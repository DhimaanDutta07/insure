//src/server.ts
import {config} from 'dotenv';
config();
import express, { Express, NextFunction, Request, Response } from "express";
import prisma from "./utils/prismaClient";
import cors from "cors";
import helmet from "helmet";
import ApiRoutes from "./routes/routes";
import { globalErrorHandler } from "./middlewares/GlobalErrorHandler";
import { decodeJwt } from "./middlewares/AuthMiddleware";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import seedData from './scripts/seedData';

// Define environment variables interface
interface RequiredEnv {
  DATABASE_URL: string;
  PORT: string;
  NODE_ENV: string;
  JWT_SECRET: string;
}

function checkEnvironmentVariables(): void {
  const requiredEnvVariables: (keyof RequiredEnv)[] = [
    "DATABASE_URL",
    "PORT",
    "NODE_ENV",
    "JWT_SECRET",
  ];

  const missingEnvVariables = requiredEnvVariables.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVariables.length) {
    throw new Error(
      `❌ Missing environment variables: ${missingEnvVariables.join(", ")}`
    );
  }
}

async function establishDatabaseConnection(
  retries: number = 5,
  delay: number = 1000
): Promise<void> {
  let currentTry = 1;

  while (currentTry <= retries) {
    try {
      await prisma.$connect();
      console.log("✅ Database connection established");
      return;
    } catch (error) {
      console.error(
        `❌ Database connection attempt ${currentTry} failed:`,
        error
      );

      if (currentTry < retries) {
        console.log(`Retrying in ${delay}ms... (${currentTry}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        currentTry++;
      } else {
        throw new Error(
          "❌ Maximum retries reached! Database Connection Failed."
        );
      }
    }
  }
}

function setupMiddleware(app: Express): void {
// File download endpoint
app.get('/api/files/material-receipts/images/:fileName', (req: Request, res: Response): void => {
  const fileName: string = req.params.fileName as string;
  const filePath: string = path.join(process.env.STORAGE_DIR || '/var/www/html/uploads', 'material-receipts', 'images', fileName);
  
  if (!fs.existsSync(filePath)) {
      console.log("File not found:", filePath);
      res.status(404).json({ error: "File not found" });
      return;
  }

  const contentType: string = 'application/octet-stream';
  
  res.set('X-Sendfile', filePath);
  res.set('Content-Type', contentType);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  
  // Force download
  res.set('Content-Disposition', `attachment; filename="${fileName}"`);
  
  res.end();
});

  // Basic middleware
  const origin = process.env.FRONTEND_API || process.env.LOCALHOST_API;
  app.use(cors({ 
    origin: [
      "https://insurewelladvisory.in",
      "https://policy.mindrops.com",
      "https://policy-management-frontend-coral.vercel.app", // ✅ production frontend
      /https:\/\/policy-management-frontend.*\.vercel\.app$/, // ✅ all Vercel preview deployments
      "http://localhost:5173",
      "http://localhost:3001",
      "http://192.168.1.15:3001"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "role"],
    credentials: true,
  }));
  // app.use(cors());
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
  }));
  
  // Set trust proxy to handle X-Forwarded-For header correctly when behind a proxy (like nginx)
  app.set('trust proxy', 1);
  
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  // Remove redundant /uploads route
  // app.use('/uploads', express.static(process.env.STORAGE_DIR || ""));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // limit each IP to 1000 requests per windowMs
    // No need for trustForwardHeader as we've set app.set('trust proxy', 1)
    validate: {
      xForwardedForHeader: false // Disable the validation that was causing the error
    }
  });
  app.use(limiter);

  // JWT Decoding
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/v1/auth") || req.path.startsWith("/api/v1/uploads")) {
      return next(); // Skip JWT decoding for auth routes and file uploads
    }
    decodeJwt(req, res, next);
  });
}

function setupRoutes(app: Express): void {
  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "healthy" });
  });
  let directory = path.join(__dirname, "..", "purchase-orders");
  // console.log("Directory 2", directory);
  app.use("/files", express.static(directory));

  // Serve uploaded files directly
  // const storageDir = process.env.STORAGE_DIR || '/var/www/html/uploads';
  
  // // Add CORS headers for static files
  // app.use('/api/files', (req, res, next) => {
  //   res.header('Access-Control-Allow-Origin', '*');
  //   res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  //   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
  //   // Handle preflight requests
  //   if (req.method === 'OPTIONS') {
  //     res.status(200).end();
  //     return;
  //   }
  //   next();
  // }, express.static(storageDir, {
  //   setHeaders: (res, path) => {
  //     // Set appropriate content type based on file extension
  //     const ext = path.split('.').pop()?.toLowerCase();
  //     switch (ext) {
  //       case 'jpg':
  //       case 'jpeg':
  //         res.setHeader('Content-Type', 'image/jpeg');
  //         break;
  //       case 'png':
  //         res.setHeader('Content-Type', 'image/png');
  //         break;
  //       case 'gif':
  //         res.setHeader('Content-Type', 'image/gif');
  //         break;
  //       case 'pdf':
  //         res.setHeader('Content-Type', 'application/pdf');
  //         break;
  //       default:
  //         res.setHeader('Content-Type', 'application/octet-stream');
  //     }
      
  //     // Set cache control for better performance
  //     res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  //   }
  // }
// ));
  
  // console.log(`Serving files from ${storageDir} at /api/files route`);

  // API routes
  app.use("/api", ApiRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
  });

  // Error handler
  app.use(globalErrorHandler);
}

// function ensureUploadDir() {
//   const uploadDir = path.join(__dirname, "temp", "uploads");
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//     console.log(`✅ Created directory: ${uploadDir}`);
//   }
// }

const app: Express = express();

// Initial checks and synchronous setup
try {
  checkEnvironmentVariables();
} catch (err) {
  console.error("❌ Environment check failed:", err);
  if (!process.env.VERCEL) process.exit(1);
}

setupMiddleware(app);
setupRoutes(app);

async function startApp(): Promise<void> {
  try {
    // ✅ Always connect to DB, even on Vercel
    await establishDatabaseConnection();

    if (!process.env.VERCEL) {
      // Seed data only on local/server
      await seedData();

      // Start server only on local/server (Vercel handles this itself)
      const port = process.env.PORT || 3000;
      app.listen(port, () => {
        console.log(
          `🚀 Server is running in ${process.env.NODE_ENV} mode on port: http://localhost:${port}`
        );
      });
    }
  } catch (err) {
    console.error("❌ Error starting app:", err);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

// Graceful shutdown handling
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    try {
      await prisma.$disconnect();
      console.log("✅ Database connection closed");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during shutdown:", err);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Start the application
startApp();
if (!process.env.VERCEL) {
  setupGracefulShutdown();
}

export default app;
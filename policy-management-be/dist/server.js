"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//src/server.ts
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const express_1 = __importDefault(require("express"));
const prismaClient_1 = __importDefault(require("./utils/prismaClient"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const routes_1 = __importDefault(require("./routes/routes"));
const GlobalErrorHandler_1 = require("./middlewares/GlobalErrorHandler");
const etagCache_1 = require("./middlewares/etagCache");
const apiCache_1 = require("./middlewares/apiCache");
const AuthMiddleware_1 = require("./middlewares/AuthMiddleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const seedData_1 = __importDefault(require("./scripts/seedData"));
function checkEnvironmentVariables() {
    const requiredEnvVariables = [
        "DATABASE_URL",
        "PORT",
        "NODE_ENV",
        "JWT_SECRET",
    ];
    const missingEnvVariables = requiredEnvVariables.filter((envVar) => !process.env[envVar]);
    if (missingEnvVariables.length) {
        throw new Error(`❌ Missing environment variables: ${missingEnvVariables.join(", ")}`);
    }
}
async function establishDatabaseConnection(retries = 5, delay = 1000) {
    let currentTry = 1;
    while (currentTry <= retries) {
        try {
            await prismaClient_1.default.$connect();
            console.log("✅ Database connection established");
            return;
        }
        catch (error) {
            console.error(`❌ Database connection attempt ${currentTry} failed:`, error);
            if (currentTry < retries) {
                console.log(`Retrying in ${delay}ms... (${currentTry}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                currentTry++;
            }
            else {
                throw new Error("❌ Maximum retries reached! Database Connection Failed.");
            }
        }
    }
}
function setupMiddleware(app) {
    // File download endpoint
    app.get('/api/files/material-receipts/images/:fileName', (req, res) => {
        const fileName = req.params.fileName;
        const filePath = path_1.default.join(process.env.STORAGE_DIR || '/var/www/html/uploads', 'material-receipts', 'images', fileName);
        if (!fs_1.default.existsSync(filePath)) {
            console.log("File not found:", filePath);
            res.status(404).json({ error: "File not found" });
            return;
        }
        const contentType = 'application/octet-stream';
        res.set('X-Sendfile', filePath);
        res.set('Content-Type', contentType);
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, role');
        res.set('Access-Control-Allow-Credentials', 'true');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        // Force download
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);
        res.end();
    });
    // Basic middleware
    const origin = process.env.FRONTEND_API || process.env.LOCALHOST_API;
    app.use((0, cors_1.default)({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "role"],
        credentials: true,
    }));
    // app.use(cors());
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false
    }));
    // Enable compression for all responses - significantly reduces payload size
    app.use((0, compression_1.default)({
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression_1.default.filter(req, res);
        },
        threshold: 1024, // Only compress responses larger than 1KB
        level: 6, // Balance between speed and compression ratio
    }));
    // Set trust proxy to handle X-Forwarded-For header correctly when behind a proxy (like nginx)
    app.set('trust proxy', 1);
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    // Remove redundant /uploads route
    // app.use('/uploads', express.static(process.env.STORAGE_DIR || ""));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
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
        (0, AuthMiddleware_1.decodeJwt)(req, res, next);
    });
    // API response caching - caches GET responses and auto-invalidates on mutations
    app.use(apiCache_1.apiCacheMiddleware);
}
function setupRoutes(app) {
    // Health check endpoint
    app.get("/health", (req, res) => {
        res.status(200).json({ status: "healthy" });
    });
    let directory = path_1.default.join(__dirname, "..", "purchase-orders");
    // console.log("Directory 2", directory);
    app.use("/files", express_1.default.static(directory));
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
    // ETag caching for API responses
    app.use("/api", etagCache_1.etagCache);
    app.use("/api", routes_1.default);
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: "Route not found" });
    });
    // Error handler
    app.use(GlobalErrorHandler_1.globalErrorHandler);
}
// function ensureUploadDir() {
//   const uploadDir = path.join(__dirname, "temp", "uploads");
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//     console.log(`✅ Created directory: ${uploadDir}`);
//   }
// }
const app = (0, express_1.default)();
// Initial checks and synchronous setup
try {
    checkEnvironmentVariables();
}
catch (err) {
    console.error("❌ Environment check failed:", err);
    if (!process.env.VERCEL)
        process.exit(1);
}
setupMiddleware(app);
setupRoutes(app);
async function startApp() {
    try {
        // ✅ Always connect to DB, even on Vercel
        await establishDatabaseConnection();
        if (!process.env.VERCEL) {
            // Seed data only on local/server
            await (0, seedData_1.default)();
            // Start server only on local/server (Vercel handles this itself)
            const port = process.env.PORT || 3000;
            app.listen(port, () => {
                console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port: http://localhost:${port}`);
            });
        }
    }
    catch (err) {
        console.error("❌ Error starting app:", err);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
}
// Graceful shutdown handling
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Starting graceful shutdown...`);
        try {
            await prismaClient_1.default.$disconnect();
            console.log("✅ Database connection closed");
            process.exit(0);
        }
        catch (err) {
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
exports.default = app;

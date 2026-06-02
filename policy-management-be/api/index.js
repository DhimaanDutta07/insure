let app;

async function getApp() {
  if (!app) {
    const server = require("../dist/server"); // ✅ compiled JS, not .ts
    app = server.default || server;
  }
  return app;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, role");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const expressApp = await getApp();
    return new Promise((resolve, reject) => {
      expressApp(req, res);
      res.once("finish", resolve);
      res.once("error", reject);
    });
  } catch (err) {
    console.error("Initialization error:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: "Initialization Error",
      message: err.message,
      stack: err.stack,
    }));
  }
};
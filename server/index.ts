import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import net from "net";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Check if port is available and find an alternative if needed
async function findAvailablePort(startPort: number, maxPort: number = startPort + 10): Promise<number> {
  for (let port = startPort; port <= maxPort; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const server = net.createServer()
          .once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
              resolve(); // Port is in use, try next
            } else {
              reject(err);
            }
          })
          .once('listening', () => {
            server.close();
            resolve();
          })
          .listen(port);
      });

      return port; // If we get here, the port is available
    } catch (error) {
      console.error(`Error checking port ${port}:`, error);
      continue;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${maxPort}`);
}

(async () => {
  try {
    const startPort = Number(process.env.PORT) || 5000;
    console.log(`Starting server initialization on port ${startPort}...`);

    // Find an available port
    const port = await findAvailablePort(startPort);
    console.log(`Found available port: ${port}`);

    // Test database connection
    log('Testing database connection...');
    await db.query.laws.findMany();
    log('Database connection established');

    // Register API routes
    const server = registerRoutes(app);
    log('API routes registered');

    // Setup Vite or static file serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log('Vite middleware setup complete');
    } else {
      serveStatic(app);
      log('Static file serving setup complete');
    }

    // Start server
    await new Promise<void>((resolve) => {
      server.listen(port, '0.0.0.0', () => {
        log(`✨ Server running at http://0.0.0.0:${port}`);
        log(`💡 API endpoints available at http://0.0.0.0:${port}/api`);
        resolve();
      });
    });

    // Additional logging for debugging
    process.on('SIGTERM', () => {
      log('Received SIGTERM signal, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
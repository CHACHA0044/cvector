import express from "express";
import cors from "cors";
import productsRouter from "./routes/products.js";

const app = express();
const PORT = process.env.PORT || 3001;

/*
 * CORS Configuration
 * ------------------
 * In production, we restrict origins to the deployed frontend URL.
 * In development, we allow all origins for convenience.
 * Render injects NODE_ENV=production and the frontend URL can be set via
 * FRONTEND_URL env var. If neither is set, we default to allowing all.
 */
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL || "*"
    : "*",
  methods: ["GET"],
};
app.use(cors(corsOptions));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms | IP: ${req.ip}`);
  });
  next();
});

// Routes
app.use("/api/products", productsRouter);

// Health check — used by Render to verify the service is alive
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler for logging unhandled middleware/route errors
app.use((err, req, res, next) => {
  console.error(`[ERROR] [${new Date().toISOString()}] Unhandled error at ${req.method} ${req.url}:`, err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Start self-polling after server starts
  startSelfPolling();
});

// Helper for generating random calculation logs
function performRandomCalculations() {
  const operations = [
    () => {
      // Calculate a random Fibonacci number
      const n = Math.floor(Math.random() * 20) + 10;
      let a = 0, b = 1;
      for (let i = 2; i <= n; i++) {
        let temp = a + b;
        a = b;
        b = temp;
      }
      return `Fibonacci(${n}) = ${b}`;
    },
    () => {
      // Find primes up to a random limit
      const limit = Math.floor(Math.random() * 100) + 50;
      const primes = [];
      for (let i = 2; i <= limit; i++) {
        let isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
          if (i % j === 0) { isPrime = false; break; }
        }
        if (isPrime) primes.push(i);
      }
      return `Primes up to ${limit}: ${primes.length} found (${primes.slice(0, 5).join(", ")}...)`;
    },
    () => {
      // Sort a random array of numbers
      const size = Math.floor(Math.random() * 50) + 50;
      const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
      arr.sort((x, y) => x - y);
      return `Sorted random array of size ${size} (min: ${arr[0]}, max: ${arr[arr.length - 1]})`;
    }
  ];
  const randomOp = operations[Math.floor(Math.random() * operations.length)];
  return randomOp();
}

// Self-polling keep-alive routine (every 3 minutes)
function startSelfPolling() {
  const THREE_MINUTES = 3 * 60 * 1000;
  
  console.log(`[Keep-Alive] Initializing self-polling keep-alive every 3 minutes.`);
  
  setInterval(async () => {
    // Render exposes RENDER_EXTERNAL_URL env var automatically for web services.
    // If not set, we default to localhost.
    const selfUrl = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
      : `http://localhost:${PORT}/api/health`;

    console.log(`[Keep-Alive] [${new Date().toISOString()}] Self-polling URL: ${selfUrl}`);
    try {
      const start = Date.now();
      const response = await fetch(selfUrl);
      const duration = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[Keep-Alive] Successful self-ping. Status: ${response.status} (${duration}ms). Response status: ${data.status}`);
      } else {
        console.warn(`[Keep-Alive] Self-ping returned non-ok status: ${response.status}`);
      }
    } catch (error) {
      console.error(`[Keep-Alive] Self-ping failed:`, error.message);
    }

    // Perform and log random calculation
    try {
      const calcResult = performRandomCalculations();
      console.log(`[Keep-Alive] Random Calculation: ${calcResult}`);
    } catch (calcError) {
      console.error(`[Keep-Alive] Random calculation failed:`, calcError.message);
    }
  }, THREE_MINUTES);
}


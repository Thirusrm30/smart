const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// =============================================
// GLOBAL SECURITY MIDDLEWARES
// =============================================

// Set security HTTP headers
// Disabling Cross-Origin-Resource-Policy temporarily for uploads serving if not configured properly, 
// using typical defaults.
app.use(helmet({ crossOriginResourcePolicy: false })); 

// Rate limiting (max 100 requests per 15 min per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Too many requests from this IP, please try again later."
});
app.use(limiter); // Apply rate limiter generally

// Sanitize user input to prevent MongoDB Operator Injection
app.use(mongoSanitize());

// =============================================
// STANDARD MIDDLEWARE
// =============================================

const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || false
        : "*",                        
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Serve uploaded images securely
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// =============================================
// ROUTES
// =============================================

const authRoutes = require("./routes/authRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Mount routers
app.use("/api/auth", authRoutes);      // Authentication logic
app.use("/upload", uploadRoutes);      // Handling image uploads
app.use("/", reportRoutes);            // Reports management (moved from server.js core)

// Root endpoint for healthchecks
app.get("/", (req, res) => {
    res.json({ message: "Smart Civic Backend Running securely!" });
});

// Add 404 Route handler for unknown endpoints
app.use((req, res, next) => {
    res.status(404).json({ message: "API documentation or Endpoint not found" });
});

// =============================================
// AI MODEL LOADING
// =============================================

const { loadModel } = require("./services/imageClassifier");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Server running securely on port ${PORT}`);

    console.log("");
    console.log("=".repeat(50));
    console.log("  LOADING AI MODEL");
    console.log("=".repeat(50));

    const modelLoaded = await loadModel();

    if (modelLoaded) {
        console.log("=".repeat(50));
        console.log("  ✅ AI is ready! Upload an image to classify it.");
        console.log("=".repeat(50));
    } else {
        console.log("=".repeat(50));
        console.log("  ⚠️ AI model failed to load.");
        console.log("  Image uploads will still work, but without AI labels.");
        console.log("=".repeat(50));
    }
});
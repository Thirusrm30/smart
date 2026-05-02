const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    },
    image: {
        type: String
    },
    status: {
        type: String,
        default: "Pending"
    },

    // =============================================
    // AI PREDICTION (Step 15)
    // =============================================
    // Stores the AI classification result for the uploaded image
    // This is automatically filled when an image is uploaded
    aiPrediction: {
        // The top predicted label (e.g., "garbage truck", "fire", "pothole")
        className: {
            type: String,
            default: "unknown"
        },
        // Confidence score (0.0 to 1.0) — higher = more confident
        probability: {
            type: Number,
            default: 0
        },
        // Top 3 predictions with their confidence scores
        allPredictions: [
            {
                className: { type: String },
                probability: { type: Number }
            }
        ]
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Report", ReportSchema);
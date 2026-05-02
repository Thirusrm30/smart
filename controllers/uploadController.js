// =============================================
// Upload Controller
// =============================================
// This file contains the logic that runs after
// a file is successfully uploaded by Multer.
//
// Step 15: After uploading, we run AI image classification
// and SAVE the result to MongoDB along with the report.

// Import the AI classifier function
const { classifyImage } = require("../services/imageClassifier");

// Import the Report model to save data to MongoDB
const Report = require("../models/report");

/**
 * uploadImage - Handles image upload + AI classification + DB save
 *
 * How it works:
 * 1. Multer middleware (in the route) saves the file first
 * 2. Then this function runs:
 *    a. Checks if a file was uploaded
 *    b. Sends the image to the AI classifier
 *    c. Saves the report with AI prediction to MongoDB
 *    d. Returns the file info + AI prediction + saved report
 *
 * req.file = the uploaded file info (added by Multer)
 *   - req.file.filename  = the saved file name (e.g., "1741356000000.jpg")
 *   - req.file.path      = the full path (e.g., "uploads/1741356000000.jpg")
 *
 * req.body = optional form fields the user can send along with the image:
 *   - title, description, location, latitude, longitude
 */
const uploadImage = async (req, res) => {
    try {
        // Check if a file was actually uploaded
        if (!req.file) {
            return res.status(400).json({
                message: "No image file uploaded. Please send a file with key 'image'."
            });
        }

        // ---- STEP 1: AI IMAGE CLASSIFICATION ----
        // After the image is saved by Multer, we pass it to the AI model
        // The classifier reads the image, converts it to a tensor,
        // and uses MobileNet to predict what's in the image

        let prediction = null;

        try {
            // classifyImage returns: { className, probability, allPredictions }
            prediction = await classifyImage(req.file.path);

            console.log(`📸 Image "${req.file.filename}" classified as: ${prediction.className} (${prediction.probability * 100}%)`);
        } catch (aiError) {
            // If AI classification fails, we still continue
            // The image was uploaded fine, just the AI part had an issue
            console.error("⚠️ AI classification failed:", aiError.message);
            prediction = {
                className: "unknown",
                probability: 0,
                allPredictions: []
            };
        }

        // ---- STEP 2: SAVE TO MONGODB ----
        // Create a new Report document with the image + AI prediction
        // The user can also send title, description, location etc. in the form-data

        const newReport = new Report({
            // User-provided fields (sent as form-data along with the image)
            // These are optional — if not sent, they won't be saved
            title: req.body.title || "Untitled Report",
            description: req.body.description || "Image uploaded via AI classifier",
            location: req.body.location || "",
            latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
            longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,

            // The image filename (stored in uploads/ folder)
            image: req.file.filename,

            // AI prediction result — saved to database!
            aiPrediction: {
                className: prediction.className,
                probability: prediction.probability,
                allPredictions: prediction.allPredictions
            }
        });

        // Save to MongoDB
        const savedReport = await newReport.save();

        console.log(`💾 Report saved to database with ID: ${savedReport._id}`);

        // ---- STEP 3: SEND RESPONSE ----
        // Send back success response with everything
        res.status(201).json({
            message: "Image uploaded, classified, and saved to database!",
            fileName: req.file.filename,
            filePath: req.file.path,
            // AI prediction result
            prediction: {
                className: prediction.className,
                probability: prediction.probability,
                allPredictions: prediction.allPredictions
            },
            // The saved report from MongoDB (includes _id, createdAt, etc.)
            report: savedReport
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to upload image",
            error: error.message
        });
    }
};

module.exports = { uploadImage };

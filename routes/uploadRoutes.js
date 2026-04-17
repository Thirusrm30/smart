// =============================================
// Upload Routes
// =============================================
// This file defines the URL endpoint for uploading images.

const express = require("express");
const router = express.Router();

// Import the Multer upload middleware
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

// Import the controller function
const { uploadImage } = require("../controllers/uploadController");

// POST /upload
// authMiddleware ensures only logged in users can upload
// upload.single("image") = Multer processes ONE file with the key name "image"
// uploadImage = our controller function that sends back the response
router.post("/", authMiddleware, upload.single("image"), uploadImage);

module.exports = router;

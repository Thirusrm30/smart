// =============================================
// Multer Upload Middleware
// =============================================
// This file configures Multer to handle image uploads.
// Multer is a middleware that processes multipart/form-data
// (which is the format used when uploading files).

const multer = require("multer");
const path = require("path");

// ----- STEP 1: Configure where to save files -----
// diskStorage tells Multer to save files to your hard drive
const storage = multer.diskStorage({

    // destination = which folder to save the uploaded file
    destination: function (req, file, cb) {
        cb(null, "uploads/");  // saves to the "uploads" folder
    },

    // filename = what to name the saved file
    // We use Date.now() to create a unique name so files don't overwrite each other
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        // Example: 1741356000000.jpg
        cb(null, uniqueName);
    }
});

// ----- STEP 2: Filter to allow only image files -----
// This function checks if the uploaded file is an image
// If not, it rejects the upload with an error
const fileFilter = function (req, file, cb) {
    // List of allowed image types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);  // accept the file
    } else {
        cb(new Error("Only .jpg, .jpeg, and .png files are allowed!"), false);
    }
};

// ----- STEP 3: Create the Multer upload instance -----
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    // Limit file size to 5MB to prevent server overload
    limits: {
        fileSize: 5 * 1024 * 1024  // 5MB in bytes
    }
});

// Export so other files can use it
module.exports = upload;

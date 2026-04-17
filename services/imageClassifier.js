// =============================================
// AI Image Classifier Service
// =============================================
// This file uses TensorFlow.js and the MobileNet model
// to classify images uploaded by users.
//
// How it works:
// 1. When the server starts, we load the MobileNet AI model
// 2. When a user uploads an image, we:
//    a. Read the image file from disk
//    b. Convert it to a format TensorFlow can understand (a "tensor")
//    c. Pass it to MobileNet for prediction
//    d. Return the predicted label (e.g., "garbage truck", "fire", "street")
//
// We use @tensorflow/tfjs (pure JavaScript version) instead of
// @tensorflow/tfjs-node because tfjs-node has installation issues
// on Windows with Node 20. The pure JS version works everywhere!

const tf = require("@tensorflow/tfjs");
const mobilenet = require("@tensorflow-models/mobilenet");
const fs = require("fs");
const path = require("path");
const jpeg = require("jpeg-js");

const { PNG } = require("pngjs");

// =============================================
// STEP 1: Model Loading
// =============================================

// This variable will hold our loaded AI model
let model = null;

/**
 * loadModel - Loads the MobileNet AI model into memory
 *
 * This should be called ONCE when the server starts.
 * Loading takes a few seconds, so we do it at startup
 * instead of making users wait on every request.
 *
 * MobileNet is a lightweight image classification model
 * trained on ImageNet (1000+ categories of objects).
 */
async function loadModel() {
    try {
        console.log("🤖 Loading MobileNet AI model...");
        console.log("   (This may take 10-30 seconds on first run)");

        // Load MobileNet version 2, alpha 1.0 (best accuracy)
        // The model will be downloaded from the internet on first run
        // and cached locally for future use
        model = await mobilenet.load({
            version: 2,
            alpha: 1.0
        });

        console.log("✅ MobileNet AI model loaded successfully!");
        return true;
    } catch (error) {
        console.error("❌ Failed to load MobileNet model:", error.message);
        console.error("   The server will still run, but image classification won't work.");
        return false;
    }
}

// =============================================
// STEP 2: Image Reading Helpers
// =============================================

/**
 * readJPEG - Reads a JPEG image file and returns pixel data
 *
 * @param {string} filePath - Path to the JPEG file
 * @returns {Object} - { data: Uint8Array, width: number, height: number }
 */
function readJPEG(filePath) {
    // Read the raw file bytes
    const buf = fs.readFileSync(filePath);

    // Decode JPEG into raw pixel data (RGBA format)
    // formatAsRGBA: true means each pixel has 4 values: Red, Green, Blue, Alpha
    const pixels = jpeg.decode(buf, { formatAsRGBA: true });

    return {
        data: pixels.data,      // Raw pixel values
        width: pixels.width,    // Image width in pixels
        height: pixels.height   // Image height in pixels
    };
}

/**
 * readPNG - Reads a PNG image file and returns pixel data
 *
 * @param {string} filePath - Path to the PNG file
 * @returns {Object} - { data: Uint8Array, width: number, height: number }
 */
function readPNG(filePath) {
    // Read and decode PNG file
    const buf = fs.readFileSync(filePath);
    const png = PNG.sync.read(buf);

    return {
        data: png.data,         // Raw pixel values (RGBA)
        width: png.width,       // Image width
        height: png.height      // Image height
    };
}

/**
 * imageToTensor - Converts raw image pixel data to a TensorFlow tensor
 *
 * A "tensor" is a multi-dimensional array that TensorFlow uses.
 * For images, we need a 3D tensor with shape [height, width, 3]
 * where 3 = RGB color channels.
 *
 * @param {Object} imageData - { data, width, height } from readJPEG/readPNG
 * @returns {tf.Tensor3D} - A 3D tensor ready for MobileNet
 */
function imageToTensor(imageData) {
    const { data, width, height } = imageData;

    // The raw data has 4 channels (RGBA), but MobileNet needs 3 (RGB)
    // So we need to remove the Alpha (transparency) channel

    // Calculate total pixels
    const totalPixels = width * height;

    // Create a new array with only RGB values (3 channels instead of 4)
    const rgbValues = new Int32Array(totalPixels * 3);

    for (let i = 0; i < totalPixels; i++) {
        // RGBA: each pixel takes 4 bytes in the original data
        // RGB: each pixel takes 3 bytes in our new array
        rgbValues[i * 3 + 0] = data[i * 4 + 0]; // Red
        rgbValues[i * 3 + 1] = data[i * 4 + 1]; // Green
        rgbValues[i * 3 + 2] = data[i * 4 + 2]; // Blue
        // We skip data[i * 4 + 3] which is Alpha (transparency)
    }

    // Create a TensorFlow tensor from the pixel values
    // Shape: [height, width, 3] means a 2D image with 3 color channels
    const tensor = tf.tensor3d(rgbValues, [height, width, 3], "int32");

    return tensor;
}

// =============================================
// STEP 3: Main Classification Function
// =============================================

/**
 * classifyImage - The main function that classifies an uploaded image
 *
 * This is the function you call from your upload controller.
 * It reads the image, converts it, and runs AI prediction.
 *
 * @param {string} imagePath - Path to the uploaded image file
 *                             (e.g., "uploads/1741356000000.jpg")
 * @returns {Object} - { className: "...", probability: 0.XX }
 *
 * Example return:
 *   { className: "garbage truck", probability: 0.85 }
 */
async function classifyImage(imagePath) {
    // Check 1: Is the AI model loaded?
    if (!model) {
        throw new Error("AI model is not loaded yet. Please wait for the server to finish starting.");
    }

    // Check 2: Does the image file exist?
    const fullPath = path.resolve(imagePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Image file not found: ${fullPath}`);
    }

    console.log(`🔍 Classifying image: ${path.basename(fullPath)}`);

    // Determine the image type from file extension
    const extension = path.extname(fullPath).toLowerCase();

    // Read the image based on its format
    let imageData;
    if (extension === ".jpg" || extension === ".jpeg") {
        imageData = readJPEG(fullPath);
    } else if (extension === ".png") {
        imageData = readPNG(fullPath);
    } else {
        throw new Error(`Unsupported image format: ${extension}. Use .jpg, .jpeg, or .png`);
    }

    // Convert the image pixels to a TensorFlow tensor
    const imageTensor = imageToTensor(imageData);

    // Run AI prediction!
    // MobileNet returns an array of predictions, sorted by confidence
    // Each prediction has: { className, probability }
    const predictions = await model.classify(imageTensor);

    // Clean up: free the tensor memory
    // TensorFlow tensors use GPU/CPU memory that isn't managed by JavaScript's
    // garbage collector, so we need to manually free it
    imageTensor.dispose();

    console.log(`✅ Classification complete! Top prediction: ${predictions[0].className}`);

    // Return the top prediction (highest confidence)
    // predictions[0] = most confident prediction
    return {
        className: predictions[0].className,
        probability: Math.round(predictions[0].probability * 100) / 100, // Round to 2 decimals
        // Also include top 3 predictions for more detail
        allPredictions: predictions.map(p => ({
            className: p.className,
            probability: Math.round(p.probability * 100) / 100
        }))
    };
}

// =============================================
// STEP 4: Export functions for use in other files
// =============================================

module.exports = {
    loadModel,       // Called once in server.js when server starts
    classifyImage    // Called in uploadController.js when image is uploaded
};

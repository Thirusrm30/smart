const Report = require("../models/report");
const mongoose = require("mongoose");

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

exports.createReport = async (req, res) => {
    try {
        const { title, description, location, latitude, longitude, image } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: "Description is required" });
        }

        const newReport = new Report({
            title: title.trim(),
            description: description.trim(),
            location: location ? location.trim() : undefined,
            latitude,
            longitude,
            image
        });

        const savedReport = await newReport.save();

        res.status(201).json({
            message: "Report created",
            data: savedReport
        });
    } catch (error) {
        console.error("POST /report error:", error.message);
        res.status(500).json({ message: "Failed to create report" });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: "Reports fetched successfully",
            data: reports
        });
    } catch (error) {
        console.error("GET /reports error:", error.message);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
};

exports.getReportById = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid report ID format" });
        }

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({
            message: "Report fetched successfully",
            data: report
        });
    } catch (error) {
        console.error("GET /reports/:id error:", error.message);
        res.status(500).json({ message: "Failed to fetch report" });
    }
};

exports.updateReport = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid report ID format" });
        }

        const allowedFields = ["title", "description", "location", "latitude", "longitude", "image", "status", "aiPrediction"];
        const updateData = {};

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({
            message: "Report updated successfully",
            data: report
        });
    } catch (error) {
        console.error("PUT /reports/:id error:", error.message);
        res.status(500).json({ message: "Failed to update report" });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: "Invalid report ID format" });
        }

        const { status } = req.body;

        const validStatuses = ["Pending", "In Progress", "Resolved"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({
            message: "Report status updated successfully",
            data: report
        });
    } catch (error) {
        console.error("PATCH /reports/:id/status error:", error.message);
        res.status(500).json({ message: "Failed to update report status" });
    }
};

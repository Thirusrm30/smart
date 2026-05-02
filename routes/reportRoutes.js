const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/authMiddleware");

// Public routes for viewing reports
router.get("/reports", reportController.getReports);
router.get("/reports/:id", reportController.getReportById);

// Protected routes for managing reports (require JWT token)
router.post("/report", authMiddleware, reportController.createReport);
router.put("/reports/:id", authMiddleware, reportController.updateReport);
router.patch("/reports/:id/status", authMiddleware, reportController.updateStatus);

module.exports = router;

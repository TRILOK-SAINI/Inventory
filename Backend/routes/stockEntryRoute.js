import express from "express";
import {
  getReport,
  getCalendarDates,
  downloadReport,
} from "../controllers/stockEntryController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only super_admin can view stock entry reports
router.use(protect, authorize("super_admin"));

router.get("/report", getReport);
router.get("/calendar", getCalendarDates);
router.get("/report/download", downloadReport);

export default router;

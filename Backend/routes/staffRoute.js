import express from "express";
import {
  getMyStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  toggleStaffStatus,
} from "../controllers/staffController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
router.use(protect);

router.get("/", authorize("super_admin", "shop_admin"), getMyStaff);

router.post(
  "/",
  authorize("super_admin", "shop_admin"),
  upload.single("photo"),
  createStaff,
);

router.put(
  "/:id",
  authorize("super_admin", "shop_admin"),
  upload.single("photo"),
  updateStaff,
);

router.delete("/:id", authorize("super_admin", "shop_admin"), deleteStaff);

router.patch(
  "/:id/toggle",
  authorize("super_admin", "shop_admin"),
  toggleStaffStatus,
);

export default router;

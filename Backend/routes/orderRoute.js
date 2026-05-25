import express from "express";
import {
  createOrder,
  getShopOrders,
  deliverOrder,
  cancelOrder,
  getOrderStats,
  getOrderReport,
  getOrderReportStaff,
  downloadOrderReport,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ── Super admin report routes ───────────────────────────── */
router.get(
  "/report/download",
  protect,
  authorize("super_admin"),
  downloadOrderReport,
);
router.get(
  "/report/staff",
  protect,
  authorize("super_admin"),
  getOrderReportStaff,
);
router.get("/report", protect, authorize("super_admin"), getOrderReport);

/* ── Shop / staff routes ─────────────────────────────────── */
router.use(protect, authorize("staff", "shop_admin"));

router.get("/stats", getOrderStats);
router.route("/").get(getShopOrders).post(createOrder);
router.patch("/:id/deliver", deliverOrder);
router.patch("/:id/cancel", cancelOrder);

export default router;

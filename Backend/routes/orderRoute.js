import express from "express";
import {
  createOrder,
  getShopOrders,
  deliverOrder,
  cancelOrder,
  getOrderStats,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Both staff and shop_admin can access orders
router.use(protect, authorize("staff", "shop_admin"));

router.get("/stats", getOrderStats);
router.route("/").get(getShopOrders).post(createOrder);
router.patch("/:id/deliver", deliverOrder);
router.patch("/:id/cancel", cancelOrder);

export default router;
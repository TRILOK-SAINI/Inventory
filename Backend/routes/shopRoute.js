import express from "express";
import {
  createShop,
  deleteShop,
  getAllShops,
  getMyShop,
  getShopById,
  toggleShopStatus,
  updateShop,
} from "../controllers/shopController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-shop", protect, authorize("shop_admin", "staff"), getMyShop);

router
  .route("/")
  .get(protect, authorize("super_admin"), getAllShops)
  .post(protect, authorize("super_admin"), createShop);

router
  .route("/:id")
  .get(protect, authorize("super_admin"), getShopById)
  .put(protect, authorize("super_admin"), updateShop)
  .delete(protect, authorize("super_admin"), deleteShop);

router.patch("/:id/status", protect, authorize("super_admin"), toggleShopStatus);

export default router;

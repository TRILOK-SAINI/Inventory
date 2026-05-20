import express from "express";
import multer from "multer";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleStatus,
  bulkDelete,
  getProductStats,
  updateStock,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ── Multer ──────────────────────────────────────────────────── */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPEG, PNG, WEBP, GIF allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
});

const handleUpload = (req, res, next) => {
  upload.array("images", 8)(req, res, (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

/* ── Routes ──────────────────────────────────────────────────── */

// Stats — super_admin + shop_admin
router.get(
  "/stats",
  protect,
  authorize("super_admin", "shop_admin"),
  getProductStats,
);

// Bulk delete — super_admin + shop_admin
router.delete(
  "/bulk-delete",
  protect,
  authorize("super_admin", "shop_admin"),
  bulkDelete,
);

// Stock update — staff (daily inventory entry)
router.patch(
  "/:id/stock",
  protect,
  authorize("staff", "shop_admin", "super_admin"),
  updateStock,
);

// Status toggle — super_admin + shop_admin
router.patch(
  "/:id/status",
  protect,
  authorize("super_admin", "shop_admin"),
  toggleStatus,
);

// Collection
router
  .route("/")
  .get(protect, authorize("super_admin", "shop_admin", "staff"), getAllProducts)
  .post(
    protect,
    authorize("super_admin", "shop_admin"),
    handleUpload,
    createProduct,
  );

// Single resource
router
  .route("/:id")
  .get(protect, authorize("super_admin", "shop_admin", "staff"), getProductById)
  .put(
    protect,
    authorize("super_admin", "shop_admin"),
    handleUpload,
    updateProduct,
  )
  .delete(protect, authorize("super_admin", "shop_admin"), deleteProduct);

export default router;

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
} from "../controllers/productController.js";
// import { protect, adminOnly } from "../middleware/auth.js"; // uncomment when auth is ready

const router = express.Router();

/* ── Multer config (memory storage → pass buffer to cloud) ─── */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5 MB per file
    files:    8,                  // max 8 images per product
  },
});

/* ── Multer error handler ────────────────────────────────────── */
const handleUpload = (req, res, next) => {
  upload.array("images", 8)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

/* ═══════════════════════════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════════════════════════ */

// Stats — must be before /:id to avoid conflict
router.get("/stats", /* protect, adminOnly, */ getProductStats);

// Bulk delete
router.delete("/bulk-delete", /* protect, adminOnly, */ bulkDelete);

// Collection routes
router
  .route("/")
  .get(/* protect, */ getAllProducts)
  .post(/* protect, adminOnly, */ handleUpload, createProduct);

// Single resource routes
router
  .route("/:id")
  .get(/* protect, */ getProductById)
  .put(/* protect, adminOnly, */ handleUpload, updateProduct)
  .delete(/* protect, adminOnly, */ deleteProduct);

// Status toggle
router.patch("/:id/status", /* protect, adminOnly, */ toggleStatus);

export default router;

/* ═══════════════════════════════════════════════════════════════
   MOUNT IN app.js / server.js:

   import productRouter from "./routes/productRoutes.js";
   app.use("/api/products", productRouter);

═══════════════════════════════════════════════════════════════ */
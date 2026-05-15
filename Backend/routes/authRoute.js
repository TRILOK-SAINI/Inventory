import express from "express";
import {
  setupSuperAdmin,
  login,
  logout,
  getMe,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   PUBLIC ROUTES
========================================================= */

// First super admin setup (one time only)
router.post("/setup-super-admin", setupSuperAdmin);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

/* =========================================================
   PROTECTED ROUTES
========================================================= */

// Current logged in user
router.get("/me", protect, getMe);

export default router;
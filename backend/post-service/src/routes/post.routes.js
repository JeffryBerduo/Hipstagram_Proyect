const express = require("express");
const router  = express.Router();

const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const {
  getFeed,
  getPostById,
  createPost,
  deletePost,
  getAllPosts,
  approvePost,
  rejectPost,
  adminDeletePost,
} = require("../controllers/post.controller");

// ── Rutas públicas (requieren login) ──────────────────────────
router.get("/feed",    verifyToken, getFeed);
router.get("/:id",     verifyToken, getPostById);
router.post("/",       verifyToken, createPost);
router.delete("/:id",  verifyToken, deletePost);

// ── Rutas ADMIN ───────────────────────────────────────────────
router.get   ("/admin/all",          verifyToken, verifyAdmin, getAllPosts);
router.patch ("/admin/:id/approve",  verifyToken, verifyAdmin, approvePost);
router.patch ("/admin/:id/reject",   verifyToken, verifyAdmin, rejectPost);
router.delete("/admin/:id",          verifyToken, verifyAdmin, adminDeletePost);

module.exports = router;

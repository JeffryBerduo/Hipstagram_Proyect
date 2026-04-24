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

const { getPalabras, agregarPalabra, eliminarPalabra } = require("../controllers/palabras.controller");

// ── Palabras prohibidas
router.get   ("/palabras-prohibidas",      verifyToken, verifyAdmin, getPalabras);
router.post  ("/palabras-prohibidas",      verifyToken, verifyAdmin, agregarPalabra);
router.delete("/palabras-prohibidas/:id",  verifyToken, verifyAdmin, eliminarPalabra);

// ── Rutas ADMIN ───────────────────────────────────────────────
router.get   ("/admin/all",          verifyToken, verifyAdmin, getAllPosts);
router.patch ("/admin/:id/approve",  verifyToken, verifyAdmin, approvePost);
router.patch ("/admin/:id/reject",   verifyToken, verifyAdmin, rejectPost);
router.delete("/admin/:id",          verifyToken, verifyAdmin, adminDeletePost);

// ── Rutas públicas (login) ──────────────────────────
router.get("/feed",    verifyToken, getFeed);
router.get("/:id",     verifyToken, getPostById);
router.post("/",       verifyToken, createPost);
router.delete("/:id",  verifyToken, deletePost);

module.exports = router;
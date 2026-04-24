const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const { getUsuarios, toggleUsuario } = require("../controllers/usuarios.controller");
const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const { getAuditoria } = require('../controllers/auditoria.controller');

router.post("/register", register);
router.post("/login",    login);

// ── Gestión de usuarios (solo ADMIN) ─────────────────────────
router.get  ("/admin/usuarios",            verifyToken, verifyAdmin, getUsuarios);
router.patch("/admin/usuarios/:id/toggle", verifyToken, verifyAdmin, toggleUsuario);

// ── Auditoría (solo ADMIN) ────────────────────────────────────
router.get('/admin/auditoria', verifyToken, verifyAdmin, getAuditoria);

module.exports = router;
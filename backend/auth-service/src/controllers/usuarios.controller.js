const { pool } = require('../config/db');

// GET /api/auth/admin/usuarios
const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, role, is_active, fecha_registro
       FROM usuarios
       ORDER BY fecha_registro DESC`
    );
    res.json({ usuarios: result.rows });
  } catch (err) {
    console.error('getUsuarios error:', err);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// PATCH /api/auth/admin/usuarios/:id/toggle
const toggleUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET is_active = NOT is_active
       WHERE id = $1
       RETURNING id, username, email, role, is_active`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const usuario = result.rows[0];
    res.json({
      message: usuario.is_active ? 'Usuario activado' : 'Usuario desactivado',
      usuario
    });
  } catch (err) {
    console.error('toggleUsuario error:', err);
    res.status(500).json({ message: 'Error al modificar usuario' });
  }
};

module.exports = { getUsuarios, toggleUsuario };
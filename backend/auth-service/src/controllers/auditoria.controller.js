const { pool } = require("../config/db");

// GET /api/auth/admin/auditoria
const getAuditoria = async (req, res) => {
  const { fecha_inicio, fecha_fin, user_id, accion } = req.query;

  try {
    let conditions = [];
    let params = [];
    let i = 1;

    if (fecha_inicio) {
      conditions.push(`a.timestamp >= $${i}`);
      params.push(fecha_inicio);
      i++;
    }
    if (fecha_fin) {
      conditions.push(`a.timestamp <= $${i}`);
      params.push(fecha_fin);
      i++;
    }
    if (user_id) {
      conditions.push(`a.user_id = $${i}`);
      params.push(user_id);
      i++;
    }
    if (accion) {
      conditions.push(`a.accion ILIKE $${i}`);
      params.push(`%${accion}%`);
      i++;
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         a.id,
         a.timestamp,
         a.user_id,
         u.username,
         a.rol,
         a.accion,
         a.entidad_tipo,
         a.entidad_id,
         a.resultado,
         a.ip
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.user_id
       ${where}
       ORDER BY a.timestamp DESC
       LIMIT 100`,
      params,
    );

    res.json({ registros: result.rows });
  } catch (err) {
    console.error("getAuditoria error:", err);
    res.status(500).json({ message: "Error al obtener auditoría" });
  }
};

module.exports = { getAuditoria };

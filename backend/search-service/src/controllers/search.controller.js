const pool = require("../config/db");

// Base SELECT reutilizable
const BASE_SELECT = `
  SELECT
    p.id, p.description, p.image_url, p.created_at,
    u.id       AS user_id,
    u.username,
    COUNT(DISTINCT v.id) FILTER (WHERE v.tipo_voto =  1) AS likes,
    COUNT(DISTINCT v.id) FILTER (WHERE v.tipo_voto = -1) AS dislikes,
    ARRAY_AGG(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) AS hashtags
  FROM publicaciones p
  JOIN usuarios u ON u.id = p.user_id
  LEFT JOIN votos v ON v.post_id = p.id
  LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
  LEFT JOIN hashtags h ON h.id = ph.hashtag_id
`;

// Condición base: solo posts aprobados de usuarios activos
const BASE_WHERE = `p.status = 'APPROVED' AND u.is_active = true`;

// GET /api/search?hashtag=cats
const searchByHashtag = async (req, res) => {
  const { hashtag } = req.query;
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const normalized = hashtag.toLowerCase().replace(/^#/, "");

  try {
    const result = await pool.query(
      `${BASE_SELECT}
       WHERE ${BASE_WHERE} AND h.name = $1
       GROUP BY p.id, u.id
       ORDER BY likes DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [normalized, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(DISTINCT p.id)
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.user_id
       LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
       LEFT JOIN hashtags h ON h.id = ph.hashtag_id
       WHERE ${BASE_WHERE} AND h.name = $1`,
      [normalized]
    );

    res.json({
      resultados: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error("searchByHashtag error:", err);
    res.status(500).json({ message: "Error en la búsqueda" });
  }
};

// GET /api/search?q=texto libre
const searchByText = async (req, res) => {
  const { q }  = req.query;
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const term   = `%${q.trim()}%`;

  try {
    const result = await pool.query(
      `${BASE_SELECT}
       WHERE ${BASE_WHERE}
         AND (p.description ILIKE $1 OR h.name ILIKE $1)
       GROUP BY p.id, u.id
       ORDER BY likes DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [term, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(DISTINCT p.id)
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.user_id
       LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
       LEFT JOIN hashtags h ON h.id = ph.hashtag_id
       WHERE ${BASE_WHERE}
         AND (p.description ILIKE $1 OR h.name ILIKE $1)`,
      [term]
    );

    res.json({
      resultados: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error("searchByText error:", err);
    res.status(500).json({ message: "Error en la búsqueda" });
  }
};

// GET /api/search?user=username
const searchByUser = async (req, res) => {
  const { user } = req.query;
  const page     = parseInt(req.query.page)  || 1;
  const limit    = parseInt(req.query.limit) || 20;
  const offset   = (page - 1) * limit;
  const term     = `%${user.trim()}%`;

  try {
    const result = await pool.query(
      `${BASE_SELECT}
       WHERE ${BASE_WHERE} AND u.username ILIKE $1
       GROUP BY p.id, u.id
       ORDER BY likes DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [term, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(DISTINCT p.id)
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.user_id
       WHERE ${BASE_WHERE} AND u.username ILIKE $1`,
      [term]
    );

    res.json({
      resultados: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error("searchByUser error:", err);
    res.status(500).json({ message: "Error en la búsqueda" });
  }
};

// GET /api/search/explore  → top posts por likes
const explore = async (req, res) => {
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `${BASE_SELECT}
       WHERE ${BASE_WHERE}
       GROUP BY p.id, u.id
       ORDER BY likes DESC, p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ resultados: result.rows, page, limit });
  } catch (err) {
    console.error("explore error:", err);
    res.status(500).json({ message: "Error al obtener explorar" });
  }
};

// Controlador principal que decide qué tipo de búsqueda hacer
const search = async (req, res) => {
  const { hashtag, q, user } = req.query;

  if (!hashtag && !q && !user) {
    return res.status(400).json({
      message: "Se requiere al menos un parámetro: hashtag, q o user",
    });
  }

  if (hashtag) return searchByHashtag(req, res);
  if (q)       return searchByText(req, res);
  if (user)    return searchByUser(req, res);
};

module.exports = { search, explore };

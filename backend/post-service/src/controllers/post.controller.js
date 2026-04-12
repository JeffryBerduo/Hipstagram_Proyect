const pool = require("../config/db");

// ─── GET /api/posts/feed ──────────────────────────────────────────────────────
const getFeed = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT
      p.id,
      p.description,
      p.image_url,
      p.created_at,
      u.id       AS user_id,
      u.username,
      ARRAY_AGG(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) AS hashtags
      FROM publicaciones p
      JOIN usuarios u ON u.id = p.user_id
      LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
      LEFT JOIN hashtags               h  ON h.id = ph.hashtag_id
      WHERE p.status = 'APPROVED'
      ND u.is_active = true
      GROUP BY p.id, u.id
      ORDER BY
      (ARRAY_AGG(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) IS NOT NULL) DESC,
      p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.json({ publicaciones: result.rows, page, limit });
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ message: "Error al obtener el feed" });
  }
};

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────
const getPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
      p.id, p.description, p.image_url, p.status, p.created_at,
      u.id AS user_id, u.username,
      ARRAY_AGG(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) AS hashtags
      FROM publicaciones p
      JOIN usuarios u ON u.id = p.user_id
      LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
      LEFT JOIN hashtags               h  ON h.id = ph.hashtag_id
      WHERE p.id = $1
      GROUP BY p.id, u.id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    const post = result.rows[0];

    if (post.status !== "APPROVED" && req.user.role !== "ADMIN") {
      return res.status(404).json({ message: "Publicación no disponible" });
    }

    res.json(post);
  } catch (err) {
    console.error("getPostById error:", err);
    res.status(500).json({ message: "Error al obtener la publicación" });
  }
};

// ─── POST /api/posts ──────────────────────────────────────────────────────────
const createPost = async (req, res) => {
  const { description, hashtags = [] } = req.body;
  const user_id = req.user.id;

  if (!description || description.trim().length === 0) {
    return res.status(400).json({ message: "La descripción es requerida" });
  }
  if (description.length > 128) {
    return res
      .status(400)
      .json({ message: "La descripción no puede superar 128 caracteres" });
  }
  if (!Array.isArray(hashtags)) {
    return res.status(400).json({ message: "hashtags debe ser un arreglo" });
  }

const image_url = null;

// Verificar palabras prohibidas
const palabras = await pool.query(
  'SELECT palabra FROM palabras_prohibidas'
);
const lista = palabras.rows.map(p => p.palabra.toLowerCase());
const textoCompleto = (description + ' ' + hashtags.join(' ')).toLowerCase();
const palabraEncontrada = lista.find(p => textoCompleto.includes(p));

if (palabraEncontrada) {
  return res.status(400).json({
    message: `La publicación contiene una palabra no permitida: "${palabraEncontrada}"`
  });
}

const client = await pool.connect();
try {
  await client.query("BEGIN");

  const postResult = await client.query(
    `INSERT INTO publicaciones (user_id, description, image_url, status)
    VALUES ($1, $2, $3, 'PENDING')
     RETURNING *`,
    [user_id, description.trim(), image_url]
  );
    const post = postResult.rows[0];

    await client.query("SAVEPOINT sp_hashtags");
    try {
      for (const tag of hashtags) {
        const normalized = tag.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (!normalized) continue;

        const hashResult = await client.query(
          `INSERT INTO hashtags (name)
           VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [normalized],
        );

        await client.query(
          `INSERT INTO publicaciones_hashtags (post_id, hashtag_id) VALUES ($1, $2)`,
          [post.id, hashResult.rows[0].id],
        );
      }
    } catch (hashErr) {
      await client.query("ROLLBACK TO SAVEPOINT sp_hashtags");
      console.warn("Hashtags revertidos:", hashErr.message);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Publicación creada, pendiente de moderación",
      publicacion: post,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createPost error:", err);
    res.status(500).json({ message: "Error al crear la publicación" });
  } finally {
    client.release();
  }
};

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
const deletePost = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT * FROM publicaciones WHERE id = $1 AND user_id = $2`,
      [id, user_id],
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ message: "Publicación no encontrada o no te pertenece" });
    }

    await client.query(
      `DELETE FROM publicaciones_hashtags WHERE post_id = $1`,
      [id],
    );
    await client.query(
      `DELETE FROM publicaciones           WHERE id      = $1`,
      [id],
    );

    await client.query("COMMIT");
    res.json({ message: "Publicación eliminada correctamente" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Error al eliminar la publicación" });
  } finally {
    client.release();
  }
};

// ─── ADMIN: GET /api/posts/admin/all ─────────────────────────────────────────
const getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || null;
  const offset = (page - 1) * limit;

  try {
    const params = status ? [status, limit, offset] : [limit, offset];
    const where = status ? "WHERE p.status = $1" : "";

    const result = await pool.query(
      `SELECT p.id, p.description, p.image_url, p.status, p.created_at,
              u.username,
              ARRAY_AGG(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL) AS hashtags
       FROM publicaciones p
       JOIN usuarios u ON u.id = p.user_id
       LEFT JOIN publicaciones_hashtags ph ON ph.post_id = p.id
       LEFT JOIN hashtags               h  ON h.id = ph.hashtag_id
       ${where}
       GROUP BY p.id, u.username
       ORDER BY p.created_at DESC
       LIMIT $${status ? 2 : 1} OFFSET $${status ? 3 : 2}`,
      params,
    );

    res.json({ publicaciones: result.rows, page, limit });
  } catch (err) {
    console.error("getAllPosts error:", err);
    res.status(500).json({ message: "Error al obtener las publicaciones" });
  }
};

// ─── ADMIN: PATCH /api/posts/admin/:id/approve ───────────────────────────────
const approvePost = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE publicaciones SET status = 'APPROVED' WHERE id = $1 RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }
    res.json({ message: "Publicación aprobada", publicacion: result.rows[0] });
  } catch (err) {
    console.error("approvePost error:", err);
    res.status(500).json({ message: "Error al aprobar la publicación" });
  }
};

// ─── ADMIN: PATCH /api/posts/admin/:id/reject ────────────────────────────────
const rejectPost = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE publicaciones SET status = 'REJECTED' WHERE id = $1 RETURNING *`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Publicación no encontrada" });
    }
    res.json({ message: "Publicación rechazada", publicacion: result.rows[0] });
  } catch (err) {
    console.error("rejectPost error:", err);
    res.status(500).json({ message: "Error al rechazar la publicación" });
  }
};

// ─── ADMIN: DELETE /api/posts/admin/:id ──────────────────────────────────────
const adminDeletePost = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM publicaciones_hashtags WHERE post_id = $1`,
      [id],
    );
    const del = await client.query(
      `DELETE FROM publicaciones WHERE id = $1 RETURNING id`,
      [id],
    );

    if (del.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Publicación no encontrada" });
    }

    await client.query("COMMIT");
    res.json({ message: "Publicación eliminada por administrador" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("adminDeletePost error:", err);
    res.status(500).json({ message: "Error al eliminar la publicación" });
  } finally {
    client.release();
  }
};

module.exports = {
  getFeed,
  getPostById,
  createPost,
  deletePost,
  getAllPosts,
  approvePost,
  rejectPost,
  adminDeletePost,
};

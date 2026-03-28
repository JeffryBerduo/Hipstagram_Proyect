const pool = require("../config/db");

// Sanitización básica: eliminar HTML
const sanitize = (str) => str.replace(/<[^>]*>/g, "").trim();

// GET /api/comments/:post_id
const getComments = async (req, res) => {
  const { post_id } = req.params;
  const page   = parseInt(req.query.page)  || 1;
  const limit  = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT c.id, c.contenido, c.created_at,
              u.id AS user_id, u.username
       FROM comentarios c
       JOIN usuarios u ON u.id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [post_id, limit, offset]
    );

    const count = await pool.query(
      `SELECT COUNT(*) FROM comentarios WHERE post_id = $1`,
      [post_id]
    );

    res.json({
      comentarios: result.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
    });
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: "Error al obtener los comentarios" });
  }
};

// POST /api/comments/:post_id
const createComment = async (req, res) => {
  const { post_id } = req.params;
  const { contenido } = req.body;
  const user_id = req.user.id;

  if (!contenido || contenido.trim().length === 0) {
    return res.status(400).json({ message: "El contenido es requerido" });
  }
  if (contenido.length > 500) {
    return res.status(400).json({ message: "El comentario no puede superar 500 caracteres" });
  }

  const clean = sanitize(contenido);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que el post existe y está aprobado
    const postCheck = await client.query(
      `SELECT id, status FROM publicaciones WHERE id = $1`,
      [post_id]
    );
    if (postCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Publicación no encontrada" });
    }
    if (postCheck.rows[0].status !== "APPROVED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No puedes comentar una publicación no aprobada" });
    }

    const result = await client.query(
      `INSERT INTO comentarios (post_id, user_id, contenido)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [post_id, user_id, clean]
    );

    await client.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado)
       VALUES ($1, 'USER', 'CREATE_COMMENT', 'COMENTARIO', $2, 'SUCCESS')`,
      [user_id, result.rows[0].id]
    );

    await client.query("COMMIT");
    res.status(201).json({
      message: "Comentario creado",
      comentario: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createComment error:", err);
    res.status(500).json({ message: "Error al crear el comentario" });
  } finally {
    client.release();
  }
};

// DELETE /api/comments/:id  (usuario elimina su propio comentario)
const deleteComment = async (req, res) => {
  const { id }  = req.params;
  const user_id = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const check = await client.query(
      `SELECT * FROM comentarios WHERE id = $1 AND user_id = $2`,
      [id, user_id]
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Comentario no encontrado o no te pertenece" });
    }

    await client.query(`DELETE FROM comentarios WHERE id = $1`, [id]);

    await client.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado)
       VALUES ($1, 'USER', 'DELETE_COMMENT', 'COMENTARIO', $2, 'SUCCESS')`,
      [user_id, id]
    );

    await client.query("COMMIT");
    res.json({ message: "Comentario eliminado" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deleteComment error:", err);
    res.status(500).json({ message: "Error al eliminar el comentario" });
  } finally {
    client.release();
  }
};

// DELETE /api/comments/admin/:id  (ADMIN elimina cualquier comentario)
const adminDeleteComment = async (req, res) => {
  const { id }   = req.params;
  const admin_id = req.user.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const del = await client.query(
      `DELETE FROM comentarios WHERE id = $1 RETURNING id`,
      [id]
    );
    if (del.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    await client.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado)
       VALUES ($1, 'ADMIN', 'ADMIN_DELETE_COMMENT', 'COMENTARIO', $2, 'SUCCESS')`,
      [admin_id, id]
    );

    await client.query("COMMIT");
    res.json({ message: "Comentario eliminado por administrador" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("adminDeleteComment error:", err);
    res.status(500).json({ message: "Error al eliminar el comentario" });
  } finally {
    client.release();
  }
};

module.exports = { getComments, createComment, deleteComment, adminDeleteComment };

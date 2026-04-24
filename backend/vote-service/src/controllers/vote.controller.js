const pool = require("../config/db");

// POST /api/votes
// Body: { post_id, tipo_voto }  →  tipo_voto: 1 (like) | -1 (dislike)
const castVote = async (req, res) => {
  const { post_id, tipo_voto } = req.body;
  const user_id = req.user.id;

  // Validaciones
  if (!post_id) {
    return res.status(400).json({ message: "post_id es requerido" });
  }
  if (tipo_voto !== 1 && tipo_voto !== -1) {
    return res.status(400).json({ message: "tipo_voto debe ser 1 (like) o -1 (dislike)" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que el post existe y está aprobado
    const postCheck = await client.query(
      `SELECT id, user_id, status FROM publicaciones WHERE id = $1`,
      [post_id]
    );
    if (postCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Publicación no encontrada" });
    }
    if (postCheck.rows[0].status !== "APPROVED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No puedes votar una publicación no aprobada" });
    }

    // Un usuario no puede votar su propio post
    if (postCheck.rows[0].user_id === user_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "No puedes votar tu propia publicación" });
    }

    // Buscar si ya existe un voto de este usuario en este post
    const existing = await client.query(
      `SELECT id, tipo_voto FROM votos WHERE user_id = $1 AND post_id = $2`,
      [user_id, post_id]
    );

    let message;
    let voto;

    if (existing.rows.length > 0) {
      if (existing.rows[0].tipo_voto === tipo_voto) {
        // Mismo voto → toggle (eliminar)
        await client.query(
          `DELETE FROM votos WHERE user_id = $1 AND post_id = $2`,
          [user_id, post_id]
        );
        message = tipo_voto === 1 ? "Like eliminado" : "Dislike eliminado";
        voto = null;
      } else {
        // Voto diferente → actualizar
        const result = await client.query(
          `UPDATE votos SET tipo_voto = $1
           WHERE user_id = $2 AND post_id = $3
           RETURNING *`,
          [tipo_voto, user_id, post_id]
        );
        message = "Reacción actualizada";
        voto = result.rows[0];
      }
    } else {
      // Primer voto
      const result = await client.query(
        `INSERT INTO votos (user_id, post_id, tipo_voto)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, post_id, tipo_voto]
      );
      message = tipo_voto === 1 ? "Like registrado" : "Dislike registrado";
      voto = result.rows[0];
    }

    // Auditoría
    await client.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado)
       VALUES ($1, 'USER', 'VOTE', 'PUBLICACION', $2, 'SUCCESS')`,
      [user_id, post_id]
    );

    await client.query("COMMIT");
    res.json({ message, voto });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("castVote error:", err);
    res.status(500).json({ message: "Error al registrar el voto" });
  } finally {
    client.release();
  }
};

// GET /api/votes/:post_id
// Devuelve conteo de likes y dislikes de un post
const getVotes = async (req, res) => {
  const { post_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE tipo_voto =  1) AS likes,
         COUNT(*) FILTER (WHERE tipo_voto = -1) AS dislikes
       FROM votos
       WHERE post_id = $1`,
      [post_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getVotes error:", err);
    res.status(500).json({ message: "Error al obtener los votos" });
  }
};

// GET /api/votes/:post_id/me
// Devuelve el voto del usuario actual en un post
const getMyVote = async (req, res) => {
  const { post_id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT tipo_voto FROM votos WHERE user_id = $1 AND post_id = $2`,
      [user_id, post_id]
    );

    res.json({ voto: result.rows[0] || null });
  } catch (err) {
    console.error("getMyVote error:", err);
    res.status(500).json({ message: "Error al obtener tu voto" });
  }
};

module.exports = { castVote, getVotes, getMyVote };

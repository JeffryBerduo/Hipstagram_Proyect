const pool = require("../config/db");

// GET /api/palabras-prohibidas
const getPalabras = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, palabra FROM palabras_prohibidas ORDER BY palabra ASC",
    );
    res.json({ palabras: result.rows });
  } catch (err) {
    console.error("getPalabras error:", err);
    res.status(500).json({ message: "Error al obtener palabras" });
  }
};

// POST /api/palabras-prohibidas
const agregarPalabra = async (req, res) => {
  const { palabra } = req.body;

  if (!palabra || palabra.trim().length === 0) {
    return res.status(400).json({ message: "La palabra es requerida" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO palabras_prohibidas (palabra) VALUES ($1) RETURNING *",
      [palabra.toLowerCase().trim()],
    );
    res
      .status(201)
      .json({ message: "Palabra agregada", palabra: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "La palabra ya existe" });
    }
    console.error("agregarPalabra error:", err);
    res.status(500).json({ message: "Error al agregar palabra" });
  }
};

// DELETE /api/palabras-prohibidas/:id
const eliminarPalabra = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM palabras_prohibidas WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Palabra no encontrada" });
    }
    res.json({ message: "Palabra eliminada" });
  } catch (err) {
    console.error("eliminarPalabra error:", err);
    res.status(500).json({ message: "Error al eliminar palabra" });
  }
};

module.exports = { getPalabras, agregarPalabra, eliminarPalabra };

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;

    // 1. Validar datos básicos
    if (!correo || !password) {
      return res
        .status(400)
        .json({ message: "Correo y password son requeridos" });
    }

    // 2. Verificar si ya existe un usuario con ese correo
    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE correo = $1",
      [correo]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "El correo ya está registrado" });
    }

    // 3. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insertar usuario en la BD
    const result = await pool.query(
      `
      INSERT INTO usuarios (nombre, correo, contraseña, fecha_registro)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, nombre, correo, fecha_registro
      `,
      [nombre || null, correo, hashedPassword]
    );

    const user = result.rows[0];

    // 5. Crear token JWT
    const token = jwt.sign(
      { userId: user.id, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user,
      token,
    });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res
        .status(400)
        .json({ message: "Correo y password son requeridos" });
    }

    // 1. Buscar usuario por correo
    const result = await pool.query(
      `
      SELECT id, nombre, correo, contraseña, fecha_registro
      FROM usuarios
      WHERE correo = $1
      `,
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    // 2. Comparar contraseña enviada vs contraseña hasheada en BD
    const isMatch = await bcrypt.compare(password, user.contraseña);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 3. Generar token
    const token = jwt.sign(
      { userId: user.id, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        fecha_registro: user.fecha_registro,
      },
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { register, login };
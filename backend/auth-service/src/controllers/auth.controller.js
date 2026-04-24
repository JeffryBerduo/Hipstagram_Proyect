const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Username, email y password son requeridos" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1", [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, role, fecha_registro`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await pool.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado, ip)
       VALUES ($1, 'USER', 'REGISTER', 'USUARIO', $2, 'SUCCESS', $3)`,
      [user.id, user.id, req.ip]
    );

    res.status(201).json({ message: "Usuario registrado correctamente", user, token });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    const result = await pool.query(
      `SELECT id, username, email, password_hash, role, is_active, fecha_registro
       FROM usuarios WHERE email = $1`,
      [email]
    );

    // Usuario no existe
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, resultado, ip)
         VALUES (NULL, 'USER', 'LOGIN', 'USUARIO', 'FAILED', $1)`,
        [req.ip]
      );
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ message: "Usuario bloqueado" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    // Contraseña incorrecta
    if (!isMatch) {
      await pool.query(
        `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado, ip)
         VALUES ($1, 'USER', 'LOGIN', 'USUARIO', $2, 'FAILED', $3)`,
        [user.id, user.id, req.ip]
      );
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Login exitoso
    await pool.query(
      `INSERT INTO auditoria (user_id, rol, accion, entidad_tipo, entidad_id, resultado, ip)
       VALUES ($1, $2, 'LOGIN', 'USUARIO', $3, 'SUCCESS', $4)`,
      [user.id, user.role, user.id, req.ip]
    );

    res.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
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
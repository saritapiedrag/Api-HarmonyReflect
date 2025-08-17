const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

// Registro
exports.register = async (req, res) => {
    const { nombre, email, password } = req.body;

    try {
        // 1️. Buscar el ID del personaje "Michu"
        const personajeSql = 'SELECT idPersonaje FROM Personaje WHERE nombre_personaje = ?';
        db.query(personajeSql, ['Michu'], async (err, personajeResult) => {
            if (err) return res.status(500).json(err);

            if (personajeResult.length === 0) {
                return res.status(400).json({ message: 'Personaje Michu no encontrado' });
            }

            const idPersonaje = personajeResult[0].idPersonaje;

            // 2️. Encriptar la contraseña
            const hashed = await bcrypt.hash(password, 10);

            // 3️. Insertar usuario con personaje
            const sqlUsuario = `
                INSERT INTO Usuario (nombre, email, password, fecha_registro, idPersonaje) 
                VALUES (?, ?, ?, CURDATE(), ?)
            `;
            db.query(sqlUsuario, [nombre, email, hashed, idPersonaje], (err, userResult) => {
                if (err) return res.status(500).json(err);

                const userId = userResult.insertId;

                // 4. Insertar emoción inicial (Feliz)
                const emocionSql = `
                    INSERT INTO EmocionPersonaje (idUsuario, idPersonaje, fecha, emocion, causa)
                    VALUES (?, ?, CURDATE(), 'Feliz', 'Inicio del juego')
                `;
                db.query(emocionSql, [userId, idPersonaje], (err) => {
                    if (err) return res.status(500).json(err);

                    res.json({
                        message: 'Usuario registrado',
                        id: userId,
                        personaje: idPersonaje
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor', error });
    }
};

// Login
exports.login = (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM Usuario WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        const valid = await bcrypt.compare(password, results[0].password);
        if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: results[0].idUsuario }, secret, { expiresIn: '1d' });
        res.json({ message: 'Login exitoso', token, userId: results[0].idUsuario });

    });
};

// Actualizar datos
exports.updateUser = (req, res) => {
    const { nombre, password } = req.body;
    const { id } = req.params;
    const fields = [];
    const values = [];

    if (nombre) {
        fields.push('nombre = ?');
        values.push(nombre);
    }

    if (password) {
        const hashed = bcrypt.hashSync(password, 10);
        fields.push('password = ?');
        values.push(hashed);
    }

    values.push(id);

    const sql = `UPDATE Usuario SET ${fields.join(', ')} WHERE idUsuario = ?`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Usuario actualizado' });
    });
};

//Verificar si el correo existe 
exports.checkEmail = (req, res) => {
    const { email } = req.query;
    const sql = 'SELECT * FROM Usuario WHERE email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
};

//Datos Usuario

exports.getUserById = (req, res) => {
    const { id } = req.params;
    const sql = `
      SELECT u.nombre, u.email, p.nombre_personaje AS personaje
      FROM Usuario u
      JOIN Personaje p ON u.idPersonaje = p.idPersonaje
      WHERE u.idUsuario = ?
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(results[0]);
    });
};





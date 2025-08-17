const db = require('../config/db');

// Registrar emoción del día
exports.registrar = (req, res) => {
    const { id_usuario, id_personaje, fecha, emocion, causa } = req.body;
    const sql = `
        INSERT INTO EmocionPersonaje (id_usuario, id_personaje, fecha, emocion, causa) 
        VALUES (?, ?, CURDATE(), ?, ?)
        ON DUPLICATE KEY UPDATE emocion = VALUES(emocion), causa = VALUES(causa)
    `;
    db.query(sql, [id_usuario, id_personaje, fecha, emocion, causa], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Emoción registrada o actualizada' });
    });
};

// Consultar emociones históricas
exports.getEmociones = (req, res) => {
    const { id_usuario } = req.params;
    const sql = `
        SELECT * FROM EmocionPersonaje 
        WHERE id_usuario = ? ORDER BY fecha DESC
    `;
    db.query(sql, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

//Consultar emoción actual

exports.getEmocionActual = (req, res) => {
    const { id_usuario } = req.params;
    const sql = `
        SELECT emocion FROM EmocionPersonaje 
        WHERE idUsuario = ? AND fecha = CURDATE()
    `;
    db.query(sql, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) {
            return res.json({ emocion: 'feliz' }); // emoción por defecto
        }
        res.json(results[0]); 
    });
};

// Actualizar o crear emoción actual del personaje
exports.setEmocionActual = (req, res) => {
    const { id_usuario, emocion, causa, id_personaje } = req.body;

    // Si no tienes id_personaje o causa, puedes asignar valores por defecto
    const personaje = id_personaje || 1; // o el id por defecto que uses
    const motivo = causa || 'Automático desde app';

    const sql = `
        INSERT INTO EmocionPersonaje (idUsuario, idPersonaje, fecha, emocion, causa) 
        VALUES (?, ?, CURDATE(), ?, ?)
        ON DUPLICATE KEY UPDATE emocion = VALUES(emocion), causa = VALUES(causa)
    `;

    db.query(sql, [id_usuario, personaje, emocion, motivo], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Emoción actualizada' });
    });
};



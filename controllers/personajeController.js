const db = require('../config/db');

// Obtener todos los personajes
exports.getPersonajes = (req, res) => {
    const sql = 'SELECT * FROM Personaje';
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
};

// Cambiar personaje del usuario
exports.updatePersonajeUsuario = (req, res) => {
    const { idUsuario, idPersonaje } = req.params;
    const sql = 'UPDATE Usuario SET idPersonaje = ? WHERE idUsuario = ?';
    db.query(sql, [idPersonaje, idUsuario], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Personaje actualizado' });
    });
};

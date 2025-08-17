const db = require('../config/db');

// Listar notificaciones generales
exports.getAll = (req, res) => {
    db.query('SELECT * FROM Notificacion', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Crear notificación
exports.create = (req, res) => {
    const { mensaje, hora_envio, recurrente } = req.body;
    const sql = 'INSERT INTO Notificacion (mensaje, hora_envio, recurrente, activa) VALUES (?, ?, ?, TRUE)';
    db.query(sql, [mensaje, hora_envio, recurrente], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Notificación creada', id: result.insertId });
    });
};

// Asignar notificación a usuario
exports.asignar = (req, res) => {
    const { id_usuario, id_notificacion, fecha_programada } = req.body;
    const sql = 'INSERT INTO NotificacionUsuario (id_usuario, id_notificacion, fecha_programada) VALUES (?, ?, ?)';
    db.query(sql, [id_usuario, id_notificacion, fecha_programada], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Notificación asignada', id: result.insertId });
    });
};

// Consultar notificaciones activas del usuario
exports.getUsuario = (req, res) => {
    const { id_usuario } = req.params;
    const sql = `
        SELECT nu.id_notificacion_usuario, n.mensaje, n.hora_envio, nu.fecha_programada
        FROM NotificacionUsuario nu
        JOIN Notificacion n ON nu.id_notificacion = n.id_notificacion
        WHERE nu.id_usuario = ? AND n.activa = TRUE
    `;
    db.query(sql, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};


// Obtener notificaciones activas según hora actual (aproximación por minutos)
exports.getNotificacionesPorHora = (req, res) => {
    const now = new Date();
    const horaActual = now.toTimeString().slice(0, 5); // formato HH:mm

    const query = `
        SELECT * FROM Notificacion 
        WHERE activa = true 
          AND recurrente = true 
          AND TIME_FORMAT(hora_envio, '%H:%i') = ?
    `;

    db.query(query, [horaActual], (err, results) => {
        if (err) {
            console.error("Error al obtener notificaciones:", err);
            return res.status(500).json({ message: "Error al consultar notificaciones" });
        }
        res.json(results);
    });
};

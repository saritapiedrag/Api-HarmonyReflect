const db = require('../config/db');

// Obtener progreso semanal del usuario
exports.getProgreso = (req, res) => {
    const { id_usuario } = req.params;
    const sql = 'SELECT * FROM ProgresoSemanal WHERE id_usuario = ? ORDER BY semana_inicio DESC';
    db.query(sql, [id_usuario], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Registrar progreso
exports.registrar = (req, res) => {
    const { id_usuario, semana_inicio, semana_fin, tareas_realizadas, tareas_asignadas, porcentaje_cumplimiento } = req.body;
    const sql = `
        INSERT INTO ProgresoSemanal 
        (id_usuario, semana_inicio, semana_fin, tareas_realizadas, tareas_asignadas, porcentaje_cumplimiento)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(sql, [id_usuario, semana_inicio, semana_fin, tareas_realizadas, tareas_asignadas, porcentaje_cumplimiento], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Progreso registrado', id: result.insertId });
    });
};

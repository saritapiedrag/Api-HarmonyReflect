const db = require('../config/db');

// Listar todas las tareas disponibles
exports.getAllTareas = (req, res) => {
    db.query('SELECT * FROM Tarea', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Lista tarea más proxima al usuario
exports.getTareasUsuarioOrden = (req, res) => {
    const { id } = req.params;
    const sql = `
      SELECT tu.idTareaUsuario,
             t.nombre_tarea,
             tu.fecha,
             tu.realizada,
             tu.hora_realizacion
      FROM TareaUsuario tu
      JOIN Tarea t ON tu.idTarea = t.idTarea
      WHERE tu.idUsuario = ? 
        AND tu.fecha = CURDATE() 
        AND tu.realizada = FALSE
        AND tu.hora_realizacion >= TIME(NOW())
      ORDER BY tu.hora_realizacion ASC
    `;
    db.query(sql, [id], (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    });
};

  

// Listar tareas asignadas al usuario 
exports.getTareasUsuario = (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT tu.idTareaUsuario, t.nombre_tarea, t.categoria, tu.fecha, tu.hora_realizacion, tu.realizada
        FROM TareaUsuario tu
        JOIN Tarea t ON tu.idTarea = t.idTarea
        WHERE tu.idUsuario = ? AND tu.realizada = FALSE
        ORDER BY tu.fecha ASC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// Asignar tarea a usuario
exports.asignarTarea = (req, res) => {
    const { id_usuario, id_tarea, fecha } = req.body;
    const sql = 'INSERT INTO TareaUsuario (idUsuario, idTarea, fecha, realizada) VALUES (?, ?, ?, FALSE)';
    db.query(sql, [id_usuario, id_tarea, fecha], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Tarea asignada', id: result.insertId });
    });
};

// Marcar tarea como realizada
exports.marcarTareaRealizada = (req, res) => {
  const { id } = req.params;
  // 1️⃣ Marcamos la tarea como hecha (y guardamos hora_realizacion actual):
  const sqlUp = `
    UPDATE TareaUsuario
    SET realizada = TRUE,
        hora_realizacion = CURRENT_TIME()
    WHERE idTareaUsuario = ?
  `;
  db.query(sqlUp, [id], (err) => {
    if (err) return res.status(500).json(err);

    // 2️⃣ Recuperamos usuario+fecha de la tarea:
    db.query(
      `SELECT idUsuario, fecha FROM TareaUsuario WHERE idTareaUsuario = ?`,
      [id],
      (err2, rows) => {
        if (err2) return res.status(500).json(err2);

        const { idUsuario, fecha } = rows[0];

        // 3️⃣ Contamos cuántas ya hechas hay hoy:
        db.query(
          `SELECT COUNT(*) AS realizadas
           FROM TareaUsuario
           WHERE idUsuario = ? AND fecha = ? AND realizada = TRUE`,
          [idUsuario, fecha],
          (err3, result3) => {
            if (err3) return res.status(500).json(err3);

            const realizadas = result3[0].realizadas;

            // 4️⃣ Insert/Update en ProgresoDiario
            const stmt = `
              INSERT INTO ProgresoDiario
                (idUsuario, fecha, tareas_realizadas, tareas_asignadas)
              VALUES (?, ?, ?, 0)
              ON DUPLICATE KEY UPDATE
                tareas_realizadas = ?
            `;
            db.query(
              stmt,
              [idUsuario, fecha, realizadas, realizadas],
              (err4) => {
                if (err4) console.error('Error al upd ProgresoDiario:', err4);
                // 5️⃣ Respondemos OK
                res.json({ message: 'Tarea marcada y progreso actualizado' });
              }
            );
          }
        );
      }
    );
  });
};

//Revision de tareas Completas
exports.getUltimaTareaHoy = (req, res) => {
    const { idUsuario } = req.params;
    const hoy = new Date().toISOString().slice(0, 10);

    const sql = `
        SELECT * FROM TareaUsuario
        WHERE idUsuario = ? AND fecha = ? AND realizada = 1
        ORDER BY updated_at DESC
        LIMIT 1
    `;

    db.query(sql, [idUsuario, hoy], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.length === 0) return res.status(200).json({ message: 'No hay tareas realizadas hoy' });
        res.json(result[0]);
    });
};

// Obtener tareas pendientes (hoy, no realizadas)
exports.getTareasPendientes = (req, res) => {
    const { idUsuario } = req.params;

    const sql = `
        SELECT tu.idTareaUsuario,
               t.nombre_tarea,
               tu.hora_realizacion
        FROM TareaUsuario tu
        JOIN Tarea t ON tu.idTarea = t.idTarea
        WHERE tu.idUsuario = ?
          AND tu.fecha = CURDATE()
          AND tu.realizada = FALSE
    `;

    db.query(sql, [idUsuario], (err, results) => {
        if (err) {
            console.error('Error al obtener tareas pendientes:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        res.json(results);
    });
};

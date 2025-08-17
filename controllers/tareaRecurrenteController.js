const db = require('../config/db');

// Obtener tareas recurrentes del usuario
const getTareasRecurrentes = (req, res) => {
    const { idUsuario } = req.params;
    const sql = 'SELECT * FROM TareaRecurrente WHERE idUsuario = ?';
    db.query(sql, [idUsuario], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json(result);
    });
};

// Verificar si ya existe tarea recurrente para usuario + tarea
const checkTareaRecurrenteExistente = (req, res) => {
    const { idUsuario, idTarea } = req.query;
    const sql = `SELECT COUNT(*) AS count FROM TareaRecurrente WHERE idUsuario = ? AND idTarea = ?`;
    db.query(sql, [idUsuario, idTarea], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        const existe = result[0].count > 0;
        res.json({ existe });
    });
};

// Obtener detalle tarea recurrente para un usuario y tarea específica
const getDetalleTareaRecurrente = (req, res) => {
    const { idUsuario, idTarea } = req.params;
    const sql = 'SELECT * FROM TareaRecurrente WHERE idUsuario = ? AND idTarea = ? LIMIT 1';

    db.query(sql, [idUsuario, idTarea], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result.length === 0) {
            return res.status(404).json({ message: 'No se encontró la tarea recurrente' });
        }

        res.json(result[0]);
    });
};

// Crear tarea recurrente (no duplica)
const createTareaRecurrente = (req, res) => {
  const { idUsuario, idTarea, hora, dias } = req.body;

  // 1️⃣ check duplicado
  const sqlCheck = `SELECT idTareaRecurrente 
                    FROM TareaRecurrente 
                    WHERE idUsuario = ? AND idTarea = ?`;
  db.query(sqlCheck, [idUsuario, idTarea], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length > 0) {
      return res.status(400).json({ message: 'La tarea recurrente ya existe para este usuario' });
    }

    // 2️⃣ insertar definición
    const sql = `INSERT INTO TareaRecurrente 
      (idUsuario, idTarea, hora, lunes, martes, miercoles, jueves, viernes, sabado, domingo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const vals = [
      idUsuario, idTarea, hora,
      dias.lunes, dias.martes, dias.miercoles,
      dias.jueves, dias.viernes, dias.sabado, dias.domingo
    ];
    db.query(sql, vals, (err2, result) => {
        
      if (err2) return res.status(500).json({ error: err2 });
      generarTareasUsuario(idUsuario, idTarea, hora, dias, res, result.insertId);
    });
  });
};

// Actualizar tarea recurrente y regenerar
// Actualizar tarea recurrente y regenerar toda la semana
const updateTareaRecurrente = (req, res) => {
  const { idTareaRecurrente } = req.params;
  const { idUsuario, idTarea, hora, dias } = req.body;
  const diasSemana = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const today = new Date();
  const fechaHoy = today.toLocaleDateString('sv-SE');

  // 1️⃣ Actualizar definición en TareaRecurrente
  const sqlUp = `
    UPDATE TareaRecurrente SET 
      idTarea=?, hora=?, lunes=?, martes=?, miercoles=?, jueves=?, viernes=?, sabado=?, domingo=?
    WHERE idTareaRecurrente=?
  `;
  const valsUp = [
    idTarea, hora,
    dias.lunes, dias.martes, dias.miercoles,
    dias.jueves, dias.viernes, dias.sabado, dias.domingo,
    idTareaRecurrente
  ];

  db.query(sqlUp, valsUp, err => {
    if (err) return res.status(500).json({ error: err });

    // 2️⃣ Borrar todas las TareaUsuario de hoy en adelante para este idTarea
    const sqlDel = `
      DELETE FROM TareaUsuario
      WHERE idUsuario = ? AND idTarea = ? AND fecha >= ?
    `;
    db.query(sqlDel, [idUsuario, idTarea, fechaHoy], delErr => {
      if (delErr) return res.status(500).json({ error: delErr });

      // 3️⃣ Regenerar toda la semana desde hoy
      generarTareasUsuario(
        idUsuario,
        idTarea,
        hora,
        dias,
        res,
        idTareaRecurrente,
        false  // false = crea toda la semana, no solo hoy
      );
    });
  });
};




// Función para generar tareasUsuario de la semana según días activos
function generarTareasUsuario(
  idUsuario, idTarea, hora, dias,
  res, idTareaRecurrente, isUpdate = false
) {
  const diasSemana = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const today = new Date();
  const fechasAInsertar = [];

  if (isUpdate) {
    const nombreHoy = diasSemana[today.getDay()];
    if (dias[nombreHoy]) {
      fechasAInsertar.push([
        idUsuario,
        idTarea,
        today.toLocaleDateString('sv-SE'),
        hora,
        false
      ]);
    }
  } else {
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(today);
      fecha.setDate(today.getDate() + i);
      const nombreDia = diasSemana[fecha.getDay()];
      if (dias[nombreDia]) {
        fechasAInsertar.push([
          idUsuario,
          idTarea,
          fecha.toLocaleDateString('sv-SE'),
          hora,
          false
        ]);
      }
    }
  }

  if (fechasAInsertar.length === 0) {
    return res.json({
      message: `Tarea recurrente ${isUpdate?'actualizada':'creada'}, sin días activos ${isUpdate?'hoy':'esta semana'}.`,
      idTareaRecurrente
    });
  }

  // Insert en TareaUsuario
  const sqlTU = `
    INSERT INTO TareaUsuario 
      (idUsuario, idTarea, fecha, hora_realizacion, realizada)
    VALUES ?
  `;
  db.query(sqlTU, [fechasAInsertar], err => {
    if (err) return res.status(500).json({ error: err });

    // Upsert en ProgresoDiario para cada fecha
    const fechaClave = fechasAInsertar[0][2];
    const stmt = `
      INSERT INTO ProgresoDiario
        (idUsuario, fecha, tareas_realizadas, tareas_asignadas)
      VALUES (?, ?, 0, 1)
      ON DUPLICATE KEY UPDATE
        tareas_asignadas = tareas_asignadas + 1
    `;
    db.query(stmt, [idUsuario, fechaClave], err2 => {
      if (err2) console.error('⚠️ Error ProgresoDiario:', err2);
      res.json({
        message: `Tarea recurrente ${isUpdate?'actualizada':'creada'} y progreso inicializado para la semana.`,
        idTareaRecurrente,
        tareasCreadas: fechasAInsertar.length
      });
    });
  });
}

// Eliminar tarea recurrente
const deleteTareaRecurrente = (req, res) => {
    const { idTareaRecurrente } = req.params;
    const sql = 'DELETE FROM TareaRecurrente WHERE idTareaRecurrente = ?';
    db.query(sql, [idTareaRecurrente], (err) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Tarea recurrente eliminada' });
        
    });
};

function actualizarProgresoDiarioDeHoy(idUsuario) {
  const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const contarTareasHoy = `
    SELECT COUNT(*) AS total
    FROM TareaUsuario
    WHERE idUsuario = ? AND fecha = ?
  `;

  db.query(contarTareasHoy, [idUsuario, hoy], (err, results) => {
    if (err) {
      console.error('Error al contar tareas de hoy:', err);
      return;
    }

    const tareasAsignadas = results[0].total;

    const actualizarProgreso = `
      INSERT INTO ProgresoDiario (idUsuario, fecha, tareas_realizadas, tareas_asignadas)
      VALUES (?, ?, 0, ?)
      ON DUPLICATE KEY UPDATE tareas_asignadas = ?
    `;

    db.query(actualizarProgreso, [idUsuario, hoy, tareasAsignadas, tareasAsignadas], (err2) => {
      if (err2) {
        console.error('Error al actualizar ProgresoDiario:', err2);
      } else {
        console.log(`ProgresoDiario actualizado para hoy (${hoy}) con ${tareasAsignadas} tareas asignadas.`);
      }
    });
  });
}

module.exports = {
  getTareasRecurrentes,
  checkTareaRecurrenteExistente,
  getDetalleTareaRecurrente,
  createTareaRecurrente,
  updateTareaRecurrente,
  deleteTareaRecurrente,
  actualizarProgresoDiarioDeHoy
};

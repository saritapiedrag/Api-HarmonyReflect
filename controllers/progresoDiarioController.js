const db = require('../config/db'); 

//Registrar cada Progreso Diario
const registrarProgresoDiario = async (req, res) => {
    const { idUsuario, fecha, tareas_realizadas, tareas_asignadas } = req.body;

    try {
        await db.query(
            `INSERT INTO ProgresoDiario (idUsuario, fecha, tareas_realizadas, tareas_asignadas)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                tareas_realizadas = VALUES(tareas_realizadas),
                tareas_asignadas = VALUES(tareas_asignadas)`,
            [idUsuario, fecha, tareas_realizadas, tareas_asignadas]
        );
        res.status(200).json({ message: 'Progreso diario guardado correctamente' });
    } catch (error) {
        console.error('Error al registrar progreso diario:', error);
        res.status(500).json({ message: 'Error al guardar el progreso diario' });
    }
};

//Obtener el progreso Semanal del Usuario
const obtenerProgresoSemanal = (req, res) => {
  const { idUsuario } = req.params;
  console.log('[ProgresoSemanal] idUsuario recibido:', idUsuario);

  const sql = `
    SELECT fecha, tareas_realizadas, tareas_asignadas
    FROM ProgresoDiario
    WHERE idUsuario = ?
       AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
    ORDER BY fecha ASC
  `;

  db.query(sql, [idUsuario], (err, rows) => {
    if (err) {
      console.error('[ProgresoSemanal] Error al hacer query:', err);
      return res.status(500).json({ message: 'Error al obtener el progreso semanal' });
    }

    console.log('[ProgresoSemanal] filas obtenidas:', rows);

    let totalRealizadas = 0;
    let totalAsignadas  = 0;

    const progreso = rows.map(dia => {
      totalRealizadas += dia.tareas_realizadas;
      totalAsignadas  += dia.tareas_asignadas;
      return {
        fecha:     dia.fecha,
        realizadas: dia.tareas_realizadas,
        asignadas:  dia.tareas_asignadas
      };
    });

    const porcentaje = totalAsignadas > 0
      ? ((totalRealizadas / totalAsignadas) * 100).toFixed(2)
      : "0.00";

    res.status(200).json({
      resumen: {
        totalRealizadas,
        totalAsignadas,
        porcentaje
      },
      progreso
    });
  });
};


function verificarOActualizarProgresoDiario(req, res) {
  const { idUsuario } = req.body;
  if (!idUsuario) return res.status(400).json({ error: 'Falta idUsuario' });

  const hoy = new Date().toISOString().slice(0, 10);

  // 1. Verifica si existe registro hoy
  const sql = `
    SELECT * FROM ProgresoDiario
    WHERE idUsuario = ? AND fecha = ?
  `;

  db.query(sql, [idUsuario, hoy], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    // Si ya existe, no se hace nada
    if (results.length > 0) {
      return res.json({ actualizado: false, message: 'Progreso ya existe para hoy' });
    }

    // Si no existe, lo actualiza
    actualizarProgresoDiarioDeHoy(idUsuario);
    res.json({ actualizado: true, message: 'Progreso diario fue actualizado desde frontend' });
  });
}

//Actualizar el progreso diario
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
  registrarProgresoDiario,
  obtenerProgresoSemanal,
  verificarOActualizarProgresoDiario,
  actualizarProgresoDiarioDeHoy
};




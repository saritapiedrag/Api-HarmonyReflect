const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const tareaRoutes = require('./routes/tareaRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const progresoRoutes = require('./routes/progresoRoutes');
const emocionRoutes = require('./routes/emocionRoutes');
const tareaRecurrenteRoutes = require('./routes/tareaRecurrenteRoutes');
const personajeRoutes = require('./routes/personajeRoutes');
const progresoDiarioRoutes = require('./routes/progresoDiarioRoutes');

// Usar rutas
app.use('/api', userRoutes);
app.use('/api', tareaRoutes);
app.use('/api', notificacionRoutes);
app.use('/api', progresoRoutes);
app.use('/api', emocionRoutes);
app.use('/api/tarea-recurrente', tareaRecurrenteRoutes);
app.use('/api/personajes', personajeRoutes);
app.use('/api', progresoDiarioRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API HarmonyReflect funcionando ✅');
});

// -------------------
// Cron para progreso diario del usuario
// -------------------
const cron = require('node-cron');
const db = require('./config/db'); // Asegúrate de que la ruta esté correcta
const { actualizarProgresoDiarioDeHoy } = require('./controllers/progresoDiarioController'); // o donde esté tu función

// Ejecutara todos los días a las 00:01 AM
cron.schedule('1 0 * * *', () => {
  db.query('SELECT idUsuario FROM Usuario', (err, resultados) => {
    if (err) return console.error('Error obteniendo usuarios:', err);

    resultados.forEach(usuario => {
      actualizarProgresoDiarioDeHoy(usuario.idUsuario);
    });
  });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

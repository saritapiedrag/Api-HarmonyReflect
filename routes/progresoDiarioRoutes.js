const express = require('express');
const router = express.Router();
const progresoDiarioController = require('../controllers/progresoDiarioController');
const verifyToken = require('../middleware/auth');

router.post('/progreso-diario', verifyToken, progresoDiarioController.registrarProgresoDiario);
router.get('/progreso-semanal/:idUsuario', verifyToken, progresoDiarioController.obtenerProgresoSemanal);
router.post('/verificar-o-actualizar', verifyToken,progresoDiarioController.verificarOActualizarProgresoDiario);
module.exports = router;

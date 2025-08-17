const express = require('express');
const router = express.Router();
const progCtrl = require('../controllers/progresoController');
const verifyToken = require('../middleware/auth');

router.get('/progreso/:id_usuario', verifyToken, progCtrl.getProgreso);
router.post('/progreso', verifyToken, progCtrl.registrar);

module.exports = router;

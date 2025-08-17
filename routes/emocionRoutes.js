const express = require('express');
const router = express.Router();
const emocionCtrl = require('../controllers/emocionController');
const verifyToken = require('../middleware/auth');

router.post('/emociones', verifyToken, emocionCtrl.registrar);
router.get('/emociones/:id_usuario', verifyToken, emocionCtrl.getEmociones);
router.get('/emociones/hoy/:id_usuario', verifyToken, emocionCtrl.getEmocionActual);
router.post('/emocion-actual', verifyToken,emocionCtrl.setEmocionActual);


module.exports = router;

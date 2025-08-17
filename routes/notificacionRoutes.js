const express = require('express');
const router = express.Router();
const notifCtrl = require('../controllers/notificacionController');
const verifyToken = require('../middleware/auth');

router.get('/notificaciones', verifyToken, notifCtrl.getAll);
router.post('/notificaciones', verifyToken, notifCtrl.create);
router.post('/notificaciones-usuario', verifyToken, notifCtrl.asignar);
router.get('/notificaciones-usuario/:id_usuario', verifyToken, notifCtrl.getUsuario);
router.get('/hora-actual', verifyToken, notifCtrl.getNotificacionesPorHora);


module.exports = router;

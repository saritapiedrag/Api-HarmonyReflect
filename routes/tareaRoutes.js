const express = require('express');
const router = express.Router();
const tareaCtrl = require('../controllers/tareaController');
const verifyToken = require('../middleware/auth');

router.get('/tareas', verifyToken, tareaCtrl.getAllTareas);
router.get('/tareas-usuario-orden/:id', verifyToken, tareaCtrl.getTareasUsuarioOrden);
router.get('/tareas-usuario/:id', verifyToken, tareaCtrl.getTareasUsuario);
router.post('/tareas-usuario', verifyToken, tareaCtrl.asignarTarea);
router.put('/tareas-usuario/:id', verifyToken, tareaCtrl.marcarTareaRealizada);
router.get('/ultima-hoy/:idUsuario', tareaCtrl.getUltimaTareaHoy);
router.get('/tareas-pendientes/:idUsuario', verifyToken,tareaCtrl.getTareasPendientes);


module.exports = router;

const express = require('express');
const router = express.Router();
const tareaRecurrenteController = require('../controllers/tareaRecurrenteController');

router.get('/existe/check', tareaRecurrenteController.checkTareaRecurrenteExistente);
router.get('/detalle/:idUsuario/:idTarea', tareaRecurrenteController.getDetalleTareaRecurrente);
router.get('/:idUsuario', tareaRecurrenteController.getTareasRecurrentes);
router.post('/', tareaRecurrenteController.createTareaRecurrente);
router.put('/:idTareaRecurrente', tareaRecurrenteController.updateTareaRecurrente);
router.delete('/:idTareaRecurrente', tareaRecurrenteController.deleteTareaRecurrente);

module.exports = router;

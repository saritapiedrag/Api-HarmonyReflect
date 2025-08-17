const express = require('express');
const router = express.Router();
const personajeController = require('../controllers/personajeController');

router.get('/', personajeController.getPersonajes);
router.put('/:idUsuario/:idPersonaje', personajeController.updatePersonajeUsuario);

module.exports = router;

const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const verifyToken = require('../middleware/auth');

router.post('/usuarios', userCtrl.register);
router.post('/auth/login', userCtrl.login);
router.put('/usuarios/:id', verifyToken, userCtrl.updateUser);
router.get('/usuarios/check', userCtrl.checkEmail);
router.get('/usuarios/:id', verifyToken, userCtrl.getUserById);

module.exports = router;

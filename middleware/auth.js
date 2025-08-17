const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader) {
        return res.status(403).json({ message: 'Token requerido' });
    }

    const tokenParts = bearerHeader.split(' ');

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const token = tokenParts[1];

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        req.userId = decoded.id;
        next();
    });
}

module.exports = verifyToken;

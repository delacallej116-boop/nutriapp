const express = require('express');
const router = express.Router();

// Rutas de registros (por implementar)
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Endpoint de registros - por implementar'
    });
});

module.exports = router;

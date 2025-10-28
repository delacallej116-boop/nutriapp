const express = require('express');
const path = require('path');
const router = express.Router();

// Ruta para mostrar la vista de nuevo paciente
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'new-patient', 'index.html'));
});

module.exports = router;

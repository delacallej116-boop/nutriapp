const express = require('express');
const router = express.Router();
const path = require('path');

// Servir la página de edición de pacientes
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/edit-patient/index.html'));
});

module.exports = router;

const express = require('express'); //import express
const router  = express.Router(); 
const dimsController = require('../controller/dims');
const { tryCatch } = require('../utils/tryCatch');

/* Teilanlagen daten für Mira export */
router.post('/dims/export',tryCatch(dimsController.exportDIMS));

module.exports = router;
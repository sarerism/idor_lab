const express = require('express'); //import express
const router  = express.Router(); 
const teilanlagenController = require('../controller/teilanlage');
const { tryCatch } = require('../utils/tryCatch');

/* Teilanlagen daten für Mira export */
router.post('/teilanlage/miraData',tryCatch(teilanlagenController.getMiraData));

/* Teilanlagen daten für Standard SPICS export */
router.post('/teilanlage/spicsData',tryCatch(teilanlagenController.getSpicsData));


module.exports = router;
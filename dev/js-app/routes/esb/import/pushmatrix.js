const express = require('express'); //import express
const router  = express.Router(); 
const pushmatrixController = require('../../../controller/esb/import/pushmatrix');
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

/* Teilanlagen daten für Mira export */
router.post('/pushmatrix/esb/import', checkToken ,tryCatch(pushmatrixController.importPushmatrix));

/* Teilanlagen daten für Standard SPICS export */
router.post('/pushmatrix/esb/export', checkToken ,tryCatch(pushmatrixController.exportPushmatrix));

module.exports = router;
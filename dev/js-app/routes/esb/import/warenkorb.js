const express = require('express'); //import express
const router  = express.Router(); 
const warenkorbController = require('../../../controller/esb/import/warenkorb');
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

router.post('/warenkorb/esb/checkTNR', checkToken ,tryCatch(warenkorbController.checkTeilenummer));

/* Teilanlagen daten für Mira export */
router.post('/warenkorb/esb/import', checkToken ,tryCatch(warenkorbController.importWarenkorbESB));

/* Teilanlagen daten für Standard SPICS export */
router.post('/warenkorb/esb/export', checkToken ,tryCatch(warenkorbController.exportWarenkorbESB));

/* Teilanlagen daten für Standard SPICS export */
router.post('/warenkorb/wkt/allgemeinExport', checkToken ,tryCatch(warenkorbController.exportWarenkorbWKT));

/* Teilanlagen daten für Standard SPICS export */
router.post('/warenkorb/esb/marktSpezifischExport', checkToken ,tryCatch(warenkorbController.exportWarenkorbWKTM));


module.exports = router;
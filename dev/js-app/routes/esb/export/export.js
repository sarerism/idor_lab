const express = require('express'); //import express
const router  = express.Router(); 
const exportController = require('../../../controller/esb/export/export');
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

/* Teilanlagen daten für Mira export */

router.post('/esb/export/exportKopfDaten', checkToken ,tryCatch(exportController.exportKopfDaten));

router.post('/esb/export/getOffene', checkToken ,tryCatch(exportController.getOffene));

router.post('/esb/export/exportOffeneBestellungenSPICS', checkToken ,tryCatch(exportController.exportOffeneBestellungenSPICS));

router.post('/esb/export/getTeilanlage', checkToken ,tryCatch(exportController.getTeilanlage));

router.post('/esb/export/exportWIMS', checkToken ,tryCatch(exportController.exportWIMS));

router.post('/esb/export/exportFixbedarfe', checkToken ,tryCatch(exportController.exportFixbedarfe));

router.post('/esb/export/getDIMSandSPMboolean', checkToken ,tryCatch(exportController.getDIMSandSPMboolean));

router.post('/esb/export/getANRinputs', checkToken ,tryCatch(exportController.getANRinputs));

router.post('/esb/export/getFixbedarfe', checkToken ,tryCatch(exportController.getFixbedarfe));

router.post('/esb/export/newExportForecast', checkToken ,tryCatch(exportController.newExportForecast));

router.post('/esb/export/exportPO', checkToken ,tryCatch(exportController.exportPO));

module.exports = router;
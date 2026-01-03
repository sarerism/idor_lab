const express = require('express'); //import express
const router  = express.Router(); 
const datenpflegeController = require('../../../controller/esb/datenpflege/datenpflege.js');
const { tryCatch } = require('../../../utils/tryCatch.js');
const { checkToken } = require('../../../utils/token.js');

/* Kundenparameter Import */
router.post('/esb/datenpflege/updateKundenParameter', checkToken ,tryCatch(datenpflegeController.updateKundenParameter));

/* Matrix Import */
router.post('/esb/datenpflege/updateMatrix', checkToken ,tryCatch(datenpflegeController.updateMatrix));

/* ELC Zugehoerigkeit Import */
router.post('/esb/datenpflege/importELC', checkToken ,tryCatch(datenpflegeController.importELC));

/* ELC Zugehoerigkeit Export */
router.post('/esb/datenpflege/exportELC', checkToken ,tryCatch(datenpflegeController.exportELC));

/* Matrix daten erhalten für Forecast Export */
router.post('/esb/datenpflege/getMatrixData', checkToken ,tryCatch(datenpflegeController.getMatrixData));

/* Parameter SPM Asia Import */
router.post('/esb/datenpflege/importParameterAsia', checkToken ,tryCatch(datenpflegeController.importParameterAsia));

router.get('/esb/datenpflege/getCountryData', checkToken ,tryCatch(datenpflegeController.getCountryData));

module.exports = router;
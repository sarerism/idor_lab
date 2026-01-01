const express = require('express');
const router  = express.Router(); 
const prognoseController = require('../../controller/prognose/prognose');
const { tryCatch } = require('../../utils/tryCatch');
const { checkToken } = require('../../utils/token');

router.get('/prognose/getFahrzeugstueckzahlen', checkToken, tryCatch(prognoseController.getFahrzeugstueckzahlen));

router.post('/prognose/updateFahrzeugstueckzahlen', checkToken, tryCatch(prognoseController.updateFahrzeugstueckzahlen));

router.post('/prognose/prognoseVerbauratenBerechnung', checkToken, tryCatch(prognoseController.prognoseVerbauratenBerechnung));

router.get('/prognose/exportPrognoseVerbauraten', checkToken, tryCatch(prognoseController.exportPrognoseVerbauraten));

router.post('/prognose/importParameterVU', checkToken, tryCatch(prognoseController.importParameterVU));

router.get('/prognose/exportParameterVU', checkToken, tryCatch(prognoseController.exportParameterVU));

router.post('/prognose/importPrognoseVerbauraten', checkToken, tryCatch(prognoseController.importPrognoseVerbauraten));

router.post('/prognose/importPrognosemengen', checkToken, tryCatch(prognoseController.importPrognosemengen));

router.get('/prognose/exportPrognosemengen', checkToken, tryCatch(prognoseController.exportPrognosemengen));

router.post('/prognose/importPrognoseTeileliste', checkToken, tryCatch(prognoseController.importPrognoseTeileliste));

router.get('/prognose/exportPrognoseTeileliste', checkToken, tryCatch(prognoseController.exportPrognoseTeileliste));

router.get('/prognose/exportPrognose',tryCatch(prognoseController.exportPrognose));


module.exports = router;
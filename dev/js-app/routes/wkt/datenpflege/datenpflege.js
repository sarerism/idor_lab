const express = require('express');
const router  = express.Router(); 
const multer = require('multer');
const upload = multer();
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

const baureihenController = require('../../../controller/wkt/datenfplege/baureihenkenner');
const langController = require('../../../controller/wkt/datenfplege/langebezeichnung');
const sprachController = require('../../../controller/wkt/datenfplege/sprachtabelle');
const termidController = require('../../../controller/wkt/datenfplege/termid');
const wkparameterController = require('../../../controller/wkt/datenfplege/warenkorbparameter');
const standardWkController = require('../../../controller/wkt/datenfplege/standardwarenkorb');

router.get('/wkt/datenpflege/getBaureihenkenner', checkToken, tryCatch(baureihenController.getBaureihenkenner));

router.post('/wkt/datenpflege/updateBaureihenkenner', checkToken, tryCatch(baureihenController.updateBaureihenkenner));

router.post('/wkt/datenpflege/importLangeBezeichnung', checkToken,  upload.single("fileName") ,tryCatch(langController.importLangeBezeichnung));

router.post('/wkt/datenpflege/importSprachtabelle', checkToken, tryCatch(sprachController.importSprachtabelle));

router.get('/wkt/datenpflege/exportSprachtabelle', checkToken, tryCatch(sprachController.exportSprachtabelle));

router.post('/wkt/datenpflege/importTermID', checkToken, tryCatch(termidController.importTermID));

router.post('/wkt/datenpflege/exportTermID', checkToken, tryCatch(termidController.exportTermID));

router.post('/wkt/datenpflege/importWKParameter', checkToken, tryCatch(wkparameterController.importWKParameter));

router.get('/wkt/datenpflege/exportWkParameter', checkToken, tryCatch(wkparameterController.exportWkParameter));

router.post('/wkt/datenpflege/importStandartWK', checkToken, tryCatch(standardWkController.importStandartWK));

module.exports = router;
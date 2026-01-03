const express = require('express');
const router  = express.Router(); 
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

const warenkorbController = require('../../../controller/wkt/warenkorb/warenkorb');

router.post('/wkt/warenkorb/getWarenkorbCountries', checkToken, tryCatch(warenkorbController.getWarenkorbCountries));

router.post('/wkt/warenkorb/importTeileListe', checkToken, tryCatch(warenkorbController.importTeileListe));

router.post('/wkt/warenkorb/exportWarenkorbWKT', checkToken, tryCatch(warenkorbController.exportWarenkorbWKT));

router.post('/wkt/warenkorb/exportWarenkorbWKTMarkt', checkToken, tryCatch(warenkorbController.exportWarenkorbWKTMarkt));

module.exports = router;
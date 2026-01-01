const express = require('express');
const router  = express.Router(); 
const previewController = require('../../../controller/esb/preview/preview');
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

/* Preview Daten Laden */
router.post('/getPreviewData', checkToken ,tryCatch(previewController.getPreviewData));

module.exports = router;
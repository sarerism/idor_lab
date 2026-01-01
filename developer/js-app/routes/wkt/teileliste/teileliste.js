const express = require('express');
const router  = express.Router(); 
const { tryCatch } = require('../../../utils/tryCatch');
const { checkToken } = require('../../../utils/token');

const stuecklistenController = require('../../../controller/wkt/teileliste/stueckliste');

const teilelistenController = require('../../../controller/wkt/teileliste/teileliste');

router.post('/wkt/teileliste/importStueckliste', checkToken, tryCatch(stuecklistenController.importStueckliste));

router.post('/wkt/teileliste/exportStueckliste', checkToken, tryCatch(stuecklistenController.exportStueckliste));

router.post('/wkt/teileliste/importVerbauraten', checkToken, tryCatch(teilelistenController.importVerbauraten));

router.post('/wkt/teileliste/exportTeileListePKWEQ', checkToken, tryCatch(teilelistenController.exportTeilelistePKWEQ));

router.post('/wkt/teileliste/exportTeileListeNeu', checkToken, tryCatch(teilelistenController.exportTeilelisteNeu));

module.exports = router;
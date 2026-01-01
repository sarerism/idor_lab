const AppError = require('../../../classes/AppError');
const EmptyResult = require('../../../classes/EmptyResult');

const getPreviewData = async (req,res) => {
    if(!req.body) throw new AppError("no body");
    const pool = req.app.locals.postgresSQL;
    let bereichVar = '';
    let verfahrenVar = '';
    if (req.body.auftragerstellung == 'Wholesale & Retail') {
        if (req.body.bereich == 'Push Matrix') {
            bereichVar = `lampa.lampa_pushmatrix`;
        } else {
            bereichVar = `lampa.lampa_warenkorb`;
            verfahrenVar = `AND "Verfahren" = '${req.body.auftragerstellung}'`;
        }
    } else {
        bereichVar = `lampa.lampa_warenkorb`;
        verfahrenVar = `AND "Verfahren" = '${req.body.auftragerstellung}'`;
    }
    let previewQuery = `SELECT * FROM ${bereichVar} WHERE "Land" = '${req.body.country}' AND "Sparte" = '${req.body.sparte}' ${verfahrenVar};`;
    try {
        const result = await pool.query(`${previewQuery}`);
        if(result.rows === 0) throw new EmptyResult("","Preview");
        res.status(200).json({ error: false, data: result.rows });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: true, errorMessage: err });
    }
};

module.exports = { getPreviewData };
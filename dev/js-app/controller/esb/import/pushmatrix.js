const AppError = require('../../../classes/AppError');
const DatabaseConnError = require('../../../classes/DatabaseConnError');
const EmptyResult = require('../../../classes/EmptyResult');
const { arrayEquals, checkColumns } = require('../../../functions/check');
const { convertToColumn, convertValues } = require('../../../functions/convert');
const objectPropertyManipulation = require('../../../functions/objectPropertyManipulation');

const importPushmatrix = async (req,res,next) => {
    const pool = req.app.locals.postgresSQL;
    let checkVar = await checkColumns(req.body.formInfo,pool);
    let forecastVar = req.body.forecast;
    const { country, sparte } = req.body.formInfo;
    const queryVar = forecastVar ? 'lampa_pushmatrix_forecast' : 'lampa_pushmatrix';
    let arrCheck = await arrayEquals(Object.keys(req.body.importData[0]), checkVar);
    if (arrCheck != true) {
        return res.status(200).json({ status: 'Invalid Column Names' });
    } else {
        await pool.query(`DELETE FROM lampa.${queryVar} WHERE "Land" = $1 AND "Sparte" = $2`,[country,sparte]);
        let endquery = '';
        let columnQuery = await convertToColumn(Object.keys(req.body.importData[0]), req.body.formInfo);
        columnQuery = columnQuery + `,"VFNR6"`;
        columnQuery = columnQuery.replace(',', '');
        let valueElement = null;
        await Promise.all(req.body.importData.map(async (element) => {
            const vfnrLoop = async () => {
                if (element.VFNR.toString().length != 6) {
                    return element.VFNR6 = '0' + element.VFNR;
                } else {
                    return element.VFNR6 = element.VFNR;
                }
            };
            await vfnrLoop();
            const changeValueLoop = async () => {
                for (let index = 0; index < Object.keys(element).length; index++) {
                    const el = Object.keys(element)[index];
                    if (Math.sign(element[`${el}`]) == -1) {
                        element[`${el}`] = Math.abs(element[`${el}`]);
                    }
                }
            };
            await changeValueLoop();
            valueElement = await convertValues([element]);
            let lieferVFNR = element.VFNR;
            lieferVFNR = lieferVFNR.toString()
            lieferVFNR = lieferVFNR.padStart(6,'0');
            valueElement += `,'${lieferVFNR}'` ;
            endquery += `,` + `('${req.body.formInfo.country}','${req.body.formInfo.sparte}'${valueElement})`;
        }));
        endquery = endquery.replace(',', '');
        let finalQuery = `INSERT INTO lampa.${queryVar} ("Land","Sparte",${columnQuery},"LieferVFNR6") VALUES ${endquery};`;
        const result = await pool.query(`${finalQuery}`);
        return res.status(200).json({ status: 'Success', rowsAffected: result.rowsAffected, errorMessage: false });
    }
};

const exportPushmatrix = async (req,res,next) => {
    try {
        if(!req.body) throw new AppError("No body");
        if(Object.keys(req.body).length === 0) throw new AppError("Empty body");
        if(!req.body.country || !req.body.sparte) throw new AppError("Partial Empty Body");
        
        const pool = req.app.locals.postgresSQL;
        if(!pool) throw new DatabaseConnError("");
        
        const result = await pool.query(`SELECT * FROM lampa.lampa_pushmatrix WHERE "Land" = $1 AND "Sparte" = $2`, [req.body.country, req.body.sparte]);
        if(result.rows === 0) throw new EmptyResult(""," Warenkorb abfrage");
        
        const pushmatrix = result.rows;
        let convertedPushmatrixArray = [];


        /**
         * Notiz: Mal anschauen ob die Datenbankabfrage besser gestaltet werden kann.
         */

        const PROPERTY_REMOVE_ARRAY =  ["vfnr6","id","letzteaenderung","sparte"];

        for (let pushmatrixEintrag of pushmatrix) {
            objectPropertyManipulation.removeNullProperties(pushmatrixEintrag)
            objectPropertyManipulation.removePropertiesGiven(pushmatrixEintrag,PROPERTY_REMOVE_ARRAY);
            convertedPushmatrixArray.push(pushmatrixEintrag);
        }
        res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: convertedPushmatrixArray });    
    } catch (error) {
        console.log(error);
        res.status(500).send(error.message);
    }
};

module.exports = { importPushmatrix , exportPushmatrix };
const AppError = require('../../../classes/AppError');
const DatabaseConnError = require('../../../classes/DatabaseConnError');
const EmptyResult = require('../../../classes/EmptyResult');
const { checkColumns, arrayEquals } = require('../../../functions/check');
const { convertToColumn, convertTNR, convertValues } = require('../../../functions/convert');
const objectPropertyManipulation = require('../../../functions/objectPropertyManipulation');

const importWarenkorbESB = async (req,res,next) => {
    const pool = await req.app.locals.postgresSQL;

    const forecastVar = req.body.forecast;
    const queryVar = forecastVar ? 'lampa_forecast_warenkorb' : 'lampa_warenkorb';

    const { country, sparte, auftragerstellung } = req.body.formInfo;

    await pool.query(`DELETE FROM lampa.${queryVar} WHERE "Land" = $1 AND "Sparte" = $2 AND "Verfahren" = $3;`,[country,sparte, auftragerstellung]);

    let endquery = '';
    let checkElement = '';
    let valueElement = null;
    let columnQuery = await convertToColumn(Object.keys(req.body.importData[0]), req.body.formInfo);
    columnQuery = columnQuery + `,"TNRsort"`;
    columnQuery = columnQuery.replace(',', '');
    await Promise.all(req.body.importData.map(async (element) => {
        checkElement = element['TNRlies'];
        checkElement = await convertTNR(checkElement);
        element['TNRsort'] = checkElement;
        valueElement = await convertValues([element]);
        valueElement = valueElement.replace(',', '');
        endquery += `,` + `('${req.body.formInfo.country}','${req.body.formInfo.sparte}','${req.body.formInfo.auftragerstellung}',${valueElement})`;
    }));
    endquery = endquery.replace(',', '');

    // NOTE: [column_name] brackets were removed for migration
    let finalQuery = `INSERT INTO lampa.${queryVar} ("Land","Sparte","Verfahren",${columnQuery}) VALUES ${endquery};`;

    const result = await pool.query(`${finalQuery}`);
    return res.status(200).json({ status: 'Success', rowsAffected: result.rowCount, errorMessage: false });
};

const exportWarenkorbESB = async (req,res,next) => {
    try {
        if(!req.body) throw new AppError("No body");
        if(Object.keys(req.body).length === 0) throw new AppError("Empty body");
        if(!req.body.country || !req.body.sparte || !req.body.auftragerstellung) throw new AppError("Partial Empty Body");
    
        const pool = req.app.locals.postgresSQL;
        if(!pool) throw new DatabaseConnError("");

        /* 
            Notiz: Kann man die Location nicht anhand der ESB herausfinden? 
                (Wurde nie so beschrieben deshalb auch nicht geprüft)
            Somit müsste man nicht alle werte durchgehen um die Locationen zu löschen.
        */
        let values = [req.body.country, req.body.sparte, req.body.auftragerstellung];
        const result = await pool.query(`SELECT * FROM lampa.lampa_warenkorb WHERE "Land" = $1 AND "Sparte" = $2 AND "Verfahren" = $3;`, values);
        
        if(result.rows.length === 0) throw new EmptyResult(""," Warenkorb abfrage");
    
        let warenkorb = result.rows;
        let convertedWarenkorb = [];

        /**
         * Notiz:
         * Diese Properties müssen immer entfernt werden, wenn man die Locationen schon vorher
         * spezifisch abfragen könnte würde das entfernen hier obselete werden (removeNullProperties).
         */
    
        const PROPERTY_REMOVE_ARRAY =  ["verfahren","tnrsort","id","letzteaenderung","sparte"];

        for (let warenkorbEintrag of warenkorb) {
            objectPropertyManipulation.removeNullProperties(warenkorbEintrag)
            objectPropertyManipulation.removePropertiesGiven(warenkorbEintrag,PROPERTY_REMOVE_ARRAY);
            convertedWarenkorb.push(warenkorbEintrag);
        }
        res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: convertedWarenkorb });
    } catch (error) {
        console.log(error);
        let status = 500;
        res.status(status).send(error.message); 
    }
}

//NOTE: Sollte in einen Extraordner mit Files für WKT
const exportWarenkorbWKT = async (req,res,next) => {

};

const exportWarenkorbWKTM = async (req,res,next) => {

};

const checkTeilenummer = async (req,res) => {
    const pool = await req.app.locals.postgresSQL;
    let checkIfAll = []
    let checkVar = await checkColumns(req.body.formInfo,pool);
    let arrCheck = await arrayEquals(Object.keys(req.body.importData[0]), checkVar);
    if (arrCheck != true) {
        return res.status(200).json({ status: 'Invalid Column Names', errorMessage: true });
    } else {
        if (req.body.importData == undefined || req.body.importData == '') {
            return res.status(200).json({ status: 'No File was uploaded!' });
        } else {
            let errorArray = [];
            let tempArray = [];
            let importData = req.body.importData;
            const loopArr = async () => {
                await Promise.all(importData.map(async (element) => {
                    const loopFunc = async () => {
                        let checkElement = element['TNRlies'];
                        checkElement = await convertTNR(checkElement);
                        checkIfAll.push(checkElement);
                        try {
                            const result = await pool.query(`SELECT "MATNR_SORT" FROM lampa.lampa_primus WHERE "MATNR_SORT" = '${checkElement}';`);
                            if (result.rows == 0) {
                                errorArray.push(element['TNRlies']);
                            } else {
                                tempArray.push(element['TNRlies']);
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    await loopFunc();
                }));
            }
            await loopArr();
            if (errorArray != 0) {
                return res.status(200).json({ status: 'Error!', errorMessage: true, notFound: errorArray, found: tempArray, check: checkIfAll });
            } else if (errorArray == 0) {
                return res.status(200).json({ status: 'Success!', errorMessage: false, found: tempArray });
            }
        }
    }
}

module.exports = { importWarenkorbESB , exportWarenkorbESB , exportWarenkorbWKT , exportWarenkorbWKTM, checkTeilenummer };
const DatabaseConnError = require('../classes/DatabaseConnError');
const AppError = require('../classes/AppError');

const DEFAULT_MARKETING_CODE = 100000;

const getMiraData = async (req,res,next) => {
    const pool = req.app.locals.postgresSQL;
    let marketingcodeV2;
    let locations;
    let laenderkurzel;
    let testArrayWithblp;
    let formData = req.body;
    let teilanlagenArray = [];
    let verfahrenVar = '';
    if (req.body.sparte == 'PKW MB' || req.body.sparte == 'Aggregate') {
        marketingcodeV2 = '1PX000';
    } else if (req.body.sparte == 'PKW smart') {
        marketingcodeV2 = 'SPX000';
    }else if(req.body.sparte == 'Van'){
        marketingcodeV2 = '2TZ000';
    }
    if (req.body.auftragerstellung == 'Wholesale only') {
        verfahrenVar = ` AND lampa."lampa_warenkorb"."Verfahren" = 'Wholesale only'`;
    } else {
        verfahrenVar = ` AND lampa."lampa_warenkorb"."Verfahren" = 'Wholesale & Retail'`;
    }

    if(!pool) throw new DatabaseConnError("");
    const laenderResult = await pool.query(
        `SELECT "SPRACHE" FROM lampa."lampa_ESB_Kundenparameter" WHERE "LAND" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}';`);
    laenderkurzel = laenderResult.rows;

    if(!pool) throw new DatabaseConnError("");
    const kundenKdnr = await pool.query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
    WHERE "LAND" = '${formData.country}' AND "SPARTE" = '${formData.sparte}';`);
    locations = kundenKdnr.rows;

    if(locations.length === 0) throw new AppError("");
    //TODO: Kundenummer2 wird nachfolgend nicht benötigt
    for (let i = 0; i < locations.length; i++) {
        const locationElement = locations[i];
        const sqlQuery = `SELECT DISTINCT
        "Sales Org ID" AS "SalesOrgID",
        "Warehouse ID" AS "WarhouseID",
        "KDNR" as "Kundennummer1", 
        "KDNR" as "Kundennummer2",
        "TNRsort" as "Teilenummer",
        "${laenderkurzel[i].SPRACHE}" AS "Benennung",
        (SELECT  
            (CASE WHEN "Mengeneinheit" = ''
            THEN 
            '01'
            ELSE "Mengeneinheit"
        END )) as "Mengeneinheit",
        "CentralVendorCode" AS "Lieferwerk",
        "Praefix Lieferwerk" AS "LieferwerkPraefix",
        (SELECT
        CASE
            WHEN "Rabattgruppe_akt" = '0'::text THEN '20'::text
            ELSE "Rabattgruppe_akt"::text
        END) AS "Rabattgruppe",
        "WAEHRUNG" As "Waehrung",
        "SPRACHE_CODE" AS "Sprachcode",
        2 AS "Dezimalstellen",
        lampa."lampa_blp"."Bruttolistpreis_akt" * lampa."lampa_ESB_Kundenparameter"."WAEHRUNG_FAKTOR" AS "Bruttolistpreis",
        "Marketingcode",
        "BRANCH" as "Branch",
        "Division_Code" AS "Division Code", 
        "Fiktives_Baumuster" AS "ETBM"
        FROM
        lampa."lampa_ESB_Kundenparameter"
        JOIN lampa."lampa_warenkorb" ON lampa."lampa_warenkorb"."Land" = "lampa_ESB_Kundenparameter"."LAND"
        JOIN lampa."lampa_primus" ON "lampa_primus"."MATNR_SORT" = "lampa_warenkorb"."TNRsort"
        LEFT JOIN lampa."lampa_blp" ON REPLACE("lampa_blp"."MATNR_DRUCK",' ','') = REPLACE("lampa_primus"."MATNR_DRUCK",' ','')
        WHERE lampa."lampa_ESB_Kundenparameter"."LAND" = '${req.body.country}'  
        AND lampa."lampa_warenkorb"."Sparte" = '${req.body.sparte}' 
        AND "KDNR" = '${locationElement.KDNR}' ${verfahrenVar}`;
        const queryResult = (await pool.query(sqlQuery)).rows;
        let teilanlage = [];
        // TODO: fragen was mit dem lieferwerk format ist da es nun mit dem präfix keine zahl mehr ist
        /** Notiz: Hier vielleicht nochmal prüfen ob etwas zurück gekommen ist */
        for (let queryElement of queryResult) {
            queryElement['Lieferwerk'] = queryElement['Lieferwerk'] ? `${queryElement['Lieferwerk'].padStart(4, '0')}` : '';
            queryElement['Benennung'] = queryElement['Benennung'] ? `${queryElement['Benennung'].padEnd(25, ' ')}` : '';
            queryElement['Teilenummer'] = queryElement['Teilenummer'] ? `${queryElement['Teilenummer']}` : '';
            queryElement['Mengeneinheit'] = queryElement['Mengeneinheit'] ? queryElement['Mengeneinheit'].substring(1, 2) : '';
            let bruttopreis = queryElement['Bruttolistpreis'];

            if (bruttopreis == null || bruttopreis == 'null' || bruttopreis == 0) {
                bruttopreis = '1';
                queryElement['Rabattgruppe'] = '20';
                bruttopreis = bruttopreis ? `="${bruttopreis.padStart(11, '0')}"` : '';
            } else {
                bruttopreis = Math.round((bruttopreis + Number.EPSILON) * 100) / 100;
                bruttopreis = bruttopreis.toString();
                bruttopreis = bruttopreis.replace('.', '');
                bruttopreis = `="${bruttopreis.padStart(11, '0')}"`;
            }
            let marketingcode = queryElement['Marketingcode'];
            if (marketingcode == DEFAULT_MARKETING_CODE || marketingcode == DEFAULT_MARKETING_CODE.toString() || marketingcode == '      ' || marketingcode == 'null' || marketingcode == null || marketingcode == undefined) {
                marketingcode = marketingcodeV2;
            }
            queryElement['LieferwerkPraefix'] = queryElement['LieferwerkPraefix'] ? queryElement['LieferwerkPraefix']  : '';
            let objTemp = {
                salesOrgId: queryElement['SalesOrgID'],
                warehouseId: queryElement['WarhouseID'],
                kundennummer: queryElement['Kundennummer1'],
                teilenummer : queryElement['Teilenummer'],
                lieferwerk : queryElement['LieferwerkPraefix'] + queryElement['Lieferwerk'],
                waehrung : queryElement['Waehrung'],
                rabattGruppe : queryElement['Rabattgruppe'],
                dezimalstellen : queryElement['Dezimalstellen'],
                bruttolistpreis : bruttopreis,
                marketingcode: marketingcode,
                divisionCode : queryElement['Division Code'],
                etbm : `="${queryElement['ETBM']}"` 
            };
            teilanlage.push(objTemp);
        }
        teilanlagenArray.push(teilanlage);
    }
    return res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: teilanlagenArray, checkData: testArrayWithblp });
}

const getSpicsData = async (req,res,next) => {
    const pool = req.app.locals.postgresSQL;
    let marketingcodeV2;
    let locations;
    let laenderkurzel;
    let testArrayWithblp;
    let formData = req.body;
    let pushData = [];
    let stringArray = [];
    let verfahrenVar = '';
    if (req.body.sparte == 'PKW MB' || req.body.sparte == 'Aggregate') {
        marketingcodeV2 = '1PX000';
    } else if (req.body.sparte == 'PKW smart') {
        marketingcodeV2 = 'SPX000';
    }else if(req.body.sparte == 'Van'){
        marketingcodeV2 = '2TZ000';
    }
    if (req.body.auftragerstellung == 'Wholesale only') {
        verfahrenVar = ` AND lampa."lampa_warenkorb"."Verfahren" = 'Wholesale only'`;
    } else {
        verfahrenVar = ` AND lampa."lampa_warenkorb"."Verfahren" = 'Wholesale & Retail'`;
    }

    if(!pool) throw new DatabaseConnError("");
    const laenderResult = await pool.query(
        `SELECT "SPRACHE" FROM lampa."lampa_ESB_Kundenparameter" WHERE "LAND" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}';`
        )
    laenderkurzel = laenderResult.rows;

    if(!pool) throw new DatabaseConnError("");
    const kundenKdnr = await pool.query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
    WHERE "LAND" = '${formData.country}' AND "SPARTE" = '${formData.sparte}';`);
    locations = kundenKdnr.rows;

    if(locations.length === 0) throw new AppError("");
    for (let i = 0; i < locations.length; i++) {
        const locationElement = locations[i];
        const sqlQuery = `SELECT DISTINCT
        "KDNR" as "Kundennummer1", 
        "KDNR" as "Kundennummer2",
        "TNRsort" as "Teilenummer",
        "${laenderkurzel[i].SPRACHE}" AS "Benennung",
        (SELECT  
            (CASE WHEN "Mengeneinheit" = ''
            THEN 
            '01'
            ELSE "Mengeneinheit"
        END )) as "Mengeneinheit",
        "CentralVendorCode" AS "Lieferwerk",
        (SELECT
            CASE
                WHEN "Rabattgruppe_akt" = '0'::text THEN '20'::text
                ELSE "Rabattgruppe_akt"::text
            END) AS "Rabattgruppe",
        "WAEHRUNG" As "Waehrung",
        "SPRACHE_CODE" AS "Sprachcode",
        2 AS "Dezimalstellen",
        lampa."lampa_blp"."Bruttolistpreis_akt" * lampa."lampa_ESB_Kundenparameter"."WAEHRUNG_FAKTOR" AS "Bruttolistpreis",
        "Marketingcode",
        "BRANCH" as "Branch",
        "Division_Code" AS "Division Code", 
        "Fiktives_Baumuster" AS "ETBM"
        FROM
        lampa."lampa_ESB_Kundenparameter"
        JOIN lampa."lampa_warenkorb" ON "lampa_warenkorb"."Land" = "lampa_ESB_Kundenparameter"."LAND"
        JOIN lampa."lampa_primus" ON "lampa_primus"."MATNR_SORT" = "lampa_warenkorb"."TNRsort"
        LEFT JOIN lampa."lampa_blp" ON REPLACE("lampa_blp"."MATNR_DRUCK",' ','') = REPLACE("lampa_primus"."MATNR_DRUCK",' ','')
        WHERE "lampa_ESB_Kundenparameter"."LAND" = '${req.body.country}'  
        AND "lampa_warenkorb"."Sparte" = '${req.body.sparte}' 
        AND "KDNR" = '${locationElement.KDNR}' ${verfahrenVar}`;
        if(!pool) throw new DatabaseConnError("");
        const queryResult = (await pool.query(sqlQuery)).rows;
        /** Notiz: Hier vielleicht nochmal prüfen ob etwas zurück gekommen ist */
        for (let queryElement of queryResult) {
            queryElement['Lieferwerk'] = queryElement['Lieferwerk'] ? `${queryElement['Lieferwerk'].padStart(4, '0')}` : '';
            queryElement['Benennung'] = queryElement['Benennung'] ? `${queryElement['Benennung'].padEnd(25, ' ')}` : '';
            queryElement['Teilenummer'] = queryElement['Teilenummer'] ? `${queryElement['Teilenummer'].padEnd(24, ' ')}` : '';
            queryElement['Mengeneinheit'] = queryElement['Mengeneinheit'] ? queryElement['Mengeneinheit'].substring(1, 2) : '';
            let bruttopreis = queryElement['Bruttolistpreis'];

            if (bruttopreis == null || bruttopreis == 'null' || bruttopreis == 0) {
                bruttopreis = '1';
                queryElement['Rabattgruppe'] = '20';
                bruttopreis = bruttopreis ? bruttopreis.padStart(11, '0') : '';
                queryElement['Rabattgruppe'] = queryElement['Rabattgruppe'] ? queryElement['Rabattgruppe'].padStart(2, '0') : '';
            } else {
                bruttopreis = Math.round((bruttopreis + Number.EPSILON) * 100) / 100;
                bruttopreis = bruttopreis.toString();
                bruttopreis = bruttopreis.replace('.', '');
                bruttopreis = bruttopreis.padStart(11, '0');
                queryElement['Rabattgruppe'] = queryElement['Rabattgruppe'].padStart(2, '0')
            }
            let marketingcode = queryElement['Marketingcode'];
            if (marketingcode == DEFAULT_MARKETING_CODE || marketingcode == DEFAULT_MARKETING_CODE.toString() || marketingcode == '      ' || marketingcode == 'null' || marketingcode == null || !marketingcode) {
                marketingcode = marketingcodeV2;
            }
            let temp = (queryElement['Kundennummer1'] +
            queryElement['Kundennummer2'] +
            queryElement['Teilenummer'] +
            queryElement['Benennung'] +
            queryElement['Mengeneinheit'] +
            queryElement['Lieferwerk'] +
            queryElement['Rabattgruppe'] +
            queryElement['Waehrung'] +
            queryElement['Sprachcode'] +
            queryElement['Dezimalstellen'] +
            bruttopreis +
            marketingcode +
            queryElement['Branch'] +
            '           ' +
            queryElement['Division Code'] +
            queryElement['ETBM']);
            let objTemp = { test: temp };
            stringArray.push(objTemp);
        }
        pushData.push(stringArray);
        stringArray = [];
    }
    return res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: pushData, checkData: testArrayWithblp });
}

module.exports = { getMiraData , getSpicsData };
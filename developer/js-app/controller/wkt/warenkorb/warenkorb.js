const { removePropertiesFromArray } = require("../../../functions/objectPropertyManipulation");
const { spaltenCheck, includesSpaltenErrorHandling, requiredColumns } = require("../../../utils/columns");
// TODO: check if still required
let _ = require('lodash');
const { verbauratenBerechnung, verbauratenBerechnungTeileliste } = require("../../../services/verbauratenService");

const getWarenkorbCountries = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    const { sparte } = req.body;
    const result = await pool.query(`SELECT  DISTINCT "Push-Markt" AS "Push" FROM lampa.lampa_warenkorbparameter WHERE "${sparte}" = 'x';`);
    res.status(200).json({arrayData : result.rows});
};

// TODO: Needs to be tested thouroghly

// FIXME: EVERY Primary Key with autoincrement needs to be "default" in the query;
const importTeileListe = async (req,res) => {
    req.setTimeout(1500000);
    const pool = req.app.locals.postgresSQL;
    let sparte = req.body.sparte;
    let dataArray = req.body.eintraege;
    if(sparte == 'PKW_Motor_Benzin' || sparte == 'PKW_Motor_Diesel'){
        for (let index = 0; index < dataArray.length; index++) {
            let element = dataArray[index];
            element['Built ratio'] = '0%';
        }
    }
    let errLoopArray = [
        'Model',
        'Module',
        'Part no. sort',
        'Part no. read',
        'Name in German',
        'Name in English',
        'Sales codes',
        'RHD/LHD',
        'Built ratio',
        'New model ID',
        'Basket ID Is',
        'Basket ID Target',
        'Prio USA',
        'Qty USA',
        'Line GB',
        'Basket ID Proposal',
        'Pos Prognose',
        'Anmerkung ECE',
        'Remark',
        'Procurement type',
        'Creation date',
        'Launch date',
        'Shelf life',
        'Haz. Mat.',
        'C-code',
        'ID special edition',
        'Driving relevance',
        'B9 key',
        'Marketing code',
        'TermID',
        'Length',
        'Width',
        'Height',
        'Weight',
        'Status life cycle code'
      ];
    if(sparte == 'Van'){
        errLoopArray = [
            'Model',
            'Module',
            'Part no. sort',
            'Part no. read',
            'Name in German',
            'Name in English',
            'Sales codes',
            'RHD/LHD',
            'Built ratio',
            'New model ID',
            'Basket ID Is',
            'Basket ID Target',
            'Line GB',
            'Basket ID Proposal',
            'Pos Prognose',
            'Anmerkung ECE',
            'Remark',
            'Prio USA',
            'Qty USA',
            'Procurement type',
            'Creation date',
            'Launch date',
            'Shelf life',
            'Haz. Mat.',
            'C-code',
            'ID special edition',
            'Driving relevance',
            'B9 key',
            'Marketing code',
            'TermID',
            'Length',
            'Width',
            'Height',
            'Weight',
            'Status life cycle code'
        ]
    }else if(sparte== 'PKW_Motor_Benzin' || sparte == 'PKW_Motor_Diesel'){
        errLoopArray = [
            'Model',
            'Module',
            'Part no. sort',
            'Part no. read',
            'Name in German',
            'Name in English',
            'Sales codes',
            'RHD/LHD',
            'New model ID',
            'Basket ID Is',
            'Basket ID Target',
            'Prio USA',
            'Qty USA',
            'Line GB',
            'Basket ID Proposal',
            'Pos Prognose',
            'Anmerkung ECE',
            'Remark',
            'Prio USA Proposal',
            'Qty USA Proposal',
            'Small Pkg',
            'Large Pkg',
            'Package No',
            'Anmerkung USA',
            'Procurement type',
            'Creation date',
            'Launch date',
            'Shelf life',
            'Haz. Mat.',
            'C-code',
            'ID special edition',
            'Driving relevance',
            'B9 key',
            'Qty China',
            'Qty Japan',
            'Marketing code',
            'TermID',
            'Length',
            'Width',
            'Height',
            'Weight',
            'Status life cycle code'
        ]
    }
    let spaltenNamen = req.body.spalten;
    let spaltenNamenWithoutMG = [];
    for (let index = 0; index < spaltenNamen.length; index++) {
        const element = spaltenNamen[index];
        if(element.search('Qty ') < 0){
            spaltenNamenWithoutMG.push(element);
        }else{
            if(element.search('Qty USA') > -1 || element.search('Qty Japan') > -1 || element.search('Qty China') > -1){
                spaltenNamenWithoutMG.push(element);
            }
        }
        
    }
    let errObj = await requiredColumns(errLoopArray,spaltenNamenWithoutMG);
    if(errObj.err == true){
        res.status(200).json({err : true, errorObject : errObj});
    }else{
        await pool.query(`DELETE FROM lampa."lampa_teileListeForWk" WHERE "ID" is not null AND "Sparte" = '${sparte}';`);
        let loopArray = [
            'Module',
            'Part no. sort',
            'Part no. read',
            'Name in German',
            'Name in English',
            'Sales codes',
            'RHD/LHD',
            'Qty FA',
            'Qty FB',
            'Qty FC',
            'Qty FH',
            'Qty FN',
            'Qty FR',
            'Qty FS',
            'Qty FV',
            'Qty FW',
            'Qty FX',
            'Qty FZ',
            'Qty M14',
            'Qty M15',
            'Qty M16',
            'Qty M17',
            'Qty M18',
            'Qty M19',
            'Qty M20',
            'Qty M22',
            'Qty M25',
            'Qty M29',
            'Qty M30',
            'Qty M55',
            'Qty M35',
            'Qty M60',
            'Qty FKA',
            'Qty FKB',
            'Qty FVK',
            'Qty FLK',
            'Qty FHL',
            'Qty FHS',
            'Built ratio',
            'New model ID',
            'Basket ID Is',
            'Basket ID Target',
            'Prio USA',
            'Qty USA',
            'Line GB',
            'Basket ID Proposal',
            'Pos Prognose',
            'Anmerkung ECE',
            'Remark',
            'Prio USA Proposal',
            'Qty USA Proposal',
            'Small Pkg',
            'Large Pkg',
            'Package No',
            'Anmerkung USA',
            'Procurement type',
            'Creation date',
            'Launch date',
            'Shelf life',
            'Haz. Mat.',
            'C-code',
            'ID special edition',
            'Driving relevance',
            'B9 key',
            'Qty China',
            'Qty Japan',
            'Marketing code',
            'TermID',
            'Length',
            'Width',
            'Height',
            'Weight',
            'Status of life cycle code',
            'Sparte'
          ];
        let endquery = '';
        let tempQuery = '';
        Promise.all(dataArray.map(async (element, longIndex) => {
            tempQuery = '';
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
                element['Sparte'] = req.body.sparte;
                if(typeof element[`${el}`] == 'string'){
                    let str = element[`${el}`];
                    if(str.indexOf("'") > -1){
                        element[`${el}`] = str.replace("'","''");
                    }
                }
                if(typeof element[`${el}`] == 'undefined'){
                    element[`${el}`] = "''";
                }
                if(typeof element[`${el}`] == 'string' && element[`${el}`] != "''"){
                    element[`${el}`] = `'${element[`${el}`]}'`;
                }
                if(el.search('Qty') > -1){
                    if(element[`${el}`] == "''"){
                        element[`${el}`] = "NULL";
                    }
                }
                if(el === 'Length' || el === 'Width' || el === 'Weight'){
                    if(element[`${el}`] === "''")  element[`${el}`] = 0;
                }
                if(el == 'Built ratio'){
                    if(element['Built ratio'] === "''"){
                        element['Built ratio'] = 0;
                    }
                }
                if(index == (loopArray.length - 1) && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == (loopArray.length - 1)){
                    tempQuery += `${element[`${el}`]}) \n;`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `INSERT INTO lampa."lampa_teileListeForWk" VALUES(default,${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }

            }
        }));
        const result = await pool.
            query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowsAffected});
    }
};

const exportWarenkorbWKT = async (req,res) => {
    req.setTimeout(1500000);
    const cluster = req.body.cluster;
    let volNisch = req.body.cluster;
    let teileListenData = [];
    let errObj = {err:false,errorMessage: ''};
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT * FROM lampa."lampa_teileListeForWk" WHERE "Sparte" = '${req.body.sparte}'`);
    
    // FIXME: Postgres has rows and row (row for 1 entry | rows for 1+ entries)
    teileListenData = result.rows;
    if(teileListenData.length == 0){
        errObj.err = true;
    }
    if(errObj.err == true){
        res.status(200).json({ err: true, errorMessage: `Es wurde keine Teileliste für "${req.body.sparte}" gefunden \n bitte nochmals hochladen / prüfen`});
    }else{
        let finishedData = [];
        let notFoundInPrimus = [];
        let counter = 0;
        let indexer = 0;
        let mengenString = '';
        let bar = new Promise((resolve,reject) => {
            teileListenData.forEach( async (element ,index) => {
                setTimeout(async () => {
                    mengenString = '';
                    indexer++;
                    // console.log(indexer);
                    // Mengenspalten bei lampa_teilelisteforwk einfügen
                    for (let index = 0; index < Object.keys(element).length; index++) {
                        let objIndex =  Object.keys(element)[index];
                        if(element[objIndex] != null){
                            if(objIndex.search('MG') > -1){
                                mengenString += `'${element[objIndex]}' AS "${objIndex}",`
                            }
                        }
                    }
                    try {
                        // FIXME: Check why V2 = V3?
                        const query = `SELECT 
                        '${element['Module']}' AS "Module",
                        '${element['Line GB']}' AS "Line GB",
                        '${element['Part no. Sort']}' AS "Part no. sort",
                        '${element['Part no. read']}' AS "Part no. read",
                        "Benennung_DE" AS "Benennung deutsch",
                        "Benennung_EN" AS "English",
                        "Benennung_FR" AS "Français",
                        "Benennung_IT" AS "Italiano",
                        "Benennung_ES" AS "Espagnol",
                        "Technik_Info" AS "New model ID",
                        '${element['Salescodes']}' AS "Sales code",
                        '${element['BHD/LHD']}' AS "RHD/LHD",
                        ${mengenString}
                        'WK' AS "Basket ID",
                        'BEV' AS  "Stocking ID",
                        'V1' AS "V1",
                        'V2' AS "V2",
                        'V2' AS "V3",
                        (SELECT "Bruttolistpreis_akt" FROM lampa."lampa_blp" WHERE "MATNR_SORT" = '${element['Part no. Sort']}' ORDER BY "Bruttolistpreis_akt" DESC LIMIT 1) AS "List price GLC",
                        "Rabattgruppe_akt" AS "DG",
                        "Marketingcode",
                        "Max_LG_Zeit" AS "Shelf life",
                        "Gewicht" AS "Weight",
                        "Laenge" AS "Length",
                        "Hoehe" AS "Height",
                        "Breite" AS "Width"
                        FROM lampa."lampa_primus" WHERE "MATNR_SORT" = '${element['Part no. Sort']}';
                        `;
                        const result = await pool.query(query);

                        // FIXME: Postgres has rows and row (row for 1 entry | rows for 1+ entries)
                        if(result.rows.length > 0){
                            for (let index = 0; index < result.rows.length; index++) {
                                const el = result.rows[index];
                                finishedData.push(el);
                            }
                        }else{
                            console.log('no result');
                            notFoundInPrimus.push(element);
                        }
                    } catch (err) {
                        console.log(err);
                        // throw err;
                    }
                    if (index === teileListenData.length -1) resolve();
                }, counter * 25);
                counter++;
            });
        });
        bar.then(async () => {
            let exportArray = [];
            let compiledNotPrimus = [];
            for (let index = 0; index < notFoundInPrimus.length; index++) {
                let element = notFoundInPrimus[index];
                try {
                    const result = await pool.
                    query(`SELECT 
                    '${element['Module']}' AS "Module",
                    '${element['Line GB']}' AS "Line GB",
                    '${element['Part no. Sort']}' AS "Part no. sort",
                    '${element['Part no. read']}' AS "Part no. read",
                    '' AS "Benennung deutsch",
                    '' AS "English",
                    '' AS "Français",
                    '' AS "Italiano",
                    '' AS "Espagnol",
                    '' AS "New model ID",
                    '${element['Salescodes']}' AS "Sales code",
                    '${element['BHD/LHD']}' AS "RHD/LHD",
                    ${mengenString}
                    '' AS "Basket ID",
                    '' AS "Stocking ID",
                    '' AS "V1",
                    '' AS "V2",
                    '' AS "V3",
                    '' AS "List price GLC",
                    '' AS "DG",
                    '' AS "Marketingcode",
                    '' AS "Shelf life",
                    '' AS "Weight",
                    '' AS "Length",
                    '' AS "Height",
                    '' AS "Width"
                    FROM lampa"lampa_teilelisteForWK" WHERE "Part no. Sort" = '${element['Part no. Sort']}' AND id = '${element['ID']}';
                    `);
                    // FIXME: Postgres has rows and row (row for 1 entry | rows for 1+ entries)
                    if(result.rows.length > 0){
                        for (let index = 0; index < result.rows.length; index++) {
                            const el = result.rows[index];
                            compiledNotPrimus.push(el);
                        }
                    }else{
                        console.log('no result');
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            for (let index = 0; index < compiledNotPrimus.length; index++) {
                const element = compiledNotPrimus[index];
                finishedData.push(element);
            }
            for (let index = 0; index < finishedData.length; index++) {
                const element = finishedData[index];
                let termId  = '0' + element['TermID'];
                let query = `SELECT * FROM lampa."lampa_standartwarenkorb" WHERE "WK Pos" = '${element['Line GB']}' AND "Sparte" = '${req.body.sparte}'`;
                try {
                    const result = await pool.query(`${query}`);
                    if(result.rows.length > 0){
                        element['Basket ID'] = result.rows[0]['WK'];
                        element['Stocking ID'] = result.rows[0]['BEV'];
                        if(volNisch == 'vol'){
                            element['V1'] = result.rows[0]['Allg V1 V'];
                            element['V2'] = result.rows[0]['Allg V2 V'];
                            element['V3'] = result.rows[0]['Allg V3 V'];
                        }else if(volNisch == 'nisch'){
                            element['V1'] = result.rows[0]['Allg V1 N'];
                            element['V2'] = result.rows[0]['Allg V2 N'];
                            element['V3'] = result.rows[0]['Allg V3 N'];
                        }else if(volNisch == 'exot'){
                            element['V1'] = result.rows[0]['Allg V1 N'];
                            delete element['V2'];
                            delete element['V3'];
                        }
                        //if vol or nisch
                        exportArray.push(element);
                        console.log(index);
                    }else{
                        element['Basket ID'] = '';
                        element['Stocking ID'] = '';
                        //if vol or nisch
                        element['V1'] = '';
                        element['V2'] = '';
                        element['V3'] = '';
                        exportArray.push(element);
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            for (let index = 0; index < exportArray.length; index++) {
                let element = exportArray[index];
                let keys = Object.keys(element);
                for (let index = 0; index < keys.length; index++) {
                    const el = keys[index];
                    // console.log(element[`${el}`])
                    if(el.search(' MG') > 0){
                        element[`${el}`] = parseInt(element[`${el}`])
                    }
                }
                element['Module'] = parseInt(element['Module']);
                element['Line GB'] = parseInt(element['Line GB']);
                element['V1'] = parseInt(element['V1']);
                element['V2'] = parseInt(element['V2']);
                element['V3'] = parseInt(element['V3']);    
                if(element['List price GLC'] != null){
                    element['List price GLC'] = parseFloat(element['List price GLC'])
                }
                element['Length'] = parseFloat(element['Length'])
                element['Width'] = parseFloat(element['Width'])
                element['Height'] = parseFloat(element['Height'])
                element['Weight'] = parseFloat(element['Weight'])
            }
            exportArray = exportArray.map((row) => {
                let keys = Object.keys(row);
                let obj = {};
                for (let index = 0; index < keys.length; index++) {
                    const el = keys[index];
                    if(el.search(' MG') > 0){
                        obj[`${el.substring(0,el.search(' MG'))}`] = row[`${el}`];
                    }else{
                        obj[`${el}`] = row[`${el}`];
                    }
                }
                return obj;
            });
            if(cluster === "exot") exportArray = removePropertiesFromArray(exportArray, ["V2", "V3"]);
            res.status(200).json({ err: false, teileListe : exportArray, sqlData: teileListenData});
        });
    }
};

const exportWarenkorbWKTMarkt = async (req,res) => {
    const VERBAURATEN_MARKT_TBL = "lampa_marktspezifischeVerbaurate";
    let sprachtitel = '';
    let titelArray = [];
    let notFoundInPrimus = [];
    let sparte = req.body.sparte;
    let errObj = {err:false,errorMessage:''};

    let lang = {};

    const pool = req.app.locals.postgresSQL;

    // TODO: Implement check if empty parameter also injection
    const result = await pool
            .query(`SELECT * FROM lampa."lampa_warenkorbparameter" WHERE "Push-Markt" = '${req.body.country}'`);
    sprachtitel = result.rows;
    sprachtitel[0].Sprache_Titel_WK = sprachtitel[0].Sprache_Titel_WK.replace('ö','oe');
    
    // TODO: Implement check if empty parameter also injection
    const titelResult = await pool.query(`SELECT "${sprachtitel[0].Sprache_Titel_WK}"  AS "Lang", "Feldinhalt" FROM lampa."lampa_sprachtabelle_warenkorb"`);

    // TODO: Check if query result has certain length 24 and if all fields are in sprachtabelle
    titelArray = titelResult.rows;

    
    for (let index = 0; index < titelArray.length; index++) {
        const element = titelArray[index];
        if(element['Lang'] == ''){
            element['Lang'] = ' ';
        }
        
    }

    for(const item of titelArray){
        lang[item.Feldinhalt] = item.Lang;
    }

    let volNisch = req.body.cluster;
    let clusterKenner = '';
    if(volNisch == 'vol'){
        clusterKenner = 'V';
    }else if(volNisch == 'exot' || volNisch == 'nisch'){
        clusterKenner = 'N';
    }
    let teileListenData = [];
    // TODO: Implement check if empty parameter also injection
    const teilListenResult = await pool.query(`SELECT * FROM lampa."lampa_teileListeForWk" WHERE "Sparte" = '${req.body.sparte}'`);
    teileListenData = teilListenResult.rows;
    if(teileListenData.length == 0){
        errObj.err = true;
    }
    if(errObj.err == true){
        console.log('Error!');
        res.status(200).json({ err: true, errorMessage: `Es wurde keine Teileliste für "${req.body.sparte}" gefunden \n bitte nochmals hochladen / prüfen`});
    }else{
        let newTeileliste = [];
        // Lenkung prüfen
        for (let index = 0; index < teileListenData.length; index++) {
            const element = teileListenData[index];
            if(sprachtitel[0]['Lenkung'] == 'L'){
                if(element['BHD/LHD'] == 'L' || element['BHD/LHD'] == 'B'){
                    newTeileliste.push(element);
                }
            }else if(sprachtitel[0]['Lenkung'] == 'R'){
                if(element['BHD/LHD'] == 'R' || element['BHD/LHD'] == 'B'){
                    newTeileliste.push(element);
                }
            }else{
                newTeileliste.push(element);
            }
        }
        let bevArray = [];
        teileListenData = _.clone(newTeileliste);
        for (let index = 0; index < teileListenData.length; index++) {
            let element = teileListenData[index];
            if(element['Line GB'] != ''){
                let bevA = sprachtitel[0]['BEV_A'];
                let bevB = sprachtitel[0]['BEV_B'];
                let bevC = sprachtitel[0]['BEV_C'];
                let bevD = sprachtitel[0]['BEV_D'];
                try {
                    const result = await pool
                        .query(`SELECT * FROM lampa.lampa_standartwarenkorb WHERE "WK Pos"='${element['Line GB']}' AND "Sparte" ='${req.body.sparte}'`);
                        let bevQuery = '';
                        if(result.rows.length > 0){
                            bevQuery = result.rows[0]['BEV'];
                            if(sparte === 'PKW' || sparte === 'EQ'){
                                element['Gruppe'] = result.rows[0]['Gruppe'];
                                element['Bildtafel'] = result.rows[0]['Bildtafel'];
                            }
                        }
                        if(bevA == 'x' && bevQuery == 'A'){
                            element['BEV'] = bevQuery;
                            bevArray.push(element);
                        }else if(bevB == 'x' && bevQuery == 'B'){
                            element['BEV'] = bevQuery;
                            bevArray.push(element);
                        }else if(bevC == 'x' && bevQuery == 'C'){
                            element['BEV'] = bevQuery;
                            bevArray.push(element);
                        }else if(bevD == 'x' && bevQuery == 'D'){
                            element['BEV'] = bevQuery;
                            bevArray.push(element);
                        }
                } catch (err) {
                    console.log(err);
                    res.status(500).json({ error: true, errorMessage: err });
                }
            }
        }

        for (const key in lang) {
            if (Object.hasOwnProperty.call(lang, key)) {
                let element = lang[key];
                if(element.length == 1){
                    element = 'MUST DELETE';
                }
                
            }
        }

        let bennenungsString = '';
        let bennenungsStringV2 = '';
        if(sprachtitel[0]['Sprache_Bennenung'] != 'Benennung_DE'){
            if(sprachtitel[0]['Sprache_Bennenung'] == 'Benennung_EN'){
                bennenungsString = `"Benennung_EN" AS "${lang['Benennung Englisch']}",`;
                bennenungsStringV2 = `'' AS "${lang['Benennung Englisch']}",`;
            }else if(sprachtitel[0]['Sprache_Bennenung'] == 'Benennung_FR'){
                bennenungsString = `"Benennung_FR" AS "${lang['Benennung Französisch']}",`;
                bennenungsStringV2 = `'' AS "${lang['Benennung Französisch']}",`;
            }else if(sprachtitel[0]['Sprache_Bennenung'] == 'Benennung_IT'){
                bennenungsString = `"Benennung_IT" AS "${lang['Benennung Italienisch']}",`;
                bennenungsStringV2 = `'' AS "${lang['Benennung Italienisch']}",`;
            }else if(sprachtitel[0]['Sprache_Bennenung'] == 'Benennung_ES'){
                bennenungsString = `"Benennung_ES" AS "${lang['Benennung Spanisch']}",`;
                bennenungsStringV2 = `'' AS "${lang['Benennung Spanisch']}",`;
            }
        }
        teileListenData = _.clone(bevArray);
        if(teileListenData.length == 0){
            res.status(200).json({ err: true, teileListe : [], errorMessage: 'No Matching Line GB with Standardwarenkorb'});
        }else{
            let finishedData = [];
            let val = '';
            // const resultfromPrimus = await teileliste(stuecklistenData, finishedData);
            let counter = 0;
            let indexer = 0;
            let mengenString = '';
            let bar = new Promise((resolve,reject) => {
                teileListenData.forEach( async (element ,index) => {
                    setTimeout(async () => {
                        mengenString = '';
                        indexer++;
                        // Mengenspalten bei lampa_teilelisteforwk einfügen
                        for (let index = 0; index < Object.keys(element).length; index++) {
                            let objIndex =  Object.keys(element)[index];
                            if(element[objIndex] != null){
                                if(objIndex.search('MG') > -1){
                                    let withoutQty = objIndex.replace('Qty','');
                                    mengenString += `'${element[objIndex]}' AS "${lang['Menge pro Fahrzeug']} ${withoutQty}",`
                                }
                            }
                        }
                        let extra = "";
                        if(sparte === 'PKW' || sparte === 'EQ'){
                            extra = `'${element['Gruppe']}' AS "${lang['Gruppe']}",
                            '${element['Bildtafel']}' AS "${lang['Bildtafel']}",`;
                        }
                        try {
                            let query = `SELECT 
                            ${extra}
                            '${element['Module']}' AS "${lang['Modul']}",
                            '${element['Line GB']}' AS "${lang['WK Pos']}",
                            '${element['Part no. Sort']}' AS "${lang['TNR sort']}",
                            '${element['Part no. read']}' AS "${lang['TNR lies']}",
                            "Benennung_DE" AS "${lang['Benennung deutsch']}",
                            ${bennenungsString}
                            "Technik_Info" AS "${lang['BR-Kenner']}",
                            '${element['Salescodes']}' AS "${lang['Codebedingung']}",
                            '${element['BHD/LHD']}' AS "${lang['LK']}",
                            ${mengenString}
                            ${element['Verbaurate']}::float AS "Verbaurate",
                            (SELECT "WK" FROM lampa.lampa_standartwarenkorb WHERE "WK Pos" = '${element['Line GB']}' LIMIT 1) AS "${lang['WK']}",
                            '${element['BEV']}' AS  "${lang['BEV']}",
                            'V1' AS "${lang['V1']}",
                            'V2' AS "${lang['V2']}",
                            'V2' AS "${lang['V3']}",
                            "ES2",
                            (SELECT "Bruttolistpreis_akt" FROM lampa.lampa_blp WHERE "MATNR_SORT" = '${element['Part no. Sort']}' ORDER BY "Bruttolistpreis_akt" DESC LIMIT 1) AS "${lang['Bruttolistpreis GLC']}",
                            "Rabattgruppe_akt" AS "${lang['Rabattgruppe']}",
                            "Marketingcode" AS "${lang['Marketingcode']}",
                            "Max_LG_Zeit" AS "${lang['Lagerdauer']}",
                            "Gewicht" AS "${lang['Gewicht']}",
                            "Laenge" AS "${lang['Länge']}",
                            "Hoehe" AS "${lang['Höhe']}",
                            "Breite" AS "${lang['Breite']}",
                            '${element['Part no. Sort']}' AS "Sort"
                            FROM lampa.lampa_primus WHERE "MATNR_SORT" = '${element['Part no. Sort']}';
                            `
                            const result = await pool.query(query);
                            if(result.rows.length > 0){
                                for (let index = 0; index < result.rows.length; index++) {
                                    const el = result.rows[index];
                                    finishedData.push(el);
                                }
                            }else{
                                notFoundInPrimus.push(element);
                                console.log('no result');
                            }
                        } catch (err) {
                            console.log(err);
                        }
                        if (index === teileListenData.length -1) resolve();
                    }, counter * 25);
                    counter++;
                });
            });
            bar.then(async () => {
                console.log(finishedData)
                let exportArray = [];
                let notFoundInPrimusCompiled = [];
                for (let index = 0; index < notFoundInPrimus.length; index++) {
                    const element = notFoundInPrimus[index];
                    let extra = "";
                    if(sparte === 'PKW' || sparte === 'EQ'){
                        extra = `'${element['Gruppe']}' AS "${lang['Gruppe']}",
                        '${element['Bildtafel']}' AS "${lang['Bildtafel']}",`;
                    }
                    try {
                        let query = `SELECT 
                        ${extra}
                        '${element['Module']}' AS "${lang['Modul']}",
                        '${element['Line GB']}' AS "${lang['WK Pos']}",
                        '${element['Part no. Sort']}' AS "${lang['TNR sort']}",
                        '${element['Part no. read']}' AS "${lang['TNR lies']}",
                        '' AS "${lang['Benennung deutsch']}",
                        ${bennenungsStringV2}
                        '' AS "${lang['BR-Kenner']}",
                        '${element['Salescodes']}' AS "${lang['Codebedingung']}",
                        '${element['BHD/LHD']}' AS "${lang['LK']}",
                        ${mengenString}
                        ${element['Verbaurate']}::float AS "Verbaurate",
                        '' AS "${lang['WK']}",
                        '${element['BEV']}' AS "${lang['BEV']}",
                        'V1' AS "${lang['V1']}",
                        'V2' AS "${lang['V2']}",
                        'V2' AS "${lang['V3']}",
                        '' AS "ES2",
                        '' AS "${lang['Bruttolistpreis GLC']}",
                        '' AS "${lang['Rabattgruppe']}",
                        '' AS "${lang['Marketingcode']}",
                        '' AS "${lang['Lagerdauer']}",
                        '' AS "${lang['Gewicht']}",
                        '' AS "${lang['Länge']}",
                        '' AS "${lang['Höhe']}",
                        '' AS "${lang['Breite']}"
                        FROM lampa."lampa_teileListeForWk" WHERE "Part no. Sort" = '${element['Part no. Sort']}' AND "ID" = '${element['ID']}';
                        `
                        const result = await pool.query(query);
                        if(result.rows.length > 0){
                            for (let index = 0; index < result.rows.length; index++) {
                                const el = result.rows[index];
                                notFoundInPrimusCompiled.push(el);
                            }
                        }else{
                            console.log('no result');
                        }
                    } catch (err) {
                        console.log(err);
                    }
                }
                for (let index = 0; index < notFoundInPrimusCompiled.length; index++) {
                    const element = notFoundInPrimusCompiled[index];
                    finishedData.push(element);
                }
                let queryZusatz = '';
                if(req.body.country != 'Frankreich'){
                    if(sprachtitel[0]['V1'] > 0){
                        queryZusatz += ` "${sprachtitel[0]['Kennung_V1']} V1 V",`;
                        queryZusatz += ` "${sprachtitel[0]['Kennung_V1']} V1 N",`;
                    }
                }else{
                    queryZusatz += ` "Val V1 V",`;
                    queryZusatz += ` "Val V1 N",`;
                    queryZusatz += ` "ET V1 N",`;
                    queryZusatz += ` "ET V1 V",`;
                }
                if(sprachtitel[0]['V2'] > 0){
                    queryZusatz += ` "${sprachtitel[0]['Kennung_V2-V3']} V2 V",`;
                    queryZusatz += ` "${sprachtitel[0]['Kennung_V2-V3']} V2 N",`;
                }
                if(sprachtitel[0]['V3'] > 0){
                    queryZusatz += ` "${sprachtitel[0]['Kennung_V2-V3']} V3 V",`;
                    queryZusatz += ` "${sprachtitel[0]['Kennung_V2-V3']} V3 N",`;
                }
                for (let index = 0; index < finishedData.length; index++) {
                    let element = finishedData[index];
                    let termId  = '0' + element['TermID'];
                    let query = `SELECT "WK",
                    ${queryZusatz} "BEV"
                    FROM lampa.lampa_standartwarenkorb WHERE "WK Pos" = '${element[`${lang['WK Pos']}`]}' AND "Sparte" ='${req.body.sparte}'`;
                    
                    try {
                        const result = await pool.query(`${query}`);
                        if(result.rows.length > 0){
                            element[`${lang['WK']}`] = result.rows[0]['WK'];
                            element[`${lang['BEV']}`] = result.rows[0]['BEV'];
                                if(sprachtitel[0]['V1'] > 0){
                                    delete element['V1'];
                                    if(req.body.country == 'Frankreich'){
                                        let frArray = ['Val','ET']
                                        for (let index = 0; index < sprachtitel[0]['V1']; index++) {
                                            let str = `${(index+1)}._Titel_V1`;
                                            element[`${sprachtitel[0][str]}`]= result.rows[0][`${frArray[index]} V1 ${clusterKenner}`];  
                                        }
                                    }else{
                                        for (let index = 0; index < sprachtitel[0]['V1']; index++) {
                                            let str = `${(index+1)}._Titel_V1`;
                                            element[`${sprachtitel[0][str]}`]= result.rows[0][`${sprachtitel[0]['Kennung_V1']} V1 ${clusterKenner}`];  
                                        }
                                    }
                                }else{
                                    delete element['V1'];
                                }
                                if(volNisch != 'exot'){
                                    if(sprachtitel[0]['V2'] > 0){
                                        element[`V2`] = result.rows[0][`${sprachtitel[0]['Kennung_V2-V3']} V2 ${clusterKenner}`];
                                    }else{
                                        delete element['V2'];
                                    }
                                    if(sprachtitel[0]['V3'] > 0){
                                        element[`V3`] = result.rows[0][`${sprachtitel[0]['Kennung_V2-V3']} V3 ${clusterKenner}`];
                                    }else{
                                        delete element['V3'];
                                    }
                                }else{
                                    delete element['V2'];
                                    delete element['V3'];
                                }
                            exportArray.push(element);
                        }else{
                            element[`${lang['WK']}`] = '';
                            element[`${lang['BEV']}`] = '';
                            element[`${sprachtitel[0]['1._Titel_V1']}`] = '';
                            element['V1'] = '';
                            element['V2'] = '';
                            element['V3'] = '';
                            exportArray.push(element);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }

                if(sparte != 'PKW_Motor_Benzin' && sparte != 'PKW_Motor_Diesel'){
                    for (let index = 0; index < exportArray.length; index++) {
                        let element = exportArray[index];
                        let es2 = element['ES2'];
                        let str = element['Teil'];
                        let farbVerbaurate = '';
                        let isFarbe = false;
                        if(es2){
                            if(es2.length >= 3){
                                // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116)
                                if(es2 != '9999' && es2 != '9051' && es2 != '9116'){
                                    if(es2.search(' ') < 0){
                                        let secondPos = es2.substring(1,2);
                                        if(secondPos.match(/[a-z]/i) == null){
                                            if(es2.substring(1,2) ){
                                                farbVerbaurate = es2.substring(es2.length-3,es2.length);
                                                farbVerbaurate = farbVerbaurate+'U';
                                                farbVerbaurate = await verbauratenBerechnungTeileliste(farbVerbaurate,sparte,VERBAURATEN_MARKT_TBL,'',pool);
                                                // farbVerbaurate = parseFloat(farbVerbaurate.replace('%',''));
                                                isFarbe = true;
                                            } 
                                        }
                                    }
                                }
                            }
                            if(isFarbe != false){
                                element['Verbaurate'] = await verbauratenBerechnungTeileliste(element[`${lang['Codebedingung']}`],sparte,VERBAURATEN_MARKT_TBL,'',pool);
                                element['Verbaurate'] = element['Verbaurate'] * farbVerbaurate ;

                                element['Verbaurate'] = element['Verbaurate'] > 1 ? 1 : element['Verbaurate']; 
                            }else{
                                element['Verbaurate'] = await verbauratenBerechnungTeileliste(element[`${lang['Codebedingung']}`],sparte,VERBAURATEN_MARKT_TBL,'',pool);

                                element['Verbaurate'] = element['Verbaurate'] > 1 ? 1 : element['Verbaurate']; 
                            }
                        }
                    }
                }else{
                    for (let index = 0; index < exportArray.length; index++) {
                        let element = exportArray[index];
                        delete element['Verbaurate'];
                    }
                }
                for (let index = 0; index < exportArray.length; index++) {
                    let element = exportArray[index];
                    delete element['Teil'];
                    delete element['Sort'];
                    delete element['MUST DELETE'];
                    delete element['ES2'];
                }
                let v1Array = [];
                for (let index = 0; index < sprachtitel[0]['V1']; index++) {
                    let str = `${(index+1)}._Titel_V1`;
                    v1Array.push(`${sprachtitel[0][str]}`); 
                }
                let newExportArray = [];
                let mengenNameArray = []
                for (let index = 0; index < exportArray.length; index++) {
                    const element = exportArray[index];
                    for (let index = 0; index < Object.keys(element).length; index++) {
                        const el = Object.keys(element)[index];
                        if(el.search(' MG') > -1){
                            mengenNameArray.push(el)
                        }
                    }
                }
                let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
                let filteredArray = [...new Set(findDuplicates(mengenNameArray))];
                for (let index = 0; index < exportArray.length; index++) {
                    let element = exportArray[index];
                    let firstHalf = [];
                    let isFirstHalf = true;
                    let secondHalf = [];
                    let isSecondHalf = false;
                    for (let index = 0; index < Object.keys(element).length; index++) {
                        const el = Object.keys(element)[index];
                        if(el.search(`${lang['BEV']}`) < 0 && isFirstHalf){
                            firstHalf.push(el);
                        }else{
                            isFirstHalf = false;
                            isSecondHalf = true;
                        }
                        if(isSecondHalf == true){
                            secondHalf.push(el);
                        }
                    }
                    firstHalf.splice(firstHalf.length-1,1);
                    for (let index = 0; index < firstHalf.length; index++) {
                        let element = firstHalf[index];
                        if(element.search(' MG') > -1){
                            firstHalf.splice(index,1);
                        }
                    }
                    firstHalf = firstHalf.concat(filteredArray);
                    let position = firstHalf.indexOf('Verbaurate');
                    firstHalf.splice(position,1);
                    firstHalf.push('Verbaurate');
                    secondHalf.splice(secondHalf.length-v1Array.length,5);
                    firstHalf.push(`${lang['WK']}`);
                    firstHalf.push(`${lang['BEV']}`);
                    let compiledStringArray = firstHalf.concat(v1Array);
                    secondHalf.splice(0,1);
                    compiledStringArray = compiledStringArray.concat(secondHalf);
                    let obj = {};
                    for (let index = 0; index < compiledStringArray.length; index++) {
                        const elName = compiledStringArray[index];
                        if(element[`${elName}`] == undefined){
                            element[`${elName}`] = ''
                        }
                        obj[`${elName}`] = element[`${elName}`];
                    }
                    newExportArray.push(obj);
                }
                for (let index = 0; index < newExportArray.length; index++) {
                    let element = newExportArray[index];
                    let keys = Object.keys(element);
                    for (let index = 0; index < keys.length; index++) {
                        const el = keys[index];
                        if(el.search(' MG') > 0){
                            element[`${el}`] = parseInt(element[`${el}`])
                        }
                    }
                    if(element[`${lang['Bruttolistpreis GLC']}`] != null && element[`${lang['Bruttolistpreis GLC']}`] != ''){
                        element[`${lang['Bruttolistpreis GLC']}`] = parseFloat(element[`${lang['Bruttolistpreis GLC']}`])
                    }
                    element[`${lang['Gewicht']}`] = parseFloat(element[`${lang['Gewicht']}`])
                    element[`${lang['Länge']}`] = parseFloat(element[`${lang['Länge']}`])
                    element[`${lang['Höhe']}`] = parseFloat(element[`${lang['Höhe']}`])
                    element[`${lang['Breite']}`] = parseFloat(element[`${lang['Breite']}`])
                    element[`${lang['Modul']}`] = parseInt(element[`${lang['Modul']}`])
                    element[`${lang['WK Pos']}`] = parseInt(element[`${lang['WK Pos']}`])
                }
                let verbaurateColumnPlace = 0;
                let mengenNameArrayV2 = []
                for (let index = 0; index < newExportArray.length; index++) {
                    const element = newExportArray[index];
                    for (let index = 0; index < Object.keys(element).length; index++) {
                        const el = Object.keys(element)[index];
                        mengenNameArrayV2.push(el)
                    }
                }
                let filteredArrayV2 = [...new Set(findDuplicates(mengenNameArrayV2))];
                for (let index = 0; index < filteredArrayV2.length; index++) {
                    const element = filteredArrayV2[index];
                    if(element.search('Verbaurate') > -1){
                        verbaurateColumnPlace = index
                    }
                    
                }
                newExportArray = newExportArray.map((row) => {
                    let keys = Object.keys(row);
                    let obj = {};
                    for (let index = 0; index < keys.length; index++) {
                        const el = keys[index];
                        if(el.search(' MG') > 0){
                            obj[`${el.substring(0,el.search(' MG'))}`] = row[`${el}`];
                        }else{
                            obj[`${el}`] = row[`${el}`]
                        }
                    }
                    return obj;
                })
                res.status(200).json({ err: false, teileListe : newExportArray, recievedDataTeil: teileListenData , columnPlace : verbaurateColumnPlace});
            });
        }
    }
};

module.exports = { getWarenkorbCountries, importTeileListe, exportWarenkorbWKT, exportWarenkorbWKTMarkt };
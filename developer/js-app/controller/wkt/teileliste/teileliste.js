const AppError = require("../../../classes/AppError");
const DatabaseConnError = require("../../../classes/DatabaseConnError");
const ReturnMessage = require("../../../classes/ReturnMessage");
const { DEFAULT_SUCCESS_MESSAGE } = require("../../../constants/messages");
const checkFile = require("../../../functions/checkFile");
const { changeToNum, convertToFixed } = require("../../../functions/convert");
const { verbauratenBerechnung, checkForPrimeNumber, verbauratenBerechnungTeileliste } = require("../../../services/verbauratenService");
const xlsx = require("xlsx");
const { createBufferFromWorksheet, convertColumnToType } = require("../../../services/xlsxService");


//TODO: Move to file
function reorgArrayProp(propNames,array){
    let newArray = [];
    for(let item of array){
        let obj = {};
        for(let key of propNames){
            if(item[`${key}`] === null){
                obj[`${key}`] = null;
            }else{
                obj[`${key}`] = item[`${key}`];
            }
        }
        newArray.push(obj);
    }
    return newArray;
}

// NOTE: Should be reworked
const importVerbauraten = async (req,res) => {
    const sparte = req.body.sparte;
    let dataArray = req.body.eintraege;
    let spaltenNamen = req.body.spalten;
    let checkArray = [];
    let queryTblName = "", queryExtraMarkt = "", extraMarkt = "";
    let tblName = req.body.imp;
    let loopArray = [
        'Code',
        'Code Bezeichnung',
        'Verbaurate',
        'Sparte',
        'Kriterium',
        'Gesamt' ,
        ];
    let endquery = '';
    let tempQuery = '';
    if(!req.body){
        throw new AppError("");
    }
    const pool = req.app.locals.postgresSQL;
    if(tblName == 'Verbauraten'){
        queryTblName = 'lampa_verbauraten';
        if(sparte == 'PKW' || sparte == 'EQ'){
            queryExtraMarkt = `AND "ExtraMarkt" = '${req.body.extraMarkt}'`;
            extraMarkt = `'${req.body.extraMarkt}'`;
        }else{
            extraMarkt = "''";
        }
    }else if(tblName == 'MartkVerbauraten'){
        queryTblName = 'lampa_marktspezifischeVerbaurate';
        extraMarkt = "''";
    }else{
        throw new AppError("");
    }
    if(!pool){
        throw new DatabaseConnError("");
    }else{
        await pool.query(`DELETE FROM lampa."${queryTblName}" WHERE "Sparte" = '${sparte}' ${queryExtraMarkt};`);
    }
    if(sparte == 'Van'){
        checkArray = [
            'Kriterium',
            'Gesamt',
            'Verbaurate'
            ];
    }else{
        checkArray = [
            'Code',
            'Code Bezeichnung',
            'Verbaurate'
            ];
    }
    checkFile(checkArray,dataArray,spaltenNamen);
    if(sparte == 'Van'){
        for (let index = 0; index < dataArray.length; index++) {
            let element = dataArray[index];
            let indexOfSpace = element['Kriterium'].indexOf(' ');
            let code = element['Kriterium'].substring(0,indexOfSpace);
            element['Code'] = code;
        }
    }
    Promise.all(dataArray.map((element, longIndex) => {
        tempQuery = '';
        for (let index = 0; index < loopArray.length; index++) {
            const el = loopArray[index];
            if(typeof element[`${el}`] == 'string'){
                let str = element[`${el}`];
                if(str.indexOf("'") > -1){
                    element[`${el}`] = str.replace("'","''");
                }
            }
            if(el == 'Sparte'){
                element[`${el}`] = req.body.sparte;
            }
            if(typeof element[`${el}`] == 'undefined'){
                element[`${el}`] = null;
            }
            if(typeof element[`${el}`] == 'string' && element[`${el}`] != "''"){
                element[`${el}`] = `'${element[`${el}`]}'`;
            }
            if(el == "Gesamt"){
                if(element[`${el}`] === null){
                    element[`${el}`] = 0;
                }
            }
            if(index == 5 && longIndex == dataArray.length -1){
                tempQuery += `${element[`${el}`]},${extraMarkt})`;
                endquery += tempQuery;
            }else if(index == 5){
                tempQuery += `${element[`${el}`]},${extraMarkt});`;
                endquery += tempQuery;
            }else if(index == 0){
                tempQuery += `INSERT INTO lampa."${queryTblName}" VALUES(${element[`${el}`]},`;
            }else{
                tempQuery += `${element[`${el}`]},`;
            }
        }
    }));
    await pool.query(`${endquery}`);
    res.status(200).json(new ReturnMessage(DEFAULT_SUCCESS_MESSAGE,false));
};

const exportTeilelisteNeu = async (req,res) => {
    /* Request Timeout wird hochgesetzt da der Export bis zu 20 min dauern kann */
    req.setTimeout(1500000);


    const SPARTE = req.body.sparte;
    const BAUREIHENKENNER = req.body.baureihenkenner;
    if(!SPARTE || !BAUREIHENKENNER) return res.status(404).json({message: 'missing parameters'});

    const GRUNDNUMMER = "Grundnummer";

    const pool = req.app.locals.postgresSQL;
    
    const BAUREIHENKENNER_KEYS = Object.keys(BAUREIHENKENNER);
    const EXTRA_MAERKTE = ['USA','ECE','China'];
    const BUILT_RATIO_QRY_STRING = SPARTE == 'PKW' || SPARTE == 'EQ'
    ? `'' AS "Built ratio USA", '' AS "Built ratio China", '' AS "Built ratio USA", `
    : `'' AS "Built ratio", `;

    let kenner = [];
    let kennerQuery = ``;

    /* Baureihen kenner werden rausgezogen */
    for (let index = 0; index < BAUREIHENKENNER_KEYS.length; index++) {
        const element = BAUREIHENKENNER[`${BAUREIHENKENNER_KEYS[index]}`];
        if(BAUREIHENKENNER_KEYS[index] != 'Fahrzeug' && element != '' && element != null){
            kenner.push(element);
            kennerQuery += (index !== 1 ? "OR " : "") + `"Technik_Info" LIKE '${element}%' `;
        }
    }
    
    let foundGrundnummer = [];
    let stuecklistenData = [];

    // TODO: Check if result empty
    const stuecklisteResult = await pool.query(`SELECT * FROM lampa.lampa_stueckliste WHERE "Sparte" = $1`,[SPARTE]);
    stuecklistenData = stuecklisteResult.rows;

    let finishedData = [];
    let counter = 0;
    let mengenString = '';
    let mengenStringV2 = '';


    const uniqueTNRsortValues = [...new Set(stuecklistenData.map(element => element['TNRsort']))];

    try {
        const valuesString = uniqueTNRsortValues.map(value => `'${value}'`).join(',');

        const primusQuerySql =  
        `SELECT  
        '' AS "Model",
        '' AS "Module",
        '' AS "Teil",
        lampa.lampa_primus."MATNR_SORT" AS "Part no. sort",
        "MATNR_DRUCK" AS "Part no. read",
        lampa.lampa_primus."Benennung_DE" AS "Name in German",
        lampa.lampa_primus."Benennung_EN" AS "Name in English",
        lampa.lampa_lange_bezeichnungen."Benennung_DE" AS "Bennennung lang_dt",
        lampa.lampa_lange_bezeichnungen."Benennung_EN" AS "Bennennung lang_engl",
        '' AS "Sales codes",
        '' AS "RHD/LHD",
        '' AS "Built ratio",
        "Technik_Info" AS "New model ID",
        "Warenkorb_KNR" AS "Basket ID Is",
        '' AS "Basket ID Target",
        '' AS "Prio USA",
        '' AS "Qty USA",
        '' AS "Line GB",
        '' AS "Basket ID Proposal",
        '' AS "Pos Prognose",
        '' AS "Anmerkung ECE",
        '' AS "Remark",
        '' AS "USA_Prio Proposal",
        "Term_ID" as "TermID",
        "Beschaffungs_Art" AS "Procurement type",
        "Anlagedatum" AS "Creation date",
        "Seriengueltigkeit_Beginn" AS "Launch date",
        "Max_LG_Zeit" AS "Shelf life",
        "Gefahrgut_KLS" AS "Haz. Mat.",
        lampa.lampa_primus_hinweis."TLHW_CODE_Wert" AS "C-code",
        lampa.lampa_primus_hinweis."TLHW_Status_LBNZ_ZYKL" AS "Status life cycle code",
        "KNZ_Sonderedition" AS "ID special edition",
        "Sicherheits_Relevanz" AS "Driving relevance",
        "B9_Status_Wert" AS "B9 key",
        "Marketingcode" AS "Marketing code",
        "Laenge" AS "Length",
        "Breite" AS "Width",
        "Hoehe" AS "Height",
        "Gewicht" AS "Weight",
        "ES2",
        "${GRUNDNUMMER}"
        FROM lampa.lampa_primus 
        LEFT JOIN lampa.lampa_primus_hinweis ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_primus_hinweis."MATNR_SORT")
        LEFT JOIN lampa.lampa_lange_bezeichnungen ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_lange_bezeichnungen."MATNR_SORT") 
        WHERE "Grundnummer" IN (${valuesString}) AND (${kennerQuery});`;

        const result = await pool.query(primusQuerySql);

        for (let row of result.rows) {
            let foundElement = stuecklistenData.find(element => element['TNRsort'] === row['Grundnummer']);
            if (foundElement) {
                for (let i = 0; i < Object.keys(foundElement).length; i++) {
                    let objIndex =  Object.keys(foundElement)[i];
                    if(foundElement[objIndex] != null){
                        if(objIndex.search('MG') > -1){
                            row[`Qty ${objIndex}`] = foundElement[objIndex];
                        }
                    }
                }
                row["Model"] = BAUREIHENKENNER['Fahrzeug'];
                row["Module"] = foundElement['Submodul'];
                row["Teil"] = foundElement['Teil'];
                row["Sales codes"] = foundElement['Codebedingung lang'];
                row["RHD/LHD"] = foundElement['LK'];
                row["Built ratio"] = foundElement['Verbaurate'];
                finishedData.push(row);
            }
        }
    } catch (err) {

        //TODO: Add error handling
        console.log(err);
    }

    let exportArray = [];
    for (let index = 0; index < finishedData.length; index++) {
        const element = finishedData[index];
        let termId  = element['TermID'].slice(1);
        const queryStandardWarenkorb = `
        SELECT * FROM lampa.lampa_standartwarenkorb 
        WHERE "WK Pos" = (
            SELECT "WK_Pos_Proposal" FROM lampa."lampa_termIDs" 
            WHERE "TermID" = $1 AND "Modul" = $2
            AND "Sparte" = $3 LIMIT 1
        )
        AND "Sparte" = $4;`;
        const queryTermId = `
        SELECT * FROM lampa."lampa_termIDs" 
        WHERE "TermID" = $1 
        AND "Modul" = $2 AND "Sparte" = $3 LIMIT 1;`;
        let standardWarenkorbResult = await pool.query(`${queryStandardWarenkorb}`,[termId,element['Module'],SPARTE,SPARTE]);
        standardWarenkorbResult = standardWarenkorbResult.rows.length > 0 ? standardWarenkorbResult.rows[0] : null;
        let termIdResult = await pool.query(`${queryTermId}`,[termId,element['Module'],SPARTE]);
        termIdResult = termIdResult.rows.length > 0 ? termIdResult.rows[0] : null;
        if(standardWarenkorbResult){
            element['Line GB'] = standardWarenkorbResult['WK Pos'];
            element['Pos Prognose'] = standardWarenkorbResult['WK Pos'];
        }
        if(termIdResult){
            element['Basket ID Proposal'] = termIdResult['WK'];
            element['Pos Prognose'] = termIdResult['WK_Pos_Proposal'];
            element['Line GB'] = termIdResult['WK_Pos_Proposal'];
            element['Anmerkung ECE'] = termIdResult['Anmerkung_ECE'];
            element['USA_Prio Proposal'] = termIdResult['USA_Prio'];
        }else{
            element['Basket ID Proposal'] = '';
            element['Pos Prognose'] = '';
            element['Line GB'] = '';
            element['Anmerkung ECE'] = '';
            element['USA_Prio Proposal'] = '';
        }
        exportArray.push(element);
    }
    /* Verbauraten Berechnung  */
    let farbenArray = [];
    if(SPARTE != 'PKW_Motor_Benzin' && SPARTE != 'PKW_Motor_Diesel'){
        for (let index = 0; index < exportArray.length; index++) {
            let element = exportArray[index];
            if(SPARTE == 'PKW' || SPARTE == 'EQ'){
                delete element['Built ratio'];
            }
            let es2 = element['ES2'];
            let farbVerbaurate = '';
            let isFarbe = false;
            let farbverbauratenArr = [];
            /* Farbverbauraten */
            if(es2){
                if(es2.length >= 3){
                    // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116 )
                    // TODO: Add geprimte missing
                    if(!checkForPrimeNumber(es2)){
                        if(es2.search(' ') < 0){
                            let secondPos = es2.substring(1,2);
                            if(secondPos.match(/[a-z]/i) == null){
                                if(es2.substring(1,2)){
                                    farbVerbaurate = es2.substring(es2.length-3,es2.length);
                                    farbVerbaurate = farbVerbaurate+'U';
                                    farbVerbaurate = await verbauratenBerechnungTeileliste(farbVerbaurate,SPARTE,'lampa_verbauraten','',pool);
                                    farbenArray.push({'Teil': element['Teil'],'Farbbaurate':farbVerbaurate, 'TNRsort': element['Part no. sort']})
                                    isFarbe = true;
                                } 
                            }
                        }
                    }
                }
            }

            /* Verbauraten Spalten */
            if(isFarbe != false){
                element['Built ratio'] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten','',pool);
                element['Built ratio'] = element['Built ratio'] * farbVerbaurate;
                // element['Built ratio'] = parseFloat(element['Built ratio']).toFixed(2)   
                element['Built ratio'] = element['Built ratio'] > 1 ? 1 : element['Built ratio']; 
            }else{
                element['Built ratio'] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten','',pool);
            }
            console.log(element['Built ratio']);
        }
    }else{
        for (let index = 0; index < exportArray.length; index++) {
            let element = exportArray[index];
            delete element['Built ratio'];
        }
    }
        // Stream.emit('push', 'message', { msg: 'Verbauraten wurden berechnet.' , loading: 60});
        let baureihenSql = `SELECT  
        '' AS "Model",
        '' AS "Module",
        '' AS "Teil",
        lampa.lampa_primus."MATNR_SORT" AS "Part no. sort",
        "MATNR_DRUCK" AS "Part no. read",
        lampa.lampa_primus."Benennung_DE" AS "Name in German",
        lampa.lampa_primus."Benennung_EN" AS "Name in English",
        lampa_lange_bezeichnungen."Benennung_DE" AS "Benennung lang_dt",
        lampa_lange_bezeichnungen."Benennung_EN" AS "Benennung lang_engl",
        '' AS "Sales codes",
        '' AS "RHD/LHD",
        ${BUILT_RATIO_QRY_STRING}
        "Technik_Info" AS "New model ID",
        "Warenkorb_KNR" AS "Basket ID Is",
        '' AS "Basket ID Target",
        '' AS "Prio USA",
        '' AS "Qty USA",
        '' AS "Line GB",
        '' AS "Basket ID Proposal",
        '' AS "Pos Prognose",
        '' AS "Anmerkung ECE",
        '' AS "Remark",
        "Term_ID" as "TermID",
        "Beschaffungs_Art" AS "Procurement type",
        "Anlagedatum" AS "Creation date",
        "Seriengueltigkeit_Beginn" AS "Launch date",
        "Max_LG_Zeit" AS "Shelf life",
        "Gefahrgut_KLS" AS "Haz. Mat.",
        lampa.lampa_primus_hinweis."TLHW_CODE_Wert" AS "C-code",
        lampa.lampa_primus_hinweis."TLHW_Status_LBNZ_ZYKL" AS "Status life cycle code",
        "KNZ_Sonderedition" AS "ID special edition",
        "Sicherheits_Relevanz" AS "Driving relevance",
        "B9_Status_Wert" AS "B9 key",
        "Marketingcode" AS "Marketing code",
        "Laenge" AS "Length",
        "Breite" AS "Width",
        "Hoehe" AS "Height",
        "Gewicht" AS "Weight",
        "ES2",
        "Grundnummer"
        FROM lampa.lampa_primus 
        LEFT JOIN lampa.lampa_primus_hinweis ON (lampa_primus."MATNR_SORT" = lampa.lampa_primus_hinweis."MATNR_SORT") 
        LEFT JOIN lampa.lampa_lange_bezeichnungen ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_lange_bezeichnungen."MATNR_SORT") 
        WHERE (${kennerQuery})`;
        // for (let index = 0; index < stuecklistenData.length; index++) {
        //     const element = stuecklistenData[index];
        //     baureihenSql += ` AND "Grundnummer" <> '${element['TNRsort']}'`;
        // }
        // let baureihendata = [];
        const notFoundResult = await pool.query(baureihenSql);

        for (let row of notFoundResult.rows) {
            let foundElement = finishedData.find(element => element['Grundnummer'] === row['Grundnummer']);
            if (!foundElement) {
                exportArray.push(row);
            }
        }

        for (let index = 0; index < exportArray.length; index++) {
            let element = exportArray[index];
            let keys = Object.keys(element);
            for (let index = 0; index < keys.length; index++) {
                const el = keys[index];
                if(el.search(' MG') > 0){
                    element[`${el}`] = changeToNum(element[`${el}`])
                }
            }
            element['Module'] = changeToNum(element['Module']);
            element['Line GB'] = changeToNum(element['Line GB']);
            element['Pos Prognose'] = changeToNum(element['Pos Prognose']);
            element['USA_Prio Proposal'] = changeToNum(element['USA_Prio Proposal']);
            element['Length'] = changeToNum(element['Length'])
            element['Width'] = changeToNum(element['Width'])
            element['Height'] = changeToNum(element['Height'])
            element['Weight'] = changeToNum(element['Weight'])
            //TODO: Ging vorher ohne toString(), kam  im Datumsformat und warf einen Fehler
            element['Creation date'] = element['Creation date'].toString();
            element['Launch date'] = element['Launch date'].toString();
            let newCreationDate = element['Creation date'].substring(0,4)+'.'+element['Creation date'].substring(4,6) +'.'+ element['Creation date'].substring(6,8);
            element['Creation date'] = newCreationDate;
            let newLaunchDate = element['Launch date'].substring(0,4)+'.'+element['Launch date'].substring(4,6) +'.'+ element['Launch date'].substring(6,8);
            element['Launch date'] = newLaunchDate;
            element['Creation date'] = new Date(newLaunchDate)
            element['Launch date'] = new Date(newLaunchDate)
            element['Creation date'] = new Date(element['Creation date'].getUTCFullYear(), element['Creation date'].getUTCMonth(), element['Creation date'].getUTCDate())
            element['Launch date'] = new Date(element['Launch date'].getUTCFullYear(), element['Launch date'].getUTCMonth(), element['Launch date'].getUTCDate())
            delete element['Teil'];
            delete element['ES2'];
            if(SPARTE == 'Van'){
                delete element['Anmerkung USA'];
                delete element['Large Pkg'];
                delete element['Package No'];
                delete element['USA_Prio Proposal'];
                // element['Built ratio'] = element['Built ratio'] ? parseFloat(element['Built ratio'].replace('%')) /100 : null;
            }else{
                delete element['Built ratio'];
            }
        }
        let verbaurateColumnPlace = 0;
        let mengenNameArrayV2 = [];
        for (let index = 0; index < exportArray.length; index++) {
            const element = exportArray[index];
            for (let index = 0; index < Object.keys(element).length; index++) {
                const el = Object.keys(element)[index];
                mengenNameArrayV2.push(el);
            }
        }
        exportArray = exportArray.map((row) => {
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

        let propKeys = [...Object.keys(exportArray[0])];
        let newPropKeys =  [...Object.keys(exportArray[0])];

        for (let index = propKeys.indexOf(GRUNDNUMMER)+1; index < propKeys.length; index++) {
            let propKey = propKeys[index];
            if(propKey.search(' MG') > 0) propKey = `${propKey.substring(0,propKey.search(' MG'))}`;
            newPropKeys.splice(newPropKeys.indexOf("RHD/LHD")+1,0,propKey);
        }

        newPropKeys = newPropKeys.slice(0,newPropKeys.indexOf(GRUNDNUMMER));

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


        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Reorg');


        exportArray = reorgArrayProp(newPropKeys, exportArray);

    
        const VERBAURATE_COLUMN_NAME = "Built ratio";

        if(process.env.LOCAL_DEVELOPMENT){
            let worksheet = xlsx.utils.json_to_sheet(exportArray);
            const percentageCellStyle = "0.00%";
            const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
            convertColumnToType(worksheet,firstRow.indexOf(VERBAURATE_COLUMN_NAME),percentageCellStyle);
            const buffer = createBufferFromWorksheet(worksheet);

            res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.status(200).send(buffer);   
        }else{
            res.status(200).json({exportArray});
        }
};

const exportTeilelistePKWEQ = async (req,res) => {
    /* Request Timeout wird hochgesetzt da der Export bis zu 20 min dauern kann */
    req.setTimeout(1500000);

    const GRUNDNUMMER = "Grundnummer";
    const SPARTE = req.body.sparte;
    const BAUREIHENKENNER = req.body.baureihenkenner;
    if(!SPARTE || !BAUREIHENKENNER) return res.status(404).json({message: 'missing parameters'});
    
    const BAUREIHENKENNER_KEYS = Object.keys(BAUREIHENKENNER);
    const EXTRA_MAERKTE = ['ECE','USA','China'];
    const BUILT_RATIO_QRY_STRING = `'' AS "Built ratio ECE", '' AS "Built ratio USA", '' AS "Built ratio China", `;

    let kenner = [];
    let kennerQuery = ``;
    /* Baureihen kenner werden rausgezogen */
    for (let index = 0; index < BAUREIHENKENNER_KEYS.length; index++) {
        const element = BAUREIHENKENNER[`${BAUREIHENKENNER_KEYS[index]}`];
        if(BAUREIHENKENNER_KEYS[index] != 'Fahrzeug' && element != '' && element != null){
            kenner.push(element);
            kennerQuery += (index !== 1 ? "OR " : "") + `"Technik_Info" LIKE '${element}%' `;
        }
    }
    
    let foundGrundnummer = [];
    let stuecklistenData = [];

    const pool = req.app.locals.postgresSQL;

    //TODO: Prüfen ob stückliste vorhanden ist 
    const stuecklisteResult = await pool.query(`SELECT * FROM lampa.lampa_stueckliste WHERE "Sparte" = $1`,[SPARTE]);
    stuecklistenData = stuecklisteResult.rows;

    let finishedData = [];
    let counter = 0;
    let mengenString = '';
    let mengenStringV2 = '';


    const uniqueTNRsortValues = [...new Set(stuecklistenData.map(element => element['TNRsort']))];

    console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Starting Primus');


    try {
        // Create a comma-separated string of unique values to use in the IN operator
        const valuesString = uniqueTNRsortValues.map(value => `'${value}'`).join(',');

        // TODO: Lieferant muss noch in primus postgres als spalte hinzugefügt werden
        // Query muss dann "Lieferant 1" anstatt '' AS "Lieferant 1"
        const primusQuerySql = 
        `SELECT  
        '' AS "Model",
        '' AS "Module",
        '' AS "Teil", 
        lampa.lampa_primus."MATNR_SORT" AS "Part no. sort",
        "MATNR_DRUCK" AS "Part no. read",
        lampa.lampa_primus."Benennung_DE" AS "Name in German",
        lampa.lampa_primus."Benennung_EN" AS "Name in English",
        lampa.lampa_lange_bezeichnungen."Benennung_DE" AS "Benennung lang_dt",
        lampa.lampa_lange_bezeichnungen."Benennung_EN" AS "Benennung lang_engl",
        '' AS "Sales codes",
        '' AS "RHD/LHD",
        ${BUILT_RATIO_QRY_STRING}
        '' AS "Built ratio",
        "Technik_Info" AS "New model ID",
        "Warenkorb_KNR" AS "Basket ID Is",
        '' AS "Basket ID Target",
        '' AS "Prio USA",
        '' AS "Qty USA",
        '' AS "Line GB",
        '' AS "Basket ID Proposal",
        '' AS "Pos Prognose",
        '' AS "Anmerkung ECE",
        '' AS "Remark",
        '' AS "USA_Prio Proposal",
        '' AS "USA_QTY_N",
        '' AS "USA_QTY_V",
        '' AS "SUP_QTY_LOW",
        '' AS "SUP_QTY_HIGH",
        '' AS "SUP_Package",
        '' AS "China ID",
        '' AS "ISO Qty China",
        "Term_ID" as "TermID",
        "Beschaffungs_Art" AS "Procurement type",
        "Anlagedatum" AS "Creation date",
        "Seriengueltigkeit_Beginn" AS "Launch date",
        "Max_LG_Zeit" AS "Shelf life",
        "Gefahrgut_KLS" AS "Haz. Mat.",
        lampa.lampa_primus_hinweis."TLHW_CODE_Wert" AS "C-code",
        lampa.lampa_primus_hinweis."TLHW_Status_LBNZ_ZYKL" AS "Status life cycle code",
        "KNZ_Sonderedition" AS "ID special edition",
        "Sicherheits_Relevanz" AS "Driving relevance",
        "B9_Status_Wert" AS "B9 key",
        "Marketingcode" AS "Marketing code",
        "Laenge" AS "Length",
        "Breite" AS "Width",
        "Hoehe" AS "Height",
        "Gewicht" AS "Weight",
        "LIEF_LFNT_1" AS "Supplier 1",
        "LIEF_LFNT_3" AS "Supplier 3",
        "ES2",
        "${GRUNDNUMMER}"
        FROM lampa.lampa_primus 
        LEFT JOIN lampa.lampa_primus_hinweis ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_primus_hinweis."MATNR_SORT")
        LEFT JOIN lampa.lampa_lange_bezeichnungen ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_lange_bezeichnungen."MATNR_SORT") 
        WHERE "Grundnummer" IN (${valuesString}) AND (${kennerQuery});`;

        // Execute a single query to fetch all records matching the 'TNRsort' values
        const result = await pool.query(primusQuerySql);

        // Loop through the result and filter the found data
        for (let row of result.rows) {
            let foundElement = stuecklistenData.find(element => element['TNRsort'] === row['Grundnummer']);
            if (foundElement) {
                for (let i = 0; i < Object.keys(foundElement).length; i++) {
                    let objIndex =  Object.keys(foundElement)[i];
                    if(foundElement[objIndex] != null){
                        if(objIndex.search('MG') > -1){
                            row[`Qty ${objIndex}`] = foundElement[objIndex];
                        }
                    }
                }
                row["Model"] = BAUREIHENKENNER['Fahrzeug'];
                row["Module"] = foundElement['Submodul'];
                row["Teil"] = foundElement['Teil'];
                row["Sales codes"] = foundElement['Codebedingung lang'];
                row["RHD/LHD"] = foundElement['LK'];
                row["Built ratio"] = foundElement['Verbaurate'];
                finishedData.push(row);
            }
        }
    } catch (err) {

        //TODO: Add error handling
        console.log(err);
    }

    // PERFORMANCE IMPROVEMENT ->
    console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Additional data requests');

    let exportArray = [];
    for (let index = 0; index < finishedData.length; index++) {
        const element = finishedData[index];
        let termId  = element['TermID'].slice(1);
        const queryStandardWarenkorb = `
        SELECT * FROM lampa.lampa_standartwarenkorb 
        WHERE "WK Pos" = (
            SELECT "WK_Pos_Proposal" FROM lampa."lampa_termIDs" 
            WHERE "TermID" = $1 AND "Modul" = $2
            AND "Sparte" = $3 LIMIT 1
        )
        AND "Sparte" = $4;`;
        const queryTermId = `
        SELECT * FROM lampa."lampa_termIDs" 
        WHERE "TermID" = $1 
        AND "Modul" = $2 AND "Sparte" = $3 LIMIT 1;`;
        let standardWarenkorbResult = await pool.query(`${queryStandardWarenkorb}`,[termId,element['Module'],SPARTE,SPARTE]);
        standardWarenkorbResult = standardWarenkorbResult.rows.length > 0 ? standardWarenkorbResult.rows[0] : null;
        let termIdResult = await pool.query(`${queryTermId}`,[termId,element['Module'],SPARTE]);
        termIdResult = termIdResult.rows.length > 0 ? termIdResult.rows[0] : null;
        if(standardWarenkorbResult){
            element['Line GB'] = standardWarenkorbResult['WK Pos'];
            element['Pos Prognose'] = standardWarenkorbResult['WK Pos'];
        }
        if(termIdResult){
            element['Basket ID Proposal'] = termIdResult['WK'];
            element['Pos Prognose'] = termIdResult['WK_Pos_Proposal'];
            element['Line GB'] = termIdResult['WK_Pos_Proposal'];
            element['Anmerkung ECE'] = termIdResult['Anmerkung_ECE'];
            element['USA_Prio Proposal'] = termIdResult['USA_Prio'];
            element['USA_QTY_N'] = termIdResult['USA_QTY_N'];
            element['USA_QTY_V'] = termIdResult['USA_QTY_V'];
            element['SUP_QTY_LOW'] = termIdResult['SUP_QTY_LOW'];
            element['SUP_QTY_HIGH'] = termIdResult['SUP_QTY_HIGH'];
            element['SUP_Package'] = termIdResult['SUP_Package'];
            element['China ID'] = termIdResult['China ID'];
            element['ISO Qty China'] = termIdResult['ISO Qty China'];
        }else{
            element['Basket ID Proposal'] = '';
            element['Pos Prognose'] = '';
            element['Line GB'] = '';
            element['Anmerkung ECE'] = '';
            element['USA_Prio Proposal'] = '';
            element['USA_QTY_N'] = '';
            element['USA_QTY_V'] = '';
            element['SUP_QTY_LOW'] = '';
            element['SUP_QTY_HIGH'] = '';
            element['SUP_Package'] =  '';
            element['China ID'] =  '';
            element['ISO Qty China'] =  '';
        }
        exportArray.push(element);
    }

    console.log('here2')

    // Stream.emit('push', 'message', { msg: 'Verbauraten Berechnung!' ,data: exportArray, loading: 30});
    /* Verbauraten Berechnung  */

    // PERFORMANCE IMPROVEMENT
    console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Verbauraten Start');

    let farbenArray = [];
        for (let index = 0; index < exportArray.length; index++) {
            let element = exportArray[index];
            if(SPARTE == 'PKW' || SPARTE == 'EQ'){
                delete element['Built ratio'];
            }
            let es2 = element['ES2'];
            let farbVerbaurate = '';
            let isFarbe = false;
            let farbverbauratenArr = [];
            /* Farbverbauraten */
            if(es2){
                if(es2.length >= 3){
                    // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116 )
                    // TODO: Add geprimte missing
                    if(!checkForPrimeNumber(es2)){
                        if(es2.search(' ') < 0){
                            let secondPos = es2.substring(1,2);
                            if(secondPos.match(/[a-z]/i) == null){
                                if(es2.substring(1,2)){
                                    farbVerbaurate = es2.substring(es2.length-3,es2.length);
                                    farbVerbaurate = farbVerbaurate+'U';
                                    if(SPARTE == 'PKW' || SPARTE == 'EQ'){
                                        for(let markt of EXTRA_MAERKTE){
                                            const farbVerbaurateMarkt = await verbauratenBerechnungTeileliste(farbVerbaurate,SPARTE,'lampa_verbauraten',` AND "ExtraMarkt" = '${markt}'`,pool);
                                            farbverbauratenArr.push(farbVerbaurateMarkt);
                                        }
                                    }else{
                                        farbVerbaurate = await verbauratenBerechnungTeileliste(farbVerbaurate,SPARTE,'lampa_verbauraten','',pool);
                                    }
                                    farbenArray.push({'Teil': element['Teil'],'Farbbaurate':farbVerbaurate, 'TNRsort': element['Part no. sort']})
                                    isFarbe = true;
                                } 
                            }
                        }
                    }
                }
            }
            /* Verbauraten Spalten */
            if(isFarbe != false){
                if(SPARTE == 'PKW' || SPARTE == 'EQ'){
                    let i = 0;
                    for(let markt of EXTRA_MAERKTE){
                        element[`Built ratio ${markt}`] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten',` AND "ExtraMarkt" = '${markt}'`,pool);
                        element[`Built ratio ${markt}`] = element[`Built ratio ${markt}`] * farbverbauratenArr[i];
                        // element[`Built ratio ${markt}`] = ((parseFloat(element[`Built ratio ${markt}`].replace('%','')) / 100)*(farbverbauratenArr[i])) ;
                        // element[`Built ratio ${markt}`] = parseFloat(element[`Built ratio ${markt}`]).toFixed(2)
                        element['Built ratio'] = element['Built ratio'] > 1 ? 1 : element['Built ratio']; 
                        i++;
                    }
                }else{  
                    element['Built ratio'] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten','',pool);
                    element['Built ratio'] = element['Built ratio'] * farbVerbaurate;
                    // element['Built ratio'] = parseFloat(element['Built ratio']).toFixed(2)   
                    element['Built ratio'] = element['Built ratio'] > 1 ? 1 : element['Built ratio']; 
                }
            }else{
                if(SPARTE == 'PKW' || SPARTE == 'EQ'){
                    for(let markt of EXTRA_MAERKTE){
                        element[`Built ratio ${markt}`] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten',` AND "ExtraMarkt" = '${markt}'`,pool);
                    }
                }else{
                    element['Built ratio'] = await verbauratenBerechnungTeileliste(element['Sales codes'],SPARTE,'lampa_verbauraten','',pool);
                }
            }
        }


        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Verbauraten Finished');

        // TODO: Lieferant muss noch in primus postgres als spalte hinzugefügt werden und mengenstring primus_hinweise
        // Query muss dann "Lieferant 1" anstatt '' AS "Lieferant 1"

        let baureihenSql = `SELECT  
        '' AS "Model",
        '' AS "Module",
        '' AS "Teil",
        lampa.lampa_primus."MATNR_SORT" AS "Part no. sort",
        "MATNR_DRUCK" AS "Part no. read",
        lampa.lampa_primus."Benennung_DE" AS "Name in German",
        lampa.lampa_primus."Benennung_EN" AS "Name in English",
        lampa_lange_bezeichnungen."Benennung_DE" AS "Benennung lang_dt",
        lampa_lange_bezeichnungen."Benennung_EN" AS "Benennung lang_engl",
        '' AS "Sales codes",
        '' AS "RHD/LHD",
        ${BUILT_RATIO_QRY_STRING}
        "Technik_Info" AS "New model ID",
        "Warenkorb_KNR" AS "Basket ID Is",
        '' AS "Basket ID Target",
        '' AS "Prio USA",
        '' AS "Qty USA",
        '' AS "Line GB",
        '' AS "Basket ID Proposal",
        '' AS "Pos Prognose",
        '' AS "Anmerkung ECE",
        '' AS "Remark",
        '' AS "USA_Prio Proposal",
        '' AS "USA_QTY_N",
        '' AS "USA_QTY_V",
        '' AS "SUP_QTY_LOW",
        '' AS "SUP_QTY_HIGH",
        '' AS "SUP_Package",
        '' AS "China ID",
        '' AS "ISO Qty China",
        "Term_ID" as "TermID",
        "Beschaffungs_Art" AS "Procurement type",
        "Anlagedatum" AS "Creation date",
        "Seriengueltigkeit_Beginn" AS "Launch date",
        "Max_LG_Zeit" AS "Shelf life",
        "Gefahrgut_KLS" AS "Haz. Mat.",
        lampa.lampa_primus_hinweis."TLHW_CODE_Wert" AS "C-code",
        lampa.lampa_primus_hinweis."TLHW_Status_LBNZ_ZYKL" AS "Status life cycle code",
        "KNZ_Sonderedition" AS "ID special edition",
        "Sicherheits_Relevanz" AS "Driving relevance",
        "B9_Status_Wert" AS "B9 key",
        "Marketingcode" AS "Marketing code",
        "Laenge" AS "Length",
        "Breite" AS "Width",
        "Hoehe" AS "Height",
        "Gewicht" AS "Weight",
        "LIEF_LFNT_1" AS "Supplier 1",
        "LIEF_LFNT_3" AS "Supplier 3",
        "ES2",
        "Grundnummer"
        FROM lampa.lampa_primus 
        LEFT JOIN lampa.lampa_primus_hinweis ON (lampa_primus."MATNR_SORT" = lampa.lampa_primus_hinweis."MATNR_SORT")
        LEFT JOIN lampa.lampa_lange_bezeichnungen ON (lampa.lampa_primus."MATNR_SORT" = lampa.lampa_lange_bezeichnungen."MATNR_SORT") 
        WHERE (${kennerQuery})`;
        
        
        ///
        // for (let index = 0; index < stuecklistenData.length; index++) {
        //     const element = stuecklistenData[index];
        //     baureihenSql += ` AND "Grundnummer" <> '${element['TNRsort']}'`;
        // }

        // let baureihendata = [];

        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Find missing');

        const notFoundResult = await pool.query(baureihenSql);
        // baureihendata = notFoundResult.rows;

        for (let row of notFoundResult.rows) {
            let foundElement = finishedData.find(element => element['Grundnummer'] === row['Grundnummer']);
            if (!foundElement) {
                exportArray.push(row);
            }
        }

 
        // for (let index = 0; index < baureihendata.length; index++) {
        //     const element = baureihendata[index];
        //     exportArray.push(element);
        // }

        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Last Conversion');


        for (let index = 0; index < exportArray.length; index++) {
            let element = exportArray[index];
            let keys = Object.keys(element);
            for (let index = 0; index < keys.length; index++) {
                const el = keys[index];
                if(el.search(' MG') > 0){
                    element[`${el}`] = changeToNum(element[`${el}`]);
                }
            }
            element['Module'] = changeToNum(element['Module']);
            element['Line GB'] = changeToNum(element['Line GB']);
            element['Pos Prognose'] = changeToNum(element['Pos Prognose']);
            element['USA_Prio Proposal'] = changeToNum(element['USA_Prio Proposal']);
            // element['Length'] = changeToNum(element['Length']);
            // element['Width'] = changeToNum(element['Width']);
            // element['Height'] = changeToNum(element['Height']);
            // element['Weight'] = changeToNum(element['Weight']);
            element['TermID'] = changeToNum(element['TermID']);
            element['Length'] = convertToFixed(element['Length'],3);
            element['Width'] = convertToFixed(element['Width'],3);
            element['Height'] = convertToFixed(element['Height'],3);
            element['Weight'] = convertToFixed(element['Weight'],3);

            // element['Length'] = parseFloat(element['Length']);
            // element['Width'] = changeToNum(element['Width']);
            // element['Height'] = changeToNum(element['Height']);
            // element['Weight'] = changeToNum(element['Weight']);

            //TODO: Ging vorher ohne toString(), kam  im Datumsformat und warf einen Fehler
            // element['Creation date'] = element['Creation date'].toString();
            // element['Launch date'] = element['Launch date'].toString();
            // let newCreationDate = element['Creation date'].substring(0,4)+'.'+element['Creation date'].substring(4,6) +'.'+ element['Creation date'].substring(6,8);
            // element['Creation date'] = newCreationDate;
            // let newLaunchDate = element['Launch date'].substring(0,4)+'.'+element['Launch date'].substring(4,6) +'.'+ element['Launch date'].substring(6,8);
            // element['Launch date'] = newLaunchDate;
            // element['Creation date'] = new Date(newLaunchDate)
            // element['Launch date'] = new Date(newLaunchDate)
            // element['Creation date'] = new Date(element['Creation date'].getUTCFullYear(), element['Creation date'].getUTCMonth(), element['Creation date'].getUTCDate())
            // element['Launch date'] = new Date(element['Launch date'].getUTCFullYear(), element['Launch date'].getUTCMonth(), element['Launch date'].getUTCDate())
            // element['Creation date'] = element['Creation date'].toString();
            // element['Launch date'] = element['Launch date'];
            // let newCreationDate = element['Creation date'].substring(0,4)+'.'+element['Creation date'].substring(4,6) +'.'+ element['Creation date'].substring(6,8);
            // element['Creation date'] = newCreationDate;
            // let newLaunchDate = element['Launch date'].substring(0,4)+'.'+element['Launch date'].substring(4,6) +'.'+ element['Launch date'].substring(6,8);
            // element['Launch date'] = newLaunchDate;
            delete element['Teil'];
            delete element['ES2'];
        }
        let mengenNameArrayV2 = [];
        for (let index = 0; index < exportArray.length; index++) {
            const element = exportArray[index];
            for (let index = 0; index < Object.keys(element).length; index++) {
                const el = Object.keys(element)[index];
                mengenNameArrayV2.push(el);
            }
        }
       
        let propKeys = [...Object.keys(exportArray[0])];
        let newPropKeys =  [...Object.keys(exportArray[0])];

        for (let index = propKeys.indexOf(GRUNDNUMMER)+1; index < propKeys.length; index++) {
            let propKey = propKeys[index];
            if(propKey.search(' MG') > 0) propKey = `${propKey.substring(0,propKey.search(' MG'))}`;
            newPropKeys.splice(newPropKeys.indexOf("RHD/LHD")+1,0,propKey);
        }

        newPropKeys = newPropKeys.slice(0,newPropKeys.indexOf(GRUNDNUMMER));

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


        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Reorg');


        exportArray = reorgArrayProp(newPropKeys, exportArray);

    
        const VERBAURATE_COLUMN_NAME_ECE = "Built ratio ECE";
        const VERBAURATE_COLUMN_NAME_CHINA = "Built ratio USA";
        const VERBAURATE_COLUMN_NAME_USA = "Built ratio China";

        if(process.env.LOCAL_DEVELOPMENT){
            let worksheet = xlsx.utils.json_to_sheet(exportArray);
            const percentageCellStyle = "0.00%";
            const firstRow = xlsx.utils.sheet_to_json(worksheet, { header: 1 })[0];
            convertColumnToType(worksheet,firstRow.indexOf(VERBAURATE_COLUMN_NAME_ECE),percentageCellStyle);
            convertColumnToType(worksheet,firstRow.indexOf(VERBAURATE_COLUMN_NAME_USA),percentageCellStyle);
            convertColumnToType(worksheet,firstRow.indexOf(VERBAURATE_COLUMN_NAME_CHINA),percentageCellStyle);
             const buffer = createBufferFromWorksheet(worksheet);

            res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.status(200).send(buffer);   
        }else{
            res.status(200).json({exportArray});
        }
};

function convertVerbaurateKomma(verbauratenString){
    if(!verbauratenString) return verbauratenString;
    return verbauratenString.replace('.',',');
}


module.exports = { importVerbauraten, exportTeilelistePKWEQ, exportTeilelisteNeu };

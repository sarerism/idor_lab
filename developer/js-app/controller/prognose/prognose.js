const { convertTNR } = require("../../functions/convert");
const { spaltenCheck } = require("../../utils/columns");
const { plusminusSuche } = require("../../utils/verbauratenBerechnung");

const getFahrzeugstueckzahlen = async(req,res) => {
    let data = [];
    const pool = req.app.locals.postgresSQL;
    const result = await pool.
        query(`SELECT * FROM lampa.lampa_prognose_fahrzeugstueckzahlen`);
    data = result.rows;
    res.status(200).json({err:false, result: data});
};

const prognoseVerbauratenBerechnung = async (req,res)=>{
    let code = req.body.code;
    const pool = req.app.locals.postgresSQL;
    let obj = await verbauratenBerechnungPrognose({codeBedingung: code, isSql : req.body.query, verbauratenArray: req.body.verbauraten}, pool);
    let verbauratenArray = obj.verbauraten;
    let compiledArray = [];
    for (let index = 0; index < verbauratenArray.length; index++) {
        const element = verbauratenArray[index];
        if(element[0] != undefined){
            compiledArray.push(element[0]['Verbaurate']);
        }else{
            element.push({'Verbaurate': 0});
            compiledArray.push(element[0]['Verbaurate']);
        }
    }
    res.status(200).json({codeArray : obj.codes, err : false, verbauratenArray: compiledArray, finishedString: obj.finishedData});
};

const importParameterVU = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    await pool.query(`DELETE FROM lampa.lampa_parameter_top_vu WHERE "Verbaurate" is not null`);

    let dataArray = req.body.eintraege;
    let loopArray = [
        'Benennung VU',
        'Komponente',
        'Benennung Teil',
        'Verbaurate',
        'LL/RL',
        'Links/Rechts',
        'Lackierung',
        'Pos Prognose'
      ];
    let endquery = '';
    let tempQuery = '';
    Promise.all(dataArray.map(async (element, longIndex) => {
        tempQuery = '';
        for (let index = 0; index < loopArray.length; index++) {
            const el = loopArray[index];
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
            if(index == 7 && longIndex == dataArray.length -1){
                tempQuery += `${element[`${el}`]})`;
                endquery += tempQuery;
            }else if(index == 7){
                tempQuery += `${element[`${el}`]}) \n;`;
                endquery += tempQuery;
            }else if(index == 0){
                tempQuery += `INSERT INTO lampa.lampa_parameter_top_vu VALUES(${element[`${el}`]},`;
            }else{
                tempQuery += `${element[`${el}`]},`;
            }
        }
    }));
    const result = await pool.
        query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowCount});
};

const exportParameterVU = async (req,res)=> {
    const pool = req.app.locals.postgresSQL;
    let endquery = 'SELECT * FROM lampa.lampa_parameter_top_vu';
    const result = await pool.
        query(`${endquery}`);
        res.status(200).json({parameter : result.rows, err : false});
};

const updateFahrzeugstueckzahlen = async(req,res) => {
    const pool = req.app.locals.postgresSQL;
    let data;
    await pool.
        query(`DELETE FROM lampa.lampa_prognose_fahrzeugstueckzahlen WHERE "Fahrzeugstückzahlen" is not null`);
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Fahrzeugstückzahlen',
        'Jahr1',
        'Jahr2',
        'Jahr3'
      ];
    let endquery = '';
    let tempQuery = '';
    dataArray[2]['Jahr1'] = parseInt(dataArray[0]['Jahr1']) + parseInt(dataArray[1]['Jahr1']);
    dataArray[2]['Jahr2'] = parseInt(dataArray[0]['Jahr2']) + parseInt(dataArray[1]['Jahr2']);
    dataArray[2]['Jahr3'] = parseInt(dataArray[0]['Jahr3']) + parseInt(dataArray[1]['Jahr3']);
    Promise.all(dataArray.map((element, longIndex) => {
        tempQuery = '';
        for (let index = 0; index < loopArray.length; index++) {
            const el = loopArray[index];
            if(typeof element[`${el}`] == 'string'){
                element[`${el}`] = `'${element[`${el}`]}'`;
            }
            if(typeof element[`${el}`] == 'undefined'){
                element[`${el}`] = 0;
            }
            if(index == 3 && longIndex == dataArray.length -1){
                tempQuery += `${element[`${el}`]})`;
                endquery += tempQuery;
            }else if(index == 3){
                tempQuery += `${element[`${el}`]});`;
                endquery += tempQuery;
            }else if(index == 0){
                tempQuery += `INSERT INTO lampa.lampa_prognose_fahrzeugstueckzahlen VALUES(${element[`${el}`]},`;
            }else{
                tempQuery += `${element[`${el}`]},`;
            }
        }
    }));
    const result = await pool.
        query(`${endquery}`);
    data = result.rowCount;
    res.status(200).json({err:false, rowsAffected: data});
};

const importPrognoseVerbauraten = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Code',
        'Code-Bezeichnung',
        'Verbaurate',
        'Sparte',
        'Kriterium',
        'Gesamt' ,
      ];
    let checkArray = ['Code','Code Bezeichnung','Verbaurate'];
    let spaltenNamen = req.body.spalten;
    let errorObj = await spaltenCheck(checkArray,dataArray,spaltenNamen);
    let endquery = '';
    let tempQuery = '';
    if(errorObj.err == true){
        res.status(200).json(errorObj);
    }else{
        await pool.
                query(`DELETE FROM lampa.lampa_prognose_verbaurate WHERE "Sparte" is not null;`);
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
                    element[`${el}`] = "''";
                }
                if(typeof element[`${el}`] == 'string' && element[`${el}`] != "''"){
                    element[`${el}`] = `'${element[`${el}`]}'`;
                }
                if(index == 5 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 5){
                    tempQuery += `${element[`${el}`]});`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `INSERT INTO lampa.lampa_prognose_verbaurate VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }
        }));
        const result = await pool.
            query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowsCount});
    }
};

const exportPrognoseVerbauraten = async (req,res)=> {
    let endquery = 'SELECT "Code", "Code-Bezeichnung", "Verbaurate" FROM lampa.lampa_prognose_verbaurate';
    const pool = req.app.locals.postgresSQL;
    const result = await pool.
        query(`${endquery}`);
    res.status(200).json({parameter : result.rows, err : false});
};

const importPrognosemengen = async (req,res) => {
    let spaltenNamen = req.body.spalten;
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Komponente',
        'Pos Prognose',
        'Jahr 1',
        'Jahr 2',
        'Jahr 3'
      ];
    let endquery = '';
    let tempQuery = '';
    let errorObj = await spaltenCheck(loopArray, dataArray, spaltenNamen);
    if(errorObj.err == true){
        res.status(200).json(errorObj);
    }else{
        const pool = req.app.locals.postgresSQL;
        await pool.
            query(`DELETE FROM lampa.lampa_prognosemengen WHERE "Komponente" is not null`);

        Promise.all(dataArray.map(async (element, longIndex) => {
            tempQuery = '';
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
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
                if(index == 4 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 4){
                    tempQuery += `${element[`${el}`]}) \n;`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `INSERT INTO lampa.lampa_prognosemengen VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }
        }));
        const result = await pool.
                query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowCount});
    }
};

const exportPrognosemengen = async (req,res)=> {
    const pool = req.app.locals.postgresSQL;
    let endquery = 'SELECT * FROM lampa.lampa_prognosemengen';
    const result = await pool.
        query(`${endquery}`);
    res.status(200).json({mengen : result.rows, err : false});
};

const importPrognoseTeileliste = async (req,res) => {
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Pos Prognose',
        'TNR lies',
        'Benennung',
        'Codebedingung',
        'LK',
        'TNR sort'
      ];
    let errLoopArray = [
        'Pos Prognose',
        'TNR lies',
        'Benennung',
        'Codebedingung',
        'LK'
    ];
    let endquery = '';
    let tempQuery = '';
    let spaltenNamen = req.body.spalten;
    let errorObj = await spaltenCheck(errLoopArray,dataArray,spaltenNamen);
    console.log(errorObj);
    if(errorObj.err == true){
        res.status(200).json(errorObj);
    }else{
        const pool = req.app.locals.postgresSQL;
        await pool.
            query(`DELETE FROM lampa.lampa_prognose_teileliste WHERE "TNR lies" is not null`);

        for (let index = 0; index < dataArray.length; index++) {
            let element = dataArray[index];
            element['TNR sort'] = await convertTNR(element['TNR lies']);
        }
        await Promise.all(dataArray.map(async (element, longIndex) => {
            tempQuery = '';
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
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
                if(index == 5 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 5){
                    tempQuery += `${element[`${el}`]}) \n;`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `INSERT INTO lampa.lampa_prognose_teileliste VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }

        }));
        const result = await pool.
            query(`${endquery}`);
            res.status(200).json({err : false, rowsAffected : result.length});
    }
};

const exportPrognoseTeileliste = async (req,res)=> {
    const pool = req.app.locals.postgresSQL;
    let endquery = 'SELECT * FROM lampa.lampa_prognose_teileliste';
    const result = await pool.
        query(`${endquery}`);
    res.status(200).json({parameter : result.rows, err : false});
};

const exportPrognose = async (req,res)=> {
    const pool = req.app.locals.postgresSQL;
    let teileListeArray = [];
    let stueckzahlPrognose = [];
    let fahrzeugZahlen = [];
    let parameterArray = [];
    let primusData = [];
    let isPush = true;
    let prognosenArray = [];
    let geprimteZahlen = [];

    const teileListeResult = await pool.
            query(`SELECT * FROM lampa.lampa_prognose_teileliste`);
    teileListeArray = teileListeResult.rows;

    for (let index = 0; index < teileListeArray.length; index++) {
        let element = teileListeArray[index];
        let str = element['TNR lies'];
        let farbVerbaurate = '';
        let isFarbe = false;
        let isGeprimt = false;
        const primusResult = await pool.
            query(`SELECT * FROM lampa.lampa_primus WHERE "MATNR_SORT" = '${element['TNR Sort']}';`);
        primusData = primusResult.rows;

        if(primusData.length != 0){
            let primusElement = primusData[0];
            isPush = true;

            const parameterResult = await pool.
                query(`SELECT * FROM lampa.lampa_parameter_top_vu WHERE "Pos Prognose"='${element['Pos Prognose']}';`);
            parameterArray = parameterResult.rows;

            const stueckZahlResult = await pool.
                query(`SELECT * FROM lampa.lampa_prognosemengen WHERE "Pos Prognose" = '${element['Pos Prognose']}';`);
            stueckzahlPrognose = stueckZahlResult.rows;

            const fahrzeugResult = await pool.
                query(`SELECT * FROM lampa.lampa_prognose_fahrzeugstueckzahlen;`);
            fahrzeugZahlen = fahrzeugResult.rows;
         
            if(parameterArray[0]['Lackierung'] == 'X'){
                if(str.search('A') == 0 || str.search('R') == 0){
                    if (element['TNR lies'].length == 15 || element['TNR lies'].length == 17) {
                        // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116)
                        if(element['TNR lies'].substring(11,15) == '9999' || element['TNR lies'].substring(13,17) == '9999' || element['TNR lies'].substring(11,15) == '9051' || element['TNR lies'].substring(13,17) == '9051'|| element['TNR lies'].substring(11,15) == '9116' || element['TNR lies'].substring(13,17) == '9116'){
                            isFarbe = true;
                            isGeprimt = true;
                            element['Verbaurate'] = await verbauratenBerechnungPrognose({codeBedingung: element['Codebedingung'], isSql : true, verbauratenArray: []},pool);
                            let data = {'TNR lies': element['TNR lies'],
                            'Verbaurate':element['Verbaurate']['finishedData'],
                            'TNR Sort': element['TNR Sort'],
                            'LK':element['LK'],'Stuck':stueckzahlPrognose,
                            'Fahrzeug':fahrzeugZahlen,
                            'Para':parameterArray,
                            'Code' : element['Codebedingung'],
                            'Benennung' : element['Benennung'],
                            'i': index
                            };
                            if(stueckzahlPrognose[0] != undefined){
                                if(parameterArray[0] != undefined){
                                    data['TechnikInfo'] = primusElement['Technik_Info'];
                                    data['Einsatzdatum'] = primusElement['Seriengueltigkeit_Beginn'];
                                    data['WK-Kenner'] = primusElement['Warenkorb_KNR'];
                                    data['SCA'] = primusElement['Dispo_Arbeitsplatz'];
                                }
                            }
                            geprimteZahlen.push(data);
                        }else{
                            farbVerbaurate = element['TNR lies'].substring(12,15);
                            farbVerbaurate = farbVerbaurate+'U';
                            farbVerbaurate = await verbauratenBerechnungPrognose({codeBedingung: farbVerbaurate, isSql : true, verbauratenArray: []},pool);
                            farbVerbaurate = parseFloat(farbVerbaurate.finishedData.replace('%',''));
                            isFarbe = true;
                        }
                    }
                }
            }
            
            if(isFarbe != false){
                element['Verbaurate'] = await verbauratenBerechnungPrognose({codeBedingung: element['Codebedingung'], isSql : true, verbauratenArray: []},pool);
                if(farbVerbaurate != 0){
                    farbVerbaurate / 100
                }
                element['Verbaurate'] = ((parseFloat(element['Verbaurate']['finishedData'].replace('%','')) / 100)*(farbVerbaurate)) ;
                if(element['Verbaurate'] > 100){
                    element['Verbaurate'] = '100%';
                }else{
                    element['Verbaurate'] += '%';
                }
            }else{
                element['Verbaurate'] = await verbauratenBerechnungPrognose({codeBedingung: element['Codebedingung'], isSql : true, verbauratenArray: []},pool);
                element['Verbaurate'] = parseFloat(element['Verbaurate']['finishedData'].replace('%'));
                if(element['Verbaurate'] > 100){
                    element['Verbaurate'] = '100.00%';
                }else{
                    element['Verbaurate'] += '%';
                }
            }


            if(stueckzahlPrognose[0] != undefined){
                if(parameterArray[0] != undefined){
                    element = prognoseMengenBerechnung(element,stueckzahlPrognose,fahrzeugZahlen,parameterArray,{'Jahr1':0,'Jahr2':0,'Jahr3':0});
                }else{
                    // Delete element / dont push in new array
                    isPush = false;
                }
            }else{
                isPush = false;          // Delete element / dont push in new array
            }
            if(isPush == true){
                element['TechnikInfo'] = primusElement['Technik_Info'];
                element['Einsatzdatum'] = primusElement['Seriengueltigkeit_Beginn'];
                element['WK-Kenner'] = primusElement['Warenkorb_KNR'];
                element['SCA'] = primusElement['Dispo_Arbeitsplatz'];
                prognosenArray.push(element);
            }
        }
    }
    console.table(geprimteZahlen);
    for (let index = 0; index < geprimteZahlen.length; index++) {
        let element = geprimteZahlen[index];
        let withoutES2 = '';
        let is15 = false;
        let is17 = false;
        let summedSubtraction = {'Jahr1':0,'Jahr2':0,'Jahr3':0};
        // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116)
        if(element['TNR lies'].substring(11,15) == '9999' || element['TNR lies'].substring(11,15) == '9051' || element['TNR lies'].substring(11,15) == '9116'){
            withoutES2 = element['TNR lies'];
            withoutES2 = withoutES2.substring(0,11);
            is15 = true;
        // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051,9116)
        }else if(element['TNR lies'].substring(13,17) == '9999' || element['TNR lies'].substring(13,17) == '9051' || element['TNR lies'].substring(13,17) == '9116'){
            withoutES2 = element['TNR lies'];
            withoutES2 = withoutES2.substring(0,13);
            is17 = true;
        }
        for (let index = 0; index < prognosenArray.length; index++) {
            let progElement = prognosenArray[index];
            if(is15 == true){
                if(progElement['TNR lies'].substring(0,11) == withoutES2){
                    if(progElement['TNR lies'] != element['TNR lies']){
                        if(element['LK'] == progElement['LK']){
                            summedSubtraction['Jahr1'] += progElement['Mengen Jahr 1'];
                            summedSubtraction['Jahr2'] += progElement['Mengen Jahr 2'];
                            summedSubtraction['Jahr3'] += progElement['Mengen Jahr 3'];
                        }
                    }
                }
            }else if(is17 == true){
                if(progElement['TNR lies'].substring(0,13) == withoutES2){
                    if(progElement['TNR lies'] != element['TNR lies']){
                        if(element['LK'] == progElement['LK']){
                            summedSubtraction['Jahr1'] += progElement['Mengen Jahr 1'];
                            summedSubtraction['Jahr2'] += progElement['Mengen Jahr 2'];
                            summedSubtraction['Jahr3'] += progElement['Mengen Jahr 3'];
                        }
                    }
                }
            }
        }
        console.log(summedSubtraction);
        element = prognoseMengenBerechnung(element,element['Stuck'],element['Fahrzeug'],element['Para'],summedSubtraction);
    }
    let compiledArray = [];
        for (let index = 0; index < geprimteZahlen.length; index++) {
            let primElement = geprimteZahlen[index];
                let obj = {};
                obj['Pos Prognose'] = primElement['Stuck'][0]['Pos Prognose'];
                obj['TNR lies'] = primElement['TNR lies'];
                obj['Benennung'] = primElement['Benennung'];
                obj['Codebedingung'] = primElement['Code'];
                obj['LK'] = primElement['LK'];
                obj['TNR Sort'] = primElement['TNR Sort'];
                obj['Verbaurate'] = primElement['Verbaurate'];
                obj['Mengen Jahr 1'] = primElement['Mengen Jahr 1'];
                obj['Mengen Jahr 2'] = primElement['Mengen Jahr 2'];
                obj['Mengen Jahr 3'] = primElement['Mengen Jahr 3'];
                obj['TechnikInfo'] = primElement['TechnikInfo'];
                obj['Einsatzdatum'] = primElement['Einsatzdatum'];
                obj['WK-Kenner'] = primElement['WK-Kenner'];
                obj['SCA'] = primElement['SCA'];
                prognosenArray[primElement['i']] = obj;
            
            
        }
    let sortedArray = [];
    for (let index = 0; index < prognosenArray.length; index++) {
        const element = prognosenArray[index];
        let obj = {};
        obj['Pos Prognose'] = parseInt(element['Pos Prognose']);
        obj['TNR sort'] = element['TNR Sort'];
        obj['TNR lies'] = element['TNR lies'];
        obj['Benennung'] = element['Benennung'];
        obj['TechnikInfo'] = element['TechnikInfo'];
        obj['Einsatzdatum'] = element['Einsatzdatum'];
        let newEinsatzDatum = element['Einsatzdatum'].substring(0,4)+'.'+element['Einsatzdatum'].substring(4,6) +'.'+ element['Einsatzdatum'].substring(6,8);
        obj['Einsatzdatum'] = newEinsatzDatum;
        obj['Codebedingung'] = element['Codebedingung'];
        obj['LK'] = element['LK'];
        obj['WK-Kenner'] = element['WK-Kenner'];
        obj['SCA'] = element['SCA'];
        obj['Verbaurate'] = element['Verbaurate'];
        obj['Verbaurate'] = parseFloat(element['Verbaurate'].replace('%')) /100;
        obj['Mengen Jahr 1'] = parseInt(element['Mengen Jahr 1']);
        obj['Mengen Jahr 2'] = parseInt(element['Mengen Jahr 2']);
        obj['Mengen Jahr 3'] = parseInt(element['Mengen Jahr 3']);

        sortedArray.push(obj);
    }
    let verbaurateColumnPlace = 0;
    let mengenNameArrayV2 = [];
    let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index);
    for (let index = 0; index < sortedArray.length; index++) {
        const element = sortedArray[index];
        for (let index = 0; index < Object.keys(element).length; index++) {
            const el = Object.keys(element)[index];
            mengenNameArrayV2.push(el);
        }
    }
    let filteredArrayV2 = [...new Set(findDuplicates(mengenNameArrayV2))];
    console.log(filteredArrayV2);
    for (let index = 0; index < filteredArrayV2.length; index++) {
        const element = filteredArrayV2[index];
        if(element.search('Verbaurate') > -1){
            verbaurateColumnPlace = index;
        }
        
    }
    res.status(200).json({prognose : sortedArray, err: false, columnPlace: verbaurateColumnPlace});
};

async function verbauratenBerechnungPrognose(info, pool){
    let data = info.codeBedingung;
    let filterString = data;
    let slashReplace = new RegExp("/", "g");
    let plusMinus = new RegExp("\\+-", "g");
    let plus = new RegExp("\\+", "g");
    filterString = filterString.replace(slashReplace, ',');
    filterString = filterString.replace(plusMinus, ',');
    filterString = filterString.replace(plus, ',');
    filterString = filterString.replace(/ *(\(|\)) */g,'');
    let codeArray = [];
    let filterStringV2 = filterString;
    let code = '';
    let commaIndex = 0;
    let commaLength = (filterString.match(/,/g) || []).length;
    let operatorsString = data;
    if(commaLength == 0){
        codeArray.push(filterStringV2);
    }else{
        for (let index = 0; index < commaLength; index++) {
            if(index == (commaLength - 1)){
                await codeCutting();
                codeArray.push(filterStringV2);
            }else{
                await codeCutting();
            }
        }
    }
    async function codeCutting(){
        // ### Obsolete
        commaIndex = filterStringV2.indexOf(',');
        code = filterStringV2.substring(0,(commaIndex));
        filterStringV2 = filterStringV2.replace(`${code},`,"");
        code = code.replace('-','');
        codeArray.push(code);
        return;
    }
    let queryString = '';
    let queryArray = [];
    if(info.isSql == true){
        for (let index = 0; index < codeArray.length; index++) {
            let element = codeArray[index];
            operatorsString = operatorsString.replace(element,'');
            element = element.replace('-','');
            element = element.replace(/'/g, '');
            queryString = `SELECT "Verbaurate" FROM lampa.lampa_prognose_verbaurate WHERE "Code" = '${element}';`;
            const results = await pool.query(queryString);
            queryArray.push(results.rows)
        }
        // try {
        //     const results = await pool.query(queryString);
        //     queryArray.push(results.rows)
        //     // for (const result of results.rows) {
        //     //     console.log(result.rows, 'row')
        //     //     queryArray.push(result.rows);
        //     // }
        // } catch (error) {
        //     console.log(error);
        //     console.log('Error Here');
        // }
    }else{
        queryArray = info.verbauratenArray;
    }
    let isMinus = '';
    for (let index = 0; index < codeArray.length; index++) {
        isMinus = '';
        let codeElement = codeArray[index];
        let queryElement = queryArray[index];
        if(codeElement == 'ET' || codeElement == '-ET' || codeElement == 'BLANK' || codeElement == 'ETN' || codeElement == '-ETN' || codeElement == 'HA' || codeElement == '-HA' || codeElement == 'TZ' ||  codeElement == '-TZ' || codeElement == 'TZA' || codeElement == '-TZA' || codeElement == 'TZR' ||  codeElement == '-TZR' || codeElement == 'VA' || codeElement == '-VA'){
            queryArray[index] = [{'Verbaurate': 1}];
            queryElement = [{'Verbaurate': 1}];
        }else if(codeElement == 'HL' || codeElement == '-HL' || codeElement == 'HR' || codeElement == '-HR' || codeElement == 'VL' || codeElement == '-VL' || codeElement == 'VR' || codeElement == '-VR'){
            queryArray[index] = [{'Verbaurate': 0.5}];
            queryElement = [{'Verbaurate': 0.5}];
        }
        if(codeElement.indexOf('-') > -1){
            isMinus = '+-';
        }
        if(queryElement.length == 0){
            console.log(data);
            let replace = `[\\D](${codeElement})`;
            let var2 =   new RegExp(replace) ;	
            console.log(var2);
            let newString = data.match(var2);
            console.log(newString);
            if(newString == null){
                data = data.replace(codeElement,`${isMinus}0`);
            }else{
                let firstThing = newString[0].substring(0,1);
                data = data.replace(newString[0],`${firstThing}0`);
            }
        }else{
            let verbaurate = queryElement[0]['Verbaurate'];
            verbaurate = verbaurate.toString();
            verbaurate = verbaurate.replace(',','.');
            if(index > 0){
                let replace = `[\\D](${codeElement})`;
                let var2 =   new RegExp(replace) ;	
                let newString = data.match(var2);
                let firstThing = newString[0].substring(0,1);
                data = data.replace(newString[0],`${firstThing}${verbaurate}`);
            }else{
                data = data.replace(codeElement,`${isMinus}${verbaurate}`);
            }
        }
    }
    let finishedString = '';
    if(data.indexOf('+-') != -1){
        finishedString = await plusminusSuche(data);
    }else{
        finishedString = data;
    }
        if(finishedString.search('-') == 0){
            if(info.isSql == true){
                if(queryArray[0].length == 0){
                    queryArray[0] = [{'Verbaurate': '0'}];
                }
            }
            if(finishedString.search('\\(') == 1){
                let secondKlammer = finishedString.search('\\)') + 1;
                let subString = finishedString.substring(1,secondKlammer);
                subString = `(1-${subString})`;
                let finishedSubString = finishedString.substring(secondKlammer,finishedString.length);
                finishedString = subString + finishedSubString;
            }else{
                let verbauratenString = queryArray[0][0]['Verbaurate'].toString();
                let startPos = verbauratenString.length + 1;
                let replacementStr = `(1-${verbauratenString})`;
                finishedString = replacementStr+ finishedString.substring(startPos,finishedString.length);
            }
    
        }
    finishedString = finishedString.replace(/\+/g, '*');
    finishedString = finishedString.replace(/\/\*/g, '+');
    finishedString = finishedString.replace(/\//g, '+');
    console.log(finishedString);
    finishedString = parseFloat(eval(finishedString) * 100).toFixed(2);
    if(finishedString < 0){
        finishedString = 0 + `%`;
    }else if(finishedString > 100){
        finishedString = 100 + `%`;
    }else{
        finishedString = finishedString + `%`;
    }
    return {finishedData: finishedString, codes: codeArray, verbauraten : queryArray};
}

const prognoseMengenBerechnung = (element,stueckzahlPrognose,fahrzeugZahlen,parameterArray,subtraction) => {
    let rechenStringJahr1 = '';
    let rechenStringJahr2 = '';
    let rechenStringJahr3 = '';
    if(element['LK']  == 'L'){
        rechenStringJahr1 = `(${stueckzahlPrognose[0]['Jahr 1']}*(${fahrzeugZahlen[1]['Jahr 1']}/${fahrzeugZahlen[2]['Jahr 1']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr1']})`;
        console.log(rechenStringJahr1);
        rechenStringJahr1 = rechenStringJahr1.replace('%','');
        element['Mengen Jahr 1'] = Math.round(eval(rechenStringJahr1));
        rechenStringJahr2 = `(${stueckzahlPrognose[0]['Jahr 2']}*(${fahrzeugZahlen[1]['Jahr 2']}/${fahrzeugZahlen[2]['Jahr 2']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr2']})`;
        rechenStringJahr2 = rechenStringJahr2.replace('%','');
        element['Mengen Jahr 2'] = Math.round(eval(rechenStringJahr2));
        rechenStringJahr3 = `(${stueckzahlPrognose[0]['Jahr 3']}*(${fahrzeugZahlen[1]['Jahr 3']}/${fahrzeugZahlen[2]['Jahr 3']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr3']})`;
        rechenStringJahr3 = rechenStringJahr3.replace('%','');
        element['Mengen Jahr 3'] = Math.round(eval(rechenStringJahr3));
    }else if(element['LK']  == 'R'){
        rechenStringJahr1 = `(${stueckzahlPrognose[0]['Jahr 1']}*(${fahrzeugZahlen[0]['Jahr 1']}/${fahrzeugZahlen[2]['Jahr 1']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr1']})`;
        rechenStringJahr1 = rechenStringJahr1.replace('%','');
        element['Mengen Jahr 1'] = Math.round(eval(rechenStringJahr1));
        rechenStringJahr2 = `(${stueckzahlPrognose[0]['Jahr 2']}*(${fahrzeugZahlen[0]['Jahr 2']}/${fahrzeugZahlen[2]['Jahr 2']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr2']})`;
        rechenStringJahr2 = rechenStringJahr2.replace('%','');
        element['Mengen Jahr 2'] = Math.round(eval(rechenStringJahr2));
        rechenStringJahr3 = `(${stueckzahlPrognose[0]['Jahr 3']}*(${fahrzeugZahlen[0]['Jahr 3']}/${fahrzeugZahlen[2]['Jahr 3']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr3']})`;
        rechenStringJahr3 = rechenStringJahr3.replace('%','');
        element['Mengen Jahr 3'] = Math.round(eval(rechenStringJahr3));
    }else{
        console.log(stueckzahlPrognose);
        rechenStringJahr1 = `(${stueckzahlPrognose[0]['Jahr 1']}*(${fahrzeugZahlen[2]['Jahr 1']}/${fahrzeugZahlen[2]['Jahr 1']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr1']})`;
        rechenStringJahr1 = rechenStringJahr1.replace('%','');
        element['Mengen Jahr 1'] = Math.round(eval(rechenStringJahr1));
        rechenStringJahr2 = `(${stueckzahlPrognose[0]['Jahr 2']}*(${fahrzeugZahlen[2]['Jahr 2']}/${fahrzeugZahlen[2]['Jahr 2']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr2']})`;
        rechenStringJahr2 = rechenStringJahr2.replace('%','');
        element['Mengen Jahr 2'] = Math.round(eval(rechenStringJahr2));
        rechenStringJahr3 = `(${stueckzahlPrognose[0]['Jahr 3']}*(${fahrzeugZahlen[2]['Jahr 3']}/${fahrzeugZahlen[2]['Jahr 3']})*(${element['Verbaurate']}/100)/${parameterArray[0]['Links/Rechts']}-${subtraction['Jahr3']})`;
        rechenStringJahr3 = rechenStringJahr3.replace('%','');
        element['Mengen Jahr 3'] = Math.round(eval(rechenStringJahr3));
    }
    return element;
};

module.exports = { getFahrzeugstueckzahlen, prognoseVerbauratenBerechnung, importParameterVU, exportParameterVU, updateFahrzeugstueckzahlen, importPrognoseVerbauraten, importPrognosemengen, exportPrognosemengen, importPrognoseTeileliste, exportPrognoseTeileliste, exportPrognose, exportPrognoseVerbauraten };
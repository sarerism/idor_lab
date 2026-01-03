let _ = require('lodash');
const { convertTNR } = require('../../../functions/convert');
const { updateErrorHandling } = require('../../../functions/errorHandling');
const fs = require('fs');
const xlsx = require("xlsx");

// let zuImportStueckliste;
// app.post('/importStueckliste', async (req,res) => {
//     zuImportStueckliste = req.body;
//     res.status(200).json(new ResponseData(false,'Stückliste abgespeichert',null));
// })

function loadTestData(){
    const workbook = xlsx.readFile('C:\\Users\\nikolaj.thomas\\Desktop\\Mercedes Benz\\LAMPA\\RestService\\original_Stückliste_W214.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    return jsonData;
}

const importStueckliste = async (req,res) => {
    req.setTimeout(3000000);
    let dataArray = req.body.eintraege;
    let compiledDataArray = [];
    let strArray = [];
    let deleteArray = [];
    let compiledDataArrayV2 = [];
    let loopArray = [
        'Submodul',
        'Teil',
        'Codebedingung lang',
        'LK',
        'Benennung',
        'FA MG',
        'FB MG',
        'FC MG',
        'FH MG',
        'FN MG',
        'FR MG',
        'FS MG',
        'FV MG',
        'FW MG',
        'FX MG',
        'FZ MG',
        'M14 MG',
        'M15 MG',
        'M16 MG',
        'M17 MG',
        'M18 MG',
        'M19 MG',
        'M20 MG',
        'M22 MG',
        'M25 MG',
        'M29 MG',
        'M30 MG',
        'M35 MG',
        'M55 MG',
        'M60 MG',
        'FKA MG',
        'FKB MG',
        'FVK MG',
        'FLK MG',
        'FHL MG',
        'FHS MG',
        'i'
        ];
    /* Import Datei auf benötigte Spalten reduzieren*/

    for (const element of dataArray) {
        let keys = Object.keys(element);
        let obj = {};
        obj['Submodul'] = element['Submodul'];
        obj['Teil'] = element['Teil'];
        obj['Codebedingung lang'] = element['Codebedingung lang'];
        obj['LK'] = element['LK'];
        obj['Benennung'] = element['Benennung'];
        for (let index = 0; index < keys.length; index++) {
            const el = keys[index];
            if(el.search('MG') >= 0){
                obj[`${el}`] = element[`${el}`];
            }
        }
        if(element['Teil'] != undefined){
            compiledDataArray.push(obj);
        }
    }

    let infoObject = {updateArray : compiledDataArray, columnCount : loopArray};
    let errorObject = await updateErrorHandling(infoObject);

    // TODO: Return message 
    if(errorObject.err) return res.status(400).json({});

    let checkElement;
    await compiledDataArray.map(async(element, longIndex) => {
        for (let index = 0; index < loopArray.length; index++) {
            const el = loopArray[index];
            if(typeof element[`${el}`] == 'undefined'){
                if(el.search('MG') > 0){
                    element[`${el}`] = null;
                }else{
                    element[`${el}`] = '';
                }
            }
            if(element['Teil'] == ''){
                compiledDataArray.splice(longIndex,1);
            }
            if(element['LK'] == null || element['LK'] == undefined){
                element['LK'] = 'B';
            }
            if(element['Codebedingung lang'] == undefined){
                element['Codebedingung lang'] = ';';
            }
            let str = element['Codebedingung lang'];
            if((str.search(';') == 0) == true){
                element['Codebedingung lang'] = str.replace(';','BLANK');
            }else{
                element['Codebedingung lang'] = str.replace(';','');
            }
        }
        checkElement = element['Teil'];
        checkElement  = await convertTNR(checkElement);
        element.TNRsort = checkElement;
    });

    let foundDataArray = [];
    const uniqueTNRsortValues = [...new Set(compiledDataArray.map(element => element['TNRsort']))];

    const pool = req.app.locals.postgresSQL;
 
    // Create a comma-separated string of unique values to use in the IN operator
    const valuesString = uniqueTNRsortValues.map(value => `'${value}'`).join(',');

    // Execute a single query to fetch all records matching the 'TNRsort' values
    const result = await pool.query(`SELECT * FROM lampa.lampa_primus WHERE "Grundnummer" IN (${valuesString})`);

    // Loop through the result and filter the found data
    for (const row of result.rows) {
        const foundElement = compiledDataArray.find(element => element['TNRsort'] === row['Grundnummer']);
        if (foundElement) {
            foundDataArray.push(foundElement);
            strArray.push(foundElement['Teil']);
        }
    }

    // TODO: Return message for nothing found in primus
    if(foundDataArray.length === 0) return res.status(400).json({});

    compiledDataArray = _.clone(foundDataArray);
    let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index);
    let filteredArray = [...new Set(findDuplicates(strArray))];
    const values = compiledDataArray;
    const lookup = values.reduce((a, e) => {
        a[e.Teil] = ++a[e.Teil] || 0;
        return a;
        }, {});
    let valueArray = values.filter(e => lookup[e.Teil]);
    let teileNummernWithCount = [];

    compiledDataArray.sort(function(a, b){
        if(a.Teil < b.Teil) { return -1; }
        if(a.Teil > b.Teil) { return 1; }
        return 0;
    });
    for (let index = 0; index < compiledDataArray.length; index++) {
        const el = compiledDataArray[index];
        el['i'] = index;
        
    }
    filteredArray.sort();
    deleteArray = await stueckListenCompiling(compiledDataArray,filteredArray);
    for (let index = 0; index < deleteArray.length; index++) {
        const delElement = deleteArray[index];
        compiledDataArray[delElement] = null;
    }
    for (let index = 0; index < compiledDataArray.length; index++) {
        let element = compiledDataArray[index];
        if(element != null){
            compiledDataArrayV2.push(compiledDataArray[index]);
        }
        
    }
    compiledDataArray = _.clone(compiledDataArrayV2);
    Promise.all(filteredArray.map((element) => {
        let obj = { teil : element , count : 0, teilArray : []};
        teileNummernWithCount.push(obj);
    }));
    Promise.all(teileNummernWithCount.map((element) => {
        for (let index = 0; index < valueArray.length; index++) {
            let el = valueArray[index];
            if(el['Teil'] == element['teil']){
                element['count'] += 1;
                element['teilArray'].push(el);
                valueArray.splice(index,1);
                index = index -1;
            }else{
                break;
            }

        }
    }));
    for (let index = 0; index < compiledDataArray.length; index++) {
        const element = compiledDataArray[index];
        element['Verbaurate'] = '0%';
    }
    let queryLoopArray = [
        'Submodul',
        'Teil',
        'Codebedingung lang',
        'LK',
        'Benennung',
        'FA MG',
        'FB MG',
        'FC MG',
        'FH MG',
        'FN MG',
        'FR MG',
        'FS MG',
        'FV MG',
        'FW MG',
        'FX MG',
        'FZ MG',
        'M14 MG',
        'M15 MG',
        'M16 MG',
        'M17 MG',
        'M18 MG',
        'M19 MG',
        'M20 MG',
        'M22 MG',
        'M25 MG',
        'M29 MG',
        'M30 MG',
        'M35 MG',
        'M55 MG',
        'M60 MG',
        'FKA MG',
        'FKB MG',
        'FVK MG',
        'FLK MG',
        'FHL MG',
        'FHS MG',
        'TNRsort',
        'Sparte',
        'Verbaurate'
        ];
    let endquery = '';
    let tempQuery = '';

    await pool.query(`DELETE FROM lampa.lampa_stueckliste WHERE "Sparte" = '${req.body.sparte}'`);

    let queryArray = [];

    await Promise.all(compiledDataArray.map(async(element, longIndex) => {
        let test = _.clone(element);
        tempQuery = '';
        for (let index = 0; index < queryLoopArray.length; index++) {
            const el = queryLoopArray[index];
            if(typeof test[`${el}`] == 'string'){
                let str = _.clone(test[`${el}`]);
                if(str.indexOf("'") > -1){
                    test[`${el}`] = str.replace("'","''");
                }
            }
            if(el == 'Sparte'){
                test[`${el}`] = req.body.sparte;
            }
            if(typeof test[`${el}`] == 'undefined'){
                test[`${el}`] = "''";
            }
            if(typeof test[`${el}`] == 'string' && test[`${el}`] != "''"){
                test[`${el}`] = `'${test[`${el}`]}'`;
            }
            if(index == 38 && longIndex == compiledDataArray.length -1){
                tempQuery += `${test[`${el}`]})\n`;
                endquery += tempQuery;
                queryArray.push(endquery);
            }else if(index == 38){
                tempQuery += `${test[`${el}`]})\n;`;
                endquery += tempQuery;
                queryArray.push(endquery);
            }else if(index == 0){
                tempQuery = '';
                tempQuery += `INSERT INTO lampa.lampa_stueckliste VALUES(${test[`${el}`]},`;
            }else{
                tempQuery += `${test[`${el}`]},`;
            }
        }
    }));

    await pool.query(`${endquery}`);

    // TODO: success message ändern
    res.status(200).json({ msg : "success"});
};

const exportStueckliste = async(req,res) => {
    const pool = req.app.locals.postgresSQL;
    let sparte = req.body.sparte;
    let queryArray = [];
    let queryLoopArray = [
        'Submodul',
        'Teil',
        'Codebedingung lang',
        'LK',
        'Benennung',
        'FA MG',
        'FB MG',
        'FC MG',
        'FH MG',
        'FN MG',
        'FR MG',
        'FS MG',
        'FV MG',
        'FW MG',
        'FX MG',
        'FZ MG',
        'M14 MG',
        'M15 MG',
        'M16 MG',
        'M17 MG',
        'M18 MG',
        'M19 MG',
        'M20 MG',
        'M22 MG',
        'M25 MG',
        'M29 MG',
        'M30 MG',
        'M35 MG',
        'M55 MG',
        'M60 MG',
        'FKA MG',
        'FKB MG',
        'FVK MG',
        'FLK MG',
        'FHL MG',
        'FHS MG',
        'TNRsort',
        'Sparte'
    ];
    const result = await pool.query(`SELECT * FROM lampa.lampa_stueckliste WHERE "Sparte" = $1`,[sparte]);
    // TODO: Check if empty result
    queryArray = result.rows;
    await queryArray.map((element) => {
        for (let index = 0; index < queryLoopArray.length; index++) {
            const el = queryLoopArray[index];
            if(element[`${el}`] == null){
                delete element[`${el}`];
            }
            if(`${el}` == 'Submodul'){
                element[`${el}`] = `${element[`${el}`]}`;
                if(element[`${el}`].length < 6){
                    element[`${el}`] = '0' + element[`${el}`];
                }
            }
            delete element['Sparte'];
        }
    });
    res.status(200).json({err : false, data : queryArray});
};


async function stueckListenCompiling(compiledArray,filteredArray){
    let startIndex = 0;
    let dupList = [];
    let stueckListenArray = _.clone(compiledArray);
    let deleteArray = [];
    let deleteAmount = 0;
    let deleteInsideDupArray = [];
    let codeString = '';
    for (let index = 0; index < filteredArray.length; index++) {
        let dupElement = filteredArray[index];
        for (let index = startIndex; index < stueckListenArray.length; index++) {
            let stuckElement = stueckListenArray[index];
            if(dupElement == stuckElement['Teil']){
                startIndex = index + 1;
                dupList.push({Teil: dupElement, startExcel: startIndex, startArray: (startIndex - 1)});
                break;
            }
        }
    }
    for (let index = 0; index < dupList.length; index++) {
        const element = dupList[index];
        let dupArray = []
        let checkArray = 0;
        if(dupList[(index+1)] != undefined){
            dupArray = stueckListenArray.slice(element['startArray'],dupList[(index+1)]['startArray']);
        }else{
            dupArray = stueckListenArray.slice(element['startArray'],(stueckListenArray.length));
        }
        do {
            checkArray = dupArray.length;
            for (let index = 0; index < dupArray.length; index++) {
                let checkElement = dupArray[0];
                let el = dupArray[index];
                if(checkElement['i'] != el['i']){
                    if(isAllEqual(checkElement,el)==true){
                        deleteAmount +=1;
                        deleteArray.push(el['i']);
                        deleteInsideDupArray.push(index);
                    }else{
                        if(isMenge(checkElement,el) == true){
                            deleteAmount +=1;
                            deleteArray.push(el['i']);
                            deleteInsideDupArray.push(index);
                        }else{
                            if(isCode(checkElement,el) == true){
                                codeString += `/${dupArray[index]['Codebedingung lang']}`
                                deleteAmount +=1;
                                deleteArray.push(el['i']);
                                deleteInsideDupArray.push(index);
                            }
                        }
                    }
                    if(index == (dupArray.length - 1)){
                        dupArray[0]['Codebedingung lang'] = `${dupArray[0]['Codebedingung lang']}${codeString}`;
                        codeString = '';
                        dupArray[0] = null;
                        for (let index = 0; index < deleteInsideDupArray.length; index++) {
                            let element = deleteInsideDupArray[index];
                            dupArray[element] = null;
                        }
                        let replaceArray = [];
                        for (let index = 0; index < dupArray.length; index++) {
                            const element = dupArray[index];
                            if(element != null){
                                replaceArray.push(element);
                            }
                        }
                        dupArray = _.clone(replaceArray);
                        deleteInsideDupArray = [];
                    }
                }
            }
        } while (checkArray != dupArray.length);

    }
    return deleteArray;
}


function isAllEqual(checkElement,stuckElement){
    if(_.isEqual(
        _.omit(checkElement, ['i','Benennung']),
        _.omit(stuckElement, ['i','Benennung'])
    ) == true){
        return true;
    }
}

function isCode(checkElement,stuckElement){
    let omitArray = [];
    for (let index = 0; index < Object.keys(checkElement).length; index++) {
        const element = Object.keys(checkElement)[index];
        if(element.search('MG') > -1){
            omitArray.push(element);
        }
        
    }
    omitArray.push('i');
    omitArray.push('Codebedingung lang');
    omitArray.push('Benennung');
    if(checkElement['Teil'] == 'A2068170100'){
        console.log(_.isEqual(
            _.omit(checkElement, omitArray),
            _.omit(stuckElement, omitArray)
        ));
    }
    if(_.isEqual(
        _.omit(checkElement, ['i','Codebedingung lang','Benennung']),
        _.omit(stuckElement, ['i','Codebedingung lang','Benennung'])
    ) == true){
        if(checkElement['Codebedingung lang'] != stuckElement['Codebedingung lang']){
            return true;
        }
    }
}
function isLK(checkElement,stuckElement){
    if(_.isEqual(
        _.omit(checkElement, ['i','LK','Benennung']),
        _.omit(stuckElement, ['i','LK','Benennung'])
    ) == true){
        if(checkElement['LK'] == stuckElement['LK']){
            return true;
        }
    }  
}

function isMenge(checkElement,stuckElement){
    let keys = Object.keys(checkElement);
    let omitArray = [];
    let mengenArray = [];
    let checkArray = [];
    omitArray.push('i','Benennung');
    for (let index = 0; index < keys.length; index++) {
        const element = keys[index];
        if(element.search('MG') > - 1){
            omitArray.push(element);
            mengenArray.push(element);
        }
    }
    if(_.isEqual(
        _.omit(checkElement, omitArray),
        _.omit(stuckElement, omitArray)
    ) == true){
        for (let index = 0; index < mengenArray.length; index++) {
            const el = mengenArray[index];
            let checkMengenEl = checkElement[`${el}`];
            let stuckMengenEl = stuckElement[`${el}`];
            if(checkMengenEl == null && stuckMengenEl != null){
                //checkElement gets lowest menge stuckelement gets deleted
                checkElement[`${el}`] == stuckMengenEl;
            }else if(checkMengenEl != null && stuckMengenEl != null){
                // checkElement gets lowest
                if(checkMengenEl > stuckMengenEl && stuckMengenEl != 0){
                    checkElement[`${el}`] = stuckMengenEl;
                }
            } 
        }
        return true;
    }  
}


module.exports = { importStueckliste, exportStueckliste };
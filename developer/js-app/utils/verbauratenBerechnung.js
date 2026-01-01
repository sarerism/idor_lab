const plusminusSuche = async (data) => {
    let testing = new RegExp(/\+-/g);
    let testString = data;
    let plusminusCount = data.match(testing);
    let strArray = [];
    let stopBool = false;
    let currentPosition = 0;
    let position = 0;
    let positionArray = [];
    let i = 0;
    let test =  data.indexOf("+-",0);
    do {
        i += 1;
        position = data.indexOf("+-",currentPosition);
        if(position == -1){
            stopBool = true;
        }else{
        positionArray.push(position);
        currentPosition = position + 2;}
    } while (stopBool == false);
    data.replace();
    for (let index = 0; index < plusminusCount.length; index++) {
        strArray.push(data.substr(0, data.indexOf("+-") + 2));
        data = data.substring(data.indexOf("+-") + 2, data.length + 1);
    }
    strArray.push(data);
    let slashArray = [];
    for (let index = 0; index < strArray.length; index++) {
        let element = strArray[index];
        let slashIndex = element.indexOf('/');
        if(slashIndex > -1){
            let firstStr = element.substr(0, slashIndex);
            let secondStr = element.substr(slashIndex + 1);
            slashArray.push(firstStr);
            slashArray.push(`/`+secondStr);
        }else{
            slashArray.push(element);
        }
    }
    strArray = slashArray;
    let finishedString = '';
    let skipNext = false;
    for (let index = 0; index < strArray.length; index++) {
        if(strArray[index].indexOf('/') == 0){
            strArray[index] = strArray[index].replace('+-','');
            finishedString += strArray[index];
        }else{
            if(skipNext == false){
                if(strArray[index].indexOf('/+-') > -1){
                    skipNext = true;
                    strArray[index] = strArray[index].replace('/','');
                }
                if(index != 0){
                    strArray[index] = strArray[index].replace('+-','');
                    strArray[index] = `*(1-${strArray[index]})`;
                    finishedString += strArray[index];
                }else{
                    strArray[index] = strArray[index].replace('+-','');
                    finishedString += strArray[index];
                }
            }else{
                strArray[index] = strArray[index].replace('+-','');
                strArray[index] = `/(1-${strArray[index]})`;
                finishedString += strArray[index];
                skipNext = false;
            }
        }
    }
    if(finishedString.indexOf('*') == 0){
        finishedString = finishedString.replace('*','');
    }
    return finishedString;
};

const verbauratenBerechnung = async (codeBedingung, sparte,sqlString, extra) => {
    try {
        let data = codeBedingung;
        let rawdata = [];
        let testString = data;
        let newDataString = '';
        let student = rawdata;
        let replaceArray = [];
        let verbaurate = '';
        let filterString = data;
        const slashReplace = new RegExp("/", "g");
        const plusMinus = new RegExp("\\+-", "g");
        const plus = new RegExp("\\+", "g");
        const minus = new RegExp("\\-", "g");
        const bracket = new RegExp(/ *(\(|\)) */g, '');
        const backParenthesis = new RegExp(/[)]/g, '');
        filterString = filterString.replace(slashReplace, ',');
        filterString = filterString.replace(plusMinus, ',');
        filterString = filterString.replace(plus, ',');
        filterString = filterString.replace(/ *(\(|\)) */g,'');
        newDataString = newDataString.replace(plusMinus, '-');
        newDataString = newDataString.replace(plus, '*');
        newDataString = newDataString.replace(slashReplace, '+ ');
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
            commaIndex = filterStringV2.indexOf(',');
            code = filterStringV2.substring(0,(commaIndex));
            filterStringV2 = filterStringV2.replace(`${code},`,"");
            code = code.replace('-','');
            codeArray.push(code);
            return;
        }
        let queryString = '';
        for (let index = 0; index < codeArray.length; index++) {
            let element = codeArray[index];
            operatorsString = operatorsString.replace(element,'');
            element = element.replace('-','');
            element = element.replace(/'/g, '');
            queryString += `SELECT Verbaurate FROM ${sqlString} WHERE Code = '${element}' AND Sparte = '${sparte}' ${extra};`;
        }
        let queryArray = [];
        try {
            const pool = await poolPromise;
            const result = await pool.request().
                query(queryString);
                queryArray = result.recordsets;
        } catch (error) {
            console.log('Error Here');
        }
        let isMinus = '';
        for (let index = 0; index < codeArray.length; index++) {
            isMinus = '';
            let codeElement = codeArray[index];
            let queryElement = queryArray[index];
            if(codeElement == 'ET' || codeElement == 'BLANK' || codeElement == 'ETN' || codeElement == 'HA' || codeElement == 'TZ' || codeElement == 'TZA' || codeElement == 'TZR' || codeElement == 'VA'){
                queryArray[index] = [{'Verbaurate': 1}];
                queryElement = [{'Verbaurate': 1}];
            }else if(codeElement == '-ET'){
                queryArray[index] = [{'Verbaurate': 1}];
                queryElement = [{'Verbaurate': 1}];
            }else if(codeElement == 'HL' || codeElement == 'HR' || codeElement == 'VL' || codeElement == 'VR'){
                queryArray[index] = [{'Verbaurate': 0.5}];
                queryElement = [{'Verbaurate': 0.5}];
            }
            if(codeElement.indexOf('-') > -1){
                isMinus = '+-';
            }
            if(queryElement.length == 0){
                let replace = `[\\D](${codeElement})`;
                let var2 =   new RegExp(replace) ;	
                let newString = data.match(var2);
                if(newString == null){
                    data = data.replace(codeElement,`${isMinus}0`);
                }else{
                    let firstThing = newString[0].substring(0,1);
                    data = data.replace(newString[0],`${firstThing}0`);
                }
            }else{
                if(queryElement[0]['Verbaurate'] == 'nikolaj Thomas'){
                    let replace = `[\\D](${codeElement})`;
                    let var2 =   new RegExp(replace) ;	
                    let newString = data.match(var2);
                    let firstThing = newString[0].substring(0,1);
                    data = data.replace(newString[0], `${firstThing}0`);
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
        }
        let finishedString = '';
        if(data.indexOf('+-') != -1){
            finishedString = await plusminusSuche(data);
        }else{
            finishedString = data;
        }
        if(finishedString.search('-') == 0){
            if(queryArray[0].length == 0){
                queryArray[0] = [{'Verbaurate': '0'}];
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
        let beforeCalc = finishedString;
        finishedString = parseFloat(eval(finishedString) * 100).toFixed(2);
        if(finishedString < 0){
            finishedString = 0 + `%`;
        }else if(finishedString > 100){
            finishedString = 100 + `%`;
        }else{
            finishedString = finishedString + `%`;
        }
        return finishedString;
    } catch (error) {
        console.log(error);
        return '0.00%';
    }
};


module.exports = { plusminusSuche }
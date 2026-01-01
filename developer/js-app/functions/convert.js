const convertToColumn = async (data, formInfo) =>{
    if (formInfo.bereich == 'Good Basket') {
        let queryString = '';
        await Promise.all(data.map(async (element) => {
            queryString = queryString + `,` + `"${element}"`;
        }));
        return queryString;
    } else if (formInfo.bereich == 'Push Matrix') {
        let queryString = '';
        await Promise.all(data.map(async (element) => {
            element = element.replace(' ', '_');
            queryString = queryString + `,` + `"${element}"`;
        }));
        return queryString;
    }
};

const convertTNR = async (checkElement) => {
    let str = checkElement.substring(0, 1);
    if(str.search('A') == 0 || str.search('R') == 0){
        if (checkElement.length == 11) {
            checkElement = checkElement.substring(0, 1) + checkElement.substring(4, 7) + checkElement.substring(9, 11) + checkElement.substring(1, 4) + "  " + checkElement.substring(7, 9);
        } else if (checkElement.length == 13) {
            checkElement = checkElement.substring(0, 1) + checkElement.substring(4, 7) + checkElement.substring(9, 11) + checkElement.substring(1, 4) + "  " + checkElement.substring(7, 9) + checkElement.substring(11, 13);
        } else if (checkElement.length == 15) {
            checkElement = checkElement.substring(0, 1) + checkElement.substring(4, 7) + checkElement.substring(9, 11) + checkElement.substring(1, 4) + "  " + checkElement.substring(7, 9) + "  " + checkElement.substring(11, 15);
        } else if (checkElement.length == 17) {
            checkElement = checkElement.substring(0, 1) + checkElement.substring(4, 7) + checkElement.substring(9, 11) + checkElement.substring(1, 4) + "  " + checkElement.substring(7, 9) + checkElement.substring(11, 13) + checkElement.substring(13, 17);
        }
    }else if(str.search('C') == 0){
        if(checkElement.length == 16){
            checkElement = checkElement.substring(0, 10) + '    ' + checkElement.substring(10, 16);
        }
    }else if(str.search('H') == 0){
        checkElement = checkElement.substring(0 , 1) + checkElement.substring(6 , 9) + checkElement.substring(11 , 13) + checkElement.substring(3 , 6) + checkElement.substring(1 , 3) + checkElement.substring(9 , 11);
    }else if(str.search('M') == 0 || str.search('U') == 0){
        if(checkElement.length == 17){
            checkElement = checkElement.substring(0, 13) + '  ' + checkElement.substring(13, 17);
        }
    }else if(str.search('W') == 0){
        checkElement = checkElement.substring(0, 1) + checkElement.substring(4, 7) + checkElement.substring(9, 11) + checkElement.substring(1, 4) + '  ' + checkElement.substring(7, 9) + checkElement.substring(11, 13);
    }else if(str.search('X') == 0){
        if(checkElement.length == 12){
            checkElement = checkElement.substring(0, 10) + '   ' + checkElement.substring(10, 12);
        }
    }
    return checkElement;
};


const convertValues = async (data) => {
    let valueString = '';
    const loopFunc = async () => {
        let columns = Object.keys(data[0]);
        await Promise.all(columns.map((element => {
            if (element == 'TNRlies' || element == 'TNRsort' || element == 'WK' || element == 'BEV' || element == 'Markt') {
                valueString = valueString + `,` + `'${data[0][element]}'`;
            } else {
                valueString = valueString + `,` + data[0][`${element}`];
            }
        })));
        return valueString;
    };
    await loopFunc();
    return valueString;
};

const changeToNum = (toBeNum) => {
    if(!toBeNum) return null;
    if(typeof toBeNum == "string"){
        if(toBeNum.length === 0) return null;
        const num = parseInt(toBeNum);
        if(isNaN(num)) return null;
        return num;
    }else if(typeof toBeNum == "number"){
        const num = parseInt(toBeNum);
        return num;
    }
    return null;
}

const convertToFixed = (num,decimalPlaces) =>{
    if(!isNaN(num)){
        return Number(num).toFixed(decimalPlaces);
    }
    return num;
}

module.exports = { convertToColumn, convertTNR, convertValues, changeToNum, convertToFixed };
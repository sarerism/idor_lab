const _ = require('lodash');

const updateErrorHandling = async (data) => {
    let updateArray = data.updateArray;
    let columnCount = data.columnCount;
    let errorObj = {err : false , errorMessage : 'no Error'};
    for (let index = 0; index   < updateArray.length; index++) {
        const element = updateArray[index];
        let keyLength = Object.keys(element).length;
        let keys = Object.keys(element);
        if(keyLength > columnCount.length){
            errorObj.err = true;
            let errIndex = index + 2;
            errorObj.errorMessage = `The column count does not match at line: ${errIndex}, Please check the file format`;
            break;
        }else if(keyLength < columnCount.length){
            for (let index = 0; index < columnCount.length; index++) {
                const elementKey = keys[index];
                let indexSearch = columnCount.indexOf(`${elementKey}`);
                let errIndex = index + 2;
                if(indexSearch < 0){
                    if(elementKey != undefined){
                        errorObj.err = true;
                        errorObj.errorMessage = `The column does not match the format at line: ${errIndex}, Please check the file format`;
                        break;
                    }
                }
            }
        }
    }
    return errorObj;
};

const spaltenErrorHandling = async (loopArray,checkArray,special) => {
    let loopArrayV2 = _.clone(loopArray);
    let errorAdd = '';
    if(special == 'prognoseTeileliste'){
        loopArrayV2.pop();
        errorAdd = '(TNR sort will be generated automaticly)\n';
    }
    let errInfoObj = {err : false ,message: '', errorType: '', requiredColumns: []};
    let objKeysArray = [];
    let requiredColumnString = ``;
    for (let index = 0; index < checkArray.length; index++) {
        const key = Object.keys(checkArray[index]);
        objKeysArray.push(key);
    }
    for (let index = 0; index < loopArrayV2.length; index++) {
        const element = loopArrayV2[index];
        requiredColumnString += `${element},\n`
    }
    for (let index = 0; index < objKeysArray.length; index++) {
        const keyElement = objKeysArray[index];
        if(keyElement.length != loopArrayV2.length){
            errInfoObj.err = true;
            errInfoObj.message = `Number of Columns does not match at line ${index+1}\nCheck the required Columns: ${errorAdd}\n\nRequired Columns:\n${requiredColumnString}`;
            errInfoObj.requiredColumns = requiredColumnString;
            break;
        }else{
            if(_.isEqual(keyElement,loopArrayV2)==false){
                let invalidColumnName = '';
                for (let index = 0; index < keyElement.length; index++) {
                    const keyName = keyElement[index];
                    const loopName = loopArrayV2[index];
                    if(keyName != loopName){
                        invalidColumnName = keyName;
                    }
                }
                errInfoObj.err = true;
                errInfoObj.message = `Column Name: "${invalidColumnName}" does not match with required Columns\nCheck the required Columns: ${errorAdd}\nRequired Columns:\n${requiredColumnString}`;
                errInfoObj.requiredColumns = requiredColumnString;
                break;
            }
        }
    }
    return errInfoObj;
    
}


module.exports = { updateErrorHandling, spaltenErrorHandling };
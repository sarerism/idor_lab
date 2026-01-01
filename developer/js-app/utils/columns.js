const spaltenCheck = async (loopArray, checkArray , spaltenNamen) => {
    let errInfoObj = {err : false ,message: '', errorType: '', requiredColumns: []};
    let missing = [];
    let extra = [];
    let missSpell = [];
    if(loopArray.length > spaltenNamen.length){
        for (let index = 0; index < loopArray.length; index++) {
            const element = loopArray[index];
            if(spaltenNamen.indexOf(element) < 0){
                missing.push(element);
            }
        }
        errInfoObj.err = true;
        errInfoObj.message = `${missing} is/are missing \n \n Columns needed: ${loopArray}`;
        errInfoObj.requiredColumns = loopArray;
    }else if(loopArray.length < spaltenNamen.length){
        for (let index = 0; index < spaltenNamen.length; index++) {
            const element = spaltenNamen[index];
            if(loopArray.indexOf(element) < 0){
                extra.push(element);
            }
            
        }
        errInfoObj.err = true;
        errInfoObj.message = `${extra} is/are extra \n \n Columns needed: ${loopArray}`;
        errInfoObj.requiredColumns = loopArray;
    }else if(loopArray.length == spaltenNamen.length){
        for (let index = 0; index < spaltenNamen.length; index++) {
            const element = spaltenNamen[index];
            if(loopArray.indexOf(element) < 0){
                missSpell.push(element);
            }
            
        }
        if(missSpell.length > 0){
            errInfoObj.err = true;
            errInfoObj.message = `${missSpell} do not exist (Check spelling) \n \n Columns needed: ${loopArray}`;
            errInfoObj.requiredColumns = loopArray;
        }
    }
    return errInfoObj;
};

async function includesSpaltenErrorHandling(loopArray, checkArray){
    let errInfoObj = {err : false ,message: '', errorType: '', requiredColumns: []};
    for (let index = 0; index < checkArray.length; index++) {
        const element = Object.keys(checkArray[index]);
        for (let index = 0; index < element.length; index++) {
            const el = element[index];
            if(loopArray.indexOf(el) < 0){
                errInfoObj.err = true;
                errInfoObj.message = `${el} was not found in the column Array, please check for uppercase/lowercase and spacing \n \n Columns needed: ${loopArray}`;
                errInfoObj.requiredColumns = loopArray;
                break;
            }
        }
    }
    return errInfoObj;
}

async function requiredColumns(requiredArray, givenArray){
    let errInfoObj = {err : false ,message: '', errorType: '', requiredColumns: []};
    for (let index = 0; index < requiredArray.length; index++) {
        const el = requiredArray[index];
        if(givenArray.indexOf(el) < 0){
            errInfoObj.err = true;
            errInfoObj.message = `${el} was not found in the column Array, please check for uppercase/lowercase and spacing \n \n Columns needed: ${requiredArray}`;
            errInfoObj.requiredColumns = requiredArray;
            break;
        }
    }
    return errInfoObj;
}


module.exports = { spaltenCheck, includesSpaltenErrorHandling, requiredColumns };
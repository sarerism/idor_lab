const FileInputError = require("../classes/FileInputError");

module.exports = (loopArray, checkArray , spaltenNamen) =>{
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
        throw new FileInputError(errInfoObj.message,"column");
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
        throw new FileInputError(errInfoObj.message,"column");
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
            throw new FileInputError(errInfoObj.message,"column");
        }
    }
} 
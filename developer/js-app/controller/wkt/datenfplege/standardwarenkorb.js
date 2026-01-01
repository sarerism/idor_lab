const { PKW_LOOP_ARRAY, EQ_LOOP_ARRAY, OTHER_LOOP_ARRAY } = require("../../../constants/spaltenCheck");
const { includesSpaltenErrorHandling } = require("../../../utils/columns");

const importStandartWK = async (req,res) => {
    // TODO: Trennen für PKW EQ und Rest

    // TODO: Check if paramas set
    let dataArray = req.body.eintraege;
    const { sparte } = req.body;
    
    let loopArray = [];
    
    if(sparte === 'PKW'){
        loopArray = PKW_LOOP_ARRAY;
    }else if(sparte === 'EQ'){
        console.log('here')
        loopArray = EQ_LOOP_ARRAY;
    }else{
        loopArray = OTHER_LOOP_ARRAY;
    }

    let endquery = '';
    let errorObj  = await includesSpaltenErrorHandling(loopArray,dataArray);
    if(errorObj.err == true){
        return res.status(200).json(errorObj);
    }else{
        const pool = req.app.locals.postgresSQL;
        let tempQuery = '';
        await pool.
            query(`DELETE FROM lampa.lampa_standartwarenkorb WHERE "Sparte" = '${req.body.sparte}';`);

        Promise.all(dataArray.map((element, longIndex) => {
            tempQuery = '';
                for (let index = 0; index < loopArray.length; index++) {
                    const el = loopArray[index];
                    if(typeof element[`${el}`] == 'undefined'){
                        element[`${el}`] = null;
                    }
                    if(typeof element[`${el}`] == 'string'){
                        element[`${el}`] = `'${element[`${el}`]}'`;
                    }
                    if(index == loopArray.length-1 && longIndex == dataArray.length -1){
                        tempQuery += `${element[`${el}`]},'${req.body.sparte}')`;
                        endquery += tempQuery;
                    }else if(index == loopArray.length-1){
                        tempQuery += `${element[`${el}`]},'${req.body.sparte}');\n`;
                        endquery += tempQuery;
                    }else if(index == 0){
                        const quoteValeues = loopArray.map(value => `"${value}"`);
                        tempQuery += `INSERT INTO lampa.lampa_standartwarenkorb (${quoteValeues.join(', ')}, "Sparte")  VALUES (${element[`${el}`]},`;
                    }else{
                        tempQuery += `${element[`${el}`]},`;
                    }
                }
        }));
        const result = await pool.query(`${endquery}`);

        res.status(200).json({err : false,data : result , rowsAffected : result.rowCount});
    }
};

module.exports = { importStandartWK };
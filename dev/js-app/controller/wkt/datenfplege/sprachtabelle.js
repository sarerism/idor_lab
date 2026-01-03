const { spaltenCheck } = require("../../../utils/columns");

const importSprachtabelle = async (req,res) => {
    /**Error Handling + Delete Query / noch hinzufügen */
    let spaltenNamen = req.body.spalten;
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Feldinhalt',
        'Quelle',
        'Feldname der Quelle',
        'Deutsch',
        'Englisch',
        'Franzoesisch'
      ];
    let endquery = '';
    let tempQuery = '';
    let errorObj = await spaltenCheck(loopArray,dataArray,spaltenNamen);
    if(errorObj.err == true){
        return res.status(200).json(errorObj);
    }else{
        const pool = req.app.locals.postgresSQL;
        await pool.query(`DELETE FROM lampa.lampa_sprachtabelle_warenkorb WHERE "Feldinhalt" is not null;`);

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
                    tempQuery += `INSERT INTO lampa.lampa_sprachtabelle_warenkorb VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }
        }));

        const result = await pool.query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowCount});
    }
};

const exportSprachtabelle = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT * FROM lampa.lampa_sprachtabelle_warenkorb`);
    res.status(200).json({err : false, returnData : result.rows});
};


module.exports = { importSprachtabelle, exportSprachtabelle };
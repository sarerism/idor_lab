const { spaltenCheck } = require("../../../utils/columns");

const importTermID = async (req,res) => {
    let spaltenNamen = req.body.spalten;
    let errArray = [];
    let dataArray = req.body.eintraege; 
    //Nach Ergänzung Fachkonzept geändert
    let loopArray = [
        'Modul',             'WK Pos Proposal',        'Benennung Deutsch',         'Benennung Englisch',
        'TermID',            'WK',                     'TUDI',                      'USA_Prio',                  
        'USA_QTY_N',         'USA_QTY_V',              'SUP_QTY_LOW',               'SUP_QTY_HIGH',      
        'SUP_Package',       'Anmerkung ECE',          'China ID',                  'ISO Qty China'
    ];
    if(req.body.sparte == 'PKW_Motor_Benzin' || req.body.sparte == 'PKW_Motor_Diesel'){
        errArray = [
            'Modul',            'WK Pos Proposal',
            'Benennung Deutsch','Benennung Englisch',
            'TermID',           'WK',
            'Folie WK',         'Bild Nr WK',
            'Slide',            'Picture',
            'Prio',             'QTY',
            'Small Pkg',        'Large Pkg',
            'Package No',       'Anmerkung ECE',
            'Anmerkung USA'
        ];
    }else{ 
        errArray = loopArray;
    }
    let errorObj  = await spaltenCheck(errArray,dataArray,spaltenNamen);
    if(errorObj.err == true){
        return res.status(200).json(errorObj);
    }else{
        /**Error Handling + Delete Query + Sparte / noch hinzufügen */
        let endquery = '';
        let tempQuery = '';
        const pool = req.app.locals.postgresSQL;
        await pool.query(`DELETE FROM lampa."lampa_termIDs" WHERE "Sparte" = '${req.body.sparte}';`);
        
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
                if(element[`${el}`] == undefined){
                    element[`${el}`] = null;
                }
                if((typeof element[`${el}`] == 'number' && index === 1) || (typeof element[`${el}`] == 'string' && element[`${el}`] != "''")){
                    element[`${el}`] = `'${element[`${el}`]}'`;
                }
                element['Benennung Deutsch'] = `${element[`Benennung Deutsch`]}`; 
                element['Benennung Englisch'] = `${element[`Benennung Englisch`]}`;
                if(index == 15 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]},'${req.body.sparte}')`;
                    endquery += tempQuery;
                }else if(index == 15){
                    tempQuery += `${element[`${el}`]},'${req.body.sparte}');`;
                    endquery += tempQuery;
                }else if(index == 0){
                    //TODO: Verbessern, ist Mist, aber ohne funktioniert es nicht
                    tempQuery += `INSERT INTO lampa."lampa_termIDs"(
                        "Modul","WK_Pos_Proposal","Bennenung_Deutsch",
                        "Bennenung_Englisch","TermID","WK","TUDI","USA_Prio",
                        "USA_QTY_N","USA_QTY_V","SUP_QTY_LOW","SUP_QTY_HIGH",
                        "SUP_Package","Anmerkung_ECE","China ID",
                        "ISO Qty China","Sparte"
                    ) VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }
        }));
        const result = await pool.query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowCount});
    }
};

const exportTermID = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT * FROM lampa."lampa_termIDs" WHERE "Sparte" = '${req.body.sparte}'`);
    res.status(200).json({err : false, returnData : result.rows});
};

module.exports = { importTermID, exportTermID };
const { spaltenCheck } = require("../../../utils/columns");

const importWKParameter = async (req,res) => {
    /**Check column length */
    let spaltenNamen = req.body.spalten;
    let dataArray = req.body.eintraege;
    let loopArray = [
        'Push-Markt',       'V1',
        'V2',               'V3',
        '1. Titel V1',      '2. Titel V1',
        '3. Titel V1',      '4. Titel V1',
        '5. Titel V1',      'Kennung V1',
        'Kennung V2-V3',    'Sprache Benennung',
        'Sprache Titel WK', 'PKW',
        'Van',        
        'PKW Motor Benzin', 'PKW Motor Diesel',
        'EQ',
        'Lenkung',          'BEV A',
        'BEV B',            'BEV C', 'BEV D'
      ];
    let errorObj = await spaltenCheck(loopArray,dataArray,spaltenNamen);
    if(errorObj.err == true){
        return res.status(200).json(errorObj);
    }else{
        const pool = req.app.locals.postgresSQL;
        await pool.query(`DELETE FROM lampa.lampa_warenkorbparameter WHERE "Push-Markt" is not null;`);
        
        let endquery = '';
        let tempQuery = '';
        Promise.all(dataArray.map((element, longIndex) => {
            tempQuery = '';
            if(Object.keys(element).length == 22){
                console.log(Object.keys(element));
            }
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
                if(typeof element[`${el}`] == 'string'){
                    element[`${el}`] = `'${element[`${el}`]}'`;
                } 
                if(element[`${el}`] == undefined){
                    element[`${el}`] = "''";
                }
                if(index == 22 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 22){
                    tempQuery += `${element[`${el}`]}),`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }
        }));
        endquery = `INSERT INTO lampa.lampa_warenkorbparameter ("Push-Markt",
            "V1",
            "V2",
            "V3",
            "1._Titel_V1",
            "2._Titel_V1",
            "3._Titel_V1",
            "4._Titel_V1",
            "5._Titel_V1",
            "Kennung_V1",
            "Kennung_V2-V3",
            "Sprache_Bennenung",
            "Sprache_Titel_WK",
            "PKW",
            "Van",
            "PKW_Motor_Benzin",
            "PKW_Motor_Diesel",
            "EQ",
            "Lenkung",
            "BEV_A",
            "BEV_B",
            "BEV_C",
            "BEV_D") VALUES ${endquery};`;

        const result = await pool.query(`${endquery}`);
        res.status(200).json({err : false, rowsAffected : result.rowCount});
    }
};

const exportWkParameter = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT * FROM lampa.lampa_warenkorbparameter`);

    res.status(200).json({err : false, returnData : result.rows});
};

module.exports = { importWKParameter, exportWkParameter };
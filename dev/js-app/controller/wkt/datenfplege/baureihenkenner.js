const getBaureihenkenner = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    let baureihenkennerArray = [];
    const result = await pool.
        query(`SELECT * FROM lampa.lampa_baureihenkenner;`);
    baureihenkennerArray = await baureihenkennerArraySelect(result.rows);
    res.status(200).json({err : false,data : result.rows, selectData : baureihenkennerArray});
};

const updateBaureihenkenner = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    await pool.query(`DELETE FROM lampa.lampa_baureihenkenner WHERE "Fahrzeug" is not null;`);

    let dataArray = req.body.eintraege;
    let loopArray = [
        'Fahrzeug',
        'BR_Kenner_1',
        'BR_Kenner_2',
        'BR_Kenner_3',
        'BR_Kenner_4'
        
      ];
    let endquery = '';
    let tempQuery = '';
    Promise.all(dataArray.map((element, longIndex) => {
        tempQuery = '';
        for (let index = 0; index < loopArray.length; index++) {
            const el = loopArray[index];
            if(typeof element[`${el}`] == 'undefined'){
                element[`${el}`] = "''";
            }
            if(typeof element[`${el}`] == 'string' && element[`${el}`] != "''"){
                element[`${el}`] = `'${element[`${el}`]}'`;
            }
            if(index == 4 && longIndex == dataArray.length -1){
                tempQuery += `${element[`${el}`]})`;
                endquery += tempQuery;
            }else if(index == 4){
                tempQuery += `${element[`${el}`]});`;
                endquery += tempQuery;
            }else if(index == 0){
                tempQuery += `INSERT INTO lampa.lampa_baureihenkenner VALUES(${element[`${el}`]},`;
            }else{
                tempQuery += `${element[`${el}`]},`;
            }
        }
    }));
    const result = await pool.query(`${endquery}`);

    res.status(200).json({err : false, rowsAffected : result.rowCount});
};

// TODO: move to service 
async function baureihenkennerArraySelect(data){
    let bArray = data;
    let stringifiedArray = [];
    let str = '';
    const ganseFuschen = new RegExp('"', "g");
    Promise.all(bArray.map((element) => {
        str = JSON.stringify(element);
        str = str.replace(/}([^}]*)$/, '$1');
        str = str.replace(/{([^{]*)$/, '$1');
        str = str.replace(ganseFuschen,' ');
        stringifiedArray.push(str);
    }));
    return stringifiedArray;
}

module.exports = { getBaureihenkenner, updateBaureihenkenner };
const xlsx = require('xlsx');

const importLangeBezeichnung = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    let jsonData = [];
    if(process.env.LOCAL_DEVELOPMENT){
        const xlsxFile = req.file;
        const workbook = xlsx.read(xlsxFile.buffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = xlsx.utils.sheet_to_json(worksheet);   
    }else{
        jsonData = req.body.jsonData;
    }
    console.log(jsonData.length);
    if(jsonData.length === 0) return res.status(400).json({err : true, message : "Datei besitzt keine Einträge"});
    try {
        await pool.query('BEGIN');

        await pool.query('DELETE FROM lampa.lampa_lange_bezeichnungen');

        console.log('Mapping');
        const insertQueries = jsonData.map((row,index) => {
            return `('${row["MATNR_SORT"] ? escapeSingleQuotes(row["MATNR_SORT"]) : '' }','${row["Benennung DE"] ? escapeSingleQuotes(row["Benennung DE"]) : ''}','${row["Benennung EN"] ? escapeSingleQuotes(row["Benennung EN"]) : ''}')`;
        });

        const insertQuery = `INSERT INTO lampa.lampa_lange_bezeichnungen ("MATNR_SORT", "Benennung_DE", "Benennung_EN") VALUES ${insertQueries}`;

        console.log('Inserting')
        await pool.query(insertQuery);
        
        
        // for (const query of insertQueries) {
        //     console.log('inserting')
        //     await pool.query(query);
        // }

        await pool.query('COMMIT');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error inserting data:', error);
        return res.status(400).json({ err: true, message: "Error inserting data" });
    }
    console.log('Finished')
    return res.status(200).json({ err: false, message: "Success!" });
};

function escapeSingleQuotes(inputString) {
    return inputString.replace(/'/g, "''");
  }
  

module.exports = { importLangeBezeichnung };
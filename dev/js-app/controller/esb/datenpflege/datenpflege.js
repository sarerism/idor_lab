const { updateErrorHandling, spaltenErrorHandling } = require("../../../functions/errorHandling");

class ResponseData{
    constructor(isError,msg,data){
        this.isError = isError;
        this.msg = msg;
        this.data = data;
    }
}

class ColumnCompare{
    constructor(columns,dataTable,expections){
        this.columns = columns;
        this.dataTable = dataTable;
        this.expections = expections;
        if(expections != null){
            this.addToColumns();
        }
    }

    addToColumns(){
        this.columns.push(this.expections);
    }
    
}

async function compareColumns(data, pool){
    let recievedColumns = [];
    const columnsToCompare = data.columns;
    const dataTable = data.dataTable;
    console.log('here')
    try{
        const result =  await pool
            .query(`SELECT column_name
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = $1 `,[dataTable])
            result.rows.forEach((item) => {
                recievedColumns.push(item['column_name'])
            })
            console.log(recievedColumns, columnsToCompare)
            const diff = recievedColumns.filter(e => !columnsToCompare.includes(e))
            if(diff.length > 0){
                /* Columns are not the same! */
                return false;
            }else{
                /* Columns are the same! */
                return true;
            }
    }catch(err){
        return false;
    }
}

const updateKundenParameter = async (req,res) => {
    const pool = req.app.locals.postgresSQL;

    let dataArray = req.body;
    let endquery = "";
    let tempQuery = "";
    let loopArray = [
        'KDNR',            'ZUORDNUNG',
        'LAND',            'BESTELLER',
        'SPARTE',          'BRANCH',
        'SPRACHE',         'SPRACHE_CODE',
        'WAEHRUNG',        'WAEHRUNG_FAKTOR',
        'AUFTRAGSTYP',     'AUFTRAGGEBER',
        'Satzart',         'VERTRIEBSWEG',
        'REGELKRITERIUM1', 'WHS_BERECHNEN',
        'LAENDERCODE', 'Lokation_SPM',
        'Sales Org ID', 'Warehouse ID', 'Praefix Lieferwerk'
      ];
    let infoObject = {updateArray : dataArray, columnCount : loopArray};
    let errorObject = await updateErrorHandling(infoObject);
    if(errorObject.err == true){
        return res.status(200).json({err : true, errorMessage : errorObject.errorMessage});
    }else{
        Promise.all(dataArray.map(async (element, longIndex) => {
            tempQuery = '';
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
                if(typeof element[`${el}`] == 'string'){
                    element[`${el}`] = `'${element[`${el}`]}'`;
                }
                if(element[`${el}`] == undefined){
                    element[`${el}`] = "''";
                }

                if(el === 'Sales Org ID' || el === 'Warehouse ID'){
                    if(element[`${el}`] === "''"){
                        element[`${el}`] = 0;
                    }
                }
                if(index == 20 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 20){
                    tempQuery += `${element[`${el}`]}),`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
                
            }
    
        }));
        await pool.query(`DELETE FROM lampa."lampa_ESB_Kundenparameter" WHERE "KDNR" is not null;`);
        endquery = `INSERT INTO lampa."lampa_ESB_Kundenparameter" ("KDNR","ZUORDNUNG","LAND","BESTELLER","SPARTE","BRANCH","SPRACHE","SPRACHE_CODE","WAEHRUNG","WAEHRUNG_FAKTOR","AUFTRAGSTYP","AUFTRAGGEBER","Satzart","VERTRIEBSWEG","REGELKRITERIUM1","WHS_BERECHNEN", "LAENDERCODE", "Lokation_SPM","Sales Org ID", "Warehouse ID","Praefix Lieferwerk") 
        VALUES ${endquery}`;
        console.log(endquery)
        const result = await pool.query(`${endquery}`);
        return res.status(200).json({err : false, rowsAffected : result.rowCount});
    } 
};

const updateMatrix = async (req,res) => {
    const pool = req.app.locals.postgresSQL;

    let dataArray = req.body;
    let loopArray = [
        'ID'
        ,'SPARTE'
        ,'VERFAHREN'
        ,'MARKT'
        ,'TBLNAME_PUSHMATRIX'
        ,'TBLNAME_WARENKORB'
        ,'VFNR_FILL_PUSHMATRIX'
        ,'MENGENSPALTEN_WARENKORB'
        ,'QRYNAME_RETAIL_OHNE_LIEFERLC'
        ,'OPTIONGRP_VOLUMEN_NISCHE'
        ,'TEILEANLAGE'
        ,'OFFENE_BESTELLUNG'
        ,'NAME_TEILEANLAGE'
        ,'NAME_OFFENE_BEST'
        ,'KDNR_ADDON'
        ,'DIMS'
        ,'Push'
        ,'SPM'
        ,'SPM_Asia'
      ];
    let endquery = ''; 
    let tempQuery = '';
    let infoObject = {updateArray : dataArray, columnCount : loopArray}
    let errorObject = await updateErrorHandling(infoObject);
    if(errorObject.err == true){
        return res.status(200).json({err : true, errorMessage : errorObject.errorMessage});
    }else{
        Promise.all(dataArray.map(async (element, longIndex) => {
            tempQuery = '';
            for (let index = 0; index < loopArray.length; index++) {
                const el = loopArray[index];
                 if(typeof element[`${el}`] == 'string'){
                     element[`${el}`] = `'${element[`${el}`]}'`;
                 } 
                 if(element[`${el}`] == undefined){
                     element[`${el}`] = null;
                 }
                 if(index == 18 && longIndex == dataArray.length -1){
                     tempQuery += `${element[`${el}`]})`;
                     endquery += tempQuery;
                 }else if(index == 18){
                     tempQuery += `${element[`${el}`]}),`;
                     endquery += tempQuery;
                 }else if(index == 0){
                     tempQuery += `(${element[`${el}`]},`;
                 }else{
                     tempQuery += `${element[`${el}`]},`;
                 }
                
            }
     
         }));
        await pool.query(`DELETE FROM lampa."lampa_ESB_matrix" WHERE "ID" is not null;`);
        endquery = `INSERT INTO lampa."lampa_ESB_matrix" (
             "ID"
             ,"SPARTE"
             ,"VERFAHREN"
             ,"MARKT"
             ,"TBLNAME_PUSHMATRIX"
             ,"TBLNAME_WARENKORB"
             ,"VFNR_FILL_PUSHMATRIX"
             ,"MENGENSPALTEN_WARENKORB"
             ,"QRYNAME_RETAIL_OHNE_LIEFERLC"
             ,"OPTIONGRP_VOLUMEN_NISCHE"
             ,"TEILEANLAGE"
             ,"OFFENE_BESTELLUNG"
             ,"NAME_TEILEANLAGE"
             ,"NAME_OFFENE_BEST"
             ,"KDNR_ADDON"
             ,"DIMS"
             ,"Push"
             ,"SPM"
             ,"SPM_Asia"
             ) VALUES ${endquery}`;
        const result = await pool.query(`${endquery}`);
        return res.status(200).json({err : false, rowsAffected : result.rowCount});
    }
};


const importELC = async (req,res) => {
    const pool = req.app.locals.postgresSQL;

    let dataArray = req.body.eintraege;
    let loopArray = ['Betrieb','ELC'];
    let endquery = '';
    let tempQuery = '';
    let errInfoObj = spaltenErrorHandling(loopArray,dataArray);
    if(errInfoObj.err == true){
        return res.status(200).json(errInfoObj);
    }else{
        await Promise.all(dataArray.map(async (element, longIndex) => {
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
                if(index == 1 && longIndex == dataArray.length -1){
                    tempQuery += `${element[`${el}`]})`;
                    endquery += tempQuery;
                }else if(index == 1){
                    tempQuery += `${element[`${el}`]}) \n;`;
                    endquery += tempQuery;
                }else if(index == 0){
                    tempQuery += `INSERT INTO lampa."lampa_ELC_Zugehoerigkeit" VALUES(${element[`${el}`]},`;
                }else{
                    tempQuery += `${element[`${el}`]},`;
                }
            }

        }));

        await pool.query(`DELETE FROM lampa."lampa_ELC_Zugehoerigkeit" WHERE "ELC" is not null`);

        const result = await pool.query(`${endquery}`);
        return res.status(200).json({err : false, rowsAffected : result.length});
    }
};

const exportELC = async (req,res) => {
    const pool = req.app.locals.postgresSQL;

    let endquery = 'SELECT * FROM lampa."lampa_ELC_Zugehoerigkeit"';
    const result = await pool.query(`${endquery}`);

    return res.status(200).json({parameter : result.rows, err : false});
};

const getMatrixData = async (req,res,next) => {
    const pool = req.app.locals.postgresSQL;

    const sparte = req.body.sparte;
    const result = await pool.query(`SELECT DISTINCT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "SPARTE" = '${sparte}';`);
    
    // NOTE: resulsts needs to be in an other Array becuase MSSQL previously deliverd [rows:[]]
    return res.status(200).json({ status: 'Succes!', results: [result.rows] });
};

const importParameterAsia = async (req,res,next) => {
    const pool = req.app.locals.postgresSQL;

    const parameterData = req.body.parameter;
    /* Datei prüfung */
    console.log('here')
    const columns = new ColumnCompare(Object.keys(parameterData[0]),'lampa_parameter_asia','Id');
    if(!await compareColumns(columns,pool)){
        return res.status(400).json(new ResponseData(true,'Columns are not the same',null));
    }else{
        /* Error Handling */
        if(parameterData.length == 0){
            return res.status(404).json(new ResponseData(true,'No data found, please Check worksheet!',null));
        }else{
            /* Table Delete */
            try {
                await pool.query(`DELETE FROM lampa."lampa_parameter_asia" WHERE "Id" is not null`);
                /* Insert */
                parameterData.forEach(async item => {
                    let values = [
                            item['Land'],                   item['Purch. Organization'],
                            item['Purchasing Group'],       item['Company Code'],
                            item['Vendor'],                 item['Plant'],
                            item['Purchasing Doc. Type'],   item['Customer Code1'],
                            item['Customer Code2'],         item['Storage Location'],
                            item['Stock type']
                        ];
                        let query = `INSERT INTO lampa."lampa_parameter_asia"  
                        ("Land","Purch. Organization","Purchasing Group","Company Code","Vendor","Plant","Purchasing Doc. Type","Customer Code1","Customer Code2","Storage Location","Stock type") 
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
                        await pool.query(query, values);
                        (err, result) => {
                            if (err) {
                                console.log(err);
                                res.status(400).json(new ResponseData(true,'Query failed!',null));
                            }
                        }
                });
                return res.status(200).json(new ResponseData(false,'Data was Inserted!',null));
            } catch (err) {
                console.log(err)
                res.status(400).json(new ResponseData(true,'Query failed!',null));
            }
        }
    }
};

const getCountryData = async (req,res) => {
    console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Recieved Request');
    const pool = req.app.locals.postgresSQL;
    const queries = [`SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Retail%' AND "SPARTE" = 'PKW MB' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Retail%' AND "SPARTE" = 'PKW smart' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Retail%' AND "SPARTE" = 'Aggregate' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Retail%' AND "SPARTE" = 'Van' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Retail%' AND "SPARTE" = 'Truck' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT Like '%Retail%' AND "SPARTE" = 'PKW MB' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT Like '%Retail%' AND "SPARTE" = 'PKW smart' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT Like '%Retail%' AND "SPARTE" = 'Aggregate' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT Like '%Retail%' AND "SPARTE" = 'Van' ORDER BY "MARKT" ASC`,
    `SELECT "MARKT" FROM lampa."lampa_ESB_matrix" WHERE "VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT Like '%Retail%' AND "SPARTE" = 'Truck' ORDER BY "MARKT" ASC`];
    const arr = [];
    for (const query of queries) {
        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Starting DB Query');
        const result = await pool
        .query(query);
        console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Finished DB Query');
        arr.push(result.rows);   
    }
    console.log(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) , ' Finished Request');
    return res.status(200).json({ status: 'Succes!', resulst: arr });
};


// NOTE: Needs ESB Import data to work 
const newExportForecast = async (req,res,next) => {
    
};

module.exports = { updateKundenParameter, updateMatrix, importELC, exportELC, getMatrixData, newExportForecast, importParameterAsia, getCountryData, ResponseData };
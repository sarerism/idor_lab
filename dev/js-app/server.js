/**
 * Const and modules 
 */
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require("cors");
const compression = require('compression');
var cookieParser = require('cookie-parser');
let _ = require('lodash');
const xlsx = require('xlsx');
const errorHandler = require('./middleware/errorHandler');
const { requireAuth, handleLogin, handleLogout } = require('./middleware/auth');
require('dotenv').config();
const port = process.env.APP_PORT || 443;

const pg = require('pg').Pool;

const types = require('pg').types;
types.setTypeParser(types.builtins.INT8,(val) => { return parseFloat(val)});
  
// Test

const corsOptions = {
    origin: ['*', 'https://lampa-test.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'https://lampa-dev.dhcpaas-apps-p03-edc5.dhc.corpintra.net', 'http://localhost:4200','http://127.0.0.1:8082','https://app-lampa-dev-container.azurewebsites.net'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', "Cookie", "Set-Cookie", "X-Forwarded-Proto"],
    method: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    optionsSuccessStatus: 200
};

const startServer = () => {
    /**
    * Server setup
    */
    app.use(cookieParser());
    app.use(express.static(process.cwd() + "/", {
        dotfiles: 'ignore',  // Don't serve dotfiles
      }));
    app.use(compression());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '100mb', extended: true }));
    app.use(bodyParser.urlencoded({ limit: '100mb', extended: true,parameterLimit:50000 }));
    app.use(express.json({limit: '100mb'}));

    app.listen(port, async () => {
        console.log("Listening to port: " + port);
        const postgresSQL = new pg({
            host: process.env.POSTGRES_HOST,
            port:  parseInt(process.env.POSTGRES_PORT),
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PW,
            ssl: process.env.LOCAL_DEVELOPMENT ? null : { mode: 'prefer' },
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
            idleTimeoutMillis: 0
        });
        app.locals.postgresSQL = postgresSQL;
    });

    app.use((req, res, next) => {
        if (req.url.startsWith('/.git')) {
          res.status(403).send('Access Forbidden');
        } else {
          next();
        }
    });

    /**
     * Authentication routes
     */
    app.get('/login', (req, res) => {
        res.sendFile(__dirname + '/login.html');
    });

    app.post('/api/login', handleLogin);
    
    app.get('/logout', handleLogout);

    /**
     * Protected routes - require authentication
     */
    app.get('/', requireAuth, (req, res) => {
        res.status(200).json({ 
            message: "LAMPA REST API Service", 
            status: "running",
            version: "1.0.0",
            user: req.user ? req.user.username : 'guest'
        });
    });

    // TODO: Needs to be migrated ESB

    app.post('/newExportForecast',async (req,res) => {
        console.table(req.body);
        let maerkte = req.body;
        let recievedDataArrays = [];
        let maerkteLoop = [];
        for (let index = 0; index < maerkte.length; index++) {
            const element = maerkte[index];
            maerkteLoop.push(element['MARKT']);
        }
        let recievedData = [];
        for (let index = 0; index < maerkte.length; index++) {
            let markt = maerkte[index];
            let query = `SELECT DISTINCT KDNR FROM lampa_ESB_Kundenparameter WHERE Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}'`;
            try {
                const pool =  await poolPromise
                const result = await  pool.request()
                    .query(query);
                    let locations = result.recordset;
                    let kdnr;
                    if(result.recordset.length != 0){
                        kdnr = result.recordset[0]['KDNR'];
                    }
                    let warenkorbQuery = '';
                    if(markt['Volumen'] == true || markt['Nische'] == true){
                        warenkorbQuery = `SELECT Location_${kdnr}, TNRlies,TNRsort, Menge AS MENGE ,WK, BEV,TNRlies AS PRODUKTID FROM lampa_warenkorb WHERE Land='${markt['MARKT']}' AND Sparte = '${markt['sparte']}' AND Verfahren = 'Wholesale & Retail'`;
                    }else if(markt['Keine_Berechnung'] == true || markt['Wholesale'] == true){
                        if(markt['MARKT'].search('Zusatz') < 0){
                            warenkorbQuery = `SELECT Menge AS MENGE,TNRlies, TNRsort, WK,BEV,TNRlies AS PRODUKTID FROM lampa_warenkorb WHERE  Land='${markt['MARKT']}' AND Sparte = '${markt['sparte']}' AND Verfahren = 'Wholesale only'`;
                        }else{
                            warenkorbQuery = `SELECT Menge AS MENGE,TNRlies, TNRsort, WK,BEV,TNRlies AS PRODUKTID FROM lampa_warenkorb WHERE  Land='${markt['MARKT']}' AND Sparte = 'Zusatz' AND Verfahren = 'Wholesale only'`;
                        }
                        
                    }
                    try {
                        const pool =  await poolPromise
                        const result = await  pool.request()
                            .query(warenkorbQuery);
                            if(markt['Keine_Berechnung'] == true){
                                console.log('Keine Berechnung');
                            }else if(markt['Wholesale'] == true){
                                if(markt['MARKT'] == "Deutschland" || markt['MARKT'] == "Frankreich"){
                                    let locationString = '';
                                    let queryStringDE = '';
                                    for (let index = 0; index < locations.length; index++) {
                                        const loc = locations[index];
                                        locationString += `Location_${loc.KDNR}, `;
                                    }
                                    queryStringDE = `SELECT ${locationString} TNRlies, TNRsort FROM lampa_warenkorb WHERE Land='${markt['MARKT']}' AND Verfahren = 'Wholesale only' AND Sparte = '${markt['sparte']}'`;
                                    try {
                                        const pool =  await poolPromise
                                        const result =  await pool.request()
                                            .query(queryStringDE);
                                            for (let index = 0; index < result.recordset.length; index++) {
                                                let element =  result.recordset[index];
                                                let obj = {};
                                                let mengenValue = 0;
                                                obj.TNRsort = element['TNRsort'];
                                                obj.TNRlies = element['TNRlies'];
                                                for (let index = 0; index < locations.length; index++) {
                                                    const loc = locations[index];
                                                    let locationString = `Location_${loc.KDNR}`;
                                                    mengenValue += element[`${locationString}`];
                                                }
                                                if(markt['MARKT'] == 'Deutschland'){
                                                    obj['Deutschland'] = mengenValue;
                                                }else if(markt['MARKT'] == 'Frankreich'){
                                                    obj['Frankreich'] = mengenValue;
                                                }
                                                for (let index = 0; index < maerkteLoop.length; index++) {
                                                    let marktElement = maerkteLoop[index];
                                                    if(marktElement != 'Deutschland' && marktElement != 'Frankreich'){
                                                        obj[marktElement] = '';
                                                    }
                                                }
                                                recievedDataArrays.push(obj);
                                            }
                                    } catch (error) {
                                        console.log(error);
                                    }
                                }else{
                                    for (let index = 0; index < result.recordset.length; index++) {
                                        let element =  result.recordset[index];
                                        let obj = {};
                                        for (let index = 0; index < maerkteLoop.length; index++) {
                                            let marktElement = maerkteLoop[index];
                                            obj.TNRsort = element['TNRsort'];
                                            obj.TNRlies = element['TNRlies'];
                                            if(marktElement == markt['MARKT']){
                                                obj[markt['MARKT']] = element['MENGE'];
                                            }else{
                                                obj[marktElement] = '';
                                            }
                                            
                                        }
                                        recievedDataArrays.push(obj);
                                    }
                                }
                            }else if(markt['Volumen'] == true || markt['Nische'] == true){
                                        let recievedData = result.recordset;
                                        let Land = markt['MARKT'];
                                        let from_var;
                                    
                                        const wholeSaleLoop = async () => {
                                            await Promise.all(recievedData.map(async (element)=>{
                                            
                                            const loopMengen = async () => {
                                                if(Land == 'Deutschland' || Land == 'Frankreich'){
                                                    let tnrlies = element['PRODUKTID'];
                                                    if(element['MENGE'] == null || element['MENGE'] == 0 || element['MENGE'] == '0' || element['MENGE'] == 'null'){ 
                                                        let sqlQueryMenge = ``;
                                                        let locationString = '';
                                                        for (let index = 0; index < locations.length; index++) {
                                                            const loc = locations[index];
                                                            locationString += `,Location_${loc['KDNR']}`;
                                                        }
                                                        locationString = locationString.replace(',','');
                                                        sqlQueryMenge = `SELECT ${locationString} FROM lampa_warenkorb WHERE TNRlies = '${tnrlies}' AND Land = '${Land}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail'`;
                                                        if(Land == 'Deutschland' && markt['sparte'] == 'PKW smart'){
                                                            sqlQueryMenge = `SELECT Location_26005,Location_26105,Location_26205,Location_26305,Location_26405 FROM lampa_warenkorb WHERE TNRlies = '${tnrlies}' AND Land = '${Land}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale only'`
                                                        }
                                                        try{
                                                            const pool = await poolPromise;
                                                            const result = await pool.request().
                                                                query(sqlQueryMenge);
                                                                for (let index = 0; index < Object.keys(result.recordset[0]).length; index++) {
                                                                    const el = Object.keys(result.recordset[0])[index];
                                                                    element['MENGE'] += result.recordset[0][`${el}`];
                                                                }
                                                                console.log(element['TNRlies'] + ` ${Land}`);
                                                                console.log(element['MENGE']);
                                                        }catch(err){
                                                            res.status(500);
                                                        } 
                                                    }
                                                }else{
                                                    let tnrlies = element['PRODUKTID'];
                                                    if(element['MENGE'] == null || element['MENGE'] == 0 || element['MENGE'] == '0' || element['MENGE'] == 'null'){ 
                                                        let sqlQueryMenge = ``;
                                                        sqlQueryMenge = `SELECT Location_${kdnr} FROM lampa_warenkorb WHERE TNRlies = '${tnrlies}' AND Land = '${Land}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail'`;
                                                        try{
                                                            const pool = await poolPromise;
                                                            const result = await pool.request().
                                                                query(sqlQueryMenge);
                                                                element['MENGE'] = result.recordset[0][`Location_${kdnr}`];
                                                        }catch(err){
                                                            res.status(500);
                                                        } 
                                                    }
                                                }
                                            
                                        }
                                            await loopMengen();
                                            let WK = element.WK;
                                            let BEV = element.BEV;
                                            const changeLoop = async () => {
                                                if((WK == 'G' && BEV == 'C') || (WK == 'R' && BEV == 'C') || (WK == 'S' && BEV == 'C') || (WK == 'U' && BEV == 'C')){
                                                    // console.log('Mach nix');
                                                }else{
                                                    from_var = ` lampa_pushmatrix WHERE LAND = '${markt['MARKT']}' AND Sparte = '${markt['sparte']}'`;
                                                    if((WK == 'R' && BEV == 'A')){
                                                        if(markt['Nische'] == true){
                                                            try {
                                                                const pool =  await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT (SUM(NR_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(NR_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                    element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                    element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            }catch(err){
                                                                console.log(err);
                                                            }
                                                        }else if(markt['Volumen'] == true){
                                                            try{
                                                                const pool =  await poolPromise
                                                                const result =  await pool.request()
                                                                    .query(`
                                                                    SELECT (SUM(VR_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(VR_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                    console.log(`SELECT (SUM(VR_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(VR_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`)
                                                                    console.log('ELEMENT Menge ' + element['MENGE']);
                                                                    console.log('ELEMENT Mengen Addition  '+ result.recordset[0]['Menge_addition']);
                                                                    element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                    console.log('ELEMENT MENGE Gesamt ' + element['MENGE']);
                                                                    element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            }catch(err){
                                                                console.log(err);
                                                            }
                                                        }
                                                    }
                                                    if((WK == 'S' && BEV == 'A')){
                                                        if(markt['Nische'] == true){
                                                            try {
                                                                const pool =  await poolPromise
                                                                const result =  await pool.request()
                                                                    .query(`SELECT (SUM(NS_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(NS_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                    console.log(`SELECT (SUM(NS_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(NS_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                        
                                                            } catch (err) {
                                                                console.log(`SELECT SUM(NR_V3)*(SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}') AS Menge_addition FROM ${from_var}`);
                                                            }
                                                        }else if(markt['Volumen'] == true){
                                                            try {
                                                                const pool =  await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT (SUM(VS_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(VS_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                    console.log(`SELECT (SUM(VS_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                    (SUM(VS_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                                    
                                                                    
                                                                    console.log('ELEMENT Menge ' + element['MENGE']);
                                                                    console.log('Mengen Addition '+result.recordset[0]['Menge_addition'])
                                                                    element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                    console.log('ELEMENT MENGE Gesamt ' + element['MENGE']);

                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT (SUM(VR_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) +
                                                                (SUM(VR_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
                                                            }
                                                        }
                                                    }
                                                    if((WK == 'S' && BEV == 'K')){
                                                        if(markt['Nische'] == true){
                                                            try {
                                                                const pool = await poolPromise
                                                                const result =  await pool.request()
                                                                    .query(`SELECT SUM(NK_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var} `);
                                                                element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT SUM(NK_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var} `);
                                                                console.log("Line 811");
                                                            }
                                                        }else if(markt['Volumen'] == true){
                                                            try {
                                                                const pool =  await poolPromise
                                                                const result = await  pool.request()
                                                                    .query(`SELECT SUM(VK_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition ${from_var}`);
                                                                element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                
                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT SUM(VK_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}') AS Menge_addition ${from_var}`);
                                                                console.log("Line 821");
                                                            }
                                                        }
                                                    }
                                                    if((WK == 'U' && BEV == 'A')){
                                                        if(markt['Nische'] == true){
                                                            try {
                                                                const pool = await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT (SUM(NU_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') + (SUM(NU_V3)* (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail'))) AS Menge_addition  FROM ${from_var}`);
                                                                    element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                    element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT (SUM(NU_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}') + (SUM(NU_V3)* (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}'))) AS Menge_addition  FROM ${from_var}`);
                                                                console.log("Line 834");
                                                            }
                                                        }else if(markt['Volumen'] == true){
                                                            try {
                                                                const pool = await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT (SUM(VU_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail')  + (SUM(VU_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail'))) AS Menge_addition  FROM ${from_var}`);
                                                                element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                
                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                            console.log(`SELECT (SUM(VU_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}') + (SUM(VU_V3) * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}'))) AS Menge_addition  FROM ${from_var}`)
                                                            }
                                                        }
                                                    }
                                                    if((WK == 'U' && BEV == 'B')){
                                                        if(markt['Nische'] == true){
                                                            try {
                                                                const pool =  await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT SUM(NL_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
                                                                    element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                    element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT SUM(NL_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
                                                                console.log("Line 857");
                                                            }
                                                        }else if(markt['Volumen'] == true){
                                                            try {
                                                                const pool = await poolPromise
                                                                const result = await pool.request()
                                                                    .query(`SELECT SUM(VL_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
                                                                element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
                                                                
                                                                element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
                                                            } catch (err) {
                                                                console.log(`SELECT SUM(VL_V2) * (SELECT V2 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${markt['MARKT']}' AND Sparte='${markt['sparte']}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
                                                                console.log("Line 867");
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            await changeLoop();
                                            let obj = {};
                                            if(element['TNRlies'] == 'A9075012600' && markt['MARKT'] == 'Deutschland'){
                                                console.log('YES Deutschland A9075012600');
                                                console.log('A9075012600 Menge '+element['MENGE']);
                                            }
                                            for (let index = 0; index < maerkteLoop.length; index++) {
                                                let marktElement = maerkteLoop[index];
                                                obj.TNRlies = element['TNRlies'];
                                                obj.TNRsort = element['TNRsort'];
                                                obj.Benennung = element['Benennung_DE'];
                                                if(marktElement == markt['MARKT']){
                                                    obj[markt['MARKT']] = element['MENGE'];
                                                }else{
                                                    obj[marktElement] = '';
                                                }
                                                
                                            }
                                            console.log(obj);
                                            recievedDataArrays.push(obj);
                                        }))}
                                        await wholeSaleLoop();
                            }
                    } catch (err) {
                        console.log(err);
                    }
            } catch (err) {
                console.log(err);
            }
        }
        recievedDataArrays = recievedDataArrays.sort(function(a, b){
            if(a['TNRlies'] < b['TNRlies']) { return -1; }
            if(a['TNRlies'] > b['TNRlies']) { return 1; }
            return 0;
            });
    let convertedData = [];
        let obj = {};
        for (let index = 0; index < recievedDataArrays.length; index++) {
            let element = recievedDataArrays[index];
            if(index != 0 && (index != recievedDataArrays.length-1)){
                if(recievedDataArrays[(index-1)]['TNRlies'] == recievedDataArrays[index]['TNRlies']){
                    obj['TNRlies'] = element['TNRlies']
                    for (let index = 0; index < maerkteLoop.length; index++) {
                        const element2 = maerkteLoop[index];
                        if(element[`${element2}`] == undefined){
                            element[`${element2}`] = 0;
                        }
                        if(element2 != 'TNRlies' && element[`${element2}`] != ''){
                            obj[`${element2}`] = element[`${element2}`]
                        }
                    }
                }else{
                    convertedData.push(obj);
                    obj = element;
                }
            }else if(index == (recievedDataArrays.length - 1)){
                for (let index = 0; index < maerkteLoop.length; index++) {
                    const element2 = maerkteLoop[index];
                    if(element2 != 'TNRlies' && element[`${element2}`] != ''){
                        obj[`${element2}`] = element[`${element2}`]
                    }
                }
                convertedData.push(obj);
            }else{
                obj['TNRlies'] = element['TNRlies']
                for (let index = 0; index < maerkteLoop.length; index++) {
                    const element2 = maerkteLoop[index];
                    if(element2 != 'TNRlies' && element[`${element2}`] != ''){
                        obj[`${element2}`] = element[`${element2}`]
                    }
                }
                obj = element;
            }
        }
        for (let index = 0; index < convertedData.length; index++) {
            let element = convertedData[index];
            element['Gesamt'] = 0;
            for (let index = 0; index < maerkteLoop.length; index++) {
                const el = maerkteLoop[index];
                if(element[`${el}`] != ''){
                    element['Gesamt'] += element[`${el}`];
                }
            }
        }   
        for (let index = 0; index < convertedData.length; index++) {
            let element = convertedData[index];
            try {
                const pool = await poolPromise
                const result = await pool.request().
                    query(`SELECT  Benennung_DE FROM lampa_primus WHERE MATNR_SORT = '${element['TNRsort']}';`);
                    console.log(result.recordset);
                    if(result.recordset.length > 0){
                        element['Benennung'] = result.recordset[0]['Benennung_DE'];
                    }else{
                        element['Benennung'] = '';
                    }
            } catch (err) {
                console.log(err);
            }
        }
        let newConvertedData = [];
        for (let index = 0; index < convertedData.length; index++) {
            let element = convertedData[index];
            let obj = {};
            for (let index = 0; index < maerkteLoop.length; index++) {
                let marktElement = maerkteLoop[index];
                obj.TNRsort = element['TNRsort'];
                obj.TNRlies = element['TNRlies'];
                obj.Benennung = element['Benennung'];
                obj[`${marktElement}`] =  element[`${marktElement}`];
            }
            obj.Gesamt = element['Gesamt'];
            console.log(obj);
            newConvertedData.push(obj);
        }
        res.status(200).json({data : newConvertedData});
    });

    function isAllEqual(checkElement,stuckElement){
        if(_.isEqual(
            _.omit(checkElement, ['i','Benennung']),
            _.omit(stuckElement, ['i','Benennung'])
        ) == true){
            return true;
        }
    }

    function isCode(checkElement,stuckElement){
        let omitArray = [];
        for (let index = 0; index < Object.keys(checkElement).length; index++) {
            const element = Object.keys(checkElement)[index];
            if(element.search('MG') > -1){
                omitArray.push(element);
            }
            
        }
        omitArray.push('i');
        omitArray.push('Codebedingung lang');
        omitArray.push('Benennung');
        if(checkElement['Teil'] == 'A2068170100'){
            console.log(_.isEqual(
                _.omit(checkElement, omitArray),
                _.omit(stuckElement, omitArray)
            ));
        }
        if(_.isEqual(
            _.omit(checkElement, ['i','Codebedingung lang','Benennung']),
            _.omit(stuckElement, ['i','Codebedingung lang','Benennung'])
        ) == true){
            if(checkElement['Codebedingung lang'] != stuckElement['Codebedingung lang']){
                return true;
            }
        }
    }

    function isMenge(checkElement,stuckElement){
        let keys = Object.keys(checkElement);
        let omitArray = [];
        let mengenArray = [];
        let checkArray = [];
        omitArray.push('i','Benennung');
        for (let index = 0; index < keys.length; index++) {
            const element = keys[index];
            if(element.search('MG') > - 1){
                omitArray.push(element);
                mengenArray.push(element);
            }
        }
        if(_.isEqual(
            _.omit(checkElement, omitArray),
            _.omit(stuckElement, omitArray)
        ) == true){
            for (let index = 0; index < mengenArray.length; index++) {
                const el = mengenArray[index];
                let checkMengenEl = checkElement[`${el}`];
                let stuckMengenEl = stuckElement[`${el}`];
                if(checkMengenEl == null && stuckMengenEl != null){
                    //checkElement gets lowest menge stuckelement gets deleted
                    checkElement[`${el}`] == stuckMengenEl;
                }else if(checkMengenEl != null && stuckMengenEl != null){
                    // checkElement gets lowest
                    if(checkMengenEl > stuckMengenEl && stuckMengenEl != 0){
                        checkElement[`${el}`] = stuckMengenEl;
                    }
                } 
            }
            return true;
        }  
    }

    /* Debugging functions */
    // TODO: Needs to be migrated Teileliste
    function reorgArrayProp(propNames,array){
        let newArray = [];
        for(let item of array){
            let obj = {};
            for(let key of propNames){
                obj[`${key}`] = item[`${key}`];
            }
            newArray.push(obj)
        }
        return newArray;
    }

    /* Klassen */

    class PODetails{
        wholesale;
        constructor(sparte,land,verfahren,volNisch,fahrzeug,inputAsiaDate){
            this.sparte = sparte;
            this.land = land;
            this.verfahren = verfahren;
            this.volNisch = volNisch;
            this.fahrzeug = fahrzeug;
            this.asiaDate = inputAsiaDate;
            if(verfahren == 'Wholesale only'){
                this.wholesale = true;
            }else{
                this.wholesale = false;
            }
        }
    }

    /*
    * Routen
    */
    const teilanlageRoutes = require('./routes/teilanlage');
    const warenkorbRoutes = require('./routes/esb/import/warenkorb');
    const pushmatrixRoutes = require('./routes/esb/import/pushmatrix');
    const dimsRoutes = require('./routes/dims');
    const esbExportRoutes = require('./routes/esb/export/export');
    const esbPreviewRouter = require('./routes/esb/preview/preview');
    const esbDatenpflegeRoutes = require('./routes/esb/datenpflege/datenpflege');
    const prognoseRoutes = require('./routes/prognose/prognose');
    const wktDatenpflegeRoutes = require('./routes/wkt/datenpflege/datenpflege');
    const wktTeilelisteRoutes = require('./routes/wkt/teileliste/teileliste');
    const wktWarenkorbRoutes = require('./routes/wkt/warenkorb/warenkorb');

    // Apply authentication middleware to all application routes
    // Vulnerable endpoint /prognose/prognoseVerbauratenBerechnung is bypassed in middleware/auth.js
    app.use(requireAuth);

    app.use(teilanlageRoutes);
    app.use(warenkorbRoutes);
    app.use(pushmatrixRoutes);
    app.use(dimsRoutes);
    app.use(esbExportRoutes);
    app.use(esbPreviewRouter);
    app.use(esbDatenpflegeRoutes);
    app.use(prognoseRoutes);
    app.use(wktDatenpflegeRoutes);
    app.use(wktTeilelisteRoutes);
    app.use(wktWarenkorbRoutes);

    
    app.use(errorHandler);

};

/**
* Configure and start server
*/
(async () => {
    try {
        startServer();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();

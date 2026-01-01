const DatabaseConnError = require('../classes/DatabaseConnError');
const { removePropertiesFromArray } = require('../functions/objectPropertyManipulation');

function createArrayFromProperty(array, propertyName) {
    return array.map(item => item[propertyName]);
}

function removeDuplicates(arr) {
    let seen = new Set();
    return arr.filter(obj => {
      let key = JSON.stringify(obj);
      return seen.has(key) ? false : seen.add(key);
    });
}

const getPackages = async (warenkoerbe, paketbildung, option) => {
    const foundPackages = []; 
    const sheet2 = [];
    for (const paket of paketbildung) {
        for (const warenkorb of warenkoerbe) {
            if(paket.Warenkorbkenner == warenkorb.WK 
               && paket.Bevorratungskenner == warenkorb.BEV 
               && paket.Beschreibung.search(option) > -1){
                if(paket["Paket Warenkorb"] == "V2"){
                    if(warenkorb.V2 > 0){
                        foundPackages.push({...paket, sheet3 : false});
                        sheet2.push({paket: paket["Nummer DIMS Paket"], TNRsort: warenkorb["TNRsort"], menge: warenkorb.V2, dispoTyp: "F"});
                    }
                }else if(paket["Paket Warenkorb"] == "V3"){
                    if(warenkorb.V3 > 0){
                        foundPackages.push({...paket, sheet3 : false});
                        sheet2.push({paket: paket["Nummer DIMS Paket"], TNRsort: warenkorb["TNRsort"], menge: warenkorb.V3, dispoTyp: "F"});
                    }
                }
            }
        }    
    }

    return [foundPackages, sheet2];
};

function compareAndRemove(arr1, arr2, arr3) {
    const thirdArrayPaketnummers = arr3.map(obj => obj.Paketnummer);

    const filterByPaket = (arr, paketProp) => {
      return arr.filter(obj => thirdArrayPaketnummers.includes(obj[paketProp]));
    };
  
    const filteredArr1 = filterByPaket(arr1, 'Nummer DIMS Paket');
    const filteredArr2 = filterByPaket(arr2, 'paket');
  
    return [filteredArr1, filteredArr2];
}  

// TODO: Großbritannien unterschied
// TODO: Frankreich Belgien

const exportDIMS = async (req,res,next) => {
    let markt = null;
    const land = req.body.country;
    const sparte = req.body.sparte;
    const verfahren = req.body.auftragerstellung;
    const option = req.body.volNisch;
    const bestelldatum = req.body.inputDimsDate;

    if(land == null || sparte == null || verfahren == null || option == null || bestelldatum == null) return res.status(400).send({message: "Es fehlen parameter."});

    if(land == 'Frankreich' || land == 'Belgien'){
        if(req.body.markt){
            markt = req.body.markt; 
        }else{
            return res.status(404).json({message : "Es wurde kein Markt mitgegeben."});
        }
    }

    const pool = req.app.locals.postgresSQL;
    if(!pool) throw new DatabaseConnError("");

    const paketBildungSQL = `SELECT * FROM lampa."lampa_Paketbildung_Push"`;
    const pakete = await pool.query(paketBildungSQL);

    if(pakete.rows.length <= 0) return res.status(404).json({message : "Paketbildung hat keine pakete wiedergegben"});
    // TODO: prüfen ob pakete vorhanden

    const warenkorbSQL = `SELECT * FROM lampa."lampa_warenkorb" WHERE "Land" = $1 AND "Sparte" = $2 AND "Verfahren" = $3`;

    const warenkorb = 
    await pool.query(warenkorbSQL,[land,sparte,verfahren]);

    if(warenkorb.rows.length <= 0) return res.status(404).json({message : "Es wurde kein Warenkorb gefunden."});

    const [packages, sheet2] = await getPackages(warenkorb.rows,pakete.rows,option);

    const pushmatrixSQL = `SELECT * FROM lampa."lampa_pushmatrix" WHERE "Land" = $1 AND "Sparte" = $2`;

    const pushmatrixFrankreichSQL = `SELECT * FROM lampa."lampa_pushmatrix" WHERE "Land" = $1 AND "Sparte" = $2 AND "Markt" = $3`;
    
    const pushmatrix = land === "Frankreich" || land === "Belgien" ? await pool.query(pushmatrixFrankreichSQL,[land,sparte,markt])
    :
    await pool.query(pushmatrixSQL,[land,sparte]);

    if(pushmatrix.rows.length <= 0) return res.status(404).json({message : "Es wurde kein Pushmatrix gefunden."});
    let packagesSheet3 = removeDuplicates(packages);

    const sheet3 = [];
    for (let packageElement of packagesSheet3) {
        const propName = packageElement['Pushmatrix Spalte'];
        for (const pushElement of pushmatrix.rows) {
            if(pushElement[propName] !== null || pushElement !== undefined){
                const bestellMenge = Math.abs(pushElement[propName]);
                if(pushElement[propName] > 0) {
                    packageElement.sheet3 = true;
                    for (let i = 0; i < bestellMenge; i++) {
                        let sheet3Obj = { 
                            Paketnummer : packageElement['Nummer DIMS Paket'], 
                            Betrieb: pushElement.VFNR, 
                            Bestelldatum: bestelldatum, 
                            DIMS: null, 
                            Lieferantennummer: null, 
                            kundennummer: null,
                            vfnr: pushElement.VFNR,
                            vfnr6: pushElement.LieferVFNR6
                        };
                        sheet3.push(sheet3Obj);               
                    }
                }
            }
        }
    }

    
    const laenderCodes = await pool
    .query(`SELECT "LAENDERCODE" FROM lampa."lampa_markt_laendercode" WHERE ("LAND" = $1) ORDER BY "LAENDERCODE" DESC`, [land === 'Belgien' ? 'Frankreich' : land]);
    
    if(laenderCodes.rows.length <= 0) return res.status(404).json({message : "Es wurden keine Ländercodes gefunden."});


    let laenderCode = laenderCodes.rows[0].LAENDERCODE;

    if(land === "Belgien") laenderCode = laenderCodes.rows[1].LAENDERCODE;

    const lieferantenNummerSql = `SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
    WHERE "LAND" = $1 AND "SPARTE" = $2 ORDER BY "KDNR" ASC;`;
    const lieferantenNummerResults = await pool.query(lieferantenNummerSql,[land,sparte]);

    if(laenderCodes.rows.length <= 0) return res.status(404).json({message : "Es wurden keine Lieferantenummern gefunden."});

    // Notiz war davor ländercode aber muss lieferantenNummer sein
    const lieferantenNummer = land === "Deutschland" ? "20000" : lieferantenNummerResults.rows[0].KDNR;
    

    const dimsQuery = `SELECT DISTINCT "KZ_PROZESS_STEUERUNG", "GORT" 
    FROM lampa."lampa_dims_lbus" WHERE "KUNDEN_NUMMER" = $1 AND "GORT"::text LIKE $2`;

    const dimsGroQuery = `SELECT DISTINCT "KZ_PROZESS_STEUERUNG", "GORT" 
    FROM lampa."lampa_dims_lbus" WHERE "GORT" = $1 AND "MARKE" = $2`; 

    const sheet3Checked = [];

    const marke = sparte !== "Van" ? 210 : 230;

    

    for (const sheetData of sheet3) {
        console.log(sheetData.vfnr,`${laenderCode}%`)


        const dimsData = land !== "Großbritannien" ? await pool.query(dimsQuery,[sheetData.vfnr,`${laenderCode}%`])
        : 
        await pool.query(dimsGroQuery,[`${laenderCode}${sheetData.vfnr6}`,marke]);

        if(dimsData.rows.length > 0){
            let { GORT, KZ_PROZESS_STEUERUNG } = dimsData.rows[0];
            GORT = GORT.toString();
            sheetData.Betrieb = (GORT.toString()).substring(GORT.length - 6, GORT.length);
            if (KZ_PROZESS_STEUERUNG) {
                sheetData.DIMS = KZ_PROZESS_STEUERUNG.indexOf("JJJ") === 0 ? "J" : "N";
                sheetData.Lieferantennummer = KZ_PROZESS_STEUERUNG.indexOf("JJJ") === 0 ? null : `${laenderCode}0${lieferantenNummer}`;
                sheetData.kundennummer = KZ_PROZESS_STEUERUNG.indexOf("JJJ") === 0 ? null : sheetData.vfnr;
            } else {
                sheetData.DIMS = "N";
                sheetData.Lieferantennummer = `${laenderCode}0${lieferantenNummer}`;
                sheetData.kundennummer = sheetData.vfnr;
            }
            sheet3Checked.push(sheetData);
        }
        else{
            sheetData.Betrieb = sheetData.vfnr6;
            sheetData.DIMS =  "N";
            sheetData.Lieferantennummer = `${laenderCode}0${lieferantenNummer}`;
            sheetData.kundennummer =  sheetData.vfnr;
            sheet3Checked.push(sheetData);
        }
    }
    const sheet1Cleaned = removePropertiesFromArray(packagesSheet3, ["sheet3","Pushmatrix Spalte","Warenkorbkenner","Bevorratungskenner","Paket Warenkorb"]);
    const sheet3Cleaned = removePropertiesFromArray(sheet3Checked, ["vfnr", "vfnr6"]);

    const [sheet1Checked, sheet2Checked] = compareAndRemove(sheet1Cleaned, sheet2, sheet3Cleaned);
  
    return res.status(200).json({ data: [sheet1Checked,sheet2Checked,sheet3Cleaned], liefer: "", allSheet: [] , lieferant: ""});
};

module.exports = { exportDIMS };
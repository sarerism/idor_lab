const { PODetails, calcMengePO, convertToPOFormat } = require("../../../services/poService");
const { convertToPoTime } = require("../../../services/timeService");
const { ResponseData } = require("../datenpflege/datenpflege");

const getTeilanlage = async (req, res) => {
    let verfahrenVar = '';
    verfahrenVar = req.body.auftragerstellung == 'Wholesale & Retail' ? `"VERFAHREN" LIKE '%Retail%' ` : `"VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" not LIKE '%Retail%' `;
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT "TEILEANLAGE" FROM lampa."lampa_ESB_matrix" WHERE 
        ${verfahrenVar} AND "SPARTE" = '${req.body.sparte}' AND "MARKT" = '${req.body.country}';`);
    res.status(200).json({ data: result.rows });
};


const exportFixbedarfe = async (req, res) => {
    let pushData = [];
    const pool = req.app.locals.postgresSQL;
    const result = await pool.query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter" WHERE "LAND" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}';`)
    let KDNRs = result.rows;
    for (let index = 0; index < KDNRs.length; index++) {
        const element = KDNRs[index];
        const result2 = await pool.query(`SELECT DISTINCT
                '' AS "Status",
                '000' AS "Version",
                '${req.body.inputSPMDate}' AS "Datum von",
                '${req.body.inputyearSPM}' AS "Datum bis",
                '00:00:00' AS "Zeit von",
                '23:59:59' AS "Zeit bis",
                "TNRlies" AS "Produkt",
                "Lokation_SPM" as "Lokation",
                'false' AS "Virtuelle Unterlokation",
                CAST('90003' AS INTEGER) AS "Begründungsschlüssel",
                '' AS "Beschreibung des Grunds",
                'false' AS "Ramping-Kennz.",
                'false' AS "Negativkennz.",
                "Location_${element.KDNR}" AS "Menge",
                'ST' AS "ME",
                'KEINE PRIORITÄT' AS "Fixbedarfsart",
                '' AS "Priorität",
                'PUSH ODER PULL' AS "Deployment-Art",
                '' AS "Depl.-Art - Zeit",
                '' AS "Anlegedatum",
                '' AS "Angelegt von",
                '' AS "Anlegezeit",
                '' AS "Geändert von",
                '' AS "Änderungsdatum",
                '' AS "Änderungszeit",
                '' AS "Änderungsmodus"

                FROM lampa."lampa_ESB_Kundenparameter"
                JOIN lampa."lampa_warenkorb" ON "lampa_warenkorb"."Land" = "lampa_ESB_Kundenparameter"."LAND"
                WHERE lampa."lampa_ESB_Kundenparameter"."LAND" = '${req.body.country}'  AND "lampa_warenkorb"."Sparte" = '${req.body.sparte}' AND "Verfahren" = '${req.body.auftragerstellung}'
                AND lampa."lampa_ESB_Kundenparameter"."KDNR" = '${element.KDNR}' AND ("Lokation_SPM" IS NOT NULL OR "Lokation_SPM" <> '')
                order by "TNRlies"`);
        pushData.push(result2.rows);
    }
    return res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: pushData });
};

const exportWIMS = async (req, res) => {
    const pool = req.app.locals.postgresSQL;

    let sheet1 = `SELECT "Nummer DIMS Paket" AS "Dims", "Versandart", CONCAT('${req.body.inputFahrzeug} ', "Beschreibung") AS "Beschreibung"
    FROM            lampa."lampa_Paketbildung_Push"
    WHERE        ("Beschreibung" Like '%${req.body.country}%')
	LIMIT 1;`;
    let sheet2 = `SELECT        (SELECT  "Nummer DIMS Paket"
    FROM            lampa."lampa_Paketbildung_Push"
    WHERE        ("Beschreibung" Like '%${req.body.country}%') LIMIT 1) AS "Nummer DIMS Paket", lampa."lampa_warenkorb"."TNRsort" ,"Menge",'F' AS "Dispotyp"
    FROM            lampa."lampa_warenkorb"
    WHERE        ("Land" = '${req.body.country}') AND "Sparte" = '${req.body.sparte}'
    Order By "TNRsort"`;
    let sheet3 = `
    SELECT        (SELECT "Nummer DIMS Paket"
    FROM            lampa."lampa_Paketbildung_Push"
    WHERE        ("Beschreibung" Like '%${req.body.country}%') LIMIT 1) AS "Paketnummer", "KDNR" AS "Betrieb",'${req.body.inputDimsDate}' AS "Bestelldatum", 'J' AS WIMS
    FROM            lampa."lampa_ESB_Kundenparameter" 
    WHERE        ("LAND" = '${req.body.country}')`;

    const result = await pool.query(`${sheet1};${sheet2};${sheet3};`);

    res.status(200).json({ data: result.rows , lieferant : ''});
};

const getOffene = async (req, res) => {
    const { sparte, country, auftragerstellung } = req.body;

    const pool = req.app.locals.postgresSQL;

    const resultTest = await pool.query(`SELECT * FROM lampa.lampa_pushmatrix`);

    console.log(resultTest.rows);

    // TODO: Prüfen ob parameter vorhanden sind
    let verfahrenVar = auftragerstellung == 'Wholesale & Retail'
    ? `"VERFAHREN" LIKE '%Retail%'`
    : `"VERFAHREN" LIKE '%Wholesale%' AND "VERFAHREN" NOT LIKE '%Retail%'`;

    // TODO: Prüfen ob result empty vorhanden ist
    const result = await pool.query(`SELECT "OFFENE_BESTELLUNG" FROM lampa."lampa_ESB_matrix" WHERE 
        ${verfahrenVar} AND "SPARTE" = $1 AND "MARKT" = $2;`,[sparte,country]);

    res.status(200).json({ data: result.rows });
};

const exportOffeneBestellungenSPICS = async (req,res) => {
    let verfahrenVar = '';
    // TODO: Check if working
    verfahrenVar = ` AND lampa."lampa_warenkorb"."Verfahren" = '${req.body.auftragerstellung === 'Wholesale only' ? 'Wholesale only' : 'Wholesale & Retail'}'`;
    let formData = req.body;
    let locations = [];
    let recievedDataArrays = [];
    const pool = req.app.locals.postgresSQL;
    const result =  await pool.query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
    WHERE "LAND" = '${formData.country}' AND "SPARTE" = '${formData.sparte}';`);
    locations = result.rows;
    await Promise.all(locations.map(async (location, index)=>{
        const loopfunc = async () => {
            let mengenVar= '';
            let joinVar = '';
            if(locations.length > 1){
                mengenVar = ` wl."Menge" `;
                joinVar = `LEFT JOIN lampa."v_lampa_warenkorb_loacation" wl ON wl."Land" = lampa_warenkorb."Land" AND wl."TNRlies" = lampa_warenkorb."TNRlies" AND 'Location_' || lampa."lampa_ESB_Kundenparameter"."KDNR" = wl."Location" AND wl."Menge" is not null AND wl."Verfahren" = '${req.body.auftragerstellung}'`;
            }else{
                mengenVar = `lampa."lampa_warenkorb"."Menge"  `;
                joinVar = ``;
            }

            const baseDataQuery = `SELECT DISTINCT
            "WK",
            "BEV",
            "AUFTRAGGEBER",
            "AUFTRAGSTYP",
            '${req.body.inputANR[index].inputANR}' AS "KUNDENAUFTRAGSNUMMER",
            "VERTRIEBSWEG",
            '' AS "KAMPAGNEID",
            '' AS "ABWEICHENDER-WARENEMPFAENGER",
            '${req.body.inputFahrzeug}' AS "BHW",
            '' AS "HU-Partner",
            '' AS "EXT.POSITIONSNUMMER",
            lampa."lampa_warenkorb"."TNRlies" AS "PRODUKTID",
            ${mengenVar} AS "MENGE",
            "REGELKRITERIUM1",
            '' AS "REGELKRITERIUM2",
            TO_CHAR(current_date, 'DD.MM.YYYY') AS "KUNDENWUNSCHTERMIN",
            '' AS "PREISE",
            '' AS "BEMERKUNG",
            '' AS "FIN",
            '' AS "SCHLIEßNUMMER",
            "Satzart",
            "KDNR" AS "Kundennummer",
            '${req.body.inputANR[index].inputANR}' AS "Auftragsnummer",
            lampa."lampa_warenkorb"."TNRlies",
            ${mengenVar} AS "Bestellmenge",
            0 AS "Filler1",
            "CentralVendorCode" AS "Lieferwerk" ,
            '' AS "Positionsnummer",
            TO_CHAR(current_date, 'YYMMDD') AS "Bestelldatum",
            '' AS "Filler2",
            '' AS "Filler3",
            '' AS "Filler4"

            FROM lampa."lampa_ESB_Kundenparameter"
            JOIN lampa."lampa_warenkorb" ON lampa."lampa_ESB_Kundenparameter"."LAND" = lampa."lampa_warenkorb"."Land" AND "lampa_ESB_Kundenparameter"."SPARTE" = lampa_warenkorb."Sparte"
            ${joinVar}
            JOIN lampa."lampa_primus" ON lampa_primus."MATNR_SORT" = "lampa_warenkorb"."TNRsort"
            WHERE lampa."lampa_ESB_Kundenparameter"."LAND" = '${req.body.country}' AND "lampa_ESB_Kundenparameter"."SPARTE" = '${req.body.sparte}' AND "lampa_ESB_Kundenparameter"."KDNR" = '${location.KDNR}'  ${verfahrenVar} ORDER BY "KDNR"`;

            const result =  await pool
                .query(baseDataQuery);               
                if(req.body.auftragerstellung == 'Wholesale only'){
                    recievedDataArrays.push(result.rows);
                }else if(req.body.auftragerstellung == 'Wholesale & Retail'){
                    let recievedData = result.rows;
                    let Land = formData.country;
                    let from_var = "";
                    const wholeSaleLoop = async () => {
                        await Promise.all(recievedData.map(async (element)=>{
                        
                        const loopMengen = async () => {
                            let tnrlies = element['PRODUKTID'];
                            if(element['MENGE'] == null || element['MENGE'] == 0 || element['MENGE'] == '0' || element['MENGE'] == 'null'){ 
                                let sqlQueryMenge = ``;
                                sqlQueryMenge = `SELECT "Location_${location.KDNR}" FROM lampa."lampa_warenkorb" WHERE "TNRlies" = '${tnrlies}' AND "Land" = '${req.body.country}' AND "Sparte"='${req.body.sparte}' AND "Verfahren" = 'Wholesale & Retail'`;
                                const result = await pool.
                                    query(sqlQueryMenge);
                                    element['MENGE'] = result.rows[0][`Location_${location.KDNR}`];
                            }
                        
                        };

                        await loopMengen();
                        let WK = element.WK;
                        let BEV = element.BEV;
                        const changeLoop = async () => {
                            
                            if((WK == 'G' && BEV == 'C') || (WK == 'R' && BEV == 'C') || (WK == 'S' && BEV == 'C') || (WK == 'U' && BEV == 'C')){
                                // console.log('Mach nix');
                            }else{
                                if((Land == 'Frankreich')){

                                    let locationKNDR = location.KDNR;

                                    if(locationKNDR === 53140 || locationKNDR === "53140") locationKNDR = 53138;
                                    if(locationKNDR === 53141 || locationKNDR === "53141") locationKNDR = 53139;

                                    from_var = `lampa."lampa_pushmatrix"
                                    WHERE  ("Land" = 'Frankreich') AND ("Sparte" = '${formData.sparte}') AND ("VFNR" IN
                                                                (SELECT DISTINCT "Betrieb"
                                                                FROM            lampa."lampa_ELC_Zugehoerigkeit"
                                                                WHERE        ("ELC" = '${locationKNDR}')))`
                                }else{
                                    from_var = ` lampa."lampa_pushmatrix" WHERE "Land" = '${formData.country}' AND "Sparte" = '${req.body.sparte}'`;
                                }
                                if((WK == 'R' && BEV == 'A')){
                                    if(formData.volNisch == 'Nische'){
                                        const result = await pool
                                            .query(`SELECT (SUM("NR_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                                            (SUM("NR_V3") * (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
            
                                    }else{
                                        const result =  await pool
                                                .query(`
                                                SELECT (SUM("VR_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                (SUM("VR_V3") * (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }
                                }
                                if((WK == 'S' && BEV == 'A')){
                                    if(formData.volNisch == 'Nische'){
                                            const result =  await pool
                                                .query(`SELECT (SUM("NS_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                (SUM("NS_V3") * (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }else{
                                        
                                            const result = await pool
                                                .query(`SELECT (SUM("VS_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                (SUM("VS_V3") * (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];

                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];

                                            console.log(element['MENGE'], 'HEERE')
                                    }
                                }
                                if((WK == 'S' && BEV == 'K')){
                                    if(formData.volNisch == 'Nische'){
                                            const result =  await pool
                                                .query(`SELECT SUM("NK_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var} `);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }else{
                                            const result = await  pool
                                                .query(`SELECT SUM("VK_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }
                                }
                                if((WK == 'U' && BEV == 'A')){
                                    if(formData.volNisch == 'Nische'){
                                            const result = await pool
                                                .query(`SELECT (SUM("NU_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail') + (SUM("NU_V3")* (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }else{
                                            const result = await pool
                                                .query(`SELECT (SUM("VU_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail')  + (SUM("VU_V3") * (SELECT "V3" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }
                                }
                                if((WK == 'U' && BEV == 'B')){
                                    if(formData.volNisch == 'Nische'){
                                            const result = await pool
                                                .query(`SELECT SUM("NL_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }else{
                                            const result = await pool
                                                .query(`SELECT SUM("VL_V2") * (SELECT "V2" FROM lampa."lampa_warenkorb" WHERE "TNRlies"  = '${element['TNRlies']}' AND "Land"  = '${formData.country}' AND "Sparte"='${formData.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                            
                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                    }
                                }
                            }
                        }
                        await changeLoop();
                    }))}
                    await wholeSaleLoop();
                    recievedDataArrays.push(recievedData);
                }
        };
        await loopfunc();
    }));

    res.status(200).json({ status: 'Success!!!!!!!!!' , errorMessage : false, arrayData: recievedDataArrays});
};

const getDIMSandSPMboolean = async (req, res) => {
    const pool = req.app.locals.postgresSQL;
    if (req.body.auftragerstellung == 'Wholesale & Retail') {
        const result = await pool.
            query(`SELECT "DIMS", "SPM","MENGENSPALTEN_WARENKORB","SPM_Asia" FROM lampa."lampa_ESB_matrix" WHERE "MARKT" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}' AND "VERFAHREN" Like '%Retail%'`);
        res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: result.rows });
    } else if (req.body.auftragerstellung == 'Wholesale only') {
        const result = await pool.
            query(`SELECT "DIMS","SPM","MENGENSPALTEN_WARENKORB","SPM_Asia" FROM lampa."lampa_ESB_matrix" WHERE "MARKT" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}' AND "VERFAHREN" Like '%Wholesale%' AND "VERFAHREN" not Like '%Retail%'`);
        res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: result.rows });
    }
};

const exportKopfDaten = async (req,res) => {
    let recievedDataArrays = [];
    const pool = req.app.locals.postgresSQL;
    const result = await pool.
        query(`SELECT DISTINCT 
        "AUFTRAGSTYP", 
        "AUFTRAGGEBER",
        '' AS "KUNDENAUFTRAGSNUMMER",
        "VERTRIEBSWEG" 
        FROM lampa."lampa_ESB_Kundenparameter" 
        WHERE "LAND" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}' ORDER BY "AUFTRAGGEBER";`);
    recievedDataArrays.push(result.rows);
    res.status(200).json({ status: 'Success!', errorMessage: false, arrayData: recievedDataArrays });
};

const getANRinputs = async (req, res) => {
    const pool = req.app.locals.postgresSQL;
    const result = await pool
        .query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
    WHERE "LAND" = '${req.body.country}' AND "SPARTE" = '${req.body.sparte}' ORDER BY "KDNR" ASC;`);
    res.status(200).json({ data: result.rows });
};

const getFixbedarfe = async (req, res) => {
    const pool = req.app.locals.postgresSQL;
    const result = await pool.
        query(`SELECT "SPARTE", "VERFAHREN", "MARKT", "SPM" FROM lampa."lampa_ESB_matrix" WHERE "MENGENSPALTEN_WARENKORB" = 2
        AND "VERFAHREN" LIKE '%Retail%' 
        AND "SPM" = 'Ja' 
        AND "SPARTE" = '${req.body.sparte}' 
        AND "MARKT" = '${req.body.country}';`);
    res.status(200).json({ rows: [result.rows.length], errorMessage: false });
};

const exportPO = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
    const exportDetails = new PODetails(req.body.sparte,req.body.country,req.body.auftragerstellung,req.body.volNisch,req.body.inputFahrzeug,req.body.inputAsiaDate);
    let parameterAsia, warenkorb;
    let poDateiCustomer1  = [];
    let poDateiCustomer2 = [];
    let primusObject = { }
    let location;
    /* Land identefizieren und mittels SQL den Eintrag des jeweiligen landes aus Asia Parameter
        aus der Datenbank exportieren.
    */
    try{
        const result =  await pool
            .query(`SELECT * FROM lampa.lampa_parameter_asia WHERE "Land" = $1`,[exportDetails.land])
            if(result.rows.length < 1){
                throw 'noresult';
            }else{
                parameterAsia = result.rows[0];
            }
    }catch(err){
        if(err == 'noresult'){
            return res.status(200).json(new ResponseData(true,'Das Angefragte Land wurde nicht in der parameter_asia Tabelle gefunden!',null));
        }else{
            return res.status(500).json(new ResponseData(true,'Internal Server Error!',null));
        }
    }
    /* Location des Jeweiligen landes holen wird benötigt für Mengen Berechnung Wholesale & Retail */
    try {
        const result = await pool
        .query(`SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter"
            WHERE "LAND" = $1 AND "SPARTE" = $2;`,[exportDetails.land,exportDetails.sparte]);
        location = result.rows;
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ResponseData(true,'Internal Server Error!',null));
    }
    /* Warenkorb holen */
    try{
        const result =  await pool
            .query(`SELECT * FROM lampa.lampa_warenkorb WHERE "Land" = $1 AND "Sparte" = $2 AND "Verfahren" = $3;`,[exportDetails.land,exportDetails.sparte,exportDetails.verfahren]);
            if(result.rows.length < 1){
                throw 'noresult';
            }else{
                warenkorb = result.rows;
            }
    }catch(err){
        console.log(err);
        if(err == 'noresult'){
            return res.status(200).json(new ResponseData(true,'Der Angefragte Warenkorb wurde nicht in der warenkorb Tabelle gefunden!',null));
        }else{
            return res.status(500).json(new ResponseData(true,'Internal Server Error!',null));
        }
    }
    console.log('test');
    /* Wenn Parameter Asia KNR2 Leer => Primus / KNR2 abfrage überspringen */
    console.log(parameterAsia)
    if(parameterAsia['Customer Code2'] != null){
        let inString = '';
        let i = 0;
        for(let warenkorbEintrag of warenkorb){
            if(i == 0){
                inString += `'${warenkorbEintrag['TNRsort']}'`;
            }else{
                inString += `,'${warenkorbEintrag['TNRsort']}'`;
            }
            i++;
        }
        /* Primus abfrage für die Veränderung der spalte Customer code */
        /* Wenn in Primus Gefahrgut_KLS etwas steht ist der Customer code die 2. Kundennummer */
        /* diese Kundennummer steht in Parameter_Asia andernfalls bleibt customer code*/
        console.log(`SELECT Gefahrgut_KLS, MATNR_SORT FROM lampa_primus WHERE MATNR_SORT IN (${inString});`,'SQL Query')
        try{
            const result =  await pool
                .query(`SELECT "Gefahrgut_KLS", "MATNR_SORT" FROM lampa.lampa_primus WHERE "MATNR_SORT" IN (${inString});`)
            if(result.rows.length > 0){
                let primusData = result.rows;
                console.log(`SELECT Gefahrgut_KLS, MATNR_SORT FROM lampa_primus WHERE MATNR_SORT IN (${inString});`,'SQL Query')
                for(let primusRow of primusData){
                    if(primusRow.Gefahrgut_KLS != null){
                        if(primusRow.Gefahrgut_KLS.trim() != ''){
                            primusObject[`${primusRow.MATNR_SORT}`] = primusRow.Gefahrgut_KLS
                        }
                    }
                }
            }
        }catch(err){
            console.log(err,'here')
            return res.status(500).json(new ResponseData(true,'Internal Server Error!',null));
        }
    }
    console.log(primusObject,'Primus Object!');
    try {
        for(let eintrag of warenkorb){
            let poEintrag = {};
            poEintrag['Purch. Organization'] = parameterAsia['Purch. Organization'];
            poEintrag['Purchasing Group'] = parameterAsia['Purchasing Group'];
            poEintrag['Company Code'] = parameterAsia['Company Code'];
            poEintrag['Vendor'] = parameterAsia['Vendor'];
            poEintrag['Plant'] = parameterAsia['Plant'];
            poEintrag['Purchasing Doc. Type'] = parameterAsia['Purchasing Doc. Type'];
            poEintrag['Material'] = eintrag['TNRlies'];
            if(exportDetails.wholesale){
                poEintrag['Order Quantity'] = eintrag['Menge'] ? eintrag['Menge'].toFixed(3) : null;
            }else{
                let menge = await calcMengePO(eintrag,exportDetails,location,pool);
                if(typeof menge == 'boolean'){
                    throw 'Mengen Rechnung Error!'
                }else{
                    poEintrag['Order Quantity'] = menge.toFixed(3);
                }
            }
            poEintrag['Order Unit'] = ""; 
            poEintrag['Customer Code'] = primusObject[eintrag['TNRsort']] == null || undefined ?  parameterAsia['Customer Code1'] : parameterAsia['Customer Code2'];
            poEintrag['Long text'] = "";   
            poEintrag['Delivery Date'] = convertToPoTime(exportDetails.asiaDate);  
            poEintrag['Storage Location'] = parameterAsia['Storage Location'];
            poEintrag['Key Number'] = "";   
            poEintrag['Chassis Number'] = "";   
            poEintrag['Remark (BHW)'] = exportDetails.fahrzeug;   
            poEintrag['Document Date'] = convertToPoTime(exportDetails.asiaDate);  
            poEintrag['Requirement Rule'] = "";   
            poEintrag['Stock Type'] = parameterAsia['Stock type']; 
            poEintrag['Material'] = eintrag['TNRlies'].search('A') === 0 ? convertToPOFormat(eintrag['TNRlies']) : eintrag['TNRlies'];
            
            console.log(eintrag['Material'])
            if(primusObject[eintrag['TNRsort']] == null || undefined){
                poDateiCustomer1.push(poEintrag);
            }else{
                poDateiCustomer2.push(poEintrag);
            }
        }   
        let poDateien = []
        if(poDateiCustomer1.length > 0) poDateien.push(poDateiCustomer1);
        if(poDateiCustomer2.length > 0) poDateien.push(poDateiCustomer2);

        return res.status(200).json(new ResponseData(false,'Success!',poDateien));
    } catch (err) {
        console.log(err);
        if(err == 'Mengen Rechnung Error!'){
            return res.status(200).json(new ResponseData(true,err,null));
        }else{
            return res.status(500).json(new ResponseData(true,'Internal Server Error!',null));
        }
    }
};

const newExportForecast = async (req,res) => {
    const pool = req.app.locals.postgresSQL;
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
        let query = `SELECT DISTINCT "KDNR" FROM lampa."lampa_ESB_Kundenparameter" WHERE "LAND" = '${markt['MARKT']}' AND "SPARTE"='${markt['sparte']}'`;
        try {
            const result = await  pool
                .query(query);
                let locations = result.rows;
                let kdnr;
                if(result.rows.length != 0){
                    kdnr = result.rows[0]['KDNR'];
                }
                let warenkorbQuery = '';
                if(markt['Volumen'] == true || markt['Nische'] == true){
                    warenkorbQuery = `SELECT "Location_${kdnr}", "TNRlies","TNRsort", "Menge" AS "MENGE" ,"WK", "BEV","TNRlies" AS "PRODUKTID" FROM lampa.lampa_warenkorb WHERE "Land"='${markt['MARKT']}' AND "Sparte" = '${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail'`;
                }else if(markt['Keine_Berechnung'] == true || markt['Wholesale'] == true){
                    if(markt['MARKT'].search('Zusatz') < 0){
                        warenkorbQuery = `SELECT "Menge" AS "MENGE","TNRlies", "TNRsort", "WK","BEV","TNRlies" AS "PRODUKTID" FROM lampa.lampa_warenkorb WHERE  "Land"='${markt['MARKT']}' AND "Sparte" = '${markt['sparte']}' AND "Verfahren" = 'Wholesale only'`;
                    }else{
                        warenkorbQuery = `SELECT "Menge" AS "MENGE","TNRlies", "TNRsort", "WK","BEV","TNRlies" AS "PRODUKTID" FROM lampa.lampa_warenkorb WHERE  "Land"='${markt['MARKT']}' AND "Sparte" = 'Zusatz' AND "Verfahren" = 'Wholesale only'`;
                    }
                    
                }
                try {
                    const result = await  pool
                        .query(warenkorbQuery);
                        if(markt['Keine_Berechnung'] == true){
                            console.log('Keine Berechnung');
                        }else if(markt['Wholesale'] == true){
                            if(markt['MARKT'] == "Deutschland" || markt['MARKT'] == "Frankreich"){
                                let locationString = '';
                                let queryStringDE = '';
                                for (let index = 0; index < locations.length; index++) {
                                    const loc = locations[index];
                                    locationString += `"Location_${loc.KDNR}", `;
                                }
                                queryStringDE = `SELECT ${locationString} "TNRlies", "TNRsort" FROM lampa.lampa_warenkorb WHERE "Land"='${markt['MARKT']}' AND "Verfahren" = 'Wholesale only' AND "Sparte" = '${markt['sparte']}'`;
                                try {
                                    const result =  await pool
                                        .query(queryStringDE);
                                        for (let index = 0; index < result.rows.length; index++) {
                                            let element =  result.rows[index];
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
                                for (let index = 0; index < result.rows.length; index++) {
                                    let element =  result.rows[index];
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
                                    let recievedData = result.rows;
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
                                                    sqlQueryMenge = `SELECT ${locationString} FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${tnrlies}' AND "Land" = '${Land}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail'`;
                                                    if(Land == 'Deutschland' && markt['sparte'] == 'PKW smart'){
                                                        sqlQueryMenge = `SELECT "Location_26005","Location_26105","Location_26205","Location_26305","Location_26405" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${tnrlies}' AND "Land" = '${Land}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale only'`
                                                    }
                                                    try{
                                                        const result = await pool.
                                                            query(sqlQueryMenge);
                                                            for (let index = 0; index < Object.keys(result.rows[0]).length; index++) {
                                                                const el = Object.keys(result.rows[0])[index];
                                                                element['MENGE'] += result.rows[0][`${el}`];
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
                                                    sqlQueryMenge = `SELECT "Location_${kdnr}" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${tnrlies}' AND "Land" = '${Land}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail'`;
                                                    try{
                                                        const result = await pool.
                                                            query(sqlQueryMenge);
                                                            element['MENGE'] = result.rows[0][`Location_${kdnr}`];
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
                                                from_var = ` lampa.lampa_pushmatrix WHERE "Land" = '${markt['MARKT']}' AND "Sparte" = '${markt['sparte']}'`;
                                                if((WK == 'R' && BEV == 'A')){
                                                    if(markt['Nische'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT (SUM("NR_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("NR_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        }catch(err){
                                                            console.log(err);
                                                        }
                                                    }else if(markt['Volumen'] == true){
                                                        try{
                                                            const result =  await pool
                                                                .query(`
                                                                SELECT (SUM("VR_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("VR_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                                console.log(`SELECT (SUM("VR_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("VR_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`)
                                                                console.log('ELEMENT Menge ' + element['MENGE']);
                                                                console.log('ELEMENT Mengen Addition  '+ result.rows[0]['Menge_addition']);
                                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                                console.log('ELEMENT MENGE Gesamt ' + element['MENGE']);
                                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        }catch(err){
                                                            console.log(err);
                                                        }
                                                    }
                                                }
                                                if((WK == 'S' && BEV == 'A')){
                                                    if(markt['Nische'] == true){
                                                        try {
                                                            const result =  await pool
                                                                .query(`SELECT (SUM("NS_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("NS_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                                console.log(`SELECT (SUM("NS_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("NS_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                    
                                                        } catch (err) {
                                                            console.log(`SELECT SUM(NR_V3)*(SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}') AS "Menge_addition" FROM ${from_var}`);
                                                        }
                                                    }else if(markt['Volumen'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT (SUM("VS_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM("VS_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                                console.log(`SELECT (SUM(VS_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                                (SUM(VS_V3) * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                                
                                                                
                                                                console.log('ELEMENT Menge ' + element['MENGE']);
                                                                console.log('Mengen Addition '+result.rows[0]['Menge_addition'])
                                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                                console.log('ELEMENT MENGE Gesamt ' + element['MENGE']);

                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT (SUM(VR_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) +
                                                            (SUM(VR_V3) * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                                                        }
                                                    }
                                                }
                                                if((WK == 'S' && BEV == 'K')){
                                                    if(markt['Nische'] == true){
                                                        try {
                                                            const result =  await pool
                                                                .query(`SELECT SUM("NK_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var} `);
                                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT SUM(NK_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var} `);
                                                            console.log("Line 811");
                                                        }
                                                    }else if(markt['Volumen'] == true){
                                                        try {
                                                            const result = await  pool
                                                                .query(`SELECT SUM("VK_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" ${from_var}`);
                                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                            
                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT SUM(VK_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}') AS "Menge_addition" ${from_var}`);
                                                            console.log("Line 821");
                                                        }
                                                    }
                                                }
                                                if((WK == 'U' && BEV == 'A')){
                                                    if(markt['Nische'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT (SUM("NU_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') + (SUM("NU_V3")* (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT (SUM(NU_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}') + (SUM(NU_V3)* (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}'))) AS "Menge_addition"  FROM ${from_var}`);
                                                            console.log("Line 834");
                                                        }
                                                    }else if(markt['Volumen'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT (SUM("VU_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail')  + (SUM("VU_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                            
                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                        console.log(`SELECT (SUM(VU_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}') + (SUM(VU_V3) * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}'))) AS "Menge_addition"  FROM ${from_var}`)
                                                        }
                                                    }
                                                }
                                                if((WK == 'U' && BEV == 'B')){
                                                    if(markt['Nische'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT SUM("NL_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                                                                element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                                element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT SUM(NL_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                                                            console.log("Line 857");
                                                        }
                                                    }else if(markt['Volumen'] == true){
                                                        try {
                                                            const result = await pool
                                                                .query(`SELECT SUM("VL_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                                                            element['MENGE'] = result.rows[0]['Menge_addition'] + element['MENGE'];
                                                            
                                                            element['Bestellmenge'] = result.rows[0]['Menge_addition'] + element['Bestellmenge'];
                                                        } catch (err) {
                                                            console.log(`SELECT SUM(VL_V2) * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${markt['MARKT']}' AND "Sparte"='${markt['sparte']}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
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
            const result = await pool.
                query(`SELECT  "Benennung_DE" FROM lampa.lampa_primus WHERE "MATNR_SORT" = '${element['TNRsort']}';`);
                console.log(result.rows);
                if(result.rows.length > 0){
                    element['Benennung'] = result.rows[0]['Benennung_DE'];
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
};



module.exports = { getTeilanlage, exportFixbedarfe, exportWIMS, exportOffeneBestellungenSPICS, exportKopfDaten, getDIMSandSPMboolean, getANRinputs, getFixbedarfe, getOffene, exportPO, newExportForecast };

// async function mengenAddition(pool,key){
//     let mengenAddition = 0;
//     let query = ``;
//     switch (key) {
//         case 'RA':
//             query = `SELECT (SUM("NR_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) +
//             (SUM("NR_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`;
//             break;
//         case 'SA':
        
//             break;
//         case 'SK':
        
//             break;
//         case 'UA':
        
//             break;
//         case 'UB':
        
//             break;
    
//         default:
//             break;
//     }
//     if((Land == 'Frankreich')){

//         let locationKNDR = location.KDNR;

//         if(locationKNDR === 53140 || locationKNDR === "53140") locationKNDR = 53138;
//         if(locationKNDR === 53141 || locationKNDR === "53141") locationKNDR = 53139;

//         from_var = `lampa_pushmatrix
//         WHERE  (Land = 'Frankreich') AND (Sparte = '${formData.sparte}') AND (VFNR IN
//                                     (SELECT DISTINCT Betrieb
//                                     FROM            lampa_ELC_Zugehörigkeit
//                                     WHERE        (ELC = '${locationKNDR}')))`
//     }else{
//         from_var = ` lampa_pushmatrix WHERE LAND = '${formData.country}' AND Sparte = '${req.body.sparte}'`;
//     }
//     if((WK == 'R' && BEV == 'A')){
//         if(formData.volNisch == 'Nische'){
//             const result = await pool
//                 .query(`SELECT (SUM("NR_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) +
//                 (SUM("NR_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
//                 element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//                 element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }else{
//             const result =  await pool
//                 .query(`
//                 SELECT (SUM("VR_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) +
//                 (SUM("VR_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
//                 element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//                 element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }
//     }
//     if((WK == 'S' && BEV == 'A')){
//         if(formData.volNisch == 'Nische'){
//             const result =  await pool
//                 .query(`SELECT (SUM("NS_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) +
//                 (SUM("NS_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }else{
//             const result = await pool
//                 .query(`SELECT (SUM("VS_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) +
//                 (SUM("VS_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')) AS Menge_addition FROM ${from_var}`);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];

//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];

//         }
//     }
//     if((WK == 'S' && BEV == 'K')){
//         if(formData.volNisch == 'Nische'){
//             const result =  await pool
//                 .query(`SELECT SUM("NK_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var} `);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }else{
//             const result = await  pool
//                 .query(`SELECT SUM("VK_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition ${from_var}`);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
            
//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }
//     }
//     if((WK == 'U' && BEV == 'A')){
//         if(formData.volNisch == 'Nische'){
//             const result = await pool
//                 .query(`SELECT (SUM("NU_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail') + (SUM("NU_V3")* (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail'))) AS Menge_addition  FROM ${from_var}`);
//                 element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//                 element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }else{
//             const result = await pool
//                 .query(`SELECT (SUM("VU_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail')  + (SUM("VU_V3") * (SELECT V3 FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail'))) AS Menge_addition  FROM ${from_var}`);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
            
//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }
//     }
//     if((WK == 'U' && BEV == 'B')){
//         if(formData.volNisch == 'Nische'){
//             const result = await pool
//                 .query(`SELECT SUM("NL_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
//                 element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
//                 element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }else{
//             const result = await pool
//                 .query(`SELECT SUM("VL_V2") * (SELECT "V2" FROM lampa_warenkorb WHERE TNRlies = '${element['TNRlies']}' AND Land = '${formData.country}' AND Sparte='${formData.sparte}' AND Verfahren = 'Wholesale & Retail') AS Menge_addition FROM ${from_var}`);
//             element['MENGE'] = result.recordset[0]['Menge_addition'] + element['MENGE'];
            
//             element['Bestellmenge'] = result.recordset[0]['Menge_addition'] + element['Bestellmenge'];
//         }
//     }
// }


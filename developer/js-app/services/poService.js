const miraConsts = require('../constants/mira');

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

const calcMengePO = async (eintrag,data,location,pool) => {
    let element = eintrag;
    const exportDetails = new PODetails(data.sparte,data.land,data.verfahren,data.volNisch,data.inputFahrzeug)
    const WK = element.WK;
    const BEV = element.BEV;
    let from_var = "";
    if(element['MENGE'] == null || element['MENGE'] == 0 || element['MENGE'] == '0' || element['MENGE'] == 'null'){ 
        let sqlQueryMenge = ``;
        sqlQueryMenge = `SELECT "Location_${location[0].KDNR}" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail'`;
        try{
            const result = await pool.
                query(sqlQueryMenge);
                element['MENGE'] = result.rows[0][`Location_${location[0].KDNR}`];
        }catch(err){
            // res.status(500);
            return true;
        } 
    }
    console.log(element['MENGE'],eintrag,'MENGEEE')
    if((WK == 'G' && BEV == 'C') || (WK == 'R' && BEV == 'C') || (WK == 'S' && BEV == 'C') || (WK == 'U' && BEV == 'C')){
        console.log(element['TNRlies']);
        return element['MENGE'];
    }else{
        from_var = ` lampa.lampa_pushmatrix WHERE "Land" = '${exportDetails.land}' AND "Sparte" = '${exportDetails.sparte}'`;
        if((WK == 'R' && BEV == 'A')){
            if(exportDetails.volNisch == 'Nische'){
                try {
                    const result = await pool
                        .query(`SELECT (SUM("NR_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                        (SUM("NR_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                        element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                        + element['MENGE'];
                }catch(err){
                    console.log(err);
                    return true;
                }
            }else if(exportDetails.volNisch == 'Volume'){
                try{
                    const result =  await pool
                        .query(`
                        SELECT (SUM("VR_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                        (SUM("VR_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                        element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                        + element['MENGE'];
                }catch(err){
                    console.log(err);
                    return true;
                }
            }
        }
        if((WK == 'S' && BEV == 'A')){
            if(exportDetails.volNisch == 'Nische'){
                try {
                    const result =  await pool
                        .query(`SELECT (SUM("NS_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                        (SUM("NS_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }else if(exportDetails.volNisch == 'Volume'){
                try {
                    const result = await pool
                        .query(`SELECT (SUM("VS_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) +
                        (SUM("VS_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')) AS "Menge_addition" FROM ${from_var}`);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }
        }
        if((WK == 'S' && BEV == 'K')){
            if(exportDetails.volNisch == 'Nische'){
                try {
                    const result =  await pool
                        .query(`SELECT SUM("NK_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var} `);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }else if(exportDetails.volNisch == 'Volume'){
                try {
                    const result = await  pool
                        .query(`SELECT SUM("VK_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" ${from_var}`);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }
        }
        if((WK == 'U' && BEV == 'A')){
            if(exportDetails.volNisch == 'Nische'){
                try {
                    const result = await pool
                        .query(`SELECT (SUM("NU_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail') + (SUM("NU_V3")* (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                        element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                        + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }else if(exportDetails.volNisch == 'Volume'){
                try {
                    const result = await pool
                        .query(`SELECT (SUM("VU_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail')  + (SUM("VU_V3") * (SELECT "V3" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail'))) AS "Menge_addition"  FROM ${from_var}`);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }
        }
        if((WK == 'U' && BEV == 'B')){
            if(exportDetails.volNisch == 'Nische'){
                try {
                    const result = await pool
                        .query(`SELECT SUM("NL_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                        element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                        + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }else if(exportDetails.volNisch == 'Volume'){
                try {
                    const result = await pool
                        .query(`SELECT SUM("VL_V2") * (SELECT "V2" FROM lampa.lampa_warenkorb WHERE "TNRlies" = '${element['TNRlies']}' AND "Land" = '${exportDetails.land}' AND "Sparte"='${exportDetails.sparte}' AND "Verfahren" = 'Wholesale & Retail') AS "Menge_addition" FROM ${from_var}`);
                    element['MENGE'] = parseInt(result.rows[0]['Menge_addition']) 
                    + element['MENGE'];
                } catch (err) {
                    console.log(err);
                    return true;
                }
            }
        }
        return element['MENGE'] == undefined ? 0 : (element['MENGE'] + element['Menge']); 
    }
};

const convertToPOFormat = (tnrlies) =>{
    switch (tnrlies.length) {
        case miraConsts.WITH_ES1_NO_ES2_LENGTH:
            return `${tnrlies.substring(0,miraConsts.NO_ES_LENGTH)}${miraConsts.WHITE_SPACE_ES1}${tnrlies.substring(miraConsts.NO_ES_LENGTH,tnrlies.length)}`;
            break;
        case miraConsts.WITH_ES2_NO_ES1_LENGTH:
            return `${tnrlies.substring(0,miraConsts.NO_ES_LENGTH)}${miraConsts.WHITE_SPACE_ES2}${tnrlies.substring(miraConsts.NO_ES_LENGTH,tnrlies.length)}`;
            break;
        case miraConsts.WITH_ES1_ES2_LENGTH:
            return `${tnrlies.substring(0,miraConsts.NO_ES_LENGTH)}${miraConsts.WHITE_SPACE_ES1_ES2}${tnrlies.substring(miraConsts.NO_ES_LENGTH,tnrlies.length)}`;
            break;
        default:
            return tnrlies;
            break;
    }
}

module.exports = { PODetails, calcMengePO, convertToPOFormat };
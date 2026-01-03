

// let zuExportierendeTeileListe;
// app.post('/exportTeileListe', async (req,res) => {
//     zuExportierendeTeileListe = req.body;
//     res.status(200).json({ error: false });
// })
// app.get('/exportTeileListe', async (req,res) => {
//     let cancelRequest;
//     req.on('close', function (err){
//         cancelRequest = true;
//         console.log('Client closed connection')
//     });
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Connection', 'keep alive');
//     res.setHeader('X-Accel-Buffering', 'no');
//     res.flushHeaders(); 

//     Stream.on('push', (event,data) => {
//         res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
//         res.flush();
//     })
//     Stream.on('end', (event,data) => {
//         res.end();
//     })
//     Stream.emit('push', 'message', { msg: 'Daten werden vorbereitet!' , loading: 5});
//     req.body = zuExportierendeTeileListe;
//     /* Request Timeout wird hochgesetzt da der Export bis zu 20 min dauern kann */
//     req.setTimeout(1500000);
//     let sparte = req.body.sparte;
//     console.log(sparte);
//     let extraMaerkte = ['USA','ECE','China'];
//     let builtRationString = '';
//     if(sparte == 'PKW' || sparte == 'EQ'){
//         builtRationString = "'' AS [Built Ratio USA], '' AS [Built Ratio China], '' AS [Built Ratio USA], "
//     }else{
//         builtRationString = "'' AS [Built Ratio], "
//     }
//     let baureihe = req.body.baureihenkenner;
//     let kenner = [];
//     let kennerKeys = Object.keys(req.body.baureihenkenner);
//     let kennerQuery = ``;
//     let foundGrundnummer = [];
//     /* Baureihen kenner werden rausgezogen */
//     for (let index = 0; index < kennerKeys.length; index++) {
//         const element = baureihe[`${kennerKeys[index]}`];
//         if(kennerKeys[index] != 'Fahrzeug' && element != '' && element != null){
//             /* Einzelne Baureihenkenner werden in einem Array gespeichert */
//             kenner.push(element);
//             if(index != 1){
//                 kennerQuery += `OR Technik_Info LIKE '${element}%' `;
//             }else{
//                 kennerQuery += ` Technik_Info LIKE '${element}%' `;
//             }
//         }
//     }
//     let primusData = [];
//     let stuecklistenData = []
//     try {
//         const pool = await poolPromise
//         const result = await pool.request()
//             .query(`SELECT * FROM lampa_stueckliste WHERE Sparte = '${sparte}';`);
//             stuecklistenData = result.recordset;
//     } catch (err) {
//         res.status(500).json({ error: true, errorMessage: err });
//     }
//     let primusQuery = '';
//     for (let longIndex = 0; longIndex < stuecklistenData.length; longIndex++) {
//         const stueckListenElement = stuecklistenData[longIndex];
//         primusQuery += `'${stueckListenElement['TNRsort']}',`;
//     }
//     let finishedData = [];
//     let val = '';
//     let counter = 0;
//     const pool = await poolPromise;
//     let indexer = 0;
//     let mengenString = '';
//     let mengenStringV2 = '';
//     ('push', 'message', { msg: 'Daten werden abgefragt!' , loading: 15});
//     let bar = new Promise((resolve,reject) => {
//         stuecklistenData.forEach( async (element ,index) => {
//             setTimeout(async () => {
//                 if(!cancelRequest){
//                 mengenString = '';
//                 mengenStringV2 = '';
//                 indexer++;
//                 for (let index = 0; index < Object.keys(element).length; index++) {
//                     let objIndex =  Object.keys(element)[index];
//                     if(element[objIndex] != null){
//                         if(objIndex.search('MG') > -1){
//                             mengenString += `'${element[objIndex]}' AS [Qty ${objIndex}],`;
//                             mengenStringV2 += `'' AS [Qty ${objIndex}],`;
//                         }
//                     }
//                 }
//                 try {
//                     console.log('here');
//                     // console.log(`
//                     // SELECT  
//                     // '${baureihe['Fahrzeug']}' AS Model,
//                     // '${element['Submodul']}' AS Module,
//                     // '${element['Teil']}' AS Teil,
//                     // lampa_primus.MATNR_SORT AS [Part no. sort],
//                     // MATNR_DRUCK AS [Part no. read],
//                     // lampa_primus.[Benennung_DE] AS [Name in German],
//                     // lampa_primus.[Benennung_EN] AS [Name in English],
//                     // lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                     // lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                     // '${element['Codebedingung lang']}' AS [Sales codes],
//                     // '${element['LK']}' AS [RHD/LHD],
//                     // ${mengenString}
//                     // '${element['Verbaurate']}' AS [Built ratio],
//                     // [Technik_info] AS [New model ID],
//                     // [Warenkorb_KNR] AS [Basket ID Is],
//                     // '' AS [Basket ID Target],
//                     // '' AS [Prio USA],
//                     // '' AS [Qty USA],
//                     // '' AS [Line GB],
//                     // '' AS [Basket ID Proposal],
//                     // '' AS [Pos Prognose],
//                     // '' AS [Anmerkung ECE],
//                     // '' AS Remark,
//                     // Term_ID as TermID,
//                     // [Beschaffungs_Art] AS [Procurement type],
//                     // Anlagedatum AS [Creation date],
//                     // [Seriengueltigkeit_Beginn] AS [Launch date],
//                     // [Max_LG_Zeit] AS [Shelf life],
//                     // [Gefahrgut_KLS] AS [Haz. Mat.],
//                     // lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                     // lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                     // [KNZ_Sonderedition] AS [ID special edition],
//                     // [Sicherheits_Relevanz] AS [Driving relevance],
//                     // [B9_Status_Wert] AS [B9 key],
//                     // [Marketingcode] AS [Marketing code],
//                     // Laenge AS Length,
//                     // Breite AS Width,
//                     // Hoehe AS Height,
//                     // Gewicht AS Weight,
//                     // ES2
//                     // FROM lampa_primus 
//                     // LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT) 
//                     // LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT)
//                     // WHERE Grundnummer = '${element['TNRsort']}' AND (${kennerQuery});`)
//                     const primusQuerySql = (sparte === 'PKW' || sparte === 'EQ') ? 
//                     `SELECT  
//                     '${baureihe['Fahrzeug']}' AS Model,
//                     '${element['Submodul']}' AS Module,
//                     '${element['Teil']}' AS Teil,
//                     lampa_primus.MATNR_SORT AS [Part no. sort],
//                     MATNR_DRUCK AS [Part no. read],
//                     lampa_primus.[Benennung_DE] AS [Name in German],
//                     lampa_primus.[Benennung_EN] AS [Name in English],
//                     lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                     lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                     '${element['Codebedingung lang']}' AS [Sales codes],
//                     '${element['LK']}' AS [RHD/LHD],
//                     ${mengenString}
//                     '${element['Verbaurate']}' AS [Built ratio],
//                     [Technik_info] AS [New model ID],
//                     [Warenkorb_KNR] AS [Basket ID Is],
//                     '' AS [Basket ID Target],
//                     '' AS [Prio USA],
//                     '' AS [Qty USA],
//                     '' AS [Line GB],
//                     '' AS [Basket ID Proposal],
//                     '' AS [Pos Prognose],
//                     '' AS [Anmerkung ECE],
//                     '' AS Remark,
//                     Term_ID as TermID,
//                     [Beschaffungs_Art] AS [Procurement type],
//                     Anlagedatum AS [Creation date],
//                     [Seriengueltigkeit_Beginn] AS [Launch date],
//                     [Max_LG_Zeit] AS [Shelf life],
//                     [Gefahrgut_KLS] AS [Haz. Mat.],
//                     lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                     lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                     [KNZ_Sonderedition] AS [ID special edition],
//                     [Sicherheits_Relevanz] AS [Driving relevance],
//                     [B9_Status_Wert] AS [B9 key],
//                     [Marketingcode] AS [Marketing code],
//                     Laenge AS Length,
//                     Breite AS Width,
//                     Hoehe AS Height,
//                     Gewicht AS Weight,
//                     ES2,
//                     [Lieferant 1],
//                     [Lieferant 3]
//                     FROM lampa_primus 
//                     LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT)
//                     LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                     WHERE Grundnummer = '${element['TNRsort']}' AND (${kennerQuery});`
//                     : `
//                     SELECT  
//                     '${baureihe['Fahrzeug']}' AS Model,
//                     '${element['Submodul']}' AS Module,
//                     '${element['Teil']}' AS Teil,
//                     lampa_primus.MATNR_SORT AS [Part no. sort],
//                     MATNR_DRUCK AS [Part no. read],
//                     lampa_primus.[Benennung_DE] AS [Name in German],
//                     lampa_primus.[Benennung_EN] AS [Name in English],
//                     lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                     lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                     '${element['Codebedingung lang']}' AS [Sales codes],
//                     '${element['LK']}' AS [RHD/LHD],
//                     ${mengenString}
//                     '${element['Verbaurate']}' AS [Built ratio],
//                     [Technik_info] AS [New model ID],
//                     [Warenkorb_KNR] AS [Basket ID Is],
//                     '' AS [Basket ID Target],
//                     '' AS [Prio USA],
//                     '' AS [Qty USA],
//                     '' AS [Line GB],
//                     '' AS [Basket ID Proposal],
//                     '' AS [Pos Prognose],
//                     '' AS [Anmerkung ECE],
//                     '' AS Remark,
//                     Term_ID as TermID,
//                     [Beschaffungs_Art] AS [Procurement type],
//                     Anlagedatum AS [Creation date],
//                     [Seriengueltigkeit_Beginn] AS [Launch date],
//                     [Max_LG_Zeit] AS [Shelf life],
//                     [Gefahrgut_KLS] AS [Haz. Mat.],
//                     lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                     lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                     [KNZ_Sonderedition] AS [ID special edition],
//                     [Sicherheits_Relevanz] AS [Driving relevance],
//                     [B9_Status_Wert] AS [B9 key],
//                     [Marketingcode] AS [Marketing code],
//                     Laenge AS Length,
//                     Breite AS Width,
//                     Hoehe AS Height,
//                     Gewicht AS Weight,
//                     ES2
//                     FROM lampa_primus 
//                     LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT)
//                     LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                     WHERE Grundnummer = '${element['TNRsort']}' AND (${kennerQuery});`;
//                     console.log(primusQuerySql);
//                     const result = await pool.request().query(primusQuerySql);
//                     if(result.recordset.length > 0){
//                         foundGrundnummer.push(element['TNRsort']);
//                         for (let index = 0; index < result.recordset.length; index++) {
//                             const el = result.recordset[index];
//                             finishedData.push(el);
//                         }
//                     }else{
//                         // ### Obsolete else
//                         // console.log('no result');
//                     }
//                 } catch (err) {
//                     console.log(err,"here error");
//                 }
//                 if (index === stuecklistenData.length -1) resolve();
//             }else{
//                 resolve();
//             }
//             }, counter * 25);
            
//             counter++;
//         });
//     });
//     bar.then(async () => {
//         if(!cancelRequest){
//             let exportArray = [];
//             Stream.emit('push', 'message', { msg: 'Daten werden verarbeitet!' , loading: 20});
//             for (let index = 0; index < finishedData.length; index++) {
//                 if(cancelRequest){
//                     break;
//                 }
//                 const element = finishedData[index];
//                 let termId  = element['TermID'];
//                 let query = `
//                 SELECT * From lampa_standartwarenkorb 
//                 WHERE [WK Pos] = (
//                     SELECT TOP 1 WK_Pos_Proposal From lampa_termIDs 
//                     WHERE TermID = '${termId}' AND Modul = '${element['Module']}' 
//                     AND Sparte ='${sparte}'
//                 ) 
//                 AND Sparte = '${sparte}';
//                 SELECT TOP 1 * From lampa_termIDs 
//                 WHERE TermID = '${termId}' 
//                 AND Modul = '${element['Module']}' AND Sparte='${sparte}';`;
                
//                 try {
//                     const pool = await poolPromise;
//                     const result = await pool.request().query(`${query}`);
//                     // ### Obsolete if
//                     if(result.recordsets[0][0] != undefined && result.recordsets[1][0] != undefined){
//                         // console.log(query);
//                     }
//                     if(result.recordsets[0][0] != undefined){
//                         element['Line GB'] = result.recordsets[0][0]['WK Pos'];
//                         element['Pos Prognose'] = result.recordsets[0][0]['WK Pos'];
//                         if(result.recordsets[1][0] != undefined){
//                             element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             element['Qty USA Proposal'] = result.recordsets[1][0]['QTY'];
//                             element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             element['USA_Prio Proposal'] = result.recordsets[1][0]['Prio'];

//                             // if(){

//                             // }
//                             // element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             // element['Qty USA Proposal'] = result.recordsets[1][0]['QTY'];
//                             // element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             // element['Prio USA Proposal'] = result.recordsets[1][0]['Prio'];
//                             // element['Small Pkg'] = result.recordsets[1][0]['Small_Pkg'];
//                             // element['Large Pkg'] = result.recordsets[1][0]['Large_Pkg'];
//                             // element['Package No'] = result.recordsets[1][0]['Package_No'];
//                             // element['Anmerkung USA'] = result.recordsets[1][0]['Anmerkung_USA'];
//                         }else{
//                             element['Basket ID Proposal'] = '';
//                             element['Qty USA Proposal'] = '';
//                             element['Anmerkung ECE'] = '';
//                             element['USA_Prio Proposal'] = '';

//                             // element['Qty USA Proposal'] = '';
//                             // element['Anmerkung ECE'] = '';
//                             // element['Prio USA Proposal'] = '';
//                             // element['Small Pkg'] = '';
//                             // element['Large Pkg'] = '';
//                             // element['Package No'] = '';
//                             // element['Anmerkung USA'] = '';
//                         }
//                         exportArray.push(element);
//                     }else{
//                         if(result.recordsets[1][0] != undefined){
//                             element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             element['Pos Prognose'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             element['Line GB'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             element['USA_Prio Proposal'] = result.recordsets[1][0]['USA_Prio'];

//                             // element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             // element['Qty USA Proposal'] = result.recordsets[1][0]['QTY'];
//                             // element['Pos Prognose'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             // element['Line GB'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             // element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             // element['USA_Prio Proposal'] = result.recordsets[1][0]['USA_Prio'];
//                         }else{
//                             element['Anmerkung ECE'] = '';
//                             element['USA_Prio Proposal'] = '';
//                         }
//                         exportArray.push(element);
//                     }
//                 } catch (error) {
//                     console.log(error);
//                 } 
//             }
//             Stream.emit('push', 'message', { msg: 'Verbauraten Berechnung!' ,data: exportArray, loading: 30});
//             /* Verbauraten Berechnung  */
//             let farbenArray = [];
//             if(sparte != 'PKW_Motor_Benzin' && sparte != 'PKW_Motor_Diesel'){
//                 for (let index = 0; index < exportArray.length; index++) {
//                     if(cancelRequest){
//                         break;
//                     }
//                     let element = exportArray[index];
//                     if(sparte == 'PKW' || sparte == 'EQ'){
//                         delete element['Built ratio'];
//                     }
//                     let es2 = element['ES2'];
//                     let farbVerbaurate = '';
//                     let isFarbe = false;
//                     let farbverbauratenArr = [];
//                     /* Farbverbauraten */
//                     if(es2){
//                         if(es2.length >= 3){
//                             // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051)
//                             if(es2 != '9999' && es2 != '9051' && es2 != '9116'){
//                                 if(es2.search(' ') < 0){
//                                     secondPos = es2.substring(1,2);
//                                     if(secondPos.match(/[a-z]/i) == null){
//                                         if(es2.substring(1,2)){
//                                             farbVerbaurate = es2.substring(es2.length-3,es2.length);
//                                             const marktCode = es2.substring(es2.length-3,es2.length) + 'U';
//                                             farbVerbaurate = farbVerbaurate+'U';
//                                             if(sparte == 'PKW' || sparte == 'EQ'){
//                                                 for(let markt of extraMaerkte){
//                                                     let farbVerbaurateMarkt = await verbauratenBerechnung(farbVerbaurate,sparte,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                                                     farbVerbaurateMarkt = parseFloat(farbVerbaurateMarkt.replace('%',''));
//                                                     farbverbauratenArr.push(farbVerbaurateMarkt)
//                                                 }
//                                             }else{
//                                                 farbVerbaurate = await verbauratenBerechnung(farbVerbaurate,sparte,'lampa_verbauraten','');
//                                             }
//                                             farbVerbaurate = parseFloat(farbVerbaurate.replace('%',''));
//                                             farbenArray.push({'Teil': element['Teil'],'Farbbaurate':farbVerbaurate, 'TNRsort': element['Part no. sort']})
//                                             isFarbe = true;
//                                         } 
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                     /* Verbauraten Spalten */
//                     if(isFarbe != false){
//                         if(farbVerbaurate != 0){
//                             farbVerbaurate / 100
//                         }
//                         if(sparte == 'PKW' || sparte == 'EQ'){
//                             let i = 0;
//                             for(let markt of extraMaerkte){
//                                 element[`Built ratio ${markt}`] = await verbauratenBerechnung(element['Sales codes'],sparte,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                                 element[`Built ratio ${markt}`] = ((parseFloat(element[`Built ratio ${markt}`].replace('%','')) / 100)*(farbverbauratenArr[i])) ;
//                                 element[`Built ratio ${markt}`] = parseFloat(element[`Built ratio ${markt}`]).toFixed(2)
//                                 if(element[`Built ratio ${markt}`] > 100){
//                                     element[`Built ratio ${markt}`] = '100.00%';
//                                 }else{
//                                     element[`Built ratio ${markt}`] += '%';
//                                 }
//                                 i++;
//                             }
//                         }else{
//                             element['Built ratio'] = await verbauratenBerechnung(element['Sales codes'],sparte,'lampa_verbauraten','');
//                             element['Built ratio'] = ((parseFloat(element['Built ratio'].replace('%','')) / 100)*(farbVerbaurate)) ;
//                             element['Built ratio'] = parseFloat(element['Built ratio']).toFixed(2)   
//                             if(element['Built ratio'] > 100){
//                                 element['Built ratio'] = '100.00%';
//                             }else{
//                                 element['Built ratio'] += '%';
//                             }
//                         }
//                     }else{
//                         if(sparte == 'PKW' || sparte == 'EQ'){
//                             for(let markt of extraMaerkte){
//                                 element[`Built ratio ${markt}`] = await verbauratenBerechnung(element['Sales codes'],sparte,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                             }
//                         }else{
//                             element['Built ratio'] = await verbauratenBerechnung(element['Sales codes'],sparte,'lampa_verbauraten','');
//                         }
//                         if(element['Built ratio'] > 100){
//                             element['Built ratio'] = '100%';
//                         }
//                     }
//                 }
//             }else{
//                 for (let index = 0; index < exportArray.length; index++) {
//                     let element = exportArray[index];
//                     delete element['Built ratio'];
//                     if(cancelRequest){
//                         break;
//                     }
//                 }
//             }
//             if(!cancelRequest){
//                 Stream.emit('push', 'message', { msg: 'Verbauraten wurden berechnet.' , loading: 60});
//                 let baureihenSql = ` SELECT  
//                 '' AS Model,
//                 '' AS Module,
//                 '' AS Teil,
//                 lampa_primus.MATNR_SORT AS [Part no. sort],
//                 MATNR_DRUCK AS [Part no. read],
//                 lampa_primus.[Benennung_DE] AS [Name in German],
//                 lampa_primus.[Benennung_EN] AS [Name in English],
//                 lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                 lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                 '' AS [Sales codes],
//                 '' AS [RHD/LHD],
//                 ${mengenStringV2}
//                 ${builtRationString}
//                 [Technik_info] AS [New model ID],
//                 [Warenkorb_KNR] AS [Basket ID Is],
//                 '' AS [Basket ID Target],
//                 '' AS [Prio USA],
//                 '' AS [Qty USA],
//                 '' AS [Line GB],
//                 '' AS [Basket ID Proposal],
//                 '' AS [Pos Prognose],
//                 '' AS [Anmerkung ECE],
//                 '' AS Remark,
//                 Term_ID as TermID,
//                 [Beschaffungs_Art] AS [Procurement type],
//                 Anlagedatum AS [Creation date],
//                 [Seriengueltigkeit_Beginn] AS [Launch date],
//                 [Max_LG_Zeit] AS [Shelf life],
//                 [Gefahrgut_KLS] AS [Haz. Mat.],
//                 lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                 lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                 [KNZ_Sonderedition] AS [ID special edition],
//                 [Sicherheits_Relevanz] AS [Driving relevance],
//                 [B9_Status_Wert] AS [B9 key],
//                 [Marketingcode] AS [Marketing code],
//                 Laenge AS Length,
//                 Breite AS Width,
//                 Hoehe AS Height,
//                 Gewicht AS Weight,
//                 ES2
//                 FROM lampa_primus 
//                 LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT) 
//                 LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                 WHERE (${kennerQuery})`;
//                 for (let index = 0; index < stuecklistenData.length; index++) {
//                     const element = stuecklistenData[index];
//                     baureihenSql += ` AND Grundnummer <> '${element['TNRsort']}'`
//                 }
//                 let baureihendata = [];
//                 console.log(baureihenSql)
//                 try {
//                     const pool = await poolPromise
//                     const result = await pool.request()
//                         .query(baureihenSql);
//                         baureihendata = result.recordset;
//                 } catch (error) {
//                     console.log('error!')
//                     res.status(500).json({ error: true, errorMessage: error });
//                 }
//                 for (let index = 0; index < baureihendata.length; index++) {
//                     const element = baureihendata[index];
//                     exportArray.push(element);
//                 }
//                 Stream.emit('push', 'message', { msg: 'Teileliste wird fertig gestellt!' , loading: 85});
//                 for (let index = 0; index < exportArray.length; index++) {
//                     let element = exportArray[index];
//                     let keys = Object.keys(element);
//                     for (let index = 0; index < keys.length; index++) {
//                         const el = keys[index];
//                         if(el.search(' MG') > 0){
//                             element[`${el}`] = parseInt(element[`${el}`])
//                         }
//                     }
//                     element['Module'] = parseInt(element['Module']);
//                     element['Line GB'] = parseInt(element['Line GB']);
//                     element['Pos Prognose'] = parseInt(element['Pos Prognose']);
//                     element['USA_Prio Proposal'] = parseInt(element['USA_Prio Proposal']);
//                     element['Length'] = parseFloat(element['Length'])
//                     element['Width'] = parseFloat(element['Width'])
//                     element['Height'] = parseFloat(element['Height'])
//                     element['Weight'] = parseFloat(element['Weight'])
//                     //TODO: Ging vorher ohne toString(), kam  im Datumsformat und warf einen Fehler
//                     element['Creation date'] = element['Creation date'].toString();
//                     element['Launch date'] = element['Launch date'].toString();
//                     let newCreationDate = element['Creation date'].substring(0,4)+'.'+element['Creation date'].substring(4,6) +'.'+ element['Creation date'].substring(6,8);
//                     element['Creation date'] = newCreationDate;
//                     let newLaunchDate = element['Launch date'].substring(0,4)+'.'+element['Launch date'].substring(4,6) +'.'+ element['Launch date'].substring(6,8);
//                     element['Launch date'] = newLaunchDate;
//                     delete element['Teil'];
//                     delete element['ES2'];
//                     console.log('element after\n')
//                     console.log(element)
//                     if(sparte == 'Van'){
//                         console.log('is equal');
//                         delete element['Anmerkung USA'];
//                         delete element['Large Pkg'];
//                         delete element['Package No'];
//                         delete element['USA_Prio Proposal'];
//                         element['Built ratio'] = parseFloat(element['Built ratio'].replace('%')) /100;
//                     }else if(sparte == 'PKW_Motor_Diesel' || sparte == 'PKW_Motor_Benzin'){
//                         delete element['Built ratio'];
//                     }else{
//                         if(sparte == 'PKW' || sparte == 'EQ'){
        
//                         }else{
//                             element['Built ratio'] = parseFloat(element['Built ratio'].replace('%')) /100;
//                         }
//                     }
//                 }
//                 let verbaurateColumnPlace = 0;
//                 let mengenNameArrayV2 = []
//                 for (let index = 0; index < exportArray.length; index++) {
//                     const element = exportArray[index];
//                     for (let index = 0; index < Object.keys(element).length; index++) {
//                         const el = Object.keys(element)[index];
//                         mengenNameArrayV2.push(el)
//                     }
//                 }
//                 exportArray = exportArray.map((row) => {
//                     let keys = Object.keys(row);
//                     let obj = {};
//                     for (let index = 0; index < keys.length; index++) {
//                         const el = keys[index];
//                         if(el.search(' MG') > 0){
//                             obj[`${el.substring(0,el.search(' MG'))}`] = row[`${el}`];
//                         }else{
//                             obj[`${el}`] = row[`${el}`]
//                         }
//                     }
//                     return obj;
//                 })
//                 if(sparte == 'EQ' || sparte == 'PKW'){
//                     const propKeys = [...Object.keys(exportArray[0])]
//                     propKeys.splice(propKeys.indexOf("New model ID"),0,'Built ratio ECE')
//                     propKeys.splice(propKeys.indexOf("Built ratio ECE")+1,0,'Built ratio USA')
//                     propKeys.splice(propKeys.indexOf("Built ratio USA")+1,0,'Built ratio China')
//                     const newPropArray = propKeys.slice(0,-3)
//                     exportArray = reorgArrayProp(newPropArray,exportArray);
//                 }
//                 Stream.emit('push', 'message', { msg: 'Teileliste wird exportiert!' , loading: 100, data: { error: false, teileListe : exportArray, columnPlace : verbaurateColumnPlace}});
//             }else{
//                 // Error
//                 Stream.emit('push', 'message', { msg: 'User hat verbindung abgebrochen!' , loading: -1});
//             }
//         }else{
//             // Error
//             Stream.emit('push', 'message', { msg: 'User hat verbindung abgebrochen!' , loading: -1});
//         }
//     });
// });

// app.post("/exportTeilelisteNeu", async (req,res) => {
//     /* Request Timeout wird hochgesetzt da der Export bis zu 20 min dauern kann */
//     req.setTimeout(1500000);


//     const SPARTE = req.body.sparte;
//     const BAUREIHENKENNER = req.body.baureihenkenner;
//     if(!SPARTE || !BAUREIHENKENNER) return res.status(404).json({message: 'missing parameters'});
    
//     const BAUREIHENKENNER_KEYS = Object.keys(BAUREIHENKENNER);
//     const EXTRA_MAERKTE = ['USA','ECE','China'];
//     const BUILT_RATIO_QRY_STRING = SPARTE == 'PKW' || SPARTE == 'EQ'
//     ? "'' AS [Built Ratio USA], '' AS [Built Ratio China], '' AS [Built Ratio USA], "
//     : "'' AS [Built Ratio], ";

//     let kenner = [];
//     let kennerQuery = ``;
//     /* Baureihen kenner werden rausgezogen */
//     for (let index = 0; index < BAUREIHENKENNER_KEYS.length; index++) {
//         const element = BAUREIHENKENNER[`${BAUREIHENKENNER_KEYS[index]}`];
//         if(BAUREIHENKENNER_KEYS[index] != 'Fahrzeug' && element != '' && element != null){
//             kenner.push(element);
//             kennerQuery += (index !== 1 ? "OR " : "") + `Technik_Info LIKE '${element}%' `;
//         }
//     }
    
//     let foundGrundnummer = [];
//     let stuecklistenData = [];
//     try {
//         const pool = await poolPromise;
//         const result = await pool.request()
//             .query(`SELECT TOP (5) * FROM lampa_stueckliste WHERE Sparte = '${SPARTE}';`);
//             stuecklistenData = result.recordset;
//     } catch (err) {
//         return res.status(500).json({ error: true, errorMessage: err });
//     }

//     let finishedData = [];
//     let counter = 0;
//     const pool = await poolPromise;
//     let mengenString = '';
//     let mengenStringV2 = '';
//     // Stream.emit('push', 'message', { msg: 'Daten werden abgefragt!' , loading: 15});

//     let grundnummerRequests = new Promise((resolve,reject) => {
//         stuecklistenData.forEach( async (element ,index) => {
//             setTimeout(async () => {
//                 mengenString = '';
//                 mengenStringV2 = '';
//                 for (let index = 0; index < Object.keys(element).length; index++) {
//                     let objIndex =  Object.keys(element)[index];
//                     if(element[objIndex] != null){
//                         if(objIndex.search('MG') > -1){
//                             mengenString += `'${element[objIndex]}' AS [Qty ${objIndex}],`;
//                             mengenStringV2 += `'' AS [Qty ${objIndex}],`;
//                         }
//                     }
//                 }
//                 try {
//                     const primusQuerySql = (SPARTE === 'PKW' || SPARTE === 'EQ') ? 
//                     `SELECT  
//                     '${BAUREIHENKENNER['Fahrzeug']}' AS Model,
//                     '${element['Submodul']}' AS Module,
//                     '${element['Teil']}' AS Teil,
//                     lampa_primus.MATNR_SORT AS [Part no. sort],
//                     MATNR_DRUCK AS [Part no. read],
//                     lampa_primus.[Benennung_DE] AS [Name in German],
//                     lampa_primus.[Benennung_EN] AS [Name in English],
//                     lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                     lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                     '${element['Codebedingung lang']}' AS [Sales codes],
//                     '${element['LK']}' AS [RHD/LHD],
//                     ${mengenString}
//                     '${element['Verbaurate']}' AS [Built ratio],
//                     [Technik_info] AS [New model ID],
//                     [Warenkorb_KNR] AS [Basket ID Is],
//                     '' AS [Basket ID Target],
//                     '' AS [Prio USA],
//                     '' AS [Qty USA],
//                     '' AS [Line GB],
//                     '' AS [Basket ID Proposal],
//                     '' AS [Pos Prognose],
//                     '' AS [Anmerkung ECE],
//                     '' AS [USA_Prio Proposal],
//                     '' AS Remark,
//                     Term_ID as TermID,
//                     [Beschaffungs_Art] AS [Procurement type],
//                     Anlagedatum AS [Creation date],
//                     [Seriengueltigkeit_Beginn] AS [Launch date],
//                     [Max_LG_Zeit] AS [Shelf life],
//                     [Gefahrgut_KLS] AS [Haz. Mat.],
//                     lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                     lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                     [KNZ_Sonderedition] AS [ID special edition],
//                     [Sicherheits_Relevanz] AS [Driving relevance],
//                     [B9_Status_Wert] AS [B9 key],
//                     [Marketingcode] AS [Marketing code],
//                     Laenge AS Length,
//                     Breite AS Width,
//                     Hoehe AS Height,
//                     Gewicht AS Weight,
//                     ES2,
//                     [Lieferant 1],
//                     [Lieferant 3]
//                     FROM lampa_primus 
//                     LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT)
//                     LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                     WHERE Grundnummer = '${element['TNRsort']}' AND (${kennerQuery});`
//                     : `
//                     SELECT  
//                     '${BAUREIHENKENNER['Fahrzeug']}' AS Model,
//                     '${element['Submodul']}' AS Module,
//                     '${element['Teil']}' AS Teil,
//                     lampa_primus.MATNR_SORT AS [Part no. sort],
//                     MATNR_DRUCK AS [Part no. read],
//                     lampa_primus.[Benennung_DE] AS [Name in German],
//                     lampa_primus.[Benennung_EN] AS [Name in English],
//                     lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                     lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                     '${element['Codebedingung lang']}' AS [Sales codes],
//                     '${element['LK']}' AS [RHD/LHD],
//                     ${mengenString}
//                     '${element['Verbaurate']}' AS [Built ratio],
//                     [Technik_info] AS [New model ID],
//                     [Warenkorb_KNR] AS [Basket ID Is],
//                     '' AS [Basket ID Target],
//                     '' AS [Prio USA],
//                     '' AS [Qty USA],
//                     '' AS [Line GB],
//                     '' AS [Basket ID Proposal],
//                     '' AS [Pos Prognose],
//                     '' AS [Anmerkung ECE],
//                     '' AS Remark,
//                     '' AS [USA_Prio Proposal],
//                     Term_ID as TermID,
//                     [Beschaffungs_Art] AS [Procurement type],
//                     Anlagedatum AS [Creation date],
//                     [Seriengueltigkeit_Beginn] AS [Launch date],
//                     [Max_LG_Zeit] AS [Shelf life],
//                     [Gefahrgut_KLS] AS [Haz. Mat.],
//                     lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                     lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                     [KNZ_Sonderedition] AS [ID special edition],
//                     [Sicherheits_Relevanz] AS [Driving relevance],
//                     [B9_Status_Wert] AS [B9 key],
//                     [Marketingcode] AS [Marketing code],
//                     Laenge AS Length,
//                     Breite AS Width,
//                     Hoehe AS Height,
//                     Gewicht AS Weight,
//                     ES2
//                     FROM lampa_primus 
//                     LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT)
//                     LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                     WHERE Grundnummer = '${element['TNRsort']}' AND (${kennerQuery});`;
//                     const result = await pool.request().query(primusQuerySql);
//                     if(result.recordset.length > 0){
//                         foundGrundnummer.push(element['TNRsort']);
//                         for (let index = 0; index < result.recordset.length; index++) {
//                             const el = result.recordset[index];
//                             finishedData.push(el);
//                         }
//                     }
//                 } catch (err) {
//                     console.log(err,"here error");
//                 }
//                 if (index === stuecklistenData.length -1) resolve();
//             }, counter * 25);
            
//             counter++;
//         });
//     });
//     grundnummerRequests.then(async () => {
//             let exportArray = [];
//             // Stream.emit('push', 'message', { msg: 'Daten werden verarbeitet!' , loading: 20});
//             for (let index = 0; index < finishedData.length; index++) {
//                 const element = finishedData[index];
//                 let termId  = element['TermID'];
//                 let query = `
//                 SELECT * From lampa_standartwarenkorb 
//                 WHERE [WK Pos] = (
//                     SELECT TOP 1 WK_Pos_Proposal From lampa_termIDs 
//                     WHERE TermID = '${termId}' AND Modul = '${element['Module']}' 
//                     AND Sparte ='${SPARTE}'
//                 ) 
//                 AND Sparte = '${SPARTE}';
//                 SELECT TOP 1 * From lampa_termIDs 
//                 WHERE TermID = '${termId}' 
//                 AND Modul = '${element['Module']}' AND Sparte='${SPARTE}';`;
                
//                 try {
//                     const pool = await poolPromise;
//                     const result = await pool.request().query(`${query}`);
//                     if(result.recordsets[0][0] != undefined){
//                         element['Line GB'] = result.recordsets[0][0]['WK Pos'];
//                         element['Pos Prognose'] = result.recordsets[0][0]['WK Pos'];
//                         if(result.recordsets[1][0] != undefined){
//                             element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             element['Qty USA Proposal'] = result.recordsets[1][0]['QTY'];
//                             element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             element['USA_Prio Proposal'] = result.recordsets[1][0]['Prio'];
//                         }else{
//                             element['Basket ID Proposal'] = '';
//                             element['Qty USA Proposal'] = '';
//                             element['Anmerkung ECE'] = '';
//                             element['USA_Prio Proposal'] = '';
//                         }
//                         exportArray.push(element);
//                     }else{
//                         if(result.recordsets[1][0] != undefined){
//                             element['Basket ID Proposal'] = result.recordsets[1][0]['WK'];
//                             element['Pos Prognose'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             element['Line GB'] = result.recordsets[1][0]['WK_Pos_Proposal'];
//                             element['Anmerkung ECE'] = result.recordsets[1][0]['Anmerkung_ECE'];
//                             element['USA_Prio Proposal'] = result.recordsets[1][0]['USA_Prio'];
//                         }else{
//                             element['Anmerkung ECE'] = '';
//                             element['USA_Prio Proposal'] = '';
//                         }
//                         exportArray.push(element);
//                     }
//                 } catch (error) {
//                     console.log(error);
//                 } 
//             }
//             // Stream.emit('push', 'message', { msg: 'Verbauraten Berechnung!' ,data: exportArray, loading: 30});
//             /* Verbauraten Berechnung  */
//             let farbenArray = [];
//             console.log(exportArray);
//             if(SPARTE != 'PKW_Motor_Benzin' && SPARTE != 'PKW_Motor_Diesel'){
//                 for (let index = 0; index < exportArray.length; index++) {
//                     let element = exportArray[index];
//                     console.log(element['Built ratio'],'Here')
//                     if(SPARTE == 'PKW' || SPARTE == 'EQ'){
//                         delete element['Built ratio'];
//                     }
//                     let es2 = element['ES2'];
//                     let farbVerbaurate = '';
//                     let isFarbe = false;
//                     let farbverbauratenArr = [];
//                     /* Farbverbauraten */
//                     if(es2){
//                         if(es2.length >= 3){
//                             // Geprimte Zahlen werden nicht Berücksichtigt (9999,9051)
//                             if(es2 != '9999' && es2 != '9051'){
//                                 if(es2.search(' ') < 0){
//                                     secondPos = es2.substring(1,2);
//                                     if(secondPos.match(/[a-z]/i) == null){
//                                         if(es2.substring(1,2)){
//                                             farbVerbaurate = es2.substring(es2.length-3,es2.length);
//                                             const marktCode = es2.substring(es2.length-3,es2.length) + 'U';
//                                             farbVerbaurate = farbVerbaurate+'U';
//                                             if(sparte == 'PKW' || sparte == 'EQ'){
//                                                 for(let markt of extraMaerkte){
//                                                     let farbVerbaurateMarkt = await verbauratenBerechnung(farbVerbaurate,sparte,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                                                     farbVerbaurateMarkt = parseFloat(farbVerbaurateMarkt.replace('%',''));
//                                                     farbverbauratenArr.push(farbVerbaurateMarkt)
//                                                 }
//                                             }else{
//                                                 farbVerbaurate = await verbauratenBerechnung(farbVerbaurate,sparte,'lampa_verbauraten','');
//                                             }
//                                             farbVerbaurate = parseFloat(farbVerbaurate.replace('%',''));
//                                             farbenArray.push({'Teil': element['Teil'],'Farbbaurate':farbVerbaurate, 'TNRsort': element['Part no. sort']})
//                                             isFarbe = true;
//                                         } 
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                     /* Verbauraten Spalten */
//                     if(isFarbe != false){
//                         if(farbVerbaurate != 0){
//                             farbVerbaurate / 100;
//                         }
//                         if(SPARTE == 'PKW' || SPARTE == 'EQ'){
//                             let i = 0;
//                             for(let markt of EXTRA_MAERKTE){
//                                 element[`Built ratio ${markt}`] = await verbauratenBerechnung(element['Sales codes'],SPARTE,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                                 element[`Built ratio ${markt}`] = ((parseFloat(element[`Built ratio ${markt}`].replace('%','')) / 100)*(farbverbauratenArr[i])) ;
//                                 element[`Built ratio ${markt}`] = parseFloat(element[`Built ratio ${markt}`]).toFixed(2)
//                                 if(element[`Built ratio ${markt}`] > 100){
//                                     element[`Built ratio ${markt}`] = '100.00%';
//                                 }else{
//                                     element[`Built ratio ${markt}`] += '%';
//                                 }
//                                 i++;
//                             }
//                         }else{
//                             element['Built ratio'] = await verbauratenBerechnung(element['Sales codes'],SPARTE,'lampa_verbauraten','');
//                             element['Built ratio'] = ((parseFloat(element['Built ratio'].replace('%','')) / 100)*(farbVerbaurate)) ;
//                             element['Built ratio'] = parseFloat(element['Built ratio']).toFixed(2)   
//                             if(element['Built ratio'] > 100){
//                                 element['Built ratio'] = '100.00%';
//                             }else{
//                                 element['Built ratio'] += '%';
//                             }
//                         }
//                     }else{
//                         if(SPARTE == 'PKW' || SPARTE == 'EQ'){
//                             for(let markt of EXTRA_MAERKTE){
//                                 element[`Built ratio ${markt}`] = await verbauratenBerechnung(element['Sales codes'],SPARTE,'lampa_verbauraten',` AND ExtraMarkt = '${markt}'`);
//                             }
//                         }else{
//                             element['Built ratio'] = await verbauratenBerechnung(element['Sales codes'],SPARTE,'lampa_verbauraten','');
//                         }
//                         if(element['Built ratio'] > 100){
//                             element['Built ratio'] = '100%';
//                         }
//                     }
//                 }
//             }else{
//                 for (let index = 0; index < exportArray.length; index++) {
//                     let element = exportArray[index];
//                     delete element['Built ratio'];
//                 }
//             }
//                 // Stream.emit('push', 'message', { msg: 'Verbauraten wurden berechnet.' , loading: 60});
//                 let baureihenSql = ` SELECT  
//                 '' AS Model,
//                 '' AS Module,
//                 '' AS Teil,
//                 lampa_primus.MATNR_SORT AS [Part no. sort],
//                 MATNR_DRUCK AS [Part no. read],
//                 lampa_primus.[Benennung_DE] AS [Name in German],
//                 lampa_primus.[Benennung_EN] AS [Name in English],
//                 lampa_lange_bezeichnung.[Benennung_DE] AS [Bennennung lang_dt],
//                 lampa_lange_bezeichnung.[Benennung_EN] AS [Bennennung lang_engl],
//                 '' AS [Sales codes],
//                 '' AS [RHD/LHD],
//                 ${mengenStringV2}
//                 ${BUILT_RATIO_QRY_STRING}
//                 [Technik_info] AS [New model ID],
//                 [Warenkorb_KNR] AS [Basket ID Is],
//                 '' AS [Basket ID Target],
//                 '' AS [Prio USA],
//                 '' AS [Qty USA],
//                 '' AS [Line GB],
//                 '' AS [Basket ID Proposal],
//                 '' AS [Pos Prognose],
//                 '' AS [Anmerkung ECE],
//                 '' AS Remark,
//                 Term_ID as TermID,
//                 [Beschaffungs_Art] AS [Procurement type],
//                 Anlagedatum AS [Creation date],
//                 [Seriengueltigkeit_Beginn] AS [Launch date],
//                 [Max_LG_Zeit] AS [Shelf life],
//                 [Gefahrgut_KLS] AS [Haz. Mat.],
//                 lampa_primus_hinweis.TLHW_CODE_Wert AS [C-code],
//                 lampa_primus_hinweis.TLHW_Status_LBNZ_ZYKL AS [Status life cycle code],
//                 [KNZ_Sonderedition] AS [ID special edition],
//                 [Sicherheits_Relevanz] AS [Driving relevance],
//                 [B9_Status_Wert] AS [B9 key],
//                 [Marketingcode] AS [Marketing code],
//                 Laenge AS Length,
//                 Breite AS Width,
//                 Hoehe AS Height,
//                 Gewicht AS Weight,
//                 ES2
//                 FROM lampa_primus 
//                 LEFT JOIN lampa_primus_hinweis ON (lampa_primus.MATNR_SORT = lampa_primus_hinweis.MATNR_SORT) 
//                 LEFT JOIN lampa_lange_bezeichnung ON (lampa_primus.MATNR_SORT = lampa_lange_bezeichnung.MATNR_SORT) 
//                 WHERE (${kennerQuery})`;
//                 /////
//                 for (let index = 0; index < stuecklistenData.length; index++) {
//                     const element = stuecklistenData[index];
//                     baureihenSql += ` AND Grundnummer <> '${element['TNRsort']}'`;
//                 }
//                 let baureihendata = [];
//                 try {
//                     const pool = await poolPromise
//                     const result = await pool.request()
//                         .query(baureihenSql);
//                         baureihendata = result.recordset;
//                 } catch (error) {
//                     return res.status(500).json({ error: true, errorMessage: error });
//                 }
//                 for (let index = 0; index < baureihendata.length; index++) {
//                     const element = baureihendata[index];
//                     exportArray.push(element);
//                 }

//                 //////
                
//                 // Stream.emit('push', 'message', { msg: 'Teileliste wird fertig gestellt!' , loading: 85});
//                 for (let index = 0; index < exportArray.length; index++) {
//                     let element = exportArray[index];
//                     let keys = Object.keys(element);
//                     for (let index = 0; index < keys.length; index++) {
//                         const el = keys[index];
//                         if(el.search(' MG') > 0){
//                             element[`${el}`] = changeToNum(element[`${el}`])
//                         }
//                     }
//                     element['Module'] = changeToNum(element['Module']);
//                     element['Line GB'] = changeToNum(element['Line GB']);
//                     element['Pos Prognose'] = changeToNum(element['Pos Prognose']);
//                     element['USA_Prio Proposal'] = changeToNum(element['USA_Prio Proposal']);
//                     element['Length'] = changeToNum(element['Length'])
//                     element['Width'] = changeToNum(element['Width'])
//                     element['Height'] = changeToNum(element['Height'])
//                     element['Weight'] = changeToNum(element['Weight'])
//                     //TODO: Ging vorher ohne toString(), kam  im Datumsformat und warf einen Fehler
//                     element['Creation date'] = element['Creation date'].toString();
//                     element['Launch date'] = element['Launch date'].toString();
//                     let newCreationDate = element['Creation date'].substring(0,4)+'.'+element['Creation date'].substring(4,6) +'.'+ element['Creation date'].substring(6,8);
//                     element['Creation date'] = newCreationDate;
//                     let newLaunchDate = element['Launch date'].substring(0,4)+'.'+element['Launch date'].substring(4,6) +'.'+ element['Launch date'].substring(6,8);
//                     element['Launch date'] = newLaunchDate;
//                     element['Creation date'] = new Date(newLaunchDate)
//                     element['Launch date'] = new Date(newLaunchDate)
//                     element['Creation date'] = new Date(element['Creation date'].getUTCFullYear(), element['Creation date'].getUTCMonth(), element['Creation date'].getUTCDate())
//                     element['Launch date'] = new Date(element['Launch date'].getUTCFullYear(), element['Launch date'].getUTCMonth(), element['Launch date'].getUTCDate())
//                     delete element['Teil'];
//                     delete element['ES2'];
//                     if(SPARTE == 'Van'){
//                         delete element['Anmerkung USA'];
//                         delete element['Large Pkg'];
//                         delete element['Package No'];
//                         delete element['USA_Prio Proposal'];
//                         element['Built ratio'] = element['Built ratio'] ? parseFloat(element['Built ratio'].replace('%')) /100 : null;
//                     }else if(SPARTE == 'PKW_Motor_Diesel' || SPARTE == 'PKW_Motor_Benzin'){
//                         delete element['Built ratio'];
//                     }else{
//                         if(SPARTE !== 'PKW' && SPARTE !== 'EQ'){
//                             console.log(SPARTE);
//                             element['Built ratio'] = parseFloat(element['Built ratio'].replace('%')) /100;
//                         }
//                     }
//                 }
//                 let verbaurateColumnPlace = 0;
//                 let mengenNameArrayV2 = [];
//                 for (let index = 0; index < exportArray.length; index++) {
//                     const element = exportArray[index];
//                     for (let index = 0; index < Object.keys(element).length; index++) {
//                         const el = Object.keys(element)[index];
//                         mengenNameArrayV2.push(el);
//                     }
//                 }
//                 exportArray = exportArray.map((row) => {
//                     let keys = Object.keys(row);
//                     let obj = {};
//                     for (let index = 0; index < keys.length; index++) {
//                         const el = keys[index];
//                         if(el.search(' MG') > 0){
//                             obj[`${el.substring(0,el.search(' MG'))}`] = row[`${el}`];
//                         }else{
//                             obj[`${el}`] = row[`${el}`]
//                         }
//                     }
//                     return obj;
//                 })
//                 if(SPARTE == 'EQ' || SPARTE == 'PKW'){
//                     const propKeys = [...Object.keys(exportArray[0])]
//                     propKeys.splice(propKeys.indexOf("New model ID"),0,'Built ratio ECE')
//                     propKeys.splice(propKeys.indexOf("Built ratio ECE")+1,0,'Built ratio USA')
//                     propKeys.splice(propKeys.indexOf("Built ratio USA")+1,0,'Built ratio China')
//                     const newPropArray = propKeys.slice(0,-3)
//                     exportArray = reorgArrayProp(newPropArray,exportArray);
//                 }

//                 // res.status(200).json( { msg: 'Teileliste wird exportiert!' , loading: 100, data: { error: false, teileListe : exportArray, columnPlace : verbaurateColumnPlace}});
//                 // Stream.emit('push', 'message', { msg: 'Teileliste wird exportiert!' , loading: 100, data: { error: false, teileListe : exportArray, columnPlace : verbaurateColumnPlace}});
//                 const worksheet = xlsx.utils.json_to_sheet(exportArray);
//                 // const currencyFormat = '0.00'; // Customize the currency format
//                 // console.log(worksheet)
//                 // worksheet['B2'].z = currencyFormat;
//                 const workbook = xlsx.utils.book_new();
//                 xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
            
//                 const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
            
//                 res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
//                 res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//                 res.status(200).send(buffer);            
//     });
// });
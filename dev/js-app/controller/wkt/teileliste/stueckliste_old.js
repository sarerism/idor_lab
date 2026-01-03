// // TODO: remove

// let zuImportStueckliste;
// app.post('/importStueckliste', async (req,res) => {
//     zuImportStueckliste = req.body;
//     res.status(200).json(new ResponseData(false,'Stückliste abgespeichert',null));
// })
// app.get('/importStueckliste', async (req,res) => {
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
//     req.body = zuImportStueckliste;
//     req.setTimeout(3000000);
//     req.on('close', function (err){
//         cancelRequest = true;
//         console.log('Client closed connection')
//     });
//     let cancelRequest = false;
//     try {
//         Stream.emit('push', 'message', { msg: 'Daten werden vorbereitet!' , loading: 5});
//         let dataArray = req.body.eintraege;
//         let compiledDataArray = [];
//         let strArray = [];
//         let deleteArray = [];
//         let testZahl = 0;
//         let compiledDataArrayV2 = [];
//         let loopArray = [
//             'Submodul',
//             'Teil',
//             'Codebedingung lang',
//             'LK',
//             'Benennung',
//             'FA MG',
//             'FB MG',
//             'FC MG',
//             'FH MG',
//             'FN MG',
//             'FR MG',
//             'FS MG',
//             'FV MG',
//             'FW MG',
//             'FX MG',
//             'FZ MG',
//             'M14 MG',
//             'M15 MG',
//             'M16 MG',
//             'M17 MG',
//             'M18 MG',
//             'M19 MG',
//             'M20 MG',
//             'M22 MG',
//             'M25 MG',
//             'M29 MG',
//             'M30 MG',
//             'M35 MG',
//             'M55 MG',
//             'M60 MG',
//             'FKA MG',
//             'FKB MG',
//             'FVK MG',
//             'FLK MG',
//             'FHL MG',
//             'FHS MG',
//             'i'
//           ];
//         /* Import Datei auf benötigte Spalten reduzieren*/
//         Promise.all(dataArray.map(async (element, longIndex) => {
//             let keys = Object.keys(element);
//             let obj = {};
//             if(element['Teil'] == undefined){
//                 testZahl += 1;
//             }
//             obj['Submodul'] = element['Submodul'];
//             obj['Teil'] = element['Teil'];
//             obj['Codebedingung lang'] = element['Codebedingung lang'];
//             obj['LK'] = element['LK'];
//             obj['Benennung'] = element['Benennung'];
//             for (let index = 0; index < keys.length; index++) {
//                 const el = keys[index];
//                 if(el.search('MG') >= 0){
//                     obj[`${el}`] = element[`${el}`];
//                 }
//             }
//             if(element['Teil'] != undefined){
//                 compiledDataArray.push(obj);
//             }
            
//         }));
//         Stream.emit('push', 'message', { msg: 'Daten werden geprüft!' , loading: 15});
//         let infoObject = {updateArray : compiledDataArray, columnCount : loopArray}
//         let errorObject = await updateErrorHandling(infoObject);
//         if(errorObject.err == false){
//             let checkElement;
//             if(testZahl == dataArray.length){
//                 Stream.emit('push', 'message', { msg: 'Alle TNRs sind leer!' , loading: -1});
//             }else{
//                 Stream.emit('push', 'message', { msg: 'Codebedingung wird geprüft!' , loading: 20});
//                 await Promise.all(compiledDataArray.map(async(element, longIndex) => {
//                     for (let index = 0; index < loopArray.length; index++) {
//                         const el = loopArray[index];
//                         if(typeof element[`${el}`] == 'undefined'){
//                             if(el.search('MG') > 0){
//                                 element[`${el}`] = null;
//                             }else{
//                                 element[`${el}`] = '';
//                             }
//                         }
//                         if(element['Teil'] == ''){
//                             compiledDataArray.splice(longIndex,1);
//                         }
//                         if(element['LK'] == null || element['LK'] == undefined){
//                             element['LK'] = 'B';
//                         }
//                         if(element['Codebedingung lang'] == undefined){
//                             element['Codebedingung lang'] = ';';
//                         }
//                         let str = element['Codebedingung lang'];
//                         if((str.search(';') == 0) == true){
//                             element['Codebedingung lang'] = str.replace(';','BLANK');
//                         }else{
//                             element['Codebedingung lang'] = str.replace(';','');
//                         }
//                     }
//                     checkElement = element['Teil'];
//                     checkElement  = await convertTNR(checkElement);
//                     element.TNRsort = checkElement;
                    
//                 }));
//                 let counter = 0;
//                 let foundDataArray = [];
//                 let foundTNR = 0;
//                 const poolFilter = await poolPromise;
//                 Stream.emit('push', 'message', { msg: 'Primus abgleich' , loading: 25});
//                 let abgleich = {viertel: false, halb: false, dreiviertel: false}
//                 let bar = new Promise((resolve,reject) => {
//                     compiledDataArray.forEach(async (element ,index) => {
//                         setTimeout(async () => {
//                                 if(!cancelRequest){
//                                 if(!abgleich.viertel){
//                                     if(compiledDataArray.length / index < 4){
//                                         abgleich.viertel = true;
//                                         Stream.emit('push', 'message', { msg: 'Primus abgleich zu 25% abgeschlossen!' , loading: 30});
//                                     }
//                                 }
//                                 if(!abgleich.halb){
//                                     if(compiledDataArray.length / index < 2){
//                                         abgleich.halb = true;
//                                         Stream.emit('push', 'message', { msg: 'Primus abgleich zu 50% abgeschlossen!' , loading: 45});
//                                     }
//                                 }
//                                 if(!abgleich.dreiviertel){
//                                     if(compiledDataArray.length / index < 1){
//                                         abgleich.dreiviertel = true;
//                                         Stream.emit('push', 'message', { msg: 'Primus abgleich zu 75% abgeschlossen!' , loading: 60});
//                                     }
//                                 }
//                                 try {
//                                     const result = await poolFilter.request().
//                                     query(`SELECT * FROM lampa_primus WHERE Grundnummer = '${element['TNRsort']}'`);
//                                     if(result.recordset.length > 0){
//                                         foundTNR++;
//                                         foundDataArray.push(element);
//                                         strArray.push(element['Teil']);
//                                     }else{
//                                         // ### Obsolete else
//                                         // console.log('no result');
//                                     }
//                                 } catch (err) {
//                                     console.log(err); 
//                                 }
//                                 if (index === compiledDataArray.length -1) resolve();
//                             }else{
//                                 resolve();
//                             }
//                         }, counter * 25);
//                         counter++;
//                     });
//                 });
//                 bar.then(async ()=>{
//                     if(foundDataArray.length > 0 || !cancelRequest){
//                         Stream.emit('push', 'message', { msg: 'Teilenummern werden gefiltert' , loading: 70});
//                         compiledDataArray = _.clone(foundDataArray);
//                         let findDuplicates = arr => arr.filter((item, index) => arr.indexOf(item) != index)
//                         let filteredArray = [...new Set(findDuplicates(strArray))];
//                         const values = compiledDataArray;
//                         const lookup = values.reduce((a, e) => {
//                             a[e.Teil] = ++a[e.Teil] || 0;
//                             return a;
//                           }, {});
//                         let valueArray = values.filter(e => lookup[e.Teil]);
//                         let k1;
//                         let k1MengenSpalte;
//                         let firstIndex = 0;
//                         let indexArray = [];
//                         let teileNummernWithCount = [];
//                         let k2;
//                         let zahl = 0;
//                         let time1 = new Date();
        
//                         compiledDataArray.sort(function(a, b){
//                             if(a.Teil < b.Teil) { return -1; }
//                             if(a.Teil > b.Teil) { return 1; }
//                             return 0;
//                         });
//                         for (let index = 0; index < compiledDataArray.length; index++) {
//                             const el = compiledDataArray[index];
//                             el['i'] = index;
                            
//                         }
//                         filteredArray.sort();
//                         deleteArray = await stueckListenCompiling(compiledDataArray,filteredArray);
//                         for (let index = 0; index < deleteArray.length; index++) {
//                             const delElement = deleteArray[index];
//                             compiledDataArray[delElement] = null;
//                         }
//                         for (let index = 0; index < compiledDataArray.length; index++) {
//                             let element = compiledDataArray[index];
//                             if(element != null){
//                                 compiledDataArrayV2.push(compiledDataArray[index]);
//                             }
                            
//                         }
//                         compiledDataArray = _.clone(compiledDataArrayV2);
//                         Promise.all(filteredArray.map((element) => {
//                             let obj = { teil : element , count : 0, teilArray : []};
//                             teileNummernWithCount.push(obj);
//                         }));
//                         Promise.all(teileNummernWithCount.map((element) => {
//                             for (let index = 0; index < valueArray.length; index++) {
//                                 let el = valueArray[index];
//                                 if(el['Teil'] == element['teil']){
//                                     element['count'] += 1;
//                                     element['teilArray'].push(el);
//                                     valueArray.splice(index,1);
//                                     index = index -1;
//                                 }else{
//                                     break;
//                                 }

//                             }
//                         }));
//                         let time2 = new Date();
//                         time1 = time1.getSeconds();
//                         time2 = time2.getSeconds();
//                         let finishedTime = time2 - time1;
//                         for (let index = 0; index < compiledDataArray.length; index++) {
//                             const element = compiledDataArray[index];
//                             element['Verbaurate'] = '0%';
//                         }
//                         let queryLoopArray = [
//                             'Submodul',
//                             'Teil',
//                             'Codebedingung lang',
//                             'LK',
//                             'Benennung',
//                             'FA MG',
//                             'FB MG',
//                             'FC MG',
//                             'FH MG',
//                             'FN MG',
//                             'FR MG',
//                             'FS MG',
//                             'FV MG',
//                             'FW MG',
//                             'FX MG',
//                             'FZ MG',
//                             'M14 MG',
//                             'M15 MG',
//                             'M16 MG',
//                             'M17 MG',
//                             'M18 MG',
//                             'M19 MG',
//                             'M20 MG',
//                             'M22 MG',
//                             'M25 MG',
//                             'M29 MG',
//                             'M30 MG',
//                             'M35 MG',
//                             'M55 MG',
//                             'M60 MG',
//                             'FKA MG',
//                             'FKB MG',
//                             'FVK MG',
//                             'FLK MG',
//                             'FHL MG',
//                             'FHS MG',
//                             'TNRsort',
//                             'Sparte',
//                             'Verbaurate'
//                             ];
//                         let endquery = '';
//                         let tempQuery = '';
//                         Stream.emit('push', 'message', { msg: 'Stückliste wird gespeichert!' , loading: 80});
//                         try {
//                             const pool = await poolPromise;
//                             const result = await pool.request().
//                                 query(`DELETE FROM lampa_stueckliste WHERE Sparte = '${req.body.sparte}'`);
//                         } catch (error) {
//                             console.log(error);
//                         }
//                         let verbauratenArray = [];
//                         let rowsAffected = 0;
//                         let queryArray = [];
//                         let element = {};
//                         await Promise.all(compiledDataArray.map(async(element, longIndex) => {
//                             test = _.clone(element)
//                                 tempQuery = '';
//                                 for (let index = 0; index < queryLoopArray.length; index++) {
//                                     const el = queryLoopArray[index];
//                                     if(typeof test[`${el}`] == 'string'){
//                                         let str = _.clone(test[`${el}`]);
//                                         if(str.indexOf("'") > -1){
//                                             test[`${el}`] = str.replace("'","''");
//                                         }
//                                     }
//                                     if(el == 'Sparte'){
//                                         test[`${el}`] = req.body.sparte;
//                                     }
//                                     if(typeof test[`${el}`] == 'undefined'){
//                                         test[`${el}`] = "''";
//                                     }
//                                     if(typeof test[`${el}`] == 'string' && test[`${el}`] != "''"){
//                                         test[`${el}`] = `'${test[`${el}`]}'`;
//                                     }
//                                     if(index == 38 && longIndex == compiledDataArray.length -1){
//                                         tempQuery += `${test[`${el}`]})\n`;
//                                         endquery += tempQuery;
//                                         queryArray.push(endquery);
//                                     }else if(index == 38){
//                                         tempQuery += `${test[`${el}`]})\n;`;
//                                         endquery += tempQuery;
//                                         queryArray.push(endquery);
//                                     }else if(index == 0){
//                                         tempQuery = '';
//                                         tempQuery += `INSERT INTO lampa_stueckliste VALUES(${test[`${el}`]},`;
//                                     }else{
//                                         tempQuery += `${test[`${el}`]},`;
//                                     }
//                                 }
//                         }));
        
//                         Stream.emit('push', 'message', { msg: 'Hochladen wird abgeschlossen!' , loading: 90});
//                         try{
//                             const pool = await poolPromise;
//                             const result = await pool.request().
//                                 query(`${endquery}`);
//                                 Stream.emit('push', 'message', { msg: 'Hochladen abgeschlossen!' , loading: 100});
//                         }catch(err){
//                             console.log(err);
//                         }
//                     }else{
//                         if(cancelRequest){
//                             Stream.emit('push', 'message', { msg: 'Benutzer hat die Verbindung abgebrochen!' , loading: -1});
//                         }else{
//                             Stream.emit('push', 'message', { msg: 'Es wurden keine Daten übereinstimmend mit Primus gefunden' , loading: -1});
//                         }
//                     }
//                 })
//             }
//         }else{
//             Stream.emit('push', 'message', { msg: 'Error!' , loading: -1});
//         }
//     } catch (error) {
//         Stream.emit('push', 'message', { msg: 'Error!' , loading: -1});
//     }
// });
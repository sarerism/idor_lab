const checkColumns = async (data,pool) => {
    if (data.bereich == 'Good Basket') {
        let stringArray = [];
        try {
            const result = await pool.query(`SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'lampa_warenkorb';`);
            console.log(result);
            const reqloop = async () => {
                await Promise.all(result.rows.map(async (el) => {
                    const loopFunc = async () => {
                        stringArray.push(el['column_name']);
                    };
                    await loopFunc();
                }));
            };
            await reqloop();
            let arr = stringArray;
            return arr;
        } catch (err) {
            console.log(err);
        }
    } else if (data.bereich == 'Push Matrix') {
        let stringArray = [];
        try {
            const result = await pool.query(`SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'lampa_pushmatrix';`);
            console.log(result);
            const reqloop = async () => {
                await Promise.all(result.rows.map(async (el, index) => {
                    const loopFunc = async () => {
                        stringArray.push(el['column_name']);
                    }
                    await loopFunc();
                }));
            }
            await reqloop();
            let arr = stringArray;
            const deleteHyphen = async () => {
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = arr[i].replace(/_/g, ' ');
                }
            }
            await deleteHyphen();
            return arr;
        } catch (err) {
            console.log(err);
        }
    }
}


const arrayEquals = async (a, b) => {
    const checkLengthArray = [];
    const loopCheck = async () => {
        for (let index = 0; index < a.length; index++) {
            const aElement = a[index];
            if (b.indexOf(aElement) >= 0) {
                checkLengthArray.push(1);
            }
        }
    };
    await loopCheck();
    if (a.length == checkLengthArray.length) {
        return true;
    } else {
        return false;
    }
}

module.exports = { checkColumns, arrayEquals };
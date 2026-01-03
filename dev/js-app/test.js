const testing = require('./testingFunctions.js');

test("Verbauraten Berechnung mit Codebedingung", async () => {
    const data = await testing.verbauratenBerechnungPrognoseTest({
        codeBedingung: '235+772+-258/235+772+258',
        isSql: false,
        verbauratenArray: [
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ],
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ]
        ]
    });
    
    expect(data).toStrictEqual({
        finishedData: 0.6756, 
        codes: ["235", "772", "258", "235", "772", "258"], 
        verbauraten: [
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ],
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ]
        ]
    });
});

test("Verbauraten sind ungleich zu falschem Ergebnis", async () => {
    const data = await testing.verbauratenBerechnungPrognoseTest({
        codeBedingung: '235+772+-258/235+772+258',
        isSql: false,
        verbauratenArray: [
            [ { Verbaurate: 0.8, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ],
            [ { Verbaurate: 0.8, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ]
        ]
    });
    expect(data).not.toStrictEqual({
        finishedData: 0.6756, 
        codes: ["235", "772", "258", "235", "772", "258"], 
        verbauraten: [
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ],
            [ { Verbaurate: 1, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0.046900000000000004, i: 2 } ]
        ]
    });
})

test("Verbauraten Berechnung mit falscher Codebedingung", async () => {
    const data = await testing.verbauratenBerechnungPrognoseTest({
        codeBedingung: '235+772-+258/235+772-+258/235+772+258',
        isSql: false,
        verbauratenArray: []
    });
    expect(data).toBeInstanceOf(Error);
});

test("Verbauraten Berechnung ergibt 0", async () => {
    const data = await testing.verbauratenBerechnungPrognoseTest({
        codeBedingung: '003+00B+102/003+00B+102',
        isSql: false,
        verbauratenArray: [
            [ { Verbaurate: 0, i: 0 } ],
            [ { Verbaurate: 0, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ],
            [ { Verbaurate: 0, i: 0 } ],
            [ { Verbaurate: 0, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ]
        ]
    });
    expect(data).toStrictEqual({
        finishedData: 0.00, 
        codes: ["003", "00B", "102", "003", "00B", "102"], 
        verbauraten: [
            [ { Verbaurate: 0, i: 0 } ],
            [ { Verbaurate: 0, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ],
            [ { Verbaurate: 0, i: 0 } ],
            [ { Verbaurate: 0, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ]
        ]
    })
});

test("Rückgabe der Verbaurate ist eine Zahl", async () => {
    const data = await testing.verbauratenBerechnungPrognoseTest({
        codeBedingung: '235+772+-258/235+772+258',
        isSql: false,
        verbauratenArray: [
            [ { Verbaurate: 0.8, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ],
            [ { Verbaurate: 0.8, i: 0 } ],
            [ { Verbaurate: 0.6756, i: 1 } ],
            [ { Verbaurate: 0, i: 2 } ]
        ]
    });
    expect(typeof data.finishedData).toBe('number');
});

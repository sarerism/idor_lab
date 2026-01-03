const xlsx = require("xlsx");

const createBufferFromWorksheet = (worksheet) =>{
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
};

const convertColumnToType = (worksheet, col, fmt) => {
    const range = xlsx.utils.decode_range(worksheet['!ref'])
    // note: range.s.r + 1 skips the header row
    for (let row = range.s.r + 1; row <= range.e.r; ++row) {
        const ref = xlsx.utils.encode_cell({ r: row, c: col })
        if (worksheet[ref] && worksheet[ref].t === 'n') {
        worksheet[ref].z = fmt
        }
    }
}

const convertIndexToColumnLetter = () => {
    if (!Number.isInteger(index) || index < 0) {
        throw new Error("Index to Column Letter failed. With ndex: ",index);
    }

    let columnName = '';

    // Convert the index to Excel column letter
    while (index >= 0) {
        let remainder = index % 26;
        columnName = String.fromCharCode(65 + remainder) + columnName;
        index = Math.floor(index / 26) - 1;
    }

    return columnName;
}

module.exports = { createBufferFromWorksheet,convertIndexToColumnLetter,convertColumnToType };
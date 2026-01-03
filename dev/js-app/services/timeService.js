const { DateTime } = require('luxon');
const convertToPoTime = (isoString) => {
    const parsedDateTime = DateTime.fromISO(isoString);
    const formattedString = parsedDateTime.toFormat('yyyyMMdd');
    return formattedString;
}

module.exports = { convertToPoTime }
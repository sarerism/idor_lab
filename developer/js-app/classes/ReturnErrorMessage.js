const ReturnMessage = require("./ReturnMessage");

class ReturnErrorMessage extends ReturnMessage{
    constructor(message, err, errorDetails) {
        super(message,err);
        this.errorDetails = errorDetails;
    }
}
module.exports = ReturnErrorMessage;

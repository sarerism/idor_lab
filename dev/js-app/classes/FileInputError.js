const { DEFAULT_FILE_ERROR, FILE_EMPTY_ERROR, FILE_COLUMN_ERROR } = require("../constants/errorMessages");

class FileInputError extends Error {

    typeErrorMessage;

    constructor(message,type) {
      super(message);
      switch (type) {
        case "column":
            this.typeErrorMessage = FILE_COLUMN_ERROR;
            break;
        case "empty":
            this.typeErrorMessage = FILE_EMPTY_ERROR;
            break;
        default:
            this.typeErrorMessage = DEFAULT_FILE_ERROR;
            break;
      }
    }
  }
  
module.exports = FileInputError;
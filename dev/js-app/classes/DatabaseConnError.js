class DatabaseConnError extends Error {
    constructor(message) {
      super(message);
    }
  }
  
module.exports = DatabaseConnError;
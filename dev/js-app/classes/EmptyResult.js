class EmptyResult extends Error {
    bereich;
    constructor(message,bereich) {
      super(message);
      this.bereich = bereich;
    }
  }
  
module.exports = EmptyResult;
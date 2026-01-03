const { RequestError, ConnectionError } = require("mssql");
const AppError = require("../classes/AppError");
const DatabaseConnError = require("../classes/DatabaseConnError");
const EmptyResult = require("../classes/EmptyResult");
const FileInputError = require("../classes/FileInputError");
const ReturnErrorMessage = require("../classes/ReturnErrorMessage");
const { DEFAULT_ERROR, DEFAULT_ERROR_DETAIL, DB_CONNECTION_ERROR, DB_QUERY_ERROR, EMPTY_QUERY_RESULT } = require("../constants/errorMessages");

const errorHandler = (error, req, res, next) => {
  console.log(error);
  if(error instanceof DatabaseConnError){
    return res.status(400).json(new ReturnErrorMessage(DB_CONNECTION_ERROR,true,""));
  }
  if(error instanceof EmptyResult){
    return res.status(400).json(new ReturnErrorMessage(EMPTY_QUERY_RESULT+", Bereich: "+error.bereich,true,""));
  }
  if(error instanceof RequestError){
    return res.status(400).json(new ReturnErrorMessage(DB_QUERY_ERROR,true,{route: req.url,message: error.message}));
  }
  if(error instanceof AppError){
    return res.status(400).json(new ReturnErrorMessage(DEFAULT_ERROR,true,{route: req.url,message: error.message}));
  }
  if(error instanceof FileInputError){
    return res.status(400).json(new ReturnErrorMessage(`${error.typeErrorMessage}\n${error.message}`,true,{route: req.url,message: error.message}));
  }
  if(error instanceof TypeError){
    return res.status(400).send(new ReturnErrorMessage(DEFAULT_ERROR,true,DEFAULT_ERROR_DETAIL));
  }
  return res.status(400).send(new ReturnErrorMessage(DEFAULT_ERROR,true,DEFAULT_ERROR_DETAIL));
};

module.exports = errorHandler;
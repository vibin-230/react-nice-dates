const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  android_version:String,
  ios_version:String,
});

//Model
const model = mongoose.model('version',schema);


module.exports    = model;
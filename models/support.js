const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  name:String,
  email:String,
  message:String
});

//Model
const model = mongoose.model('support',schema);


module.exports    = model;

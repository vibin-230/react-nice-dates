const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  username:String,
  password:String
});

//Model
const model = mongoose.model('superadmin',schema);


module.exports    = model;

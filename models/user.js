const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  last_login: Date,
  modified_at: Date,
  phone:String,
  token:String,
  otp:Number,
  name:String,
  email:String,
  profile_picture:String,
  access_token:String,
  dob:Date,
  gender:String,
  login_type:String,
  sports_interest:Array,
  activity_log:Array
});

//Model
const model = mongoose.model('user',schema);


module.exports    = model;

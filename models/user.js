const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const userSchema = new Schema({
  created_at: { type : Date , default:moment()},
  last_login: Date,
  modified_at: Date,
  phone:String,
  name:String,
  email:String,
  profile_picture:String,
  access_token:String,
  dob:Date,
  gender:String,
  login_type:String
});

//Model
const user = mongoose.model('user',userSchema);


module.exports    = user;

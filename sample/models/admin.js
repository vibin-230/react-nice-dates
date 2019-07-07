const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:Date.now()},
  modified_at: { type : Date , default:Date.now()},
  username:String,
  password:String,
  reset_password_hash:String,
  reset_password_expiry:Date,
  role:String,
  name:String,
  company_name:String,
  address:String,
  phone:String,
  alt_phone:String,
  gst:String,
  email:String,
  access:String,
  venue:Array,
  activity_log:Array,
  status:{type:Boolean, default: true}
});

//Model
const model = mongoose.model('admin',schema);


module.exports    = model;

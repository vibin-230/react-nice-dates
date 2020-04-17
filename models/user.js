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
  device_token:String,
  otp:Number,
  name:String,
  email:String,
  profile_picture:String,
  access_token:String,
  dob:Date,
  force_update:Boolean,
  version:String,
  gender:String,
  login_type:String,
  visibility:{type:String, default:'public'},
  followers:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  following:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  requests:[{
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    username:{type:String,default:''},
    timeStamp: { type : Date , default:moment()},
  }],
  sent_requests:[{
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User'},
    username:{type:String,default:''},
    timeStamp: { type : Date , default:moment()},
  }],
  conversation:[{
    conversation:{type:mongoose.Schema.Types.ObjectId, ref:'conversation'},
  }],


  
  sports_interest:Array,
  activity_log:Array,
  handle:{type: String, unique: true },
  status:{type:Boolean, default:true}
});

//Model
const model = mongoose.model('user',schema);


module.exports    = model;

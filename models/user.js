const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');



const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  last_login: Date,
  last_active:Date,
  modified_at: Date,
  location:Array,
  suggestion_reject:Array,
  location_status:{type:Boolean, default:false},
  phone:String,
  token:String,
  password:String,
  sync_contacts:{ type : Boolean , default:false},
  reset_password_hash:String,
  reset_password_expiry:Date,
  device_token:String,
  otp:Number,
  name:String,
  email:String,
  profile_picture:String,
  os:String,
  dob:Date,
  refer_id:{type:String},
  email_status:{type:Boolean, default:false},
  name_status:{type:Boolean, default:false},
  gender_status:{type:Boolean, default:false},
  bio_status:{type:Boolean, default:false},
  referal_status:{type:Boolean, default:false},
  bio:Array,
  force_update:Boolean,
  version:String,
  gender:String,
  login_type:String,
  visibility:{type:String, default:'public'},
  role:{type:String, default:'user'},
  past_convos:Array,
  followers:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  following:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  requests:[
    {type:mongoose.Schema.Types.ObjectId, ref:'user'}
    ],
  sent_requests:[
    {type:mongoose.Schema.Types.ObjectId, ref:'user'}
  ],
  conversation:[{
    conversation:{type:mongoose.Schema.Types.ObjectId, ref:'conversation'},
  }],
  mute:[{type:mongoose.Schema.Types.ObjectId, ref:'conversation'}],
  temporary:Boolean,
  device_id:Array,
  sports_interest:Array,
  activity_log:Array,
  online_status:String,
  handle:String,
  status:{type:Boolean, default:true}
});

//Model
const model = mongoose.model('user',schema);


module.exports    = model;

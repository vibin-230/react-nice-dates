const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  last_login: Date,
  last_active:Date,
  modified_at: Date,
  location:Array,
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
  refer_id:{type:String, set: v => `${v}${makeid(5)}`,unique:true},
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
  sports_interest:Array,
  activity_log:Array,
  online_status:String,
  handle:{type: String, unique: true },
  status:{type:Boolean, default:true}
});

//Model
const model = mongoose.model('user',schema);


module.exports    = model;

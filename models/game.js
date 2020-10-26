const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_by: String,
  created_type:String,
  created_at: { type : Date , default:new Date()},
  type:String,
  status: { type : Boolean , default:true},
  status_description: String,
  share_count: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  name:String,
  town_date:Date,
  booking_date: { type : Date , default:new Date()},
  start_time:Date,
  booking_status:String,
  image:String,
  limit:Number,
  sport_name:String,
  comments:Array,
  share:Array,
  subtitle:String,
  share_type:String,
  venue:{type:mongoose.Schema.Types.ObjectId, ref:'venue'},
  quits:Number,
  skipped:Array,
  completed:{ type : Boolean , default:false},
  mvp:[{mvp:Boolean,sender_id:{type:mongoose.Schema.Types.ObjectId,ref:'user'},target_id:{type:mongoose.Schema.Types.ObjectId,ref:'user'} }],
  users:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  invites:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  host :[{ type: Schema.Types.ObjectId, ref: 'user' }],
  conversation : { type: Schema.Types.ObjectId, ref: 'conversation' },
  town:{type:Boolean,default:false},
  bookings:Array,
});

//Model
const model = mongoose.model('game',schema);


module.exports    = model;

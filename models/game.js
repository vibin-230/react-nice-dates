const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_by: String,
  created_type:String,
  created_at: { type : Date , default:new Date()},
  type:String,
  share_count: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  name:String,
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
  users:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  invites:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  host :[{ type: Schema.Types.ObjectId, ref: 'user' }],
  conversation : { type: Schema.Types.ObjectId, ref: 'conversation' },
  bookings:Array,
});

//Model
const model = mongoose.model('game',schema);


module.exports    = model;
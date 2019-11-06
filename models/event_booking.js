const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  modified_at: { type : Date , default:new Date()},
  booking_id:String,
  created_by:String,
  modified_by:String,
  booking_date:Date,
  event_booking_date:Date,
  start_time:Date,
  booking_type:String,
  team_name:String,
  booking_status:String,
  booking_amount:Number,
  venue:Array,
  event_id:{ type: Schema.Types.ObjectId, ref: 'event' },
  amount:Number,
  coupon_amount:Number,
  coupons_used:String,
  offers_used:Array,
  commission:Number,
  payment_type:String,
  transaction_id:String,
  user_id:String,
  name:String,
  phone:String,
  email:String,
  free_event: Boolean
});

//Model
const model = mongoose.model('event_booking',schema);


module.exports    = model;

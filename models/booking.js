const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  modified_at: { type : Date , default:new Date()},
  booking_id:String,
  created_by:String,
  modified_by:String,
  booking_date:Date,
  booking_type:String,
  booking_status:String,
  booking_amount:Number,
  venue:String,
  venue_id:String,
  sport_name:String,
  venue_type:String,
  amount:Number,
  coupons_used:String,
  commission:Number,
  payment_type:String,
  transaction_id:String,
  slot_time:String,
  user_id:String,
  name:String,
  phone:String,
  email:String,
  multiple_id:String,
  start_time:Date,
  end_time:Date
});

//Model
const model = mongoose.model('booking',schema);


module.exports    = model;

const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  booking_date:Date,
  booking_type:String,
  booking_status:String,
  venue:String,
  sport_name:String,
  venue_type:String,
  amount:Number,
  coupons_used:String,
  commission:Number,
  payment_type:String,
  transaction_id:String,
  slot_time:String,
});

//Model
const model = mongoose.model('booking',schema);


module.exports    = model;

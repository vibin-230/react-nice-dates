const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  booking_id:String,
  created_by:String,
  booked_by:String,
  modified_by:String,
  booking_date:Date,
  booking_type:String,
  booking_status:String,
  booking_amount:Number,
  venue:String,
  venue_id:String,
  venue_data: { type: Schema.Types.ObjectId, ref: 'venue' },
  sport_name:String,
  venue_type:String,
  amount:Number,
  coupons_used:String,
  coupon_amount:Number,
  offer_amount:Number,
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
  end_time:Date,
  due:Number,
  venue_advance:Number,
  turftown_offer:Number,
  venue_offer:Number,
  no_show:Boolean,
  card:Number,
  comments:String,
  cash:Number,
  upi:Number,
  academy:Boolean,
  membership:Boolean,
  collected_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
  refund_status:Boolean,
  refunded: {
    type: Boolean,
    default: false
  }
},{ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

//Model
const model = mongoose.model('booking',schema);


module.exports    = model;

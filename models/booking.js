const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  booking_id:String,
  created_by:String,
  booked_by:String,
  modified_by:String,
  booking_date:Date,
  start_date_range:Date,
  end_date_range:Date,
  booking_type:String,
  booking_status:String,
  booking_amount:Number,
  selected_days:Array,
  venue:String,
  venue_id:String,
  venue_data: { type: Schema.Types.ObjectId, ref: 'venue' },
  repeat_booking: {
    type: Boolean,
    default: false
  },
  no_charge:Boolean,
  group_id:String,
  group_name:String,
  closed:Boolean,
  payment_option:Boolean,
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
  card:Number,
  comments:String,
  cash:Number,
  upi:Number,
  invoice_start_date:Date,
  invoice_date:Date,
  invoice_end_date:Date,
  academy:Boolean,
  cancelled_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
  membership:Boolean,
  collected_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
  invoice_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
  invoice_id:String,
  repeat_id:String,
  refund_status:Boolean,
  refunded: {
    type: Boolean,
    default: false
  },
  invoice: {
    type: Boolean,
    default: false
  }
},{ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

//Model
const model = mongoose.model('booking',schema);


module.exports    = model;

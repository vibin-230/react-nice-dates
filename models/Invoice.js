const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  invoice_id:String,
  created_by:String,
  approved_by:String,
  modified_by:String,
  invoice_date:Date,
  invoice_start_date:Date,
  invoice_end_date:Date,
  invoice_amount:Number,
  venue:String,
  venue_id:String,
  venue_data: { type: Schema.Types.ObjectId, ref: 'venue' },
  booking_data:Array,
  sport_name:String,
  coupons_used:String,
  coupon_amount:Number,
  offer_amount:Number,
  commission:Number,
  payment_type:String,
  multiple_id:String,
  cancelled_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
  collected_by:{ type: Schema.Types.ObjectId, ref: 'admin' },
},{ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

//Model
const model = mongoose.model('booking',schema);


module.exports    = model;

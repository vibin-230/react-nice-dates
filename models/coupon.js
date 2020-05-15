const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  title:String,
  description:String,
  code:String,
  type:String,
  first_time_user:Boolean,
  discount:Number,
  discount_limit:Number,
  discount_type:String,
  usage_limit_per_user:Number,
  start_date:Date,
  end_date:Date,
  start_time:Date,
  end_time:Date,
  days:Array,
  visible:{type:Boolean, default: false},
  offer_type:String,
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  // venue:Array,
  event:[{ type: Schema.Types.ObjectId, ref: 'event' }],
  status:{type:Boolean, default: true}
});

//Model
const model = mongoose.model('coupon',schema);


module.exports    = model;
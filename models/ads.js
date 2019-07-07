const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:Date.now()},
  modified_at: { type : Date , default:Date.now()},
  modified_by: String,
  image:String,
  description:String,
  coupon_code:String,
  type:String,
  url:String,
  venue:Array,
  event:Array,
  start_date:Date,
  end_date:Date,
  start_time:Date,
  end_time:Date,
  days:Array,
  sport_type:String,
  disable:Boolean,
  position:Number,
  status:{type:Boolean, default: true}
});

//Model
const model = mongoose.model('ads',schema);


module.exports    = model;

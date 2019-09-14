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
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  event:[{ type: Schema.Types.ObjectId, ref: 'event' }],
  start_date:Date,
  end_date:Date,
  start_time:Date,
  end_time:Date,
  days:Array,
  sport_type:String,
  disable:Boolean,
  position:Number,
  region:String,
  status:{type:Boolean, default: true},
  page:String,
  campaign_name:String
});


//Model
const model = mongoose.model('ads',schema);


module.exports    = model;

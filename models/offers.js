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
  first_time_user:Boolean,
  discount:Number,
  minhours:Number,
  discount_limit:Number,
  discount_type:String,
  usage_limit_per_user:Number,
  type:String,
  start_date:Date,
  end_date:Date,
  start_time:String,
  end_time:String,
  days:Array,
  offer_type:String,
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  event:[{ type: Schema.Types.ObjectId, ref: 'event' }],
  status:{type:Boolean, default: true},
  custom:{type:Boolean, default: false}

});

//Model
const model = mongoose.model('offer',schema);


module.exports    = model;

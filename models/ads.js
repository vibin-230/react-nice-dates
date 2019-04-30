const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:Date.now()},
  modified_at: { type : Date , default:Date.now()},
  image:String,
  description:String,
  coupon_code:String,
  type:String,
  url:String,
  venues:Array,
  sport_type:String
});

//Model
const model = mongoose.model('ads',schema);


module.exports    = model;

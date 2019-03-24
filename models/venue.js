const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  type:String,
  exclusive:Boolean,
  upto:String,
  outs:Boolean,
  bank:Object,
  features:Object,
  venue:Object,
  venue_display_picture:String,
  venue_cover_picture:Array,
  rating:Array,
  review:Array,
  grounds_count:String,
  configuration:Object
});

//Model
const model = mongoose.model('venue',schema);


module.exports    = model;

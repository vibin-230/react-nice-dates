const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  start_date:Date,
  end_date:Date,
  status:{type:Boolean, default:true},
  // event_name:String,
  // venue:String,
  // email:String,
  // organized_by:String,
  // event_picture:Array,
  // age_group:String,
  // format:String,
  // game_type:String,
  // half_length:String,
  // entry_fee:Number,
  // winner:Number,
  // runner_up:Number,
  // commission:Number,
  // exclusive:Boolean,
  venue:Array,
  bank:Object,
  event:Object,
  format:Object,
  type:String,
  sponsored:String
});

//Model
const model = mongoose.model('event',schema);


module.exports    = model;
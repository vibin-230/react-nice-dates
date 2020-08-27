const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_by: {type:mongoose.Schema.Types.ObjectId, ref:'admin'},
  created_at: { type : Date , default:new Date()},
  type:String,
  cash:Number,
  upi:Number,
  coins:Number,
  card:Number, 
  transaction_id:String,
  venue_id:{type:mongoose.Schema.Types.ObjectId, ref:'venue'},
  image : Array,  
  repeat_id:String,
  comments:String,
  name:String,
  status: { type : Boolean , default:true},
  status_description: String,
  user:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
  booking_id:String,
  event:{type:mongoose.Schema.Types.ObjectId, ref:'event'},
});

//Model
const model = mongoose.model('cashflow',schema);


module.exports    = model;

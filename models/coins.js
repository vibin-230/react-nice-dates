const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  booking_id:String,
  created_by:String,
  booked_by:String,
  type:String,
  referal:String,
  created_at: { type : Date , default:new Date()},
  modified_by:String,
  booking_date: { type : Date , default:new Date()},
  venue: { type: Schema.Types.ObjectId, ref: 'venue' },
  transaction_id:String,
  user:{ type: Schema.Types.ObjectId, ref: 'user' },
  from:{ type: Schema.Types.ObjectId, ref: 'user' },
  card:Number,
  comments:String,
  amount:Number,
  upi:Number,
});

//Model
const model = mongoose.model('coins',schema);


module.exports    = model;

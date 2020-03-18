const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  invoice_id:String,
  repeat_id:String,
  name:String,
  created_by:String,
  invoice_date:Date,
  invoice_amount:Number,
  advance:Number,
  booking_data:Array,
  payment_type:String,
  
 
},{ timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

//Model
const model = mongoose.model('invoice',schema);


module.exports    = model;

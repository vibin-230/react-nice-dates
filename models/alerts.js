const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_by: {type:mongoose.Schema.Types.ObjectId, ref:'user'},
  created_at: { type : Date , default:new Date()},
  type:String,
  status: { type : Boolean , default:true},
  status_description: String,
  user:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
  post:{type:mongoose.Schema.Types.ObjectId, ref:'post'},
  game:{type:mongoose.Schema.Types.ObjectId, ref:'game'},
});

//Model
const model = mongoose.model('alerts',schema);


module.exports    = model;

const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  conversation : { type: Schema.Types.ObjectId, ref: 'conversation' },
  author : { type: Schema.Types.ObjectId, ref: 'user' },
  message: String,
  image : String,
  video : String,
  name : String,
  game : { type: Schema.Types.ObjectId, ref: 'game' },
  type:String,
});

//Model
const model = mongoose.model('message',schema);


module.exports    = model;

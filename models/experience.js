const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  modified_at: { type : Date , default:new Date()},
  modified_by:{type: Schema.Types.ObjectId, ref: 'user' },
  created_by:{type: Schema.Types.ObjectId, ref: 'user' },
  sport:String,
  event_name:String,
  team_name:String,
  year:String,
  honors:String,
  list:Number,
  positon:String,
  user : { type: Schema.Types.ObjectId, ref: 'user' },
  type:String,
});

//Model
const model = mongoose.model('experience',schema);


module.exports    = model;

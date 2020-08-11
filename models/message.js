const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  conversation : { type: Schema.Types.ObjectId, ref: 'conversation' },
  author : { type: Schema.Types.ObjectId, ref: 'user' },
  message: String,
  image : Array,
  video : String,
  name : String,
  read_status: {
    type: Boolean,
    default: false
  },
  read_by : { type: Schema.Types.ObjectId, ref: 'user' },
  game : { type: Schema.Types.ObjectId, ref: 'game' },
  event : { type: Schema.Types.ObjectId, ref: 'event' },
  user : { type: Schema.Types.ObjectId, ref: 'user' },
  type:String,
});

//Model
const model = mongoose.model('message',schema);


module.exports    = model;

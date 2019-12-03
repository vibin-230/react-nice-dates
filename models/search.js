const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  userId:String,
  type:String,
  search_text:String,
  user:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  event:[{ type: Schema.Types.ObjectId, ref: 'event' }],
  status:{type:Boolean, default: true}
});

//Model
const model = mongoose.model('search',schema);


module.exports    = model;

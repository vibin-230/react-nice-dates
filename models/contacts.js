const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  contacts:Array,
  user:[{ type: Schema.Types.ObjectId, ref: 'user' }],
});

//Model
const model = mongoose.model('contacts',schema);


module.exports    = model;

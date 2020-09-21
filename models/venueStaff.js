const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  name:String,
  company_name:String,
  address:String,
  phone:String,
  alt_phone:String,
  gst:String,
  email:String,
  venue_manager:String,
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }]
});

//Model
const model = mongoose.model('venueStaff',schema);


module.exports    = model;
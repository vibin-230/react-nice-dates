const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const moment = require('moment');


const schema = new Schema({
  created_at: { type : Date , default:moment()},
  modified_at: { type : Date , default:moment()},
  created_by:String,
  modified_by:String,
  name:String,
  notify:{type:Boolean, default:false},
  company_name:String,
  address:String,
  phone:String,
  alt_phone:String,
  gst:String,
  email:String,
  role:String,
  venue:[{ type: Schema.Types.ObjectId, ref: 'venue' }],
  staff:[{ type: Schema.Types.ObjectId, ref: 'venueStaff' }]
});

//Model
const model = mongoose.model('venueManager',schema);


module.exports    = model;
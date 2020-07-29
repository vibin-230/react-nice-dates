const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_at: { type : Date , default:new Date()},
  modified_at: { type : Date , default:new Date()},
  modified_by:{type: Schema.Types.ObjectId, ref: 'user' },
  created_by:{type: Schema.Types.ObjectId, ref: 'user' },
  conversation : { type: Schema.Types.ObjectId, ref: 'conversation' },
  author : { type: Schema.Types.ObjectId, ref: 'user' },
  message: String,
  image : Array,
  status: { type : Boolean , default:true},
  shout_out_count:{ type : Number , default:0},
  shout_out:[{type: Schema.Types.ObjectId, ref: 'user' }],
  video : String,
  name : String,
  read_status: {
    type: Boolean,
    default: false
  },
  read_by : { type: Schema.Types.ObjectId, ref: 'user' },
  game : { type: Schema.Types.ObjectId, ref: 'game' },
  event :{ type: Schema.Types.ObjectId, ref: 'event' },
  venue :{ type: Schema.Types.ObjectId, ref: 'venue' },
  user : { type: Schema.Types.ObjectId, ref: 'user' },
  type:String,
});

//Model
const model = mongoose.model('post',schema);


module.exports    = model;

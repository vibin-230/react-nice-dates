const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({
  created_by:{ type: Schema.Types.ObjectId, ref: 'user' },
  name:{ type : String , default:''},
  display_picture:String,
  to:{ type: Schema.Types.ObjectId, ref: 'user' },
  created_at: { type : Date , default:new Date()},
  last_message:{ type: Schema.Types.ObjectId, ref: 'message' },
  last_updated: { type : Date , default:new Date()},
  subtitle:String,
  sport_type:String,
  invites:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
  host: [{ type: Schema.Types.ObjectId, ref: 'user' }] ,
  sport_name:String,
  last_active: Array,
  unread:Number,
  members: [{ type: Schema.Types.ObjectId, ref: 'user' }] ,
  type:String,
  exit_list:[{
    user_id:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
    //username:{type:String,default:''},
    message:Object,
    timeStamp: { type : Date , default:new Date()},
  }],
  colors:Array,
  join_date:Array
});

//Model
const model = mongoose.model('conversation',schema);


module.exports    = model;

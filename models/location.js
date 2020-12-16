const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;


const schema = new Schema({

    user:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
    latLong:Array,
    sport:String,
    created_at: { type : Date , default:new Date()},

 
});

//Model
const model = mongoose.model('location',schema);


module.exports    = model;
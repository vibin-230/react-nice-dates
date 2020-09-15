const Alert = require('./../models/alerts')
const NotifyArray = require('../scripts/NotifyArray')
const User = require('../models/user');
var mongoose = require('mongoose');

var objectId = mongoose.Types.ObjectId('569ed8269353e9f4c51617aa');

 const sendAlert = (body,type,next)=> {
  if(type === 'create'){
    Alert.create(body).then((a)=>{
      console.log('alert',a)
      NotifyUsers([body.user],body.status_description)
    }).catch(next)
  }
  else if(type === 'modify'){
    Alert.findOne({user:body.user,created_by:body.created_by}).then(a=>{
      if(a){
        Alert.findOneAndUpdate({user:body.user,created_by:body.created_by,type:body.type},{$set:body}).then((s)=>{
          console.log(s)
        }).catch(next) 
      }
    }).catch(next)
  }
  else if(type === 'delete'){
    console.log("biody",body)
    Alert.findOne({user:body.user,created_by:body.created_by,type:body.type}).lean().then(a=>{
      console.log("aaa",a)
      if(a){
        Alert.findOneAndDelete({user:body.user,created_by:body.created_by,type:body.type}).then((s)=>{
          console.log(s)
        }).catch(next) 
      }
    }).catch(next)
  }

  else if(type === 'addorupdate'){
    Alert.findOne({user:body.user,created_by:body.created_by}).then(a=>{
      if(a){
        Alert.findOneAndUpdate({user:body.user,created_by:body.created_by},{$set:body}).then((s)=>{
        }).catch(next) 
      }else{
        Alert.create(body).then((a)=>{
          NotifyUsers([body.user],body.status_description)
        }).catch(next)
      }
    }).catch(next)
  }
}

function NotifyUsers(user,message){
  User.find({_id:{$in:user}},{device_token:1,handle:1}).then((user)=>{
    NotifyArray(user.map((u)=>u.device_token),message,"Turf Town")
  })

}

module.exports = sendAlert
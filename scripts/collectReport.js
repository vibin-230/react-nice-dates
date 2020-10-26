const Cashflow = require('../models/cashflow')
//const NotifyArray = require('./NotifyArray')
const User = require('../models/user');

 const collectReport = (body,type,next)=> {
   console.log(body,type,next);
  if(type === 'create'){
    Cashflow.create(body).then((a)=>{
      console.log('alert',a)
      //NotifyUsers([body.user],body.status_description)
    }).catch(next)
  }
  else if(type === 'modify'){
    Cashflow.findOne({admin:body.admin,created_by:body.created_by}).then(a=>{
      if(a){
        Cashflow.findOneAndUpdate({admin:body.admin,created_by:body.created_by,type:body.type},{$set:body}).then((s)=>{
          console.log(s)
        }).catch(next) 
      }
    }).catch(next)
  }
  else if(type === 'delete'){
    Cashflow.findOne({admin:body.admin,created_by:body.created_by,type:body.type}).then(a=>{
      if(a){
        Cashflow.findOneAndDelete({admin:body.admin,created_by:body.created_by,type:body.type}).then((s)=>{
          console.log(s)
        }).catch(next) 
      }
    }).catch(next)
  }

  else if(type === 'addorupdate'){
    Cashflow.findOne({admin:body.admin,created_by:body.created_by}).then(a=>{
      if(a){
        Cashflow.findOneAndUpdate({admin:body.admin,created_by:body.created_by},{$set:body}).then((s)=>{
        }).catch(next) 
      }else{
        Cashflow.create(body).then((a)=>{
          //NotifyUsers([body.user],body.status_description)
        }).catch(next)
      }
    }).catch(next)
  }
}

// function NotifyUsers(user,message){
//   User.find({_id:{$in:user}},{device_token:1,handle:1}).then((user)=>{
//     NotifyArray(user.map((u)=>u.device_token),message,"Turf Town")
//   })

// }

module.exports = collectReport
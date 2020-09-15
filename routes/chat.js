const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const server = require('../scripts/constants');
const link = require('../scripts/uri');
const { check, validationResult } = require('express-validator/check');
const verifyToken = require('../scripts/verifyToken');
const verifySuperAdmin = require('../scripts/verifySuperAdmin');
const jwt = require('jsonwebtoken');
const config = require('../config');
const data = require('../sample/venue.js')
const distance = require('../scripts/distance.js')

const User = require('../models/user');
const Venue = require('../models/venue');
const Post = require('../models/post');
const Game = require('../models/game');
const Message = require('../models/message');

const Conversation = require('../models/conversation');


router.post('/shout_out/:id', verifyToken, (req, res, next) => {
    const filter = !req.body.status ? { $addToSet: { shout_out: { $each: [req.userId] } } ,$set:{shout_out_count:1} } :{ $pull: { shout_out:  req.userId  }}
    User.findById({_id: req.userId},{}).lean().then(user=> {
      let following = user.following
          //following = following.concat(req.userId)   
    Post.findByIdAndUpdate({_id: req.params.id},filter ).then(game=> {
                    Post.findOne({_id: req.params.id}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((s)=>{
                        if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                            s['shout_out_status'] = true
            
                        }else{
                            s['shout_out_status'] = false
                        }
                        // var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter(function(obj) { return following.indexOf(obj._id.toString()) !== -1; }):[]
                        var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
                        var string_array = array3.length > 0 ? array3.map((a)=>a.name_status ? a.name : a.handle):[]
              let x = ''
              if(string_array.length === 1){
                x = `Shoutout by ${string_array[0]}`
                 }else if(string_array.length === 2){
                  x = `Shoutout by ${string_array[0]} and ${string_array[1]}`
                 }
                 else if(string_array.length === 3){
                  x = `Shoutout by ${string_array[0]}, ${string_array[1]} and ${string_array[2]}`
                }
                else if(string_array.length >= 4){
                  x = `Shoutout by ${string_array[0]}, ${string_array[1]}, ${string_array[2]} and ${string_array.length-3} more`
                   
                }
                s['shout_line'] = x
                        res.send({status:"success", message:"shouted out fetched successfully", data: s})
}).catch(next);
}).catch(next);
}).catch(next);

})

// router.post('/shout_out/:id', verifyToken, (req, res, next) => {
//     console.log('passasasasasaas',req.body)
//     const filter = !req.body.status ? { $addToSet: { shout_out: { $each: [req.userId] } } ,$set:{shout_out_count:1} } :{ $pull: { shout_out:  req.userId  }}
//     Post.findByIdAndUpdate({_id: req.params.id},filter ).then(game=> {
//                 Post.findOne({_id: req.params.id}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((s)=>{
//                     if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
//                         s['shout_out_status'] = true
        
//                     }else{
//                         s['shout_out_status'] = false
//                     }
//                    //console.log(s)
//                     res.send({status:"success", message:"shouted out fetched successfully", data: s})
// }).catch(next);
// }).catch(next);

// })

function parseDate(title){
    //.format('dddd, Do MMMM')
    const date = moment(title, "MM-DD-YYYY").format('ddd, Do MMM')
    const date1 = moment(title, "MM-DD-YYYY")
    const date_diff = moment().startOf('days').diff(date1,'days')
    if(date_diff === 0){
      return 'Today'
    }
    else if(date_diff === -1){
      return 'Tomorrow'
    }
    else if(date_diff === 1){
        return 'Yesterday'
      }
    else{
      return date

    }

  }

async function getChatHistory(id, user,final_date,message_id) {
    const x = await Conversation.findById({ _id: id }).populate("members","name profile_picture handle name_status").populate("host","name profile_picture handle name_status").lean().then((conversation) => {
      let date = conversation.join_date.length > 0 ? conversation.join_date.filter((jd) => jd.user_id.toString() === user.id.toString()) : []
      const x = conversation.members.filter((a)=>a._id.toString() === user.id.toString())
      const user1 =   conversation.exit_list && conversation.exit_list.length > 0 && conversation.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === user.id.toString())
      const filter  = x.length > 0 ?  date && date.length > 0 ? { _id:{$nin:[message_id]},conversation: id, created_at: { $lte: final_date } } : { conversation: id} :{ conversation: id, created_at: { $lte: moment(user1[user1.length-1].timeStamp).add(10,'seconds') } }
      conversation['exit'] = x.length > 0 ? false:true
      
      return Message.find(filter).lean().populate('author', 'name _id handle').populate('user', 'name _id profile_picture phone handle').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).sort({_id:-1}).limit(100).then(m => {
        // var groupBy = (xs, key) => {
        //     return xs.reduce((rv, x) =>{
        //       (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
        //       return rv;
        //     }, {});
        //   };
        //   const a = groupBy(m,'created_at')
          for(let i = 1 ;i <m.length; i++){
            if( moment(m[i].created_at).utc().format('MM-DD-YYYY') !== moment(m[i-1].created_at).utc().format('MM-DD-YYYY')){
                m.splice(i,0,{conversation:conversation._id,message:parseDate(moment(m[i-1].created_at).utc().format('MM-DD-YYYY')),name:'bot',read_status:false,read_by:user.id,author:user.id,type:'bot',created_at:m[i].created_at})
            }
          }
        return {messages:m,conversation:conversation}
      }).catch((e) => console.log(e))
    }).catch((e) => console.log(e))

    return x
  }



router.post('/history/:id', [
    verifyToken,
  ],async function(req, res, next) {
    // Conversation.findById({_id: req.params.id},{}).lean().then(user=> {
    //      // following = following.concat(req.userId)
    const x = await getChatHistory(req.params.id,{id:req.userId},req.body.message.created_at)  
    res.status(201).send({status: "success", message: "past chat collected",data:x})
  
    //}).catch(next)
  
  });
router.post('/update_convo/:id', [
  verifyToken,
], (req, res, next) => {
  Conversation.find({ _id: req.params.id }).populate("members", "name profile_picture handle name_status").populate("host", "name profile_picture handle name_status").lean().then(data => {
    if (data && data.length > 0) {
      Conversation.findByIdAndUpdate({ _id: req.params.id }, { $set: req.body }).then((data) => {
        Conversation.findOne({ _id: req.params.id }).populate("members", "name profile_picture handle name_status").populate("host", "name profile_picture handle name_status").lean().then(data => {
          res.status(201).send({ status: "success", message: "conversation updated", data: data })
        }).catch(next)
      })
    }
  }).catch(next)

  


  router.post('/get_more_chats/', [
    verifyToken,
  ], (req, res, next) => {
      const client = req.redis() 
      client.get('chatroom_'+req.userId, function(err, reply) { 
        if(err){
          console.log(err);
        }
        const data = JSON.parse(reply)
        let index = data.findIndex(x => x._id.toString() ===req.body.id.toString());
       let final_data = []
        if(index > 0){
          let diff = data.length - index 
          if(diff > 4){
            final_data = data.slice(index+1,index+3)
          }else if(diff < 4 && diff >= 1){
            final_data = data.slice(index+1,index+diff)
          }else{
            final_data.push({type:'empty',data:'No data available',_id:'no-id'})
          }
        } 
      res.status(201).send({status: "success", message: "venues collected",data:final_data})
    })
  
  });

});

module.exports = router;

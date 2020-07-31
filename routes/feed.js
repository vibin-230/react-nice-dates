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


router.post('/get_town_games/', [
    verifyToken,
  ], (req, res, next) => {
    User.findById({_id: req.userId},{}).lean().then(user=> {
      let following = user.following
         // following = following.concat(req.userId)
          console.log('following',following)
          const date = moment().add(5,'hours').add(30,'minutes')
          const date2 = moment(req.body.date).add(5,'hours').add(30,'minutes')
  
      const filter = req.body.sport === 'all' ? { created_by: { $in: following } ,town:true, host:{ $in: following },start_time:{$gte:date2}} :{ created_by: { $in: following } ,town:true,sport_name:{$in:req.body.sport}, host:{ $in: following }, start_time:{$gte:date}}
      const filter1 = req.body.sport === 'all'? { $or:[{created_by: { $in: following } ,status:true},{shout_out: { $in: following } ,status:true}]}:{ created_by: { $in: following } ,status:true,sport_name:req.body.sport}  
      //Game.find(filter).lean().populate('conversation').populate('host','_id name profile_picture phone handle name_status').populate("venue","venue").populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone').then(existingConversation=>{
       Post.find(filter1).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((posts)=>{
        // existingConversation.map((key)=>{
        //  key["venue"] = key.venue.venue
        // })

        let x = posts.map((s)=>{
            if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                s['shout_out_status'] = true
                
              }else{
                s['shout_out_status'] = false
              }
              var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
              //var array4 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.indexOf(obj._id.toString()) !== -1 ):[]

             console.log('asdasdasdasdasdasd',array3,s.shout_out)
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
            return s
        })
          // var groupBy = (xs, key) => {
          //   return xs.reduce((rv, x) =>{
          //     (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
          //     return rv;
          //   }, {});
          // };
          let finalResult = x.sort((a, b) => moment(a.start_time).format("YYYYMMDDHmm") >= moment(b.start_time).format("YYYYMMDDHmm") ? 1 : -1 )
          // const a = groupBy(finalResult,'start_time')
          // const q =   Object.entries(a).map(([key,value])=>{
          //         return {title:key,data:value }
          //   })
          res.status(201).send({status: "success", message: "town games collected",data:finalResult})
  
        }).catch(next)
      }).catch(next)
    //}).catch(next)
  
  });

module.exports = router;

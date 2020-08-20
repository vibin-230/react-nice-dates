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
const Coins = require('../models/coins');
const Post = require('../models/post');
const Game = require('../models/game');
const Conversation = require('../models/conversation');
const sendAlert = require('./../scripts/sendAlert')
const Alert = require('./../models/alerts')
const Experience = require('./../models/experience')

router.post('/shout_out/:id', verifyToken, (req, res, next) => {
    const filter = !req.body.status ? { $addToSet: { shout_out: { $each: [req.userId] } } ,$set:{shout_out_count:1} } :{ $pull: { shout_out:  req.userId  }}
  
    User.findById({_id: req.userId},{}).lean().then(user=> {
      let following = user.following
      //following = following.concat(req.userId)   
      Post.findByIdAndUpdate({_id: req.params.id},filter ).then(game=> {
        Post.findOne({_id: req.params.id}).lean().populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((s)=>{
          !req.body.status && sendAlert({created_at:new Date(),created_by:req.userId,user:s.created_by,post:s._id,type:'shoutout',status_description:`${user.name_status ? user.name:user.handle} gave you a shoutout.`},'addorupdate',next)
                        if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                            s['shout_out_status'] = true
            
                        }else{
                            s['shout_out_status'] = false
                        }
                        // var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter(function(obj) { return following.indexOf(obj._id.toString()) !== -1; }):[]
                        var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
                        var string_array = array3.length > 0 && array3.filter((a)=>a._id.toString() === s.created_by._id.toString()).length <= 0 ? array3.map((a)=>a.name_status ? a.name : a.handle):[]
              if(string_array.length === 1){
                s['shout_line'] = `Shoutout by ${string_array[0]}`
                 }else if(string_array.length === 2){
                  s['shout_line'] = `Shoutout by ${string_array[0]} and ${string_array[1]}`
                 }
                 else if(string_array.length === 3){
                  s['shout_line'] = `Shoutout by ${string_array[0]}, ${string_array[1]} and ${string_array[2]}`
                }
                else if(string_array.length >= 4){
                  s['shout_line'] = `Shoutout by ${string_array[0]}, ${string_array[1]}, ${string_array[2]} and ${string_array.length-3} more`
                }else{
                  s['shout_line'] = ''

                }
                        res.send({status:"success", message:"shouted out fetched successfully", data: s})
}).catch(next);
}).catch(next);
}).catch(next);

})



router.post('/activity/:id', verifyToken, (req, res, next) => {
  User.findById({_id: req.params.id},{}).lean().then(user=> {
    let following = user.following
  Post.find({created_by: { $in: [req.params.id] } ,status:true}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((created_posts)=>{
      Post.find({shout_out: { $in: [req.params.id] } ,status:true}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((shouted_posts)=>{
        Game.find({$or:[{host:{$in:[req.params.id]}}]}).lean().populate('venue','venue'). populate("host","name _id handle name_status profile_picture").populate('conversation').populate({ path: 'conversation',populate: { path: 'last_message' }}).then(game=>{
        const posts  = [...created_posts,...shouted_posts]
       let x = posts.map((s)=>{
            if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.params.id.toString()).length > 0){
                s['shout_out_status'] = true
                
              }else{
                s['shout_out_status'] = false
              }
              var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
              //var array4 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.indexOf(obj._id.toString()) !== -1 ):[]
            // let as = array3.filter((a)=>a._id.toString() === s.created_by._id.toString())
              var string_array = array3.length > 0  ? array3.map((a)=>a.name_status ? a.name.trim() : a.handle.trim()):[]
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
        const games_and_posts = [...x,...game]
        let finalResult = games_and_posts.sort((a, b) => moment(a.created_at).format("YYYYMMDDHmm") >= moment(b.created_at).format("YYYYMMDDHmm") ? 1 : -1 )

                   //console.log(s)
                    res.send({status:"success", message:"activity fetched successfully", data: finalResult})
}).catch(next);
}).catch(next);
}).catch(next);

}).catch(next);


})


router.post('/get_town_games/', [
    verifyToken,
  ], (req, res, next) => {
    User.findById({_id: req.userId},{activity_log:0}).lean().then(user=> {
      let following = user.following
         following = following.concat(req.userId)
          // const date = moment().add(5,'hours').add(30,'minutes')
          const date2 = moment(req.body.date).add(5,'hours').add(30,'minutes')

          // console.log("Data",req.userId,date,date2)
      // const filter = req.body.sport === 'all' ? { created_by: { $in: following } ,town:true, host:{ $in: following },start_time:{$gte:date2}} :{ created_by: { $in: following } ,town:true,sport_name:{$in:req.body.sport}, host:{ $in: following }, start_time:{$gte:date}}
      const filter1 = req.body.sport === 'all'? { $or:[{created_by: { $in: following } ,status:true,start_time:{$gte:date2}},{shout_out: { $in: following },start_time:{$gte:date2},status:true}]} : { $or:[{created_by: { $in: following } ,status:true,sport_name:{$in:req.body.sport},start_time:{$gte:date2}},{shout_out: { $in: following },start_time:{$gte:date2},status:true,sport_name:{$in:req.body.sport}}]}   
      //Game.find(filter).lean().populate('conversation').populate('host','_id name profile_picture phone handle name_status').populate("venue","venue").populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone').then(existingConversation=>{
      Post.find(filter1).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((posts)=>{
        // existingConversation.map((key)=>{
        //  key["venue"] = key.venue.venue
        // })
        // c is req.userId  
        let x = posts.map((s)=>{
            if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                s['shout_out_status'] = true
                
              }else{
                s['shout_out_status'] = false
              }
              var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
              //var array4 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.indexOf(obj._id.toString()) !== -1 ):[]
            // let as = array3.filter((a)=>a._id.toString() === s.created_by._id.toString())
              var string_array = array3.length > 0  ? array3.map((a)=>a.name_status ? a.name.trim() : a.handle.trim()):[]
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

  router.post('/get_alerts/', [
    verifyToken,
  ], (req, res, next) => {
    Alert.find({user: req.userId,created_by:{$nin:[req.userId]}}).lean().populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).populate({ path: 'post', populate: { path: 'event' , populate :{path:'venue',select:'venue'} } }).populate({ path: 'post', populate: { path: 'game' , populate :{path:'venue',select:'venue'} } }).populate('created_by','name _id handle profile_picture').then(alert=> {
      console.log(alert)    
      res.status(201).send({status: "success", message: "alerts collected",data:alert})
      }).catch(next)
    //}).catch(next)
  
  });

  router.post('/create_experience/', [
    verifyToken,
  ], (req, res, next) => {
    Experience.create(req.body).then(data=>{
        res.status(201).send({status: "success", message: "user collected",data:data})
      }).catch(next)
  });


  router.post('/alter_experience/:id', [
    verifyToken,
  ], (req, res, next) => {
        Experience.findOne({_id: req.params.id}).then(exp=> {
          Experience.findByIdAndUpdate({_id: req.params.id},req.body).then(exp=>{
            Experience.findOne({_id: req.params.id}).then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "exp collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
    }).catch(next);
    }).catch(next);
  });


  router.post('/get_experiences/', [
    verifyToken,
  ], (req, res, next) => {
        Experience.find({user:req.userId}).then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "exp collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
  });


  router.post('/get_coin_history/', [
    verifyToken,
  ], (req, res, next) => {
        Coins.find({user:req.userId}).then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "coin history collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
  });

  router.post('/send_refferal_code/:id', [
    verifyToken,
  ], (req, res, next) => {
    User.findOne({user:req.userId}).then(user=> {
      User.findOne({refer_id:req.params.id}).then(from_user=> {
        Coins.findOne({type:'referal',referal:req.params.id,user:req.userId}).then((coin)=>{
            if(!coin && !user.request_status){
              if (user && from_user && !user.temporary && !from_user.temporary) {
                const x = {type:'referal',referal:req.params.id,comments:`${user.name_status?user.name:user.handle} has got ${100} coins by using ${from_user.name_status?from_user.name:from_user.handle}'s referral`,amount:100,user:req.userId,from:from_user._id}
                const y = {type:'redeem',user:from_user._id,amount:50,comments:`You have got 50 coins from ${user.name_status?user.name:user.handle} for using your referal code`,from:req.userId}
                Coins.insertMany([x,y]).then((c)=>{
                  console.log(c)
                  Coins.aggregate([ { $match: { user:req.userId } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((a)=>{
                   User.findByIdAndUpdate({user:req.userId},{$set:{request_status:true}}).then((u)=>{
                     console.log(a)
                     res.status(201).send({status: "success", message: "coin history collected",data:a[0]})
                    }).catch(next);
                  }).catch(next);
                  }).catch(next);
                }
            }
             else {
              res.status(422).send({status: "failure", errors: {user:"sorry code already used"}});
          }
      }).catch(next);
    }).catch(next);
    }).catch(next);

  });


  router.post('/create_coin', [
    verifyToken,
  ], (req, res, next) => {
    
Coins.create(Object.assign({from:req.userId},req.body)).then((s)=>{
  Coins.aggregate([ { $match: { user:s.user } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((a)=>{
  res.status(201).send({status: "success", message: "coin created",data:a[0]})
}).catch(next);
}).catch(next);

  });


 

module.exports = router;

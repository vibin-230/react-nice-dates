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
var ObjectID = require('mongodb').ObjectID;



router.post('/shout_out/:id', verifyToken, (req, res, next) => {
  const filter = !req.body.status ? { $addToSet: { shout_out: { $each: [req.userId] } } ,$set:{shout_out_count:1} } :{ $pull: { shout_out:  req.userId  }}
    User.findById({_id: req.userId},{activity_log:0}).lean().then(user=> {
      let following = user.following
      //following = following.concat(req.userId)   
      Post.findByIdAndUpdate({_id: req.params.id},filter ).then(game=> {
        Post.findOne({_id: req.params.id}).lean().populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((s)=>{
          if(s.created_by._id.toString() !== req.userId.toString()){
            !req.body.status && sendAlert({created_at:new Date(),created_by:req.userId,user:s.created_by,post:s._id,type:'shoutout',status_description:`${user.name_status ? user.name:user.handle} gave you a shoutout.`},'create',next)
            req.body.status && sendAlert({created_at:new Date(),created_by:req.userId,user:s.created_by._id,post:s._id,type:'shoutout',status_description:`${user.name_status ? user.name:user.handle} remove your a shoutout.`},'delete',next)

          }
          if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                            s['shout_out_status'] = true
            
                        }else{
                            s['shout_out_status'] = false
                        }
                        // var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter(function(obj) { return following.indexOf(obj._id.toString()) !== -1; }):[]
                        var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
                        // var string_array = array3.length > 0 && array3.filter((a)=> s.created_by._id.toString() !== req.userId && a._id.toString() === s.created_by._id.toString()).length <= 0 ? array3.map((a)=>a.name_status ? a.name : a.handle):[]
                        var string_array1 = array3.length > 0 && array3.filter((a)=> a._id.toString() !== req.userId.toString() )
                        var string_array =  string_array1.length >= 0 ?  string_array1.map((a)=>a.handle):[]

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
            var string_array1 = array3.length > 0 && array3.filter((a)=> a._id.toString() !== req.userId.toString() )
            var string_array =  string_array1.length >= 0 ?  string_array1.map((a)=>a.name_status ? a.name : a.handle):[]
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
        let y = x.filter((key)=> key && key.game )
        let z = x.filter((key)=>key && key.event)
        const games_and_posts = [...y,...z,,...game]
        let finalResult = games_and_posts.sort((a, b) => moment(a.created_at).format("YYYYMMDDHmm") >= moment(b.created_at).format("YYYYMMDDHmm") ? 1 : -1 )

                   //console.log(s)
                    res.send({status:"success", message:"activity fetched successfully", data: finalResult})
}).catch(next);
}).catch(next);
}).catch(next);

}).catch(next);


})

function getZcode(hours_bfore_game,share,shout_out,hr_since_post,distance,players,joins){
  return (50 * share) - (hours_bfore_game*100)  + (50 * shout_out) - (2 * hr_since_post) - (distance * 1) + (players / 10) + (30 * joins)
}

function getTimeToGame(hours_bfore_game){
const dateOneObj =new Date();
const dateTwoObj = new Date(hours_bfore_game);
const milliseconds = Math.abs(dateTwoObj - dateOneObj);
return Math.round(milliseconds / 36e5);
}

router.post('/get_town_games/', [verifyToken,], (req, res, next) => {
    User.findById({_id: req.userId},{activity_log:0}).lean().then(user=> {
      let following = user.following
         following = following.concat(req.userId)
          // const date = moment().add(5,'hours').add(30,'minutes')
          const date2 = moment(req.body.date).add(5,'hours').add(30,'minutes')

          // console.log("Data",req.userId,date,date2)
      // const filter = req.body.sport === 'all' ? { created_by: { $in: following } ,town:true, host:{ $in: following },start_time:{$gte:date2}} :{ created_by: { $in: following } ,town:true,sport_name:{$in:req.body.sport}, host:{ $in: following }, start_time:{$gte:date}}
      const filter1 = req.body.sport === 'all'? { $or:[{created_by: { $in: following } ,status:true,start_time:{$gte:date2}},{shout_out: { $in: following },start_time:{$gte:date2},status:true}]} : { $or:[{created_by: { $in: following } ,status:true,sport_name:{$in:req.body.sport},start_time:{$gte:date2}},{shout_out: { $in: following },start_time:{$gte:date2},status:true,sport_name:{$in:req.body.sport}}]}   
      //Game.find(filter).lean().populate('conversation').populate('host','_id name profile_picture phone handle name_status').populate("venue","venue").populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone').then(existingConversation=>{
      Post.find(filter1).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status visibility').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((posts)=>{
        Post.find({shout_out: { $in: [req.params.id] } ,status:true}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((shouted_posts)=>{

        // existingConversation.map((key)=>{
        //  key["venue"] = key.venue.venue
        // })
        // c is req.userId  


        let x = posts.filter(a=>a && a.game || a && a.event).map((s)=>{
          const hours_bfore_game = getTimeToGame(s.start_time)-5
          const share = user && user.following && user.following.some((a)=> a.toString() === s.created_by._id.toString()) ? 1 : 0
          const shout_out_count = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.length : 0
          const hr_since_post = getTimeToGame(s.created_at)
          const players = s && s.game && s.game.users && s.game.users.length > 0  ?  (s.game.users.length/s.game.limit)*10 : 0
          const users = s && s.game && s.game.users && s.game.users.length > 0 ? s.game.users.map((a)=>a._id).filter((a1)=> following.some((a)=> a.toString() === a1.toString())) : []
          const common_friends_count_in_the_game = users
          const zcode = getZcode(hours_bfore_game,share,shout_out_count,hr_since_post,1,players,users.length)
          // console.log("ssss")
          // console.log('hrs before game ',s.message,hours_bfore_game,share,shout_out_count,hr_since_post,1,players,users.length,'zcode:',zcode,s.start_time,s.created_at,new Date());
            if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
                s['shout_out_status'] = true
                
              }else{
                s['shout_out_status'] = false
              }
              
              var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
              //var array4 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.indexOf(obj._id.toString()) !== -1 ):[]
            // let as = array3.filter((a)=>a._id.toString() === s.created_by._id.toString())
              // var string_array = array3.length > 0  ? array3.map((a)=>a.name_status ? a.name.trim() : a.handle.trim()):[]
              var string_array1 = array3.length > 0 && array3.filter((a)=>  a._id.toString() !== req.userId.toString() )
              // .filter((a)=> s.created_by._id.toString() !== req.userId.toString() && a._id.toString() === s.created_by._id.toString() )
              var string_array =  string_array1.length >= 0 ?  string_array1.map((a)=>a.handle):[]
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
                s['zcode'] = zcode
            return s
        })
        // .filter(a => a && a.game)
          // var groupBy = (xs, key) => {
          //   return xs.reduce((rv, x) =>{
          //     (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
          //     return rv;
          //   }, {});
          // };

          let finalResult = x.sort((a, b) => a.zcode <= b.zcode ? 1 : -1 )
          // const a = groupBy(finalResult,'start_time')
          // const q =   Object.entries(a).map(([key,value])=>{
          //         return {title:key,data:value }
          //   })
          const client = req.redis()
          client.set('post_'+req.userId, JSON.stringify(finalResult), function(err, reply) {
            console.log('redis comeback',reply);
          });
          const finalData = [...finalResult]
          res.status(201).send({status: "success", message: "town games collected",data:finalData})
  
        }).catch(next)
      }).catch(next)
    }).catch(next)
    //}).catch(next)
  
  });
  router.post('/get_more_posts/', [
    verifyToken,
  ], (req, res, next) => {
      const client = req.redis()  
      client.get('post_'+req.userId, function(err, reply) { 
        if(err){
          console.log(err);
        }
        const data = JSON.parse(reply)
        let index = req.body && req.body.post_id && req.body.post_id._id ?  data.findIndex(x => x._id.toString() ===req.body.post_id._id.toString()) : -1 ;
       let final_data = []
        let diff;
        if(index > 0){
          diff = data.length - index  > 4 ? 4 : data.length - index
          if(diff > 4){
            final_data = data.slice(index+1,index+4)
          }else if(diff < 4 && diff >= 1){
            final_data = data.slice(index+1,index+diff)
          }else{
            final_data.push({type:'empty',data:'No data available'})
          }

        } 
      res.status(201).send({status: "success", message: "posts collected",data:final_data})
    })
  
  });

  router.post('/get_alerts/', [
    verifyToken,
  ], (req, res, next) => {
    Alert.find({user: req.userId,created_by:{$nin:[req.userId]}}).sort({created_at: -1}).lean().populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).populate({ path: 'post', populate: { path: 'event' , populate :{path:'venue',select:'venue'} } }).populate({ path: 'post', populate: { path: 'game' , populate :{path:'venue',select:'venue'} } }).populate('created_by','name _id handle profile_picture').then(alert=> {
      let y = alert.filter((key)=>{
        if(key.type == "shoutout" && key.post !== null && key.post.type == "game"){
          return (key.post.game !== null && key.created_by !== null ) 
        }
        else if(key.type == "shoutout" && key.post !== null && key.post.type == "event"){
          return (key.post.event !== null && key.created_by !== null) 
        }
        else {
          return key.created_by !== null
        }
      } )
      const client = req.redis()
          client.set('alerts_'+req.userId, JSON.stringify(y), function(err, reply) {
            console.log('redis comeback',reply);
          });
      const finalData = [...y]
      console.log("finalss",finalData.length)
      res.status(201).send({status: "success", message: "alerts collected",data:finalData.slice(0,12)})
      }).catch(next)
  
  });

router.post('/get_more_alerts/', [
    verifyToken,
  ], (req, res, next) => {
      const client = req.redis()  
      client.get('alerts_'+req.userId, function(err, reply) { 
        if(err){
          console.log(err);
        }
        const data = JSON.parse(reply)

        let index = req.body && req.body.alert && req.body.alert._id ?  data.findIndex(x => x._id.toString() ===req.body.alert._id.toString()) : -1 ;
       let final_data = []

       let diff;
       if(index > 0){
         diff = data.length - index  > 12 ? 12 : data.length - index
         console.log("index",index,"diff",diff,"data.length",data.length, )
         if(diff >= 12){
           final_data = data.slice(index+1,index+12)
         }else if(diff < 12 && diff > 1){
           final_data = data.slice(index+1,index+diff)
         }else{
           final_data.push({type:'empty',data:'No data available'})
         }
       }

      res.status(201).send({status: "success", message: "alerts collected",data:final_data})
    })
  
  });

  router.post('/create_experience/', [
    verifyToken,
  ], (req, res, next) => {
    Experience.create(req.body).then(data=>{
        res.status(201).send({status: "success", message: "user collected",data:data})
      }).catch(next)
  });


  router.post('/tt_users/', [
    verifyToken,
  ], (req, res, next) => {
    User.find({_id:{$nin:[req.userId]},handle:{"$exists" : true, "$ne" : ""}}).select("name profile_picture handle name_status _id").then(data=>{
        res.status(201).send({status: "success", message: "user collected",data:data})
      }).catch(next)
  });


  router.post('/test/:id', [
    verifyToken,
  ], (req, res, next) => {
    User.find({refer_id:'',},null, { getters: false }).select("name profile_picture handle name_status _id").then(data=>{

      res.status(201).send({status: "success", message: "user collected",data:data})
      }).catch(next)
  });

 


  router.post('/alter_experience/:id', [
    verifyToken,
  ], (req, res, next) => {
        Experience.findOne({_id: req.params.id}).then(exp=> {
          Experience.findByIdAndUpdate({_id: req.params.id},req.body).then(exp=>{
            Experience.find({user: req.userId}).then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "exp collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
    }).catch(next);
    }).catch(next);
  });


  router.post('/get_experiences/:id', [
    verifyToken,
  ], (req, res, next) => {
        Experience.find({user:req.params.id}).then(exp=> {
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
        Coins.find({user:req.userId}).populate("from","name profile_picture handle name _id").populate("user","name profile_picture handle name _id").sort({created_at:-1}).then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "coin history collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
  });

  router.post('/get_coin_history/:id', [
    verifyToken,
  ], (req, res, next) => {
        Coins.find({user:req.params.id}).populate("from","name profile_picture handle name _id").populate("user","name profile_picture handle name _id").then(exp=> {
              if (exp) {
            res.status(201).send({status: "success", message: "coin history collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
  });


  router.post('/get_coin_history_admin/', [
    verifyToken,
  ], (req, res, next) => {
        Coins.find({}).populate("from","name profile_picture handle name _id").populate("user","name profile_picture handle _id").then(exp=> {
          if (exp) {
            res.status(201).send({status: "success", message: "coin history collected",data:exp})
          } else {
              res.status(422).send({status: "failure", errors: {user:"force update failed"}});
          }
      }).catch(next);
  });
  

  router.post('/send_refferal_code', [
    verifyToken,
  ], (req, res, next) => {
    User.findOne({_id:req.userId}).then(user=> {
      User.findOne({refer_id:req.body.id},{activity_log:0}).then(from_user=> {
        if(from_user){
        Coins.findOne({type:'referal',referal:req.body.id,user:req.userId}).then((coin)=>{
          if(!coin){
              if (user && from_user && !user.temporary && !from_user.temporary) {
                const x = {type:'referal',referal:req.body.id,comments:`${user.name_status?user.name:user.handle} has got ${50} coins by using ${from_user.name_status?from_user.name:from_user.handle}'s referral`,amount:50,user:req.userId,from:from_user._id,created_at:new Date()}
                const y = {type:'redeem',user:from_user._id,amount:100,comments:`You have got 100 coins from ${user.name_status?user.name:user.handle} for using your referal code`,from:req.userId,created_at:new Date()}
                Coins.insertMany([x,y]).then((c)=>{
                  console.log(c)
                  Coins.aggregate([ { $match: { user:user._id } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((a)=>{
                     let coins1  =  a && a.length > 0 && a[0].amount ? a[0].amount : 0
                     sendAlert({created_at:new Date(),created_by:user._id,user:from_user._id,type:'referal',status_description:`${user.handle} has joined Turf Town using your referral code. Here's ${100} Turf Coins as a reward`},'create',next)
                     res.status(201).send({status: "success", message: "coin history collected",data:{coins:50,from_user:from_user }})
                  }).catch(next);
                  }).catch(next);
                }
            }
             else {
              res.status(422).send({status: "failure", errors: {user:"sorry code already used"}});
          }
      }).catch(next);
    }else{
      res.status(422).send({status: "failure", errors: {user:"sorry code doesn't exit"}}); 
    }
    }).catch(next);
    }).catch(next);

  });

  router.post('/user_activity/:id', [
    verifyToken,
  ], (req, res, next) => {


    // {$and:[{_id:{$nin:[req.userId]}},{ $or: [{"name":{ "$regex": req.body.search, "$options": "i" }}, {"handle":{ "$regex": req.body.search, "$options": "i" }}]}]}

  
    User.findById({_id:req.params.id},{}).lean().then(user=> {
    Post.find({created_by:req.params.id}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue'}] }).then((posts)=>{
      let following = [user.following,req.params.id]
      let x = posts.map((s)=>{
        if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
            s['shout_out_status'] = true
            
          }else{
            s['shout_out_status'] = false
          }
          // var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((a)=>a._id.toString() !== req.userId.toString()) : []
          // var string_array = array3.length > 0  ? array3.map((a)=> a.handle.trim()):[]

          var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
          var string_array1 = array3.length > 0 && array3.filter((a)=>  a._id.toString() !== req.userId.toString() )
          var string_array =  string_array1.length >= 0 ?  string_array1.map((a)=>a.handle):[]
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
    let y = x.filter((key)=> key && key.game )
    let z = x.filter((key)=>key && key.event)
    let final = [...y,...z]
    final.sort((a, b) => a.start_time <= b.start_time ? 1 : -1 )
    const client = req.redis()
    client.set('user_activity_'+req.userId, JSON.stringify(final), function(err, reply) {
      console.log('redis comeback',reply);
    });

    const finalData = [...final]
      res.status(201).send({status: "success", message: "user post activity",data:finalData.slice(0,10)})
    }).catch(next);
  }).catch(next);
  });


  router.post('/get_more_user_activity/:id', [
    verifyToken,
  ], (req, res, next) => {
    const client = req.redis()
      client.get('user_activity_'+req.userId, function(err, reply) { 
        if(err){
          console.log(err);
        }
        const data = JSON.parse(reply)
        let index =  req.body.user_activity && req.body.user_activity._id  ? data.findIndex(x => x._id.toString() === req.body.user_activity._id.toString()) : 0 ;
       let final_data = []

       let diff;
        if(index > 0){
          diff = data.length - index  > 10 ? 10 : data.length - index
          console.log("index",index,"diff",diff,"data.length",data.length, )
          if(diff >= 10){
            final_data = data.slice(index+1,index+10)
          }else if(diff < 10 && diff > 1){
            final_data = data.slice(index+1,index+diff)
          }else{
            final_data.push({type:'empty',data:'No data available'})
          }
        }
      res.status(201).send({status: "success", message: "posts collected",data:final_data})
    })
  
  });

  router.post('/user_activity_friend/:id', [
    verifyToken,
  ], (req, res, next) => {
    User.findById({_id:req.params.id},{}).lean().then(user=> {
    Post.find({created_by:req.params.id}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then((posts)=>{
      let following = user.following
      let x = posts.map((s)=>{
        if( s && s.shout_out && s.shout_out.length>0 && s.shout_out.filter((a)=>a._id.toString() === req.userId.toString()).length > 0){
            s['shout_out_status'] = true
            
          }else{
            s['shout_out_status'] = false
          }
          var array3 = s && s.shout_out && s.shout_out.length>0 ? s.shout_out.filter((obj)=> following.filter(a=>a.toString() === obj._id.toString()).length > 0  ):[]
          var string_array1 = array3.length > 0 && array3.filter((a)=>  a._id.toString() !== req.params.id.toString() )
          var string_array =  string_array1.length >= 0 ?  string_array1.map((a)=>a.handle):[]
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
    client.set('user_activity_friend_'+req.userId, JSON.stringify(finalResult), function(err, reply) {
      console.log('redis comeback',reply);
    });
      res.status(201).send({status: "success", message: "coin history collected",data:x.slice(0,4)})
    }).catch(next);
  }).catch(next);
  });


  router.post('/get_more_user_activity_friend/', [
    verifyToken,
  ], (req, res, next) => {
      const client = req.redis()  
      client.get('user_activity_friend_'+req.userId, function(err, reply) { 
        if(err){
          console.log(err);
        }
        const data = JSON.parse(reply)
        let index = data.findIndex(x => x._id.toString() ===req.body.user_activity._id.toString());
       let final_data = []
        console.log('data length',data.length);
        if(index > 0){
          let diff = data.length - index 
          if(diff > 4){
            final_data = data.slice(index+1,index+3)
          }else if(diff < 4 && diff >= 1){
            final_data = data.slice(index+1,index+diff)
          }else{
            final_data.push({type:'empty',data:'No data available'})
          }
        } 
      res.status(201).send({status: "success", message: "user activity collected",data:final_data})
    })
  
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

router.post('/turf_coin_history', [
  verifyToken,
], (req, res, next) => {
  Coins.aggregate([{$group:{_id:"$user",
  amount: { $sum: "$amount"},
  data:{ $push: "$$ROOT" } 
}}]).then((s) => {
    res.status(201).send({ status: "success", message: "coin history collected", data: s })
  }).catch(next);

});


 

module.exports = router;

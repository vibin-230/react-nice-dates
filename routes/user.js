const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const app = express()
const moment = require('moment');
const momentTZ = require('moment-timezone');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const server = require('../scripts/constants');
const link = require('../scripts/uri');
const Slots = require('../sample/slots');
const { check, validationResult } = require('express-validator/check');
const verifyToken = require('../scripts/verifyToken');
const jwt = require('jsonwebtoken');
const config = require('../config');
const mail = require('../scripts/mail');
const sh = require("shorthash");
const _ = require('lodash');
const combineSlots = require('../scripts/combineSlots')
const combineSlots1 = require('../scripts/combineSlots1')

const combineRepeatSlots = require('../scripts/combineRepeatedSlots')
const upload = require("../scripts/aws-s3")
const uploadPDF = require("../scripts/aws-s3-pdf")

const uploadMultiple = require('../scripts/aws-s3-multiple')
const aws = require('aws-sdk')
const multerS3 = require('multer-s3');
const AccessControl = require("../scripts/accessControl")
const SetKeyForSport = require("../scripts/setKeyForSport")
const SetKeyForEvent = require("../scripts/setKeyForEvent")
const SlotsAvailable = require("../helper/slots_available")
const SlotsValueAvailable = require("../helper/slots_value_available")
const BookSlot = require("../helper/book_slot")
const SendMessage = require("../helper/send_message")
const BookRepSlot = require("../helper/book_repeated_slot")
const mkdirp = require('mkdirp');
const Offers = require('../models/offers');
const User = require('../models/user');
const Game = require('../models/game');
const Post = require('../models/post');
const Alert = require('../models/alerts');
const createReport = require('../scripts/collectReport')
const Conversation = require('../models/conversation');
const Event = require('./../models/event')
const Booking = require('../models/booking');
const EventBooking = require('../models/event_booking');
const Venue = require('../models/venue');
const Version = require('../models/version');
const Admin = require('../models/admin');
const Ads = require('../models/ads')
const Invoice = require('../models/Invoice')
const Message = require('../models/message')
const Coins = require('../models/coins')
const Experience = require('./../models/experience')
const Contacts = require('../models/contacts')
const send_message_otp = require('../helper/send_message_otp')
const notify = require('../scripts/Notify')
const notifyRedirect = require('../scripts/NotifyNoRedirect')
const bcrypt = require('bcrypt');
const saltRounds = 10;
const NotifyArray = require('../scripts/NotifyArray')
const multer = require('multer')
const sendAlert = require('./../scripts/sendAlert')
const ModifyBookSlot = require('./../helper/modify_book')
var multer_upload = multer({ dest: 'uploads/' })
var io = require('socket.io-emitter')("//127.0.0.1:6379")
const rzp_key = require('../scripts/rzp');


 const indianRupeeComma = (value) => {
  return value.toLocaleString('EN-IN');
}

function ActivityLog(activity_log) {
  let user = activity_log.user_type==="user"?User:Admin
  user.findOneAndUpdate({_id:activity_log.id},{$push:{activity_log:activity_log}}).then(admin=>{
  })
}

function getGame(res,convo_id,refund_status,next,req){
  Conversation.findById({_id:convo_id}).lean().populate('members','_id name device_token profile_picture handle name_status visibility').then((convo)=>{
    convo['exit2'] =  convo.members.filter((a)=>a._id.toString() === req.userId.toString()).length > 0 ? false : true
    convo['exit'] =  convo.members.filter((a)=>a._id.toString() === req.userId.toString()).length > 0 ? false : true
  
    Game.findOne({conversation:convo_id}).lean().populate("mvp.target_id","name handle profile_picture _id").populate("conversation").populate('host','_id name profile_picture phone handle name_status visibility').populate('users','_id name profile_picture phone handle name_status visibility').populate('invites','_id name profile_picture phone handle visibility').then(game=>{
            Venue.findById({_id:game.bookings[0].venue_id}).then(venue =>{
              Offers.find({}).then(offers=>{
              let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(venue._id) !== -1)
              venue["offers"] = filteredOffer
              let game1 = Object.assign({},game)
              game1["venue"] = venue
              game1["rating"] = venue.rating
              game1['final'] = _.xor(game1.users,game1.host)
              convo['validity'] = moment().format('YYYYMMDDHHmm')  > moment(game.start_time).subtract(300,"minutes").format('YYYYMMDDHHmm')
              game1["conversation"] = convo
              game1['refund'] = refund_status
              game1['validity'] = moment().format('YYYYMMDDHHmm')  > moment(game.start_time).subtract(300,"minutes").format('YYYYMMDDHHmm')
              res.send({status:"success", message:"game_fetched",data:game1})
            })
    }).catch(next);
  }).catch(next);
}).catch(next);
}

function getRandomColor(){
  let colors = ["rgba(9,86,230,0.8)","#E76036","#D111BB","#3DAA1F","#27B5D1","#ff4c67","#9044F0"]
  return colors[Math.floor(Math.random() * colors.length)]
}

function getColors(members){
  let data = members.map((key,index)=>{
    let color = getRandomColor()
    return color
  })
  return data
}


Date.prototype.addHours= function(h,m){
  this.setHours(this.getHours()+h);
  this.setMinutes(this.getMinutes()+m);
  return this;
}


router.post('/get_more_chats/', [
  verifyToken,
], (req, res, next) => {
    const client = req.redis() 
    console.log(req.body); 
    client.get('chatroom_'+req.userId, function(err, reply) { 
      if(err){
        console.log(err);
      }
      const data = JSON.parse(reply)
      let index = data.findIndex(x => x._id.toString() ===req.body.id.toString());
     let final_data = []
     let diff
      if(index > 0){
         diff = data.length - index  > 10 ? 10 : data.length - index
        if(diff >= 10){
          final_data = data.slice(index+1,index+10)
          console.log('next index',index+1,index+10);
        }else if(diff < 10 && diff >= 1){
          final_data = data.slice(index+1,index+diff)
          console.log('next index',index+1,index+diff);

        }else{
          final_data.push({type:'empty',data:'No data available',_id:'no-id'})
        }
      } 
      console.log('final_data',final_data.length);
        console.log('data',data.length);
        console.log('index',index);
          console.log('diff',diff);
    res.status(201).send({status: "success", message: "venues collected",data:final_data})
  })

});

router.post('/get_more_past_bookings/', [
  verifyToken,
], (req, res, next) => {
    const client = req.redis() 
    console.log(req.body); 
    client.get('bookings_past_'+req.userId, function(err, reply) { 
      if(err){
        console.log(err);
      }
      const data = JSON.parse(reply)
      let index = data.findIndex(x => x.title.toString() ===req.body.id.toString());
     let final_data = []
      console.log('data length',data.length);
      if(index > 0){
        let diff = data.length - index 
        if(diff > 3){
          final_data = data.slice(index+1,index+2)
        }else if(diff < 2 && diff >= 1){
          final_data = data.slice(index+1,index+diff)
        }else{
          final_data.push({type:'empty',data:'No data available',_id:'no-id'})
        }
      } 
    res.status(201).send({status: "success", message: "venues collected",data:final_data})
  })

});

router.post('/get_more_present_bookings/', [
  verifyToken,
], (req, res, next) => {
    const client = req.redis() 
    console.log(req.body); 
    client.get('bookings_present_'+req.userId, function(err, reply) { 
      if(err){
        console.log(err);
      }
      const data = JSON.parse(reply)
      let index = data.findIndex(x => x.title.toString() ===req.body.id.toString());
     let final_data = []
      console.log('data length',data.length,index);
      if(index > 0){
        let diff = data.length - index 
        if(diff > 3){
          final_data = data.slice(index+1,index+2)
        }else if(diff < 3 && diff >= 1){
          final_data = data.slice(index+1,index+diff)
        }else{
          //final_data.push({type:'empty',data:'No data available',_id:'no-id'})
        }
      } 
    res.status(201).send({status: "success", message: "present collected",data:final_data})
  })

});



//Create User
router.post('/create_user', [
  verifyToken,

  check('email').exists().isLength({ min: 1}).withMessage('email cannot be empty'),
  check('email').isEmail().withMessage('email is incorrect'),
  check('name').exists().isLength({ min: 1}).withMessage('name cannot be empty'),
  check('dob').isISO8601().withMessage('date of birth needs to be a valid date'),
  check('gender').exists().isLength({ min: 1}).withMessage('gender cannot be empty'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var result = {};
    var errorsList = errors.array();
    for(var i = 0; i < errorsList.length; i++)
    {
        result[errorsList[i].param] = errorsList[i].msg;
    }
    return res.status(422).json({ errors: result});
  }
    //Generate user id
    User.findOne({},null,{sort: {$natural:-1}}).then(users=> {
      if(!users){
        req.body.userid = 1;
      }else{
        req.body.userid = users.userid + 1;
      }
      //Check if user exist
      User.find
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
          User.findOne({email:req.body.email}).then(user=> {
            if(user)
            {
              res.status(422).send({status:"failure",errors:{email:"email already exists"}})
            }else{
              
              req.body.created_at = moment();
              User.findByIdAndUpdate({_id: req.userId},req.body).then(user=>{
                User.findOne({phone:req.body.phone},{__v:0,token:0},null).then(user1=>{
                res.status(201).send({status: "success", message: "user created", data:user1})
                let activity_log = {  
                  datetime: new Date(),
                  id:req.userId,  
                  user_type: "user",
                  activity: "user created",
                  name:req.name,
                  message: req.name + " created successfully",
                }
                ActivityLog(activity_log)
              })
            })
            }
          })
        } else {
            res.status(422).send({status: "failure", errors: {user:"user doesn't exist"}});
        }
      })
    }).catch(next);
});


router.post('/force_update_all', [
  verifyToken,
], (req, res, next) => {
    User.updateMany({force_update:true}).then((user)=>{
        res.status(201).send({status: "success", message: "user updated all"})
    })
});


router.post('/delete_conversation_empty/:id', [verifyToken,], (req, res, next) => {
  Conversation.findById({_id:req.body.conversation_id}).then((convo)=>{ 
    Message.find({conversation:req.body.conversation_id}).then((user)=>{
      if(user.length === 0){
        Conversation.findByIdAndRemove({_id:req.body.conversation_id}).then(conversation=> {
          console.log("conver",conversation)
          res.send({status:"success", message:"conversation deleted"})
      }).catch(next);
      }
      else {
        res.status(201).send({status: "success", message: "conversation updated"})
      }
  }).catch(next);
}).catch(next); 
});


router.post('/mark_read/:id', [
  verifyToken,
], (req, res, next) => {
  Conversation.findById({_id:req.body.conversation_id}).then((convo)=>{
      
    Message.updateMany({conversation:req.body.conversation_id,read_status:false},{ '$set': { "read_status" : true } },{multi:true}).then((user)=>{
      const a = convo.last_active && convo.last_active.length > 0 ? convo.last_active.map((con)=>{
            if(con.user_id.toString() === req.params.id.toString()){
              con['last_active'] = new Date()
              return con
            }else 
            return con
          }) : [{user_id:req.params.id,last_active:new Date()}]

    Conversation.findByIdAndUpdate({_id:req.body.conversation_id},{last_active:a}).then(conversation=>{
      res.status(201).send({status: "success", message: "conversation updated"})
    }).catch(next);
  }).catch(next);
}).catch(next); 
});


router.post('/show_more_messages/:id', [
  verifyToken,
], (req, res, next) => {
    Message.find({conversation:req.params.id,created_at: { $lt: req.body.message.created_at }}).lean().populate('author', 'name _id').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).sort({_id:-1}).limit(10).then(m => {
      res.status(201).send({status: "success", message: "Conversation messages success",data:m})
    }).catch(next); 
});

router.post('/stop_force_update_all', [
  verifyToken,
], (req, res, next) => {
    User.updateMany({force_update:false}).then((user)=>{
        res.status(201).send({status: "success", message: "user updated all"})
    })
});

router.post('/force_update_by_user', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.body.userId}).then(user=> {
        if (user) {
              req.body.modified_at = moment();
              User.findByIdAndUpdate({_id: req.body.userId},{force_update:req.body.force_update},{activity_log:0}).then(user1=>{
                   res.status(201).send({status: "success", message: "user force_updated"})
            })
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
});
router.post('/force_update_by_user_app', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
              req.body.modified_at = moment();
              User.findByIdAndUpdate({_id: req.userId},{force_update:req.body.force_update,version:req.body.version},{activity_log:0}).then(user1=>{
                res.status(201).send({status: "success"});
            })
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
});

router.post('/check_user_game', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
          Game.findOne({_id:req.body.id}).lean().populate("conversation").populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=>{
            Conversation.findById({_id:game.conversation._id}).populate('members','_id name device_token profile_picture handle name_status').then((convo)=>{
                    Venue.findById({_id:game.bookings[0].venue_id}).then(venue =>{
                      let game1 = Object.assign({},game)
                      game1["venue"] = venue
                      game1["rating"] = venue.rating
                      game1['final'] = _.xor(game1.users,game1.host)
                      game1["conversation"] = convo
                      const x = user.following.concat(user.followers).concat([req.userId])
                      if(x.filter(a=>a.toString() === req.userId.toString()).length > 0 ){

                      if(game1.users.filter(a=>a._id.toString() === req.userId.toString()).length > 0 || game1.host.filter(a=>a._id.toString() === req.userId.toString()).length > 0 ){
                        res.send({status:"success", message:"user exists",data:game1})
                      }else{
                        res.send({status:"success", message:game1.share_type === 'closed'? "invalid user":'no user',data:game1})
                      }
                    }else{
                      res.send({status:"success", message:game1.share_type === 'closed'? "invalid user":'no user',data:game1})
                    }
                    })
    }).catch(next);
    }).catch(next);
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
});


function getLevel(x){
  if(x<500){
    return {value:x,limit:500,level:0}
  }
  else if(x>500 && x<=1200){
    return {value:x,limit:1200,level:1}
  }
  else if(x>1200 && x<=2000){
    return {value:x,limit:2000,level:2}
  }
  else if(x>2000 && x<=3000){
    return {value:x,limit:3000,level:3}
  }
  else if(x>3000 && x<=4000){
    return {value:x,limit:4000,level:4}
  }
  else if(x>4000 && x<=5250){
    return {value:x,limit:5250,level:5}
  }
  else if(x>5250 && x<=7000){
    return {value:x,limit:7000,level:6}
  }
  else if(x>7000 && x<=8500){
    return {value:x,limit:8500,level:7}
  }
  else if(x>8500 && x<=10000){
    return {value:x,limit:10000,level:8}
  }
  else if(x>10000 && x<=12000){
    return {value:x,limit:12000,level:9}
  }
  else if(x>12000 && x<=14000){
    return {value:x,limit:14000,level:10}
  }
  else if(x>14000 && x<=16000){
    return {value:x,limit:16000,level:11}
  }
  else if(x>16000 && x<=22000){
    return {value:x,limit:22000,level:12}
  }

}




router.post('/get_user', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      var count  = 0
      let game_completed_count = 0
      let mvp_count = 0
      let game_history = {}
      Alert.find({user: req.userId,status:true},{}).lean().then(alert=> {
        Game.find({users: {$in:[req.userId]},completed:true}).then(game=> {
          game_completed_count = game && game.length > 0 ? game.length : 0
          const aw = game && game.length > 0 && game.filter((a)=>{
           let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0
           mvp_count = mvp_count + f
           return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length>0
          })

          const aq = game.map((a)=>{
                game_history[a.sport_name] = {game: game_history && game_history[a.sport_name] && game_history[a.sport_name].game && game_history[a.sport_name].game > 0 ? game_history[a.sport_name].game+1:1,mvp: a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0,mv_data:a.mvp }
          })
          console.log('ga',game_history);
          //mvp_count = aw && aw.length > 0 ? aw.length : 0
          User.findOne({_id: req.userId},{activity_log:0}).populate("requests","name _id profile_picture").lean().then(user=> {
            Coins.aggregate([ { $match: { user:user._id } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((coins)=>{
            if (user) {
             user['total'] = 0
               const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
               user['alert_total'] = alerts1.length
               user['game_completed'] = game_completed_count
               user['mvp_count'] = mvp_count
               user['handle'] = user && user.handle ? user.handle : 'new_user'
               user['refer_custom_value'] = 50
               user['refer_custom_value1'] = 100
               user['game_history'] = game_history
               user['coins'] =  coins && coins.length > 0 && coins[0].amount ? coins[0].amount : 0
               user['level'] =  getLevel(250 * mvp_count + 100 * game_completed_count)
               res.status(201).send({status: "success", message: "user collected",data:user})
              } else {
                res.status(422).send({status: "failure", errors: {user:"force update failed"}});
              }
            }).catch(next);
          }).catch(next)
         }).catch(next)
      }).catch(next)
       

});

router.post('/get_user_details', [
  verifyToken,
], (req, res, next) => {
      var id = mongoose.Types.ObjectId(req.userId);
        User.find({$and:[{ "email": { $exists: true, $ne: null }}]}).lean().then(user1=>{
          User.aggregate(
            [ { $match : { _id : id} },
              {$project:{followers:1,following:1,allvalues:{$setUnion:["$followers","$following"] }}}
            ]
           ).then(mergedUser=>{
            Venue.find({}).then(venues=>{
              user_reviews = []
              venues.map(venue => {
                venue.rating.map(rating => {
                  if (rating.user_id === req.userId) {
                    rating.venue = venue.venue
                    user_reviews.push(rating)
                  }
                })
            })
            User.find({$and:[{ _id: { $in: user1}},{_id:{$nin:[...mergedUser[0].allvalues]}}]},{activity_log:0,requests:0,sent_requests:0,sports_interest:0,conversation:0,online_status:0,last_active:0,last_login:0,device_token:0,otp:0,token:0,version:0,followers:0,following:0,os:0,visibility:0,force_update:0,login_type:0}).lean().then(user=>{
              res.status(201).send({status: "success", message: "user collected",data:[{suggestions:user,my_review:user_reviews}]})
          })
    }).catch(next);
}).catch(next);
}).catch(next);
// }).catch(next)
});


router.post('/get_following/:id', [
  verifyToken,
], (req, res, next) => {
  let game_completed_count = 0
  let mvp_count = 0
  User.findOne({_id:req.params.id},{activity_log:0}).populate("followers","name _id").populate("following","name _id").lean().then(user1 => {
    Game.find({users: {$in:[req.userId]},completed:true}).then(game=> {
      game_completed_count = game && game.length > 0 ? game.length : 0
      const aw = game && game.length > 0 && game.filter((a)=>{
       let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0
       mvp_count = mvp_count + f
       return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length>0
      })
      user1.game_completed = game_completed_count
      user1.mvp_count = mvp_count
      user1.level =  getLevel(250 * mvp_count + 100 * game_completed_count)
    if(user1){
    res.status(201).send({status: "success", message: "user collected",data:[user1]})
    }
    else {
      res.status(201).send({status: "success", message: "user collected",data:[]})
    }
  }).catch(next);
}).catch(next)

});

router.post('/friend_get_following/:id', [
  verifyToken,
], (req, res, next) => {
  let game_completed_count = 0
  let mvp_count = 0
  let game_history ={}
  const filter  = {$or:[{members:[req.userId,req.params.id],type:'single'},{members:[req.params.id,req.userId],type:'single'}]}
  Conversation.find(filter).limit(1).lean().then(ec=>{
  User.findOne({_id:req.params.id},{activity_log:0}).populate("followers","name _id handle name_status profile_picture visibilility").populate("following","name _id handle name_status profile_picture visibilility").lean().then(user1 => {
    Experience.find({user:req.params.id}).then(exp=>{
    Game.find({users: {$in:[req.params.id]},completed:true}).then(game=> {
      game_completed_count = game && game.length > 0 ? game.length : 0
      const aw = game && game.length > 0 && game.filter((a)=>{
       let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.params.id.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.params.id.toString()).length : 0
       mvp_count = mvp_count + f
       return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.params.id.toString()).length>0
      })
      const aq = game.map((a)=>{
        game_history[a.sport_name] = {game: game_history && game_history[a.sport_name] && game_history[a.sport_name].game && game_history[a.sport_name].game > 0 ? game_history[a.sport_name].game+1:1,mvp: a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.params.id.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.params.id.toString()).length : 0 }
  })
      user1.game_completed = game_completed_count
      user1.mvp_count = mvp_count
      user1.level =  getLevel(250 * mvp_count + 100 * game_completed_count)
      user1.experience = exp
      user1.game_history = game_history
      user1.past_conversation = ec && ec.length > 0
    if(user1){
    res.status(201).send({status: "success", message: "user collected",data:[user1]})
    }
    else {
      res.status(201).send({status: "success", message: "user collected",data:[]})
    }
  }).catch(next)
}).catch(next)

  }).catch(next);
}).catch(next)

});



router.post('/get_follow_following', [
  verifyToken,
], (req, res, next) => {
        User.findOne({_id:req.userId},{activity_log:0}).lean().then(user1=>{
          let all = [...user1.followers,...user1.following]
          let final_users = [... new Set(all)]
          User.find({_id: {$in :final_users}},{activity_log:0,followers:0,following:0,}).lean().then(user1=>{
              res.status(201).send({status: "success", message: "user collected",data:user1})

    }).catch(next);
  }).catch(next);
});

router.post('/check_if_past_convo/:id', [
  verifyToken,
], (req, res, next) => {
  const filter  = {$or:[{members:[req.userId,req.params.id],type:'single'},{members:[req.params.id,req.userId],type:'single'}]}
  Conversation.find(filter).limit(1).lean().then(ec=>{
      if(ec && ec.length > 0){
        res.status(201).send({status: "success", message: "convo exists",data:true})
      }else{
        res.status(201).send({status: "success", message: "no convo exists",data:false})

      }
    }).catch(next);
});

function getZcode(game,location,venue,viewd,a,players,joins,friend){
  return (50 * game) - (location*100)  + (50 * friend) - (2 * venue) - (viewd * 1) - players * 30
}

router.post('/user_suggest/:id', [
  verifyToken,
], (req, res, next) => {
  User.findOne({_id: req.params.id},{'handle':{$exists:true,$ne:null }}).lean().then(user=> {
    Game.find({$or:[{host:{$in:[req.params.id]}},{users:{$in:[req.params.id]}}]}).then((game)=>{
       const filter  = {$or:[{members:[req.params.id],type:'group'}]}
      Conversation.find({$or:[{host:{$in:[req.params.id]}},{users:{$in:[req.params.id]}}]}).then((game)=>{
       let all = [...user.followers,...user.following,...[req.params.id]]
        console.log('as',user.followers);
          console.log('bs',user.following);
            var final_users = user.followers.filter(function(obj) { 
              const x = user.following.filter((a)=>a.toString() === obj.toString()).length > 0 
                 return !x
                   });
                   var final_users1 = user.followers.filter(function(obj) { 
                    const x = user.following.filter((a)=>a.toString() === obj.toString()).length > 0 
                       return x
                         });
          console.log(final_users,'final_users');
          console.log(final_users1,'final_users1');
          User.find({_id: {$in :final_users1}},{name:1,_id:1,profile_picture:1,followers:1,following:1}).lean().then(userA=>{
    User.find({_id: {$nin :all}},{name:1,_id:1,profile_picture:1,handle:1,name_status:1}).lean().then(userN=>{
    User.find({_id: {$in :final_users}},{name:1,_id:1,profile_picture:1,handle:1,name_status:1}).lean().then(user1=>{
          const yet_to_click_follow_users = user1.map((a)=> Object.assign(a,{zcode:40}))
          const usersas = userA.map((a)=>{
            return [...a.followers,...a.following]
          }) 
          let s = _.flatten(usersas)
          //let s = _.uniqBy(y)
          let final_users2 =  s.filter(function(obj) { 
            const x = final_users1.filter((a)=>a.toString() === obj.toString()).length > 0 
            return !x
          });
          User.find({_id: {$in :final_users2}},{name:1,_id:1,profile_picture:1,}).lean().then(userA=>{
            const no_relation_users = userN.map((a)=> {
                if(userA && userA.length > 0 && userA.filter((a1)=>a1._id.toString() === a._id.toString() > 0))
                 return Object.assign(a,{zcode:20})
                 else
                 return Object.assign(a,{zcode:10})
                })
            
             const final_list = [...yet_to_click_follow_users,...no_relation_users]   
            //club and game
         //event
          res.status(201).send({status: "success", message: "user suggestion list fetched",data:_.orderBy(final_list, ['zcode'], ['desc'])})
}).catch(next)
}).catch(next)
}).catch(next)

}).catch(next)
}).catch(next)
}).catch(next)
}).catch(next)




});

router.post('/get_chatrooms/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user existinvites:{$in:[req.params.id]}
      //Conversation.find({members:{$in:[req.params.id]}}).lean().populate('to',' name _id profile_picture last_active online_status status').populate('members','name _id profile_picture last_active online_status status').populate('last_message').then(existingConversation=>{
        User.findOne({_id: req.params.id},{activity_log:0,followers:0,following:0}).then(user=> {
      Conversation.find({ $or: [ { members: { $in: [req.params.id] } },{ exit_list: { $elemMatch: {user_id:req.params.id} } }] }).lean().populate("host","name profile_picture handle name_status").populate('to',' name _id profile_picture last_active online_status status handle name_status visibility').populate('members','name _id profile_picture last_active online_status status handle name_status visibility').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status visibility').populate('last_message').then(existingConversation=>{
       existingConversation = existingConversation.filter((e)=>{
         return !(e.type == "single" && e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.params.id.toString()).length > 0 )
       })
        const exit_convo_list = existingConversation.filter((e)=> {
        return (e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.params.id.toString()).length > 0)
        } )
        const exit_convo_list1 = existingConversation.filter((e)=> {
          return !(e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.params.id.toString()).length > 0)
          } )

          const date = user.last_active 
          const conversation  = req.body.conversation

         Message.aggregate([{ $match: { $and: [  { conversation: {$in:exit_convo_list1.map((c)=>c._id)} } ] } },{"$group" : {"_id" : "$conversation", "time" : {"$push" : "$created_at"},"user" : {"$push" : "$author"}}}]).then((message)=>{
           const x =  existingConversation.map((c)=> {
            let user = {}
            const status = c.members.filter((a)=>a._id.toString() === req.params.id.toString()).length > 0 ? false : true
            c['time'] = 0
            c['exit'] = false
            c['exit2'] = status
            c['validity'] = c.type==='game' && moment().format('YYYYMMDDHHmm')  > moment(c.end_time).subtract(330,"minutes").format('YYYYMMDDHHmm')
            if( c.exit_list && c.exit_list.length > 0){
              const x =  c.exit_list
                let user  =  x.length > 0 && x.filter((e)=>{ return e && e.user_id && e.user_id._id.toString() !== req.params.id.toString()})[x.length-1]
                let user1  =  x.length > 0 && x.filter((e)=>{ return e && e.user_id && e.user_id._id.toString() === req.params.id.toString()})[x.length-1]

                c.members =  user && c.type==='single' ? c.members.concat(user.user_id) : c.members
                //c['exit'] = user && user.timeStamp ? c.members.filter((a)=>a._id.toString() === req.params.id.toString()).length > 0 ? false : true : false
                c['exit'] = user && user.timeStamp && c.members.filter((a)=>a._id.toString() === req.params.id.toString()).length > 0
                c['last_updated'] = c.type === 'single' ? user && user.message  ? c.type === 'single'? c.last_updated:user.timeStamp :c.last_updated : user1 && user1.timeStamp ? user1.timeStamp : c.last_updated
                c['last_message'] = c.type === 'single' ? user && user.message ? c.type === 'single' ? c.last_message:user.message  : c.last_message : user1 && user1.message ? user1.message : c.last_message
              
            }
            const filter = c && c.last_active ? c.last_active.filter((c)=> c && c.user_id && c.user_id.toString() === req.params.id.toString()) : []
            message.length > 0 && message.map((m)=>{
               if(m._id.toString() === c._id.toString() && conversation.indexOf(c._id.toString()) === -1  ) { 
                const time = m.time.filter((timestamp,index)=>{ 
                  if( filter.length > 0 &&  moment(filter[filter.length-1].last_active).isSameOrBefore(timestamp) && m.user[index].toString() !== req.params.id.toString()) {
                    return timestamp
                  }
                })  
              
                c['time'] = user && user.message ? time.length : time.length 
                c['has_counter'] = time.length > 0 ? true :false
              c['invite_status'] = c.invite_status 
              if(c.invite_status){
                if(req.userId.toString() == c.created_by.toString()){
                  c['actual_invite_status'] = false
                }else{
                  c['actual_invite_status'] = true
                }
              }else{
                c['actual_invite_status'] = false
              }


               }
               })
             return c
          })
       // console.log(x);
       const chatrooms = _.orderBy(x, ['last_updated', 'time','created_at'], ['desc', 'desc','desc'])
       let finals = [...chatrooms]
          res.status(201).send({status: "success", message: "user collected",data:finals})
          req.redis().set('chatroom_'+req.userId,JSON.stringify(chatrooms),(err,rep)=>{
            if(err) 
            console.log(err);
          })



          

        }).catch(next)
      }).catch(next)
  }).catch(next)

});


router.post('/get_chatrooms_for_share/:id', [
  verifyToken,
], (req, res, next) => {
      Conversation.find({members: { $in: [req.params.id] },type:["single","group"], }).lean().populate("host","name profile_picture handle name_status").populate('to',' name _id profile_picture last_active online_status status handle name_status visibility').populate('members','name _id profile_picture last_active online_status status handle name_status visibility').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status visibility').populate('last_message').then(existingConversation=>{
        Conversation.find({members: { $in: [req.params.id] },type:"game",end_time:{$gte:new Date()} }).lean().populate("host","name profile_picture handle name_status").populate('to',' name _id profile_picture last_active online_status status handle name_status visibility').populate('members','name _id profile_picture last_active online_status status handle name_status visibility').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status visibility').populate('last_message').then(existingConversation1=>{
        let x = existingConversation.filter((key)=> key.type == "single" ? key.members.length > 1 : key)
        let data = [...x,...existingConversation1]
        const chatrooms = _.orderBy(data, ['last_updated', 'time','created_at'], ['desc', 'desc','desc'])
       let finals = [...chatrooms]
       res.status(201).send({status: "success", message: "user collected",data:finals})
        }).catch(next)
      }).catch(next)
});

router.post('/sync_contacts', [
  verifyToken,
], (req, res, next) => {
  User.findById({_id: req.userId},{activity_log:0}).lean().then(user=> {

    if(user.handle && user.sync_contacts){
      Contacts.findOne({user_id:req.userId}).then((c)=>{
        if(c){
          //get contacts and remove spaces between numbers
        //  const contacts =  c.contacts.filter((c)=>c.phoneNumbers.length > 0&&c.displayName).map((a)=>a.phoneNumbers).flat().map(c=>c.number.replace(/\s/g, ""))
         //for +91 numbers


         const contacts1 =  c.contacts.filter((c)=>c.phoneNumbers.length > 0&&c.displayName)
         let data = []
         const contacts2 = contacts1.map((a)=>{
           data.push(...a.phoneNumbers)
          })
         const contacts = data.map(c=>c.number.replace(/\s/g, ""))

         let finalcontacts = contacts.map((c)=>{
              if(c.length>=10){
                  if(c.substring(0,3) === '+91')
                  {
                    return c.substring(3,c.length)
                  }
                  else if(c.length === 10)
                  {
                    return c
                  }else if(c.length === 11  && c.substring(0,1) === "0")
                  {
                    return c.substring(1,c.length)
                  }
              }
            })

        //  let contactsTest = contacts.filter((f)=>f.length >= 10 && f.substring(0,3) === "+91").map(c=>c.substring(3,c.length))
        //  let contacts1 = contacts.filter((f)=>f.length >= 10 && f.substring(0,3) === "+91").map(c=>c.substring(3,c.length))
        // //for exact 10 digits match
        //  let contacts2 = contacts.filter((f)=>f.length === 10)
        //  //for 11 digits where first digit is 0
        //  let contacts3 = contacts.filter((f)=>f.length === 11 && f.substring(0,1) === "0").map(c=>c.substring(1,c.length))
         //concat all contacts 
        //  contacts1.concat(contacts2)
        //   contacts1.concat(contacts3)
        //  console.log(contacts1.filter((c)=>c === '9941883205'))
         // console.log(contacts1);

          User.find({phone: { $in :finalcontacts },status:true }).lean().then(user=> {
            res.status(201).send({status: "success", message: "common users collected",data:user})
          }).catch(next)
        }
      }).catch(next)
    }else if(user.handle && !user.sync_contacts){
      Contacts.create({user_id:req.userId,contacts:req.body}).then(c=>{
        Contacts.findById({_id:c._id}).then((c)=>{
        const contacts1 =  c.contacts.filter((c)=>c.phoneNumbers.length > 0&&c.displayName)
        let data = []
        const contacts2 = contacts1.map((a)=>{
          data.push(...a.phoneNumbers)
         })
        const contacts = data.map(c=>c.number.replace(/\s/g, ""))
        let finalcontacts = contacts.map((c)=>{
          if(c.length>=10){
              if(c.substring(0,3) === '+91')
              {
                return c.substring(3,c.length)
              }
              else if(c.length === 10)
              {
                return c
              }else if(c.length === 11  && c.substring(0,1) === "0")
              {
                return c.substring(1,c.length)
              }
          }
        })
          User.find({phone: { $in :finalcontacts } },{activity_log:0}).lean().then(user=> {
            User.findByIdAndUpdate({_id: req.userId},{sync_contacts:true}).then(user1=>{
              res.status(201).send({status: "success", message: "common users collected",data:user})
        })
      })
        
    }).catch(next)
      }).catch(next)
    }
  }).catch(next)
});


router.post('/save_token_device', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.userId},{activity_log:0}).then(user=> {
        const device_token1 = user && user.device_id && user.device_id.length > 0 ? user.device_id.some(a=>a.device_id === req.body.device_id) 
        ?
        user.device_id.map(a=>{
          if(a.device_id === req.body.device_id){
            a['device_token'] = req.body.device_token
            return a
          }else{
            return a
          }
        }):user.device_id.concat([{device_id:req.body.device_id,device_token:req.body.device_token,created_date:new Date()}]):[{device_id:req.body.device_id,device_token:req.body.device_token,created_date:new Date()}]
        
       
        User.findByIdAndUpdate({_id: req.userId},{device_token:req.body.device_token, os:req.body.os,device_id:device_token1}).then(user1=>{
          // notify(user,`<i style=' background: url("/cat.png");
          // height: 20px;
          // width: 20px;
          // display: block;'></span> ${user.name} , \uD83D Welcome to Turftown :-)`)
          if (user1) {
          res.status(201).send({status: "success", message: "user collected",data:user})
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
  }).catch(next);
});

router.post('/alter_user/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.params.id},{activity_log:0}).then(user=> {
        User.findByIdAndUpdate({_id: req.params.id},req.body).then(user=>{
          var count  = 0
      let game_completed_count = 0
      let mvp_count = 0
      let game_history = {}
      Alert.find({user: req.userId,status:true},{}).lean().then(alert=> {
          Game.find({users: {$in:[req.userId]},completed:true}).then(game=> {
          game_completed_count = game && game.length > 0 ? game.length : 0
          const aw = game && game.length > 0 && game.filter((a)=>{
           let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc.target_id.toString() === req.userId.toString()).length : 0
           mvp_count = mvp_count + f
           return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc.target_id.toString() === req.userId.toString()).length>0
          })
          const aq = game.map((a)=>{
            game_history[a.sport_name] = {game: game_history && game_history[a.sport_name] && game_history[a.sport_name].game && game_history[a.sport_name].game > 0 ? game_history[a.sport_name].game+1:1,mvp: a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0,mv_data:a.mvp }
          })
          //mvp_count = aw && aw.length > 0 ? aw.length : 0
          Conversation.find({ $or: [ { members: { $in: [req.userId] } },{ exit_list: { $elemMatch: {user_id:req.userId} } }] }).lean().populate('to',' name _id profile_picture last_active online_status status handle name_status').populate('members','name _id profile_picture last_active online_status status handle name_status').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(existingConversation=>{
        const exit_convo_list = existingConversation.filter((e)=> {
         return (e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.userId.toString()).length > 0)
         } )
         const exit_convo_list1 = existingConversation.filter((e)=> {
           return !(e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.userId.toString()).length > 0)
           } )
        //const exit_convo_list1 = existingConversation.filter((e)=> e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((u)=>u.user_id.toString() === req.userId.toString()).length > 0)
        User.findOne({_id: req.userId},{activity_log:0,followers:0,following:0}).then(user=> {
           const date = user.last_active 
 
          Message.aggregate([{ $match: { $and: [  { conversation: {$in:exit_convo_list1.map((c)=>c._id)} } ] } },{"$group" : {"_id" : "$conversation", "time" : {"$push" : "$created_at"},"user" : {"$push" : "$author"}}}]).then((message)=>{
            let counter
            const x =  existingConversation.map((c)=> {
             let user = {}
             if(exit_convo_list && exit_convo_list.length > 0 && c.exit_list && c.exit_list.length > 0){
               const x =  exit_convo_list.filter((e)=> e.exit_list && c.exit_list.length>0 && e._id.toString() === c._id.toString())
               user  =  x.length > 0 ? x[0].exit_list.filter((e)=>{
                 return e && e.user_id && e.user_id._id.toString() === req.userId.toString()})[0] : []
              c.members =  user && user.length > 0 && c.type==='single' ? c.members.concat(user.user_id) : c.members
             }
             const filter = c && c.last_active ? c.last_active.filter((c)=> c && c.user_id && c.user_id.toString() === req.userId.toString()) : []
             message.length > 0 && message.map((m)=>{
                if(m._id.toString() === c._id.toString()) { 
                 const time = m.time.filter((timestamp,index)=>{ 
                   if( filter.length > 0 &&  moment(filter[0].last_active).isSameOrBefore(timestamp) && m.user[index].toString() !== req.userId.toString()) {
                     return timestamp
                   }
                 })  
                 c['time'] = user && user.message ? time.length : time.length 
                 count = time.length > 0 ? count+1 : count
                }
                })
              return c
           })
          User.findOne({_id: req.userId},{activity_log:0}).populate("requests","name _id profile_picture").lean().then(user=> {
            Coins.aggregate([ { $match: { user:user._id } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((coins)=>{
              if (user) {
             user['total'] = count
               const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
               user['alert_total'] = alerts1.length
               user['game_completed'] = game_completed_count
               user['mvp_count'] = mvp_count
               user['refer_custom_value'] = 50
               user['refer_custom_value1'] = 100
               user['coins'] =  coins && coins.length > 0 && coins[0].amount ? coins[0].amount : 0
               user['level'] =  getLevel(250 * mvp_count + 100 * game_completed_count)
               user['game_history'] = game_history
               res.status(201).send({status: "success", message: "user collected",data:user})
              } else {
                res.status(422).send({status: "failure", errors: {user:"force update failed"}});
              }
            }).catch(next);
          }).catch(next)
         }).catch(next)
        }).catch(next)
       }).catch(next)
   }).catch(next)
  }).catch(next);
}).catch(next);


  }).catch(next);
});


router.post('/alter_game/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Game.findOne({_id: req.params.id},{activity_log:0}).then(game=> {
        Game.findByIdAndUpdate({_id: req.params.id},req.body).then(game=>{
          Game.findOne({_id: req.params.id},{activity_log:0}).lean().populate("venue").populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(g1=> {
            if (g1) {
          res.status(201).send({status: "success", message: "game edited",data:g1})
        } else {
            res.status(422).send({status: "failure", errors: {game:"edit failed"}});
        }
    }).catch(next);
  }).catch(next);

  }).catch(next);
});

router.post('/update_game_mvp/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Game.findOne({_id: req.params.id},{activity_log:0}).then(game=> {
        Game.findByIdAndUpdate({_id: req.params.id},req.body).then(game=>{
          Game.findOne({_id: req.params.id},{activity_log:0}).lean().populate("venue").populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(g1=> {
            if (g1) {
          res.status(201).send({status: "success", message: "game edited",data:g1})
        } else {
            res.status(422).send({status: "failure", errors: {game:"edit failed"}});
        }
    }).catch(next);
  }).catch(next);

  }).catch(next);
});

router.post('/check_completed_games', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Game.find({users: {$in:[req.userId]},completed:true,"mvp.sender_id":{$nin:[req.userId]},skipped:{$nin:[req.userId]}}).populate("venue",'venue').populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=> {
        if (game.length > 0) {
          res.status(201).send({status: "success", message: "game collected",data:game})
        } else {
            res.status(201).send({status: "failure",  message: "game collected",data:[]});
        }
  }).catch(next);
});

router.post('/get_mvp_history', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Game.find({users: {$in:[req.userId]},completed:true,"mvp.target_id":req.userId.toString(),sport_name:req.body.sport}).populate("mvp.sender_id","name handle profile_picture _id").populate("venue",'venue').populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=> {
        var groupBy = (xs, key) => {
          return xs.reduce((rv, x) =>{
            (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
            return rv;
          }, {});
        };
        
        let finalResult = game.sort((a, b) => moment(a.start_time).format("YYYYMMDDHmm") > moment(b.start_time).format("YYYYMMDDHmm") ? 1 : -1 )
        const a = groupBy(finalResult,'start_time')
        const q =   Object.entries(a).map(([key,value])=>{
                return {title:key,data:value }
          })
        if (game.length > 0) {
          res.status(201).send({status: "success", message: "game collected",data:{data:q,games:game}})
        } else {
            res.status(201).send({status: "failure",  message: "game collected",data:[]});
        }
  }).catch(next);
});

router.post('/share_post/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Game.findOne({_id: req.params.id},{activity_log:0}).then(game=> {
        game['town'] = true
        game['town_date'] = new Date()
        Game.findByIdAndUpdate({_id: req.params.id},game).then(user=>{
        Post.create(req.body).then(post=>{
          Post.findById({_id:post._id}).lean().populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then(post=>{
            post['shout_out_status'] = false
          res.status(201).send({status: "success", message: "user collected",data:post})
        }).catch(next);
  }).catch(next);
}).catch(next);
}).catch(next);

});


router.post('/edit_post/:id', [
  verifyToken,
], (req, res, next) => {
  console.log("REse",req.body.message)
      Post.findByIdAndUpdate({_id:req.params.id},{message:req.body.message}).lean().then(post=>{
        Post.findById({_id:req.params.id}).lean().then(post=>{
            res.status(201).send({status: "success", message: "Post edited",data:post})
        }).catch(next);
      }).catch(next);
});


router.post('/delete_post/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      Post.findById({_id:req.params.id}).lean().then(post=>{
      if(post){
        Post.findByIdAndRemove({_id:post._id}).lean().then(post1=>{
        Alert.deleteMany({type:"shoutout",post:post._id}).then(alert=>{
            res.status(201).send({status: "success", message: "post deleted"})
      }).catch(next);
    }).catch(next);
  }
  else {
    res.status(201).send({status: "success", message:"post is not avaialble" });
  }
  }).catch(next);
});

router.post('/share_post_event/:id', [
  verifyToken,
], (req, res, next) => {
        Post.create(req.body).then(post=>{
          Post.findById({_id:post._id}).lean().populate({path:"event",populate:{path:"venue",select:"venue"}}).populate('shout_out','_id name profile_picture phone handle name_status').populate('created_by','_id name profile_picture phone handle name_status').populate({ path: 'game', populate: [{ path: 'conversation' , populate :{path:'last_message'} },{path:'host',select:'_id name profile_picture phone handle name_status'},{path:'users',select:'_id name profile_picture phone handle name_status'},{path:'invites',select:'_id name profile_picture phone handle name_status'},{path:'venue',select:'venue'}] }).then(post=>{
          post["shout_out_status"] = false
            res.status(201).send({status: "success", message: "user collected",data:post})
        }).catch(next);
      }).catch(next);
});

router.post('/mute_user/:id', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.params.id},{activity_log:0}).then(user=> {
        User.findByIdAndUpdate({_id: req.params.id},{mute:req.body.mute}).then(user=>{
          User.findOne({_id: req.params.id},{activity_log:0}).then(user1=> {
            if (user1) {
          res.status(201).send({status: "success", message: "user collected",data:user1})
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
  }).catch(next);

  }).catch(next);
});


router.post('/edit_user', [
  verifyToken,
  check('email').exists().isLength({ min: 1}).withMessage('email cannot be empty'),
  check('email').isEmail().withMessage('email is incorrect'),
  check('name').exists().isLength({ min: 1}).withMessage('name cannot be empty'),
  check('dob').isISO8601().withMessage('date of birth needs to be a valid date'),
  check('gender').exists().isLength({ min: 1}).withMessage('gender cannot be empty'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var result = {};
    var errorsList = errors.array();
    for(var i = 0; i < errorsList.length; i++)
    {
        result[errorsList[i].param] = errorsList[i].msg;
    }
    return res.status(422).json({ errors: result});
  }
    //Generate user id
      //Check if user exist
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
              req.body.modified_at = moment();
              User.findByIdAndUpdate({_id: req.userId},req.body).then(user1=>{
                User.findOne({_id:req.userId},{__v:0,token:0,activity_log:0},null).then(user=>{
                  let userResponse = {
                    name:user.name,
                    gender:user.gender,
                    email:user.email,
                    phone:user.phone,
                    _id:user._id,
                    status:user.status,
                    last_login:user.last_login,
                    dob:user.dob,
                    modified_at:user.modified_at,
                    profile_picture:user.profile_picture  && user.profile_picture === '' ? '' : user.profile_picture
                  }
                res.status(201).send({status: "success", message: "user edited", data:userResponse})
                let activity_log = {
                  datetime: new Date(),
                  id:req.userId,
                  user_type: "user",
                  activity: "user edited",
                  name:req.name,
                  message: req.name + " edited successfully",
                }
                ActivityLog(activity_log)
              })
            })
        } else {
            res.status(422).send({status: "failure", errors: {user:"user doesn't exist"}});
        }
    }).catch(next);
});


router.post('/change_passowrd', [
  verifyToken,
], (req, res, next) => {
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
              req.body.modified_at = moment();

              bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                user['password'] = hash;
                user['token'] =  jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.handle }, config.secret);
                User.findByIdAndUpdate({_id: req.userId},user).then(user1=>{
                  User.findOne({_id:req.userId},{__v:0,token:0,activity_log:0},null).then(user=>{
                    res.status(201).send({status: "success", message: "password updated"})
                })
              })
              })
              
        } else {
            res.status(422).send({status: "failure", errors: {user:"user doesn't exist"}});
        }
    }).catch(next);
});

router.post('/change_password_username/:id', (req, res, next) => {
       console.log('hit pass',req.body)
      User.findOne({_id: req.params.id}).then(user=> {
        console.log('hit pass',user)
        if (user) {
              //req.body.modified_at = moment();
              bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                user['password'] = hash;
                user['handle'] = req.body.handle
                user['followers'] = []
                user['following'] = []
                user['activity_log'] = []
                user['requests'] = []
                user['refer_id'] = 'TURF'+makeid(4)
                user['bio'] = ''
                user['sent_requests'] = []
                user['token'] =  jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.handle }, config.secret);
                User.findByIdAndUpdate({_id: req.params.id},user).then(user1=>{
                  User.findOne({phone:user.phone}).lean().then(user=>{
                    let lin = Object.assign({},user)
                    lin['alert_total'] = 0
                    lin['mvp_count'] = 0
                    lin['refer_custom_value'] = 100
                    lin['refer_custom_value1'] = 50
                    lin['coins'] = 0
                    lin['total'] = 0
                    lin['level'] =  getLevel(0)
                    console.log('hit pass',lin)
                    
                  res.send({status:"success", message:"user added",data:lin})
                }).catch(next)
              })
              })
              
        } else {
            res.status(422).send({status: "failure", errors: {user:"user doesn't exist"}});
        }
    }).catch(next);
});

function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
//Send OTP
router.post('/send_otp',[
  check('phone').isLength({ min: 10, max: 10 }).withMessage('phone number must be 10 digits long'),
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    var result = {};
    var errorsList = errors.array();
    for(var i = 0; i < errorsList.length; i++)
    {
        result[errorsList[i].param] = errorsList[i].msg;
    }
    return res.status(422).json({ errors: result});
  }

  let phone = 91+req.body.phone;
  let otp   = Math.floor(999 + Math.random() * 9000);
  User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0,activity_log:0},null).then(user=> {
    send_message_otp(req.body.phone,"TRFTWN","Welcome to Turftown! Your OTP is "+otp ).then((a)=>{
      console.log(a)
        if(a.status === 'success')
        {
          if(user)
          {
            if(user.email || user.password)
            {
              User.findOneAndUpdate({phone: req.body.phone},{otp:otp}).then(user=> {
                User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0},null).then(user=> {
                  res.status(201).send({status:"success",message:"existing user",otp:otp,data:user})
                })
              })
            }else{
              User.findOneAndUpdate({phone: req.body.phone},{otp:otp}).then(user=> {
                User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0},null).then(user=> {
                  res.status(201).send({status:"success",message:"existing user",otp:otp,data:user})
                })
              })
              // User.create({phone:req.body.phone,otp:otp}).then(user=>{
              //   res.status(201).send({status:"success",message:"new user",otp:otp})
              // })
            }
          }else{
            if(req.body.phone === '8136948537') {
            const x = 'TURF'+makeid(4)
            User.create({phone:req.body.phone,refer_id:x,otp:req.body.phone === '8136948537' ? '7484':otp}).then(user=>{
              res.status(201).send({status:"success",message:"new user",otp:req.body.phone === '8136948537' ? '7484':user.otp})
            })
          }
            else{
              const x = 'TURF'+makeid(4)
            User.create({phone:req.body.phone,otp:otp,refer_id:x}).then(user=>{
              res.status(201).send({status:"success",message:"new user",otp:req.body.phone === '8136948537' ? '7484':otp})
            })
          }
          }
        }else
          {
            res.status(422).send({status:"failure", errors:{template:"invalid template"}, data:a})
        }
    }).catch(error => {
        console.log(error);
    })
  }).catch(next);
});





router.post('/remove_temp_user', (req, res, next) => {
      User.findOneAndDelete({phone:req.body.phone,temporary:true}).then(u=>console.log('user deleted'))
});

router.post('/edit_game_status', (req, res, next) => {
  Game.findByIdAndUpdate({_id:req.body.game_id},{$set:{share_type:req.body.status}}).then(g=>{
    Game.findById({_id:req.body.game_id}).lean().populate('host','_id name profile_picture phone handle name_status').populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=>{
      Venue.findById({_id:game.bookings[0].venue_id}).then(venue =>{
        let game1 = Object.assign({},game)
        game1["venue"] = venue
        game1["rating"] = venue.rating
        game1['final'] = _.xor(game1.users,game1.host)
        res.send({status:"success", message:"game_fetched",data:game1})

      }).catch(next)
    }).catch(next)
  }).catch(next)

});


router.post('/send_new_otp', (req, res, next) => {

  User.find({"phone":{ "$regex": req.body.user.phone, "$options": "i" }}).then(user=>{
    if(user && user.length > 0){
          res.send({status:"success", message:"phone exists",data:{error:true,error_description:`The phone number +91 ${req.body.mobile} is not available.`}})
        }else{
          let phone = 91+req.body.user.phone;
          let otp   = Math.floor(999 + Math.random() * 9000);
              send_message_otp(phone,'TRFTWN',"Welcome to Turftown! Your OTP is "+otp).then((a)=>{
              if(a.status === 'success')
                {
                  User.find({phone:req.body.user.phone,handle:req.body.user.handle}).then((user)=>{
                  user && user.length > 0 ? 
                    res.status(400).send({status:"failiure", message:'user exists'})
                  :User.create({refer_id:'TURF'+makeid(4),phone:req.body.user.phone,handle:req.body.user.handle,otp:otp,temporary:true}).then((user)=>{
                    res.status(201).send({status:"success", message:'new user', data:{phone:req.body.user.phone,otp:otp,handle:req.body.user.handle}})
                    setTimeout(()=>{
                      User.findOneAndDelete({phone:user.phone,temporary:true}).then(u=>console.log('user deleted'))
                    },300000)
                  })
                }).catch(next)
        
                }
                else
                  {
                    res.status(422).send({status:"failure", errors:{template:"invalid template"}, data:a})
                 }
            }).catch(next)
        }
  }).catch(next)

});

router.post('/re_send_new_otp', (req, res, next) => {

  User.find({"phone":{ "$regex": req.body.user.phone, "$options": "i" }}).then(user=>{
    if(user && user.length > 0){
      let phone = 91+req.body.user.phone;
      let otp   = Math.floor(999 + Math.random() * 9000);
      send_message_otp(phone,'TRFTWN',"Welcome to Turftown! Your OTP is "+otp).then((a)=>{
        User.findOneAndUpdate({phone:req.body.user.phone},{otp:otp}).then(user=> {
          User.find({phone:req.body.user.phone},{activity_log:0}).then(user=> {
          console.log("use",user)
          res.status(201).send({status:"success", message:'new user', data:{phone:req.body.user.phone,otp:otp,handle:req.body.user.handle}})
        }).catch(next)
      }).catch(next)
      })  
      }
        else{
          let phone = 91+req.body.user.phone;
          let otp   = Math.floor(999 + Math.random() * 9000);
              send_message_otp(phone,'TRFTWN',"Welcome to Turftown! Your OTP is "+otp).then((a)=>{
              if(a.status === 'success')
                {
                  User.find({phone:req.body.user.phone,handle:req.body.user.handle}).then((user)=>{
                  user && user.length > 0 ? 
                    res.status(400).send({status:"failiure", message:'user exists'})
                  :User.create({refer_id:'TURF'+makeid(4),phone:req.body.user.phone,handle:req.body.user.handle,otp:otp,temporary:true}).then((user)=>{
                    res.status(201).send({status:"success", message:'new user', data:{phone:req.body.user.phone,otp:otp,handle:req.body.user.handle}})
                    setTimeout(()=>{
                      User.findOneAndDelete({phone:user.phone,temporary:true}).then(u=>console.log('user deleted'))
                    },300000)
                  })
                }).catch(next)
        
                }
                else
                  {
                    res.status(422).send({status:"failure", errors:{template:"invalid template"}, data:a})
                 }
            }).catch(next)
        }
  }).catch(next)

});

router.post('/send_new_user', (req, res, next) => {
  
          User.find({phone:req.body.user.phone}).then((user)=>{
          user && user.length > 0 ? 
            res.status(400).send({status:"failiure", message:'user exists'})
          :User.create({refer_id:'TURF'+makeid(5),phone:req.body.user.phone,handle:req.body.user.handle,otp:req.body.user.otp,temporary:true}).then((user)=>{
            res.status(201).send({status:"success", message:'new user', data:{phone:req.body.user.phone,otp:req.body.user.otp,handle:req.body.user.handle}})
            setTimeout(()=>{
              User.findOneAndDelete({phone:user.phone,temporary:true}).then(u=>console.log('user deleted'))
            },125000)
          })
        }).catch(next)
});


//Verify OTP
router.post('/verify_otp', (req, res, next) => {
  User.findOne({phone: req.body.phone}).then(user=> {
    // create a token
    var token;
      if(user.otp===req.body.otp){
          User.findOneAndUpdate({phone: req.body.phone},{last_login:moment()}).then(user=>{
            User.findOne({phone: req.body.phone},{__v:0,token:0,activity_log:0},null).then(user=> {
              token = jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.name}, config.secret);
            if(user.password || user.email){
              req.userId = user._id
              var count  = 0
              let game_completed_count = 0
              let mvp_count = 0
              Alert.find({user: req.userId,status:true},{}).lean().then(alert=> {
                Game.find({users: {$in:[req.userId]},completed:true}).then(game=> {
                  game_completed_count = game && game.length > 0 ? game.length : 0
                  const aw = game && game.length > 0 && game.filter((a)=>{
                   let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0
                   mvp_count = mvp_count + f
                   return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length>0
                  })
                  //mvp_count = aw && aw.length > 0 ? aw.length : 0
                  Conversation.find({ $or: [ { members: { $in: [req.userId] } },{ exit_list: { $elemMatch: {user_id:req.userId} } }] }).lean().populate('to',' name _id profile_picture last_active online_status status handle name_status').populate('members','name _id profile_picture last_active online_status status handle name_status').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(existingConversation=>{
                const exit_convo_list = existingConversation.filter((e)=> {
                 return (e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.userId.toString()).length > 0)
                 } )
                 const exit_convo_list1 = existingConversation.filter((e)=> {
                   return !(e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id.toString() === req.userId.toString()).length > 0)
                   } )
                //const exit_convo_list1 = existingConversation.filter((e)=> e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((u)=>u.user_id.toString() === req.userId.toString()).length > 0)
                User.findOne({_id: req.userId},{activity_log:0,followers:0,following:0}).then(user=> {
                   const date = user.last_active 
                  Message.aggregate([{ $match: { $and: [  { conversation: {$in:exit_convo_list1.map((c)=>c._id)} } ] } },{"$group" : {"_id" : "$conversation", "time" : {"$push" : "$created_at"},"user" : {"$push" : "$author"}}}]).then((message)=>{
                    let counter
                    const x =  existingConversation.map((c)=> {
                     let user = {}
                     if(exit_convo_list && exit_convo_list.length > 0 && c.exit_list && c.exit_list.length > 0){
                       const x =  exit_convo_list.filter((e)=> e.exit_list && c.exit_list.length>0 && e._id.toString() === c._id.toString())
                       user  =  x.length > 0 ? x[0].exit_list.filter((e)=>{
                         return e && e.user_id && e.user_id._id.toString() === req.userId.toString()})[0] : []
                      c.members =  user && user.length > 0 && c.type==='single' ? c.members.concat(user.user_id) : c.members
                     }
                     const filter = c && c.last_active ? c.last_active.filter((c)=> c && c.user_id && c.user_id.toString() === req.userId.toString()) : []
                     message.length > 0 && message.map((m)=>{
                        if(m._id.toString() === c._id.toString()) { 
                         const time = m.time.filter((timestamp,index)=>{ 
                           if( filter.length > 0 &&  moment(filter[0].last_active).isSameOrBefore(timestamp) && m.user[index].toString() !== req.userId.toString()) {
                             return timestamp
                           }
                         })  
                         c['time'] = user && user.message ? time.length : time.length 
                         count = time.length > 0 ? count+1 : count
                        }
                        })
                      return c
                   })
                  User.findOne({_id: req.userId},{activity_log:0}).populate("requests","name _id profile_picture").lean().then(user=> {
                    Coins.aggregate([ { $match: { user:user._id } },{ $group: { _id: "$user", amount: { $sum: "$amount" } } }]).then((coins)=>{
                    if (user) {
                     user['total'] = count
                       const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
                       user['alert_total'] = alerts1.length
                       user['game_completed'] = game_completed_count
                       user['mvp_count'] = mvp_count
                       token = jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.name }, config.secret);
                       user['token'] = token
                       user['password'] = undefined
                       user['refer_custom_value'] = 50
                       user['refer_custom_value1'] = 100
                       user['coins'] =  coins && coins.length > 0 && coins[0].amount ? coins[0].amount : 0
                       user['level'] =  getLevel(250 * mvp_count + 100 * game_completed_count)
                       res.status(201).send({status: "success", message: "existing user",data:user})
                      } else {
                        res.status(422).send({status: "failure", errors: {user:"force update failed"}});
                      }
                    }).catch(next);
                  }).catch(next)
                 }).catch(next)
                }).catch(next)
              }).catch(next)
               }).catch(next)
           }).catch(next)
             
              //res.status(201).send({status:"success", message:"existing user",data:user})
              
              //Activity Log
              // let activity_log = {
              //   datetime: new Date(),
              //   id:req.userId,
              //   user_type: "user",
              //   activity: "login",
              //   name:user.name,
              //   message: user.name + " Logged in successfully",
              // }
              // ActivityLog(activity_log)
            }else{
              token = jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.name}, config.secret);
              res.status(201).send({status:"success", message:"new user", token:token})
            }
          }).catch(next);
        }).catch(next);
      }else{
        res.status(422).send({status:"failure", errors:{otp:"incorrect otp"}})
      }
  }).catch(next);
});


//Edit User
router.post('/edit_user/:id',verifyToken, AccessControl('users', 'update'), (req, res, next) => {
  User.findByIdAndUpdate({_id: req.params.id},req.body).then(user=> {
    User.findById({_id: req.params.id},{activity_log:0}).lean().then(user=> {
      res.send({status:"success", message:"user edited",data:user})
    }).catch(next);
  }).catch(next);
});


router.post('/token',verifyToken, AccessControl('users', 'update'), (req, res, next) => {
  User.findByIdAndUpdate({_id: req.userId},{device_token:req.body.token}).then(user=> {
    User.findById({_id: req.params.id},{token:0,},null).then(user=> {
      console.log(user);
      res.send({status:"success", message:"user edited"})
    }).catch(next);
  }).catch(next);
});

//Delete User
router.delete('/delete_user/:id',verifyToken, AccessControl('users', 'delete'), (req, res, next) => {
 Post.updateMany({shout_out:{$in:[req.params.id]}},{ $pull: { shout_out: { $in: [req.params.id] }} },{multi:true}).then((postss)=>{
  console.log('removed shout outs from posts',postss)
  Post.deleteMany({created_by:req.params.id}).then(posts=> {
  console.log('removed posts',posts)
  Alert.deleteMany({user:req.params.id}).then(alerts=> {
  console.log('removed alerts with user',alerts)
    Alert.deleteMany({created_by:req.params.id}).then(alerts=> {
      Coins.deleteMany({user:req.params.id}).then(coins=>{
        Coins.deleteMany({from:req.params.id}).then(coins=>{
    console.log('removed alerts created by user',alerts)
      Conversation.deleteMany({type:'single',members:{$in:[req.params.id]}}).then(conversations=> {
      console.log('removed convos single by user',conversations)
        Conversation.updateMany({members:{$in:[req.params.id]}},{ $pull: { members: { $in: [req.params.id] }}},{multi:true}).then((c)=>{
      console.log('updage convos single by user',c)
        
          Game.find({users:{$in:[req.params.id]},host:{$in:[req.params.id],}}).then((c)=>{
            console.log('find convos  by user',c)
            console.log('find convos  by user',c.length)

         
          Game.updateMany({users:{$in:[req.params.id]}},{ $pull: { users: { $in: [req.params.id] }}},{multi:true}).then((c)=>{
      console.log('updated game  by user',c)
           
            Game.updateMany({host:{$in:[req.params.id]}},{ $pull: { host: { $in: [req.params.id] }}},{multi:true}).then((c)=>{
      console.log('updated game  by user',c)
      Game.find({host:[],users:[]}).then((c)=>{
            const x  = c.length > 0 ? c.map(a=>a.conversation) : []     
                    Game.deleteMany({host:[],users:[]}).then((c)=>{
                    Conversation.deleteMany({_id:{$in:x}}).then((c)=>{

                console.log('updated game  by user',c)
                Venue.updateMany({},{$pull:{rating:{user_id:req.params.id}}},{multi:true}).then((v)=>{
                User.updateMany({followers:{$in:[req.params.id]}},{ $pull:{ followers: { $in: [req.params.id] }} },{multi:true}).then((c)=>{
                  User.updateMany({requests:{$in:[req.params.id]}},{ $pull:{ requests: { $in: [req.params.id] }} },{multi:true}).then((c)=>{
                    User.updateMany({sent_requests:{$in:[req.params.id]}},{ $pull:{ sent_requests: { $in: [req.params.id] }} },{multi:true}).then((c)=>{
                      User.updateMany({following:{$in:[req.params.id]}},{ $pull:{ following: { $in: [req.params.id] }} },{multi:true}).then((c)=>{
                         console.log('updated user  by user',c)
                        User.findOneAndDelete({_id: req.params.id}).then(user=> {
                          Game.find({host:[]}).then((c)=>{
                      const x  = c.length > 0 ? c.map(a=>a.conversation) : []     
                          Game.deleteMany({host:[]}).then((c)=>{
                            Conversation.deleteMany({_id:{$in:x}}).then((c)=>{

                          console.log('passed',c)
                          
                 res.send({status:"success", message:"user deleted",data:c})
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);

}).catch(next);

}).catch(next);

}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);

}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);
}).catch(next);

});


router.post('/host_game',verifyToken, (req, res, next) => {
        Conversation.create({start_time:req.body.booking[0].start_time,end_time:req.body.booking[req.body.booking.length-1].end_time,type:'game',display_picture:req.body.image,members:[req.body.userId],colors:getColors([req.body.userId]),created_by:req.body.userId,name:req.body.game_name,sport_name:req.body.sport_name,subtitle:req.body.subtitle,sport_type:req.body.venue_type,host:[req.body.userId],last_active:[],join_date:[{user_id:req.body.userId,join_date:new Date()}]}).then(convo=>{
          Game.create({booking_status:'hosted',image:req.body.image,subtitle:req.body.subtitle,description:req.body.description,share_type:req.body.share_type,limit:req.body.limit,users:[req.body.userId],host:[req.body.userId],name:req.body.game_name,conversation:convo._id,sport_name:req.body.sport_name,type:req.body.venue_type,bookings:req.body.booking,booking_date:req.body.booking[0].booking_date,venue:req.body.booking[0].venue_id,start_time:req.body.booking[0].start_time,created_by:req.body.userId,created_type:'user'}).then(game=>{
            Game.findOne({_id:game._id}).lean().populate("conversation").populate('host','_id name profile_picture phone handle name_status').populate("venue").populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=>{
            Message.create({conversation:convo._id,message:`${req.name} created the game`,read_status:false,name:req.name,author:req.body.userId,type:'bot',created_at:new Date()}).then(message1=>{
              User.find({_id: {$in : convo.members}},{activity_log:0,followers:0,following:0,}).then(users=> {
                const x = users.map((u)=>{ return ({user_id:u._id,last_active:u.last_active ? u.last_active : new Date()})})
                Conversation.findByIdAndUpdate({_id:message1.conversation},{last_active:x,last_message:message1._id,last_updated:new Date()}).then(conversation=>{
            //since he is a host who is accessing this api
            convo['invite'] = false
            res.send({status:"success", message:"game_created",data:{game:game,convo:convo}})
    }).catch(next);
  }).catch(next);
  }).catch(next);
   }).catch(next);
  }).catch(next);
}).catch(next);
});


router.post('/send_invite',verifyToken, (req, res, next) => {
  Game.findByIdAndUpdate({_id: req.body.game._id},{ $addToSet: { invites: { $each: req.body.ids } } }).then(game=> {
    Conversation.findByIdAndUpdate({_id: req.body.game.conversation},{ $addToSet: { invites: { $each: req.body.ids } } }).then(conversation=> {
      User.find({_id: { $in :req.body.ids } },{activity_log:0}).lean().then(user=> {
        const device_token_list=user.map((e)=>e.device_token)
        //io.emit('unread', 'invitation sent');
        res.send({status:"success", message:"invitation sent"})
          NotifyArray(device_token_list,'You have a received a new game request from '+req.name,'Turftown Game Request')
}).catch(next);
}).catch(next);
}).catch(next);
});





router.post('/get_game/:conversation_id',verifyToken, (req, res, next) => {
       getGame(res,req.params.conversation_id,false,next,req)
});

router.post('/review_user/:id',verifyToken, (req, res, next) => {
   Venue.updateMany({},{$pull:{rating:{user_id:req.params.id}}},{multi:true}).then((convo)=>{
    res.send({status:"sucess",message:"activity fetched"})  
  }).catch(next)
})

router.post('/get_group_info',verifyToken, (req, res, next) => {
  Conversation.findById({_id:req.body.conversation_id}).lean().populate('members','_id name device_token profile_picture handle name_status visibility').populate('host','_id name profile_picture phone handle name_status visibility').then((convo)=>{
   
   const filter = convo.join_date.filter((a)=>a.user_id.toString() === req.userId.toString())
   const query = filter.length > 0 ? {created_at:{$gte:filter[filter.length-1].join_date}} : {}
  console.log('filter',filter,query)
   User.find({_id:convo.created_by}).select('name -_id').then(user=>{
      Message.find({$and:[{ "image": { $exists: true, $ne: null }},{conversation:req.body.conversation_id},{type:"image"},query ]}).distinct("image").then((image)=>{
    Message.find({$and:[{ "game": { $exists: true, $ne: null }},{conversation:req.body.conversation_id},query]}).distinct("game").then((games)=>{
     Game.find({_id:{ $in: games}}).populate('conversation').lean().then(gameinfo=>{
      let activities = gameinfo.map((key)=>key.sport_name)
      let uninque_activity = [...new Set(activities)]
      let data =[{name:user,game:gameinfo,activities:uninque_activity,image:image.reverse(),convo:convo}]
      res.send({status:"sucess",message:"activity fetched",data:data})  
     })
  }).catch(next);
}).catch(next); 
}).catch(next)
}).catch(next)
});

//Upload profile picture
router.post('/profile_picture',verifyToken, (req, res, next) => {
if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let File = req.files.image;
    let filename = req.files.image.name;
    //filename = path.pathname(filename)
    let name = path.parse(filename).name
    let ext = path.parse(filename).ext
    ext = ext.toLowerCase()
    filename = Date.now() + ext
		pathLocation = "assets/images/profile/"
			mkdirp(pathLocation,function(err) {
				if (err) {
					 return console.error(err);
				}
		// Use the mv() method to place the file somewhere on your server
		File.mv(pathLocation+filename, function(err) {
			if (err) 
			return res.status(500).send(err);
			let image = process.env.DOMAIN+ pathLocation + filename;
			// Venue.findOneAndUpdate({_id:req.params.id},{"venue.venue_display_picture":image}).then(user=>{
			res.status(201).send({
					imageurl:image,
					status: 'success',
					message: "profile picture uploaded"
			})
		})
  });
});


router.post('/block_slot/:id', verifyToken, (req, res, next) => {
  function BlockSlot(body,id,booking_id){
    return new Promise(function(resolve, reject){
      Venue.findById({_id:req.params.id}).then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:venue.venue.name, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
          let conf = venue.configuration;
          let types = conf.types;
          let base_type = conf.base_type;
          let inventory = {};
          let convertable;
          for(let i=0;i<types.length; i++){
            inventory[types[i]] = conf[types[i]];
          }
          if(venue.configuration.convertable){
            if(booking_history.length>0){
              let available_inventory = Object.values(booking_history).map(booking =>{
                inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type])
                for(let i=0;i<types.length-1; i++){
                inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
                }
              })
            }
            convertable = inventory[body.venue_type]<=0
          }else{
            convertable = inventory[body.venue_type]<=booking_history.length
          }
          if(convertable){
            res.status(409).send({status:"failed", message:"slot already booked"})
          }else{
              if(booking_id){
                var numb = booking_id.match(/\d/g);
                numb = numb.join("");
                var str = "" + (parseInt(numb, 10) + 1)
                var pad = "TT000000"
                booking_id = pad.substring(0, pad.length - str.length) + str
              }else{
                booking_id = "TT000001";
              }

            let booking = {
              booking_id:booking_id,
              booking_date:body.booking_date,
              booking_type:body.booking_type,
              booking_status:"blocked",
              created_by:req.userId,
              venue:venue.venue.name,
              venue_id:body.venue_id,
              venue_data:body.venue_id,
              venue_location:venue.venue.lat_long,
              user_id:body.user_id,
              sport_name:body.sport_name,
              venue_type:body.venue_type,
              amount:body.amount,
              coupons_used:body.coupons_used,
              coupon_amount:body.coupon_amount,
              offer_amount:body.offer_amount,
              commission:body.commission,
              start_time:body.start_time,
              end_time:body.end_time,
              slot_time:body.slot_time,
              booking_amount:body.booking_amount,
              multiple_id:id,
              name:body.name,
              email:body.email,
              phone:body.phone,
              card:body.card,
              upi:body.upi,
              cash:body.cash,
              courts:body.courts
            }
            Booking.create(booking).then(booking=>{
              resolve(booking)
              setTimeout(() => {
                Booking.findById({_id:booking._id}).then(booking=>{
                  if(booking.booking_status==="blocked"){
                    Booking.findByIdAndUpdate({_id:booking._id},{booking_status:"timeout"}).then(booking=>{
                      console.log('cancelled',booking_id)
                    })
                  }
                }).catch(next)
              }, 60000);
            }).catch(error=>{
              reject()
            })
          }
        }).catch(next)
      }).catch(next)
    }).catch(next)
  }
  Booking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{
    let booking_id
    if(!bookingOrder){
      booking_id = "TT000000"
    }else{
      booking_id = bookingOrder.booking_id
    }
    var id = mongoose.Types.ObjectId();
    let promisesToRun = [];
    for(let i=0;i<req.body.length;i++)
    {
      promisesToRun.push(BlockSlot(req.body[i],id, booking_id))
    }
    Promise.all(promisesToRun).then(values => {
      values = {...values}

      res.send({status:"success", message:"slot blocked", data:values})
      let booking_id = values[0].booking_id
      let venue_name = req.body[0].venue
      let venue_type = req.body[0].venue_type
      let date = moment(req.body[0].booking_date).format("MMMM Do YYYY")
      let start_time = Object.values(req.body).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
      let end_time = Object.values(req.body).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
      let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
      User.findById({_id:req.body[0].user_id}).then(user=>{
      //Activity Log
      let activity_log = {
        datetime: new Date(),
        id:req.userId,
        user_type: req.role?req.role:"user",
        activity: 'slot blocked',
        name:req.name,
        booking_id:booking_id,
        venue_id:values[0].venue_id,
        message: "Slot "+booking_id+" blocked at "+venue_name+" "+datetime+" "+venue_type,
      }
      ActivityLog(activity_log)
    })
  })
  })
})


router.post('/host_block_slot/:id', verifyToken, (req, res, next) => {
  function BlockSlot(body,id,booking_id){
    return new Promise(function(resolve, reject){
      Venue.findById({_id:req.params.id}).then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:venue.venue.name, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
          let conf = venue.configuration;
          let types = conf.types;
          let base_type = conf.base_type;
          let inventory = {};
          let convertable;
          for(let i=0;i<types.length; i++){
            inventory[types[i]] = conf[types[i]];
          }
          if(venue.configuration.convertable){
            if(booking_history.length>0){
              let available_inventory = Object.values(booking_history).map(booking =>{
                inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type])
                for(let i=0;i<types.length-1; i++){
                inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
                }
              })
            }
            convertable = inventory[body.venue_type]<=0
            console.log('as',convertable)
            console.log(inventory[body.venue_type],booking_history.length)
          }else{
            convertable = inventory[body.venue_type]<=booking_history.length
            console.log('con',convertable,booking_history,)
          }
          if(convertable){
            res.status(201).send({status:"success", message:"slot already booked"})
          }else{
              resolve(body)
              setTimeout(() => {
                Booking.findById({_id:body.booking_id}).then(booking=>{
                  if(booking.booking_status==="blocked"){
                    Booking.findByIdAndUpdate({_id:booking._id},{booking_status:"timeout"}).then(booking=>{
                      console.log('cancelled')
                    })
                  }
                }).catch(next)
              }, 30000);
            
          }
        }).catch(next)
      }).catch(next)
    }).catch(next)
  }
  let promisesToRun = [];
  
    for(let i=0;i<req.body.length;i++)
    {
      promisesToRun.push(BlockSlot(req.body[i],req.body[i]._id, req.body[i].booking_id))
    }
    Promise.all(promisesToRun).then(values => {
      res.send({status:"success", message:"slot blocked", data:values})
    //   Booking.updateMany({booking_id:values[0].booking_id},{$set:{booking_status:"blocked"}}).then(booking=>{
    //   res.send({status:"success", message:"slot blocked", data:values})
    // }).catch(next)

  })
  })


  function createCoin(req,next){
    Coins.create(Object.assign({},req)).then((s)=>{
      console.log(s)
    }).catch(next);
  }



//Slot Booked
router.post('/book_slot1', verifyToken, (req, res, next) => {
  function BookSlot(body,id){
    return new Promise(function(resolve, reject){
      Booking.findByIdAndUpdate({_id:body._id},{booking_status:"booked", transaction_id:body.transaction_id, booking_amount:body.booking_amount,coupon_amount:body.coupon_amount,coupons_used:body.coupons_used, multiple_id:id,coins:body.coins}).lean().then(booking=>{
        Booking.findById({_id:body._id}).lean().populate('venue_data').then(booking=>{
        resolve(booking)

      }).catch(next)
    }).catch(next)
    }).catch(error=>{
      reject()
    })
  }
  let promisesToRun = [];
  var id = mongoose.Types.ObjectId();
  for(let i=0;i<req.body.length;i++)
  {
    promisesToRun.push(BookSlot(req.body[i],id))
  }
  Promise.all(promisesToRun).then(values => {
    // Capture the payment
     
    var data = {
      amount:(req.body[0].booking_amount*req.body.length)*100
    }
    var result = Object.values(combineSlots([...values]))

    //Capture Payment
    if(req.body[0].transaction_id && req.body[0].transaction_id !== 'free_slot'){
    axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        if(response.data.status === "captured")
        {
          res.send({status:"success", message:"slot booked",data: result})
        }
      })
      .catch(error => {
        console.log(error.response)
        res.send({error:error.response});
      }).catch(next);
    }
    else {
      res.send({status:"success", message:"slot booked",data: result})
    }
    //Send Sms
    handleSlotAvailabilityForGames(values,req.socket)

    Admin.find({venue:{$in:[values[0].venue_id]},notify:true},{activity_log:0}).then(admins=>{
      Venue.findById({_id:values[0].venue_id}).then(venue=>{
          req.body[0].coins > 0 && createCoin({type:'booking',booking_id:values[0].booking_id,amount:-(req.body[0].coins*req.body.length),transaction_id:req.body[0].transaction_id,user:req.userId,venue:values[0].venue_id},next)
        let booking_id = values[0].booking_id
        let phone = "91"+values[0].phone
        let venue_name = values[0].venue
        let venue_type = SetKeyForSport(values[0].venue_type)
        let venue_area = venue.venue.area
        let sport_name = SetKeyForSport(values[0].sport_name)
        let manager_phone ="91"+venue.venue.contact
        let date = moment(values[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
        let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
        //onsole.log('object',start_time,end_time);
        let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
        let directions = "https://www.google.com/maps/dir/?api=1&destination="+venue.venue.latLong[0]+","+venue.venue.latLong[1]
        let total_amount = Object.values(values).reduce((total,value)=>{
          return total+value.amount
        },0)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let manger_numbers = [...phone_numbers,manager_phone]
        let venue_discount_coupon = Math.round(result[0].commission+result[0].coupon_amount) == 0 ? "Venue Discount:0" : result[0].commission == 0 && result[0].coupon_amount !== 0 ? `TT Coupon:${result[0].coupon_amount}` : result[0].commission !== 0 && result[0].coupon_amount == 0 ? `Venue Discount:${result[0].commission}` : `Venue Discount:${result[0].commission}\nTT Coupon:${result[0].coupon_amount}`  
        let balance = Math.round(result[0].amount)-Math.round(result[0].coupon_amount)-Math.round(result[0].booking_amount)-Math.round(result[0].commission)
        let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`
        let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${values[0].name} ( ${values[0].phone} ) \nBooking Id: ${booking_id}\nVenue: ${venue_name}, ${venue_area}\nSport: ${sport_name}(${venue_type})\nDate and Time: ${datetime}\nPrice: ${Math.round(result[0].amount)}\nAmount Paid: ${Math.round(result[0].booking_amount)}\nVenue Discount: ${Math.round(result[0].commission)}\nTT Coupon: ${Math.round(result[0].coupon_amount)}\nAmount to be collected: ${Math.round(balance)}` //490618
        let sender = "TRFTWN"
        // SendMessage(phone,sender,SLOT_BOOKED_USER) // sms to user
        // SendMessage(manger_numbers.join(","),sender,SLOT_BOOKED_MANAGER) // sms to user 
        // axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&manager_phone='+manager_phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
        // .then(response => {
        //   console.log(response.data)
        // }).catch(error=>{
        //   console.log(error.response.data)
        // })
      let mailBody = {
        name:values[0].name,
        date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
        day:moment(values[0].booking_date).format("Do"),
        venue:values[0].venue,
        area:venue_area,
        venue_type:values[0].venue_type,
        booking_id:values[0].booking_id,
        slot_time:datetime,
        quantity:1,
        total_amount:Math.round(result[0].amount),
        booking_amount:Math.round(result[0].booking_amount),
        directions:directions,
        sport_name:sport_name,
        venue_discount:Math.round(result[0].commission),
        coupon_amount:Math.round(result[0].coupon_amount),
        venue_name:venue.venue.name
      }

      // let to_mail = `${values[0].email}, rajasekar@turftown.in,support@turftown.in`
      // // console.log(mailBody)
      // ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
      //   mail("support@turftown.in", to_mail,"Venue Booked","test",html,response=>{
      //     if(response){
      //       console.log('success')
      //     }else{
      //       console.log('failed')
      //     }
      //   })
      // })
      
      //Activity Log
      let activity_log = {
        datetime: new Date(),
        id:req.userId,
        user_type: req.role?req.role:"user",
        activity: 'slot booked',
        name:req.name,
        booking_id:booking_id,
        venue_id:values[0].venue_id,
        message: "Slot "+booking_id+" booked at "+venue_name+" "+datetime+" "+venue_type,
      }
      ActivityLog(activity_log)
      }).catch(next)
    }).catch(next)
  })
})


//old migration users changed combineslot to combineslot1
router.post('/book_slot', verifyToken, (req, res, next) => {
  function BookSlot(body,id){
    return new Promise(function(resolve, reject){
      Booking.findByIdAndUpdate({_id:body._id},{booking_status:"booked", transaction_id:body.transaction_id, booking_amount:body.booking_amount,coupon_amount:body.coupon_amount,coupons_used:body.coupons_used, multiple_id:id}).lean().then(booking=>{
        Booking.findById({_id:body._id}).lean().populate('venue_data').then(booking=>{
        resolve(booking)
      }).catch(next)
    }).catch(next)
    }).catch(error=>{
      reject()
    })
  }
  let promisesToRun = [];
  var id = mongoose.Types.ObjectId();
  for(let i=0;i<req.body.length;i++)
  {
    promisesToRun.push(BookSlot(req.body[i],id))
  }
  Promise.all(promisesToRun).then(values => {
    // Capture the payment
     
    var data = {
      amount:req.body[0].booking_amount*100
    }
   var result = Object.values(combineSlots1([...values]))
    //Capture Payment
  if(req.body[0].transaction_id && req.body[0].transaction_id !== 'free_slot'){
  
    axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        if(response.data.status === "captured")
        {
          res.send({status:"success", message:"slot booked",data: result})
        }
      })
      .catch(error => {
        console.log(error.response)
        res.send({error:error.response});
      }).catch(next);
    }else{
      res.send({status:"success", message:"slot booked",data: result})
    }
    //Send Sms
    Admin.find({venue:{$in:[values[0].venue_id]},notify:true},{activity_log:0}).then(admins=>{
      Venue.findById({_id:values[0].venue_id}).then(venue=>{
        let booking_id = values[0].booking_id
        let phone = "91"+values[0].phone
        let venue_name = values[0].venue
        let venue_type = SetKeyForSport(values[0].venue_type)
        let venue_area = venue.venue.area
        let sport_name = SetKeyForSport(values[0].sport_name)
        let manager_phone ="91"+venue.venue.contact
        let date = moment(values[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
        let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
        //onsole.log('object',start_time,end_time);
        let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
        let directions = "https://www.google.com/maps/dir/?api=1&destination="+venue.venue.latLong[0]+","+venue.venue.latLong[1]
        let total_amount = Object.values(values).reduce((total,value)=>{
          return total+value.amount
        },0)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let manger_numbers = [...phone_numbers,manager_phone]
        let venue_discount_coupon = Math.round(result[0].commission+result[0].coupon_amount) == 0 ? "Venue Discount:0" : result[0].commission == 0 && result[0].coupon_amount !== 0 ? `TT Coupon:${result[0].coupon_amount}` : result[0].commission !== 0 && result[0].coupon_amount == 0 ? `Venue Discount:${result[0].commission}` : `Venue Discount:${result[0].commission}\nTT Coupon:${result[0].coupon_amount}`  
        let balance = Math.round(result[0].amount)-Math.round(result[0].coupon_amount)-Math.round(result[0].booking_amount)-Math.round(result[0].commission)
        let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`
        let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${values[0].name} ( ${values[0].phone} ) \nBooking Id: ${booking_id}\nVenue: ${venue_name}, ${venue_area}\nSport: ${sport_name}(${venue_type})\nDate and Time: ${datetime}\nPrice: ${Math.round(result[0].amount)}\nAmount Paid: ${Math.round(result[0].booking_amount)}\nVenue Discount: ${Math.round(result[0].commission)}\nTT Coupon: ${Math.round(result[0].coupon_amount)}\nAmount to be collected: ${Math.round(balance)}` //490618
        let sender = "TRFTWN"
        SendMessage(phone,sender,SLOT_BOOKED_USER) // sms to user
        SendMessage(manger_numbers.join(","),sender,SLOT_BOOKED_MANAGER) // sms to user 
        // axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&manager_phone='+manager_phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
        // .then(response => {
        //   console.log(response.data)
        // }).catch(error=>{
        //   console.log(error.response.data)
        // })
      let mailBody = {
        name:values[0].name,
        date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
        day:moment(values[0].booking_date).format("Do"),
        venue:values[0].venue,
        area:venue_area,
        venue_type:values[0].venue_type,
        booking_id:values[0].booking_id,
        slot_time:datetime,
        quantity:1,
        total_amount:Math.round(result[0].amount),
        booking_amount:Math.round(result[0].booking_amount),
        directions:directions,
        sport_name:sport_name,
        venue_discount:Math.round(result[0].commission),
        coupon_amount:Math.round(result[0].coupon_amount),
        venue_name:venue.venue.name
      }
      let to_mail = `${values[0].email}, rajasekar@turftown.in,support@turftown.in`
      // console.log(mailBody)
      ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
        mail("support@turftown.in", to_mail,"Venue Booked","test",html,response=>{
          if(response){
            console.log('success')
          }else{
            console.log('failed')
          }
        })
      })
      
      //Activity Log
      let activity_log = {
        datetime: new Date(),
        id:req.userId,
        user_type: req.role?req.role:"user",
        activity: 'slot booked',
        name:req.name,
        booking_id:booking_id,
        venue_id:values[0].venue_id,
        message: "Slot "+booking_id+" booked at "+venue_name+" "+datetime+" "+venue_type,
      }
      ActivityLog(activity_log)
      }).catch(next)
    }).catch(next)
  })
})

function SlotsCheck1(body,id){
  return new Promise((resolve,reject)=>{
    Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
      let venue_id;
      if(venue.secondary_venue){
        venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
      }else{
        venue_id = [venue._id.toString()]
      }
      Booking.find({ venue:body.venue, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
      // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
        let slots_available = SlotsAvailable(venue,booking_history)
        if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
          reject()
        }else{
          console.log('slot time selected',body.slot_time);
          resolve(body.booking_id)
        }
      }).catch(error => console.log(error))
    }).catch(error => console.log(error))
  })
}

async function handleSlotAvailabilityForGames(booking1,client){
  let booking = booking1[0]
  const slot_time = { $in: booking1.map((b)=>b.slot_time) }
  const x =  await  Booking.find({  venue_id:booking.venue_id, booking_date:booking.booking_date,slot_time:slot_time,booking_status:{$in:["blocked","booked","completed"]}}).lean().then(booking_history=>{
    let promisesToRun = [];
        for(let i=0;i<booking_history.length;i++){
              promisesToRun.push(SlotsCheck1(booking_history[i],booking.venue_id))
            }
           return Promise.all(promisesToRun).then((values) => {
             return Game.updateMany({"bookings.booking_id":{$nin:[booking.booking_id]},"booking_date":booking.booking_date,"bookings.booking_status":{$in:['blocked','hosted','cancelled']},"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time },{$set:{status:false,status_description:'Sorry ! Slot has been booked by some other user'}}).lean().then(game1=>{
               return Game.find({"bookings.booking_id":{$nin:[booking.booking_id]},"booking_date":booking.booking_date,"bookings.booking_status":{$in:['blocked','hosted','cancelled']},"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time }).lean().populate('conversation').then(game=>{
                console.log('length',game);
                let messages =  game.map((nc)=>{ return {conversation:nc.conversation._id,created_at:new Date(),message:`Sorry ! Game ${nc.name} has been cancelled becuase the slot has been booked by some other user.Please choose another slot to host your game`,name:'bot',read_status:true,read_by:nc.conversation.members[0],author:nc.conversation.members[0],type:'bot'}}) 
                const members = _.flatten(game.map((g)=>g.conversation.members))
                return   User.find({_id: { $in :members } },{activity_log:0}).lean().then(user=> {
                return Message.insertMany(messages).then(message1=>{
                  const message_ids = message1.map((m)=>m._id)
                  return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                  const cids = m.map((entry)=>{
                    const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                    Conversation.findByIdAndUpdate({_id:id},{$set:{last_message:entry._id}}).then((m)=>console.log('pass'))
                    //client && client.to(id).emit('new',entry)
                    return id
                  })
                    const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray(device_token_list,'Sorry ! Game has been cancelled becuase the slot has been booked by some other user.Please choose another slot to host your game','Turftown Game Cancellation')
                                                    return 'pass'
                 }).catch((e)=>console.log(e));
              }).catch(error => console.log(error))
            }).catch(error => console.log(error))
          }).catch(error => console.log(error))
            }).catch(error => console.log(error))
          }).catch(error=>{
            console.log('hit error',error);
            return 'available'
            //res.send({status:"failed", message:"slots not available"})
          })
        }).catch(error => console.log(error))
}

router.post('/book_slot_and_host', verifyToken, (req, res, next) => {
  function BookSlot(body,id){
    return new Promise(function(resolve, reject){
      Booking.findByIdAndUpdate({_id:body._id},{booking_status:"booked", transaction_id:body.transaction_id, booking_amount:body.booking_amount,coupon_amount:body.coupon_amount,coupons_used:body.coupons_used, multiple_id:id,game:true,coins:body.coins}).lean().then(booking=>{
        Booking.findById({_id:body._id}).lean().populate('venue_data').then(booking=>{
        resolve(booking)
      }).catch(next)
    }).catch(next)
    }).catch(error=>{
      reject()
    })
  }
  let promisesToRun = [];
  var id = mongoose.Types.ObjectId();
  for(let i=0;i<req.body.length;i++)
  {
    promisesToRun.push(BookSlot(req.body[i],id))
  }
  Promise.all(promisesToRun).then(values => {
    // Capture the payment
     
    var data = {
      amount:(req.body[0].booking_amount*req.body.length)*100
    }

   console.log('razorpay api',process.env.RAZORPAY_API)
   console.log('transaction api',values)
   if(req.body[0].transaction_id && req.body[0].transaction_id !== 'free_slot'){
    //Capture Payment
    axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        console.log(response.data)
        if(response.data.status === "captured")
        {
          console.log(result)
          
        }
      })
      .catch(error => {
        console.log(error.response)
        res.send({error:error.response});
      }).catch(next);
    }
    //Send Sms
    handleSlotAvailabilityForGames(values,req.socket)

    Admin.find({venue:{$in:[values[0].venue_id]},notify:true},{activity_log:0}).then(admins=>{
      Venue.findById({_id:values[0].venue_id}).then(venue=>{
        User.findById({_id:req.userId}).then(user=>{
        Conversation.create({type:'game',start_time:values[0].start_time,end_time:values[values.length-1].end_time,display_picture:req.body[0].image,subtitle:req.body[0].subtitle,members:[req.userId],colors:getColors([req.userId]),host:[req.userId],created_by:req.userId,name:req.body[0].game_name,sport_name:values[0].sport_name,join_date:[{user_id:req.userId,join_date:new Date()}]}).then(convo=>{
           Game.create({booking_status:'booked',image:req.body[0].image,share_type:req.body[0].share_type,limit:req.body[0].limit,users:[req.userId],created_by:req.userId,created_type:'user',host:[req.userId],name:req.body[0].game_name,conversation:convo._id,subtitle:req.body[0].subtitle,sport_name:values[0].sport_name,type:req.body[0].format,bookings:values,description:req.body[0].description,booking_date:values[0].booking_date,start_time:values[0].start_time,venue:values[0].venue_id }).then(game=>{
            Game.findOne({_id:game._id}).lean().populate("conversation").populate('host','_id name profile_picture phone handle name_status').populate("venue").populate('users','_id name profile_picture phone handle name_status').populate('invites','_id name profile_picture phone handle').then(game=>{
            Message.create({conversation:convo._id,message:`${req.name} created the game`,read_status:false,name:req.name,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
              User.find({_id: {$in : convo.members}},{activity_log:0,followers:0,following:0,}).then(users=> {
                Conversation.findByIdAndUpdate({_id:message1.conversation},{last_message:message1._id,last_updated:new Date()}).then(convo=>{
                convo['invite'] = false
            res.send({status:"success", message:"slot booked",data: {game:game,convo:convo}})
            console.log('hit1',req.body[0]);
            
          req.body[0].coins > 0 && createCoin({type:'booking',amount:-(req.body[0].coins*req.body.length),transaction_id:req.body[0].transaction_id,user:req.userId,booking_id:values[0].booking_id,venue:values[0].venue_id},next)
          //createReport({venue_id:values[0].venue_id,booking_id:values[0].booking_id,status:true,user:values[0].user_id,card:values[0].card?values[0].card:0,coins:(req.body[0].coins*req.body.length),cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
          var result = Object.values(combineSlots([...values]))
        let booking_id = values[0].booking_id
        let phone = "91"+values[0].phone
        let venue_name = values[0].venue
        let venue_type = SetKeyForSport(values[0].venue_type)
        let venue_area = venue.venue.area
        let sport_name = SetKeyForSport(values[0].sport_name)
        let manager_phone ="91"+venue.venue.contact
        let date = moment(values[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
        let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
        //onsole.log('object',start_time,end_time);
        let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
        let directions = "https://www.google.com/maps/dir/?api=1&destination="+venue.venue.latLong[0]+","+venue.venue.latLong[1]
        let total_amount = Object.values(values).reduce((total,value)=>{
          return total+value.amount
        },0)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let manger_numbers = [...phone_numbers,manager_phone]
        let venue_discount_coupon = Math.round(result[0].commission+result[0].coupon_amount) == 0 ? "Venue Discount:0" : result[0].commission == 0 && result[0].coupon_amount !== 0 ? `TT Coupon:${result[0].coupon_amount}` : result[0].commission !== 0 && result[0].coupon_amount == 0 ? `Venue Discount:${result[0].commission}` : `Venue Discount:${result[0].commission}\nTT Coupon:${result[0].coupon_amount}`  
        let balance = Math.round(result[0].amount)-Math.round(result[0].coupon_amount)-Math.round(result[0].booking_amount)-Math.round(result[0].commission)-Math.round(result[0].coins)
        let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`
        let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${values[0].name} ( ${values[0].phone} ) \nBooking Id: ${booking_id}\nVenue: ${venue_name}, ${venue_area}\nSport: ${sport_name}(${venue_type})\nDate and Time: ${datetime}\nPrice: ${Math.round(result[0].amount)}\nAmount Paid: ${Math.round(result[0].booking_amount)}\nVenue Discount: ${Math.round(result[0].commission)}\nTT Coupon: ${Math.round(result[0].coupon_amount)}\nAmount to be collected: ${Math.round(balance)}` //490618
        let sender = "TRFTWN"
        let SLOT_BOOKED_GAME_USER =`Hey ${values[0].name}! Thank you for using Turf Town! Your Game has been created .\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nTT Coins : ${Math.round(result[0].coins)}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`

        // SendMessage(phone,sender,SLOT_BOOKED_USER) // sms to user
        notifyRedirect(user,SLOT_BOOKED_GAME_USER)
        // SendMessage(manger_numbers.join(","),sender,SLOT_BOOKED_MANAGER) // sms to user 
        // axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&manager_phone='+manager_phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
        // .then(response => {
        //   console.log(response.data)
        // }).catch(error=>{
        //   console.log(error.response.data)
        // })
      // let mailBody = {
      //   name:values[0].name,
      //   date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
      //   day:moment(values[0].booking_date).format("Do"),
      //   venue:values[0].venue,
      //   area:venue_area,
      //   venue_type:values[0].venue_type,
      //   booking_id:values[0].booking_id,
      //   slot_time:datetime,
      //   quantity:1,
      //   total_amount:Math.round(result[0].amount),
      //   booking_amount:Math.round(result[0].booking_amount),
      //   directions:directions,
      //   sport_name:sport_name,
      //   venue_discount:Math.round(result[0].commission),
      //   coupon_amount:Math.round(result[0].coupon_amount),
      //   venue_name:venue.venue.name
      // }

      // let to_mail = `${values[0].email}, rajasekar@turftown.in,support@turftown.in`
      // console.log(mailBody)
      // ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
      //   mail("support@turftown.in", to_mail,"Venue Booked","test",html,response=>{
      //     if(response){
      //       console.log('success')
      //     }else{
      //       console.log('failed')
      //     }
      //   })
      // })
      
      //Activity Log
      // let activity_log = {
      //   datetime: new Date(),
      //   id:req.userId,
      //   user_type: req.role?req.role:"user",
      //   activity: 'slot booked',
      //   name:req.name,
      //   booking_id:booking_id,
      //   venue_id:values[0].venue_id,
      //   message: "Slot "+booking_id+" booked at "+venue_name+" "+datetime+" "+venue_type,
      // }
      // ActivityLog(activity_log)
      }).catch(next)
    }).catch(next)
    }).catch(next)
  }).catch(next)
}).catch(next)
  }).catch(next)
}).catch(next)
}).catch(next)
    }).catch(next)
  })
})


router.post('/modify_book_slot_and_host', verifyToken, (req, res, next) => {
  // function BookSlot(body,id){
  //   return new Promise(function(resolve, reject){
  //     Booking.find({booking_id:body.booking_id}).then(booking=>{
  //       Booking.updateMany({booking_id:body.booking_id},{booking_status:"booked", transaction_id:body.transaction_id, booking_amount:body.booking_amount,coupon_amount:body.coupon_amount,coupons_used:body.coupons_used, multiple_id:id,game:true,coins:body.coins}).lean().then(booking=>{
  //       Booking.findById({_id:body._id}).lean().populate('venue_data').then(booking=>{
  //       resolve(booking)
  //     }).catch(next)
  //   }).catch(next)
  // }).catch(next)
  //   }).catch(error=>{
  //     reject()
  //   })
  // }
  let promisesToRun = [];
  var id = mongoose.Types.ObjectId();
  Booking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{
    let booking_id
    if(!bookingOrder){
      booking_id = "TT000000"
    }else{
      booking_id = bookingOrder.booking_id
      console.log(booking_id)
    }
    var id = mongoose.Types.ObjectId();
    let promisesToRun = [];
  for(let i=0;i<req.body.length;i++)
  {
    promisesToRun.push(ModifyBookSlot(req.body[i],id, booking_id,req.body[i].venue_id,req,res,next))
  }
  Promise.all(promisesToRun).then(values => {
    // Capture the payment
    // var data = {
    //   amount:(req.body[0].booking_amount * 100) 
    // }

    var data = {
      amount:(req.body[0].booking_amount*req.body.length)*100
    }

   console.log('razorpay api',process.env.RAZORPAY_API)
   console.log('transaction api',data,req.body[0])

    //Capture Payment
    if(req.body[0].transaction_id && req.body[0].transaction_id !== 'free_slot'){
    axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        console.log(response.data);
        if(response.data.status === "captured")
        {
          
        }
      })
      .catch(error => {
        console.log(error.response.data)
        res.send({error:error.response});
      }).catch(next);
    }
    //Send Sms

    Admin.find({venue:{$in:[values[0].venue_id]},notify:true},{activity_log:0}).then(admins=>{
      Venue.findById({_id:values[0].venue_id}).then(venue=>{
        User.findById({_id:req.userId}).then(user=>{
          Game.findOneAndUpdate({"bookings.booking_id":req.body[0].booking_id},{$set:{bookings:values,booking_status:'booked'}}).then(game=>{
            Game.findById({_id:game._id}).then(game=>{
            Message.create({conversation:game.conversation,message:`${req.name} has booked the slot for this game . Please be on time to the venue`,read_status:false,name:req.name,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
              User.find({_id: {$in : req.userId}},{activity_log:0,followers:0,following:0,}).then(users=> {
                Conversation.findByIdAndUpdate({_id:message1.conversation},{last_message:message1._id,last_updated:new Date()}).then(conversation=>{
                 req.body[0].coins > 0 && createCoin({type:'booking',amount:-(req.body[0].coins*req.body.length),transaction_id:req.body[0].transaction_id,user:req.userId,venue:values[0].venue_id,booking_id:values[0].booking_id},next)
                
                  Conversation.findById({_id:message1.conversation}).then(convo=>{
                    console.log('hit message',message1);
                    convo['invite'] = false
                    //req && req.socket && req.socket.broadcast.emit('unread',{})
                  res.send({status:"success", message:"slot booked",data: {game:game,convo:convo}})                  
                 handleSlotAvailabilityForGames(values,req.socket)
      
                  var result = Object.values(combineSlots([...values]))

        let booking_id = values[0].booking_id
        let phone = "91"+values[0].phone
        let venue_name = values[0].venue
        let venue_type = SetKeyForSport(values[0].venue_type)
        let venue_area = venue.venue.area
        let sport_name = SetKeyForSport(values[0].sport_name)
        let manager_phone ="91"+venue.venue.contact
        let date = moment(values[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
        let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
        //onsole.log('object',start_time,end_time);
        let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
        let directions = "https://www.google.com/maps/dir/?api=1&destination="+venue.venue.latLong[0]+","+venue.venue.latLong[1]
        let total_amount = Object.values(values).reduce((total,value)=>{
          return total+value.amount
        },0)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let manger_numbers = [...phone_numbers,manager_phone]
        let venue_discount_coupon = Math.round(result[0].commission+result[0].coupon_amount) == 0 ? "Venue Discount:0" : result[0].commission == 0 && result[0].coupon_amount !== 0 ? `TT Coupon:${result[0].coupon_amount}` : result[0].commission !== 0 && result[0].coupon_amount == 0 ? `Venue Discount:${result[0].commission}` : `Venue Discount:${result[0].commission}\nTT Coupon:${result[0].coupon_amount}`  
        let balance = Math.round(result[0].amount)-Math.round(result[0].coupon_amount)-Math.round(result[0].booking_amount)-Math.round(result[0].commission)
        let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`
        let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${values[0].name} ( ${values[0].phone} ) \nBooking Id: ${booking_id}\nVenue: ${venue_name}, ${venue_area}\nSport: ${sport_name}(${venue_type})\nDate and Time: ${datetime}\nPrice: ${Math.round(result[0].amount)}\nAmount Paid: ${Math.round(result[0].booking_amount)}\nVenue Discount: ${Math.round(result[0].commission)}\nTT Coupon: ${Math.round(result[0].coupon_amount)}\nAmount to be collected: ${Math.round(balance)}` //490618
        let sender = "TRFTWN"
        let SLOT_BOOKED_GAME_USER =`Hey ${values[0].name}! Thank you for using Turf Town! Your Game has been created .\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${Math.round(result[0].booking_amount)}\nBalance to be paid : ${Math.round(balance)}`

        // SendMessage(phone,sender,SLOT_BOOKED_USER) // sms to user
       notifyRedirect(user,SLOT_BOOKED_GAME_USER)

        // SendMessage(manger_numbers.join(","),sender,SLOT_BOOKED_MANAGER) // sms to user 
        // axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&manager_phone='+manager_phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
        // .then(response => {
        //   console.log(response.data)
        // }).catch(error=>{
        //   console.log(error.response.data)
        // })
      // let mailBody = {
      //   name:values[0].name,
      //   date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
      //   day:moment(values[0].booking_date).format("Do"),
      //   venue:values[0].venue,
      //   area:venue_area,
      //   venue_type:values[0].venue_type,
      //   booking_id:values[0].booking_id,
      //   slot_time:datetime,
      //   quantity:1,
      //   total_amount:Math.round(result[0].amount),
      //   booking_amount:Math.round(result[0].booking_amount),
      //   directions:directions,
      //   sport_name:sport_name,
      //   venue_discount:Math.round(result[0].commission),
      //   coupon_amount:Math.round(result[0].coupon_amount),
      //   venue_name:venue.venue.name
      // }

      // let to_mail = `${values[0].email}, rajasekar@turftown.in,support@turftown.in`
      // console.log(mailBody)
      // ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
      //   mail("support@turftown.in", to_mail,"Venue Booked","test",html,response=>{
      //     if(response){
      //       console.log('success')
      //     }else{
      //       console.log('failed')
      //     }
      //   })
      // })
      
      //Activity Log
      // let activity_log = {
      //   datetime: new Date(),
      //   id:req.userId,
      //   user_type: req.role?req.role:"user",
      //   activity: 'slot booked',
      //   name:req.name,
      //   booking_id:booking_id,
      //   venue_id:values[0].venue_id,
      //   message: "Slot "+booking_id+" booked at "+venue_name+" "+datetime+" "+venue_type,
      // }
      // ActivityLog(activity_log)
      }).catch(next)
    }).catch(next)
  }).catch(next)
    }).catch(next)
  }).catch(next)
}).catch(next)
}).catch(next)
}).catch(next)
    }).catch(next)
  }).catch(next)
  })
})

router.post('/book_slot_for_admin/:id', verifyToken, AccessControl('booking', 'create'), (req, res, next) => {
  let params = req.params.id
  //Check of Slot Exist
  function SlotsCheck(body,id){
    return new Promise((resolve,reject)=>{
      Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:body.venue, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
        // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
          let slots_available = SlotsAvailable(venue,booking_history)
          if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
            resolve()
          }else{
            reject()
          }
        }).catch(next)
      }).catch(next)
    })
  }

  let promisesToRun = [];
  for(let i=0;i<req.body.length;i++){
    promisesToRun.push(SlotsCheck(req.body[i],req.params.id))
  }

  Promise.all(promisesToRun).then(values => {
    
    Booking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{
      let booking_id
      if(!bookingOrder){
        booking_id = "TT000000"
      }else{
        booking_id = bookingOrder.booking_id
        console.log(booking_id)
      }
      var id = mongoose.Types.ObjectId();
      let promisesToRun = [];
      for(let i=0;i<req.body.length;i++)
      {
        promisesToRun.push(BookSlot(req.body[i],id, booking_id,params,req,res,next))
      } 
  
      Promise.all(promisesToRun).then(values => {
        values = {...values}
        var result = Object.values(combineSlots(values))
        res.send({status:"success", message:"slot booked", data:values})
        Venue.findById({_id:values[0].venue_id}).then(venue=>{
          // Send SMS
          createReport({type:'booking',comments:values[0].comments ? values[0].comments:'',venue_id:values[0].venue_id,booking_id:values[0].booking_id,status:true,created_by:values[0].user_id,card:values[0].card?values[0].card:0,coins:0,cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
          let booking_id = values[0].booking_id
          let phone = "91"+values[0].phone
          let venue_name = values[0].venue
          let venue_type = SetKeyForSport(req.body[0].venue_type) 
          let venue_area = venue.venue.area
          let sport_name = SetKeyForSport(values[0].sport_name)
          let date = moment(values[0].booking_date).format("MMMM Do YYYY")
          let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
          let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},values[0].end_time)
          let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
          let directions = "https://www.google.com/maps/dir/"+venue.venue.latLong[0]+","+venue.venue.latLong[1]
          let total_amount = Math.round(values[0].amount-values[0].commission-values[0].booking_amount)
          let venue_discount_coupon = result[0].commission == 0 ? "Venue Discount:0" : `Venue Discount:${Math.round(result[0].commission)}`
          let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${result[0].booking_amount}\nBalance to be paid : ${total_amount}`
          let sender = "TRFTWN"
          //SendMessage(phone,sender,SLOT_BOOKED_USER)
          // axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
          // .then(response => {
          //   console.log(response.data)
          // }).catch(error=>{
          //   console.log(error.response)
          // })
          
          //Activity Log
          let activity_log = {
            datetime: new Date(),
            id:req.userId,
            user_type: req.role?req.role:"user",
            activity: 'slot booked',
            name:req.name,
            booking_id:booking_id,
            venue_id:values[0].venue_id,
            message: "Slot "+booking_id+" booked at "+venue_name+" "+datetime+" "+venue_type,
          }
          ActivityLog(activity_log)
  
        }).catch(next)
      }).catch(next)
    }).catch(next)
  }).catch(error=>{
    res.send({status:"failed", message:"slots not available"})
  })
})

const SlotsCheck = (body, id) => {

}


router.post('/book_slot_for_value/:id', verifyToken, AccessControl('booking', 'create'), (req, res, next) => {
  let params = req.params.id
  //Check of Slot Exist
  // function SlotsCheck(body,id){
  //   return new Promise((resolve,reject)=>{
  //     Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
  //       let venue_id;
  //       if(venue.secondary_venue){
  //         venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
  //       }else{
  //         venue_id = [venue._id.toString()]
  //       }
  //       Booking.find({ venue:body.venue, venue_id:req.params.id, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
  //       // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
  //       let slots_available = SlotsAvailable(venue,booking_history)
  //       if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
  //           resolve()
  //         }else{
  //           reject(body)
  //         }
  //       }).catch(next)
  //     }).catch(next)
  //   })
  // }
  Venue.findById({_id:req.params.id}).then(venue=>{
  Booking.find({}).sort({"booking_id" : -1}).collation( { locale: "en_US", numericOrdering: true }).limit(1).then(bookingOrder=>{
  let promisesToRun = [];
  var id = mongoose.Types.ObjectId();
      req.body.bookObject.map(((arr,index)=>{
        let record = []
          for(let i=0;i<arr.block.length;i++){
            let repeat_data = {...arr.block[i],...req.body.repeat_data}
            promisesToRun.push(BookRepSlot(repeat_data,id,params,req,res,(index+1),record,bookingOrder,venue,next))
          }
        }))
      Promise.all(promisesToRun).then(values => {
            Booking.insertMany(values).then(booking=>{
              let values = booking
              Invoice.find({repeat_id: booking[0].repeat_id}).limit(1).then(invoice=> {
                let bookings = booking.map((b)=>b.booking_id)
                if (invoice && invoice.length > 0) {
                    let advance = req.body.bookObject[0].total_advance && (req.body.bookObject[0].total_advance !== '0' || req.body.bookObject[0].total_advance !== '') ? req.body.bookObject[0].total_advance : 0 
                    let total = invoice[0].advance+parseInt(advance,10)
                      Invoice.findOneAndUpdate({repeat_id: booking[0].repeat_id},{booking_data:bookings,advance:total,name:booking[0].name}).then(invoice=>{
                        createReport({type:'booking',comments:values[0].comments ? booking[0].comments:'',repeat_id:booking[0].repeat_id,venue_id:booking[0].venue_id,booking_id:values[0].booking_id,name:booking[0].name,status:true,admin:values[0].created_by,card:values[0].card?values[0].card:0,coins:0,cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
                        res.status(201).send({status: "success",data:invoice});
                    }).catch(next);
                } else {
                  Invoice.create({booking_data:bookings,advance:req.body.bookObject[0].total_advance,repeat_id: booking[0].repeat_id,name:booking[0].name}).then(invoice=>{
                    createReport({repeat_id: booking[0].repeat_id,name: booking[0].name,venue_id:values[0].venue_id,booking_id:values[0].booking_id,status:true,admin:values[0].created_by,card:values[0].card?values[0].card:0,coins:0,cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
                    res.send({status:"success", message:"slot booked", data:invoice})
                  }).catch(next);  
                }
            }).catch(next);  
            }).catch(error=>{
              console.log(error)
              reject()
            })
       
      }).catch(next)
}).catch(next)
}).catch(next)

})


router.post('/update_invoice_amount', verifyToken, (req, res, next) => {
  Invoice.find({repeat_id: req.body.repeat_id},{booking_data:0}).limit(1).then(invoice=> {
    if (invoice && invoice[0].repeat_id && invoice.length > 0) {
      let sum  = invoice[0].advance + req.body.total_advance
        console.log(sum)
          Invoice.findOneAndUpdate({repeat_id: req.body.repeat_id},{advance:sum,cash:req.body.cash,card:req.body.card,upi:req.body.upi,image:req.body.image}).then(invoice=>{
            Invoice.findOne({repeat_id: req.body.repeat_id},{booking_data:0}).then(invoice=>{
            res.status(201).send({status: "success",data:invoice});
        }).catch(next);
      }).catch(next);

    } else {
        res.send({status:"failiure", message:"No invoice id found", data:invoice})
    }
}).catch(next);  
})

router.post('/sub_invoice_amount', verifyToken, (req, res, next) => {
  Invoice.find({repeat_id: req.body.repeat_id},{booking_data:0}).limit(1).then(invoice=> {
    if (invoice && invoice[0].repeat_id && invoice.length > 0) {
      let sum  =  req.body.total_advance
      let sum1 = req.body.update_advance
          Invoice.findOneAndUpdate({repeat_id: req.body.repeat_id},{advance:sum,update_advance:sum1}).then(invoice=>{
            Invoice.findOne({repeat_id: req.body.repeat_id},{booking_data:0}).then(invoice=>{
            res.status(201).send({status: "success",data:invoice});
        }).catch(next);
      }).catch(next);

    } else {
        res.send({status:"failiure", message:"No invoice id found", data:invoice})
    }
}).catch(next);  
})


router.post('/get_invoice_advance', verifyToken, (req, res, next) => {
  Invoice.findOne({repeat_id: req.body.repeat_id},{booking_data:0}).then(invoice=> {
    if (invoice && invoice.repeat_id) {
            res.status(201).send({status: "success",data:invoice});
    } else {
        res.send({status:"failiure", message:"No invoice id found", data:invoice})
    }
}).catch(next);  
})

router.post('/update_invoice', verifyToken, (req, res, next) => {
  console.log("Rewww",req.body)
  Invoice.findOne({repeat_id: req.body.repeat_id},{booking_data:0}).then(invoice=> {
    console.log("rrrr",invoice)
    if (invoice && invoice.repeat_id) {
      Invoice.findOneAndUpdate({repeat_id: req.body.repeat_id},req.body).then(invoice=>{
        console.log("dddinfe",invoice)
        res.status(201).send({status: "invoice address updated",data:invoice});
      }).catch(next);  
    } else {
        res.send({status:"failiure", message:"No invoice id found", data:invoice})
    }
}).catch(next);  
})

router.post('/get_invoice_advance_many', verifyToken, (req, res, next) => {
  Invoice.find({repeat_id: {$in:req.body.repeat_id}},{booking_data:0}).then(invoice=> {
        res.send({status:"failiure", message:"No invoice", data:invoice})
}).catch(next);  
})


router.post('/check_coupon/:id', verifyToken, (req, res, next) => {
  Booking.find({user_id: req.params.id,booking_status:{$in:["completed","booked"]}}).lean().then(coupon=>{
    let coupons_used = []
    coupon.filter(booking=>{
      if(booking.coupons_used !== ""){ 
        coupons_used.push(booking.coupons_used)
      }
    })

    res.send({status:"success", message:"coupons fetched", data:coupons_used})
  })
})

router.post('/check_event_coupon/:id', verifyToken, (req, res, next) => {
  EventBooking.find({created_by: req.params.id,booking_status:{$in:["completed","booked"]}}).lean().then(coupon=>{
    let coupons_used = []
    coupon.filter(booking=>{
      if(booking.coupons_used !== ""){ 
        coupons_used.push(booking.coupons_used)
      }
    })
    res.send({status:"success", message:"coupons fetched", data:coupons_used})
  })
})

//Modify booking
router.post('/modify_booking/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_id:req.params.id}).then(booking=>{
    const amount = req.body.amount
    if(req.body.amount){
      req.body.amount = req.body.amount/booking.length
    }
    if(req.body.commission){
      req.body.commission = req.body.commission/booking.length
    }
    Booking.updateMany({booking_id:req.params.id},req.body,{multi:true}).then(booking=>{
      Booking.find({booking_id:req.params.id}).then(booking=>{
        const values = booking
        result = Object.values(combineSlots(booking))
          createReport({type:'booking',comments:values[0].comments ? values[0].comments:'',venue_id:values[0].venue_id,booking_id:values[0].booking_id,status:true,user:values[0].user_id,card:values[0].card?values[0].card:0,coins:((values[0].coins !== undefined ? values[0].coins : 0 ) *req.body.length),cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)

        res.send({status:"success", message:"booking modified", data:result})
        let booking_id = booking[0].booking_id
        let venue_name = booking[0].venue
        let venue_type = booking[0].venue_type
        let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
        let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
        let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
        //Activity Log
        let activity_log = {
          datetime: new Date(),
          id:req.userId,
          user_type: req.role?req.role:"user",
          activity: 'slot modified',
          name:req.name,
          booking_id:booking_id,
          venue_id:booking[0].venue_id,
          message: "Slot "+booking_id+" modified at "+venue_name+" "+datetime+" "+venue_type,
        }
        ActivityLog(activity_log)
      })
    })
  })
})

//Booking completed
router.post('/booking_completed/:id', verifyToken, (req, res, next) => {
  console.log('request',req.body)
  Booking.find({booking_id:req.params.id}).then(booking=>{
    if(req.body.commission){
      req.body.commission = req.body.commission/booking.length
    }
    Booking.updateMany({booking_id:req.params.id},req.body,{multi:true}).then(booking=>{
      Booking.find({booking_id:req.params.id}).then(booking=>{
        const values = booking
        Game.findOne({"bookings.booking_id":booking[0].booking_id}).then((g)=>{
        if(g){
          Game.findOneAndUpdate({"bookings.booking_id":booking[0].booking_id},{$set:{bookings:booking,completed:true,booking_status:"completed"}}).then((a)=>console.log(a))
        }
        result = Object.values(combineSlots(booking))
        res.send({status:"success", message:"booking completed", data:result})

        let booking_id = booking[0].booking_id
        let venue_name = booking[0].venue
        let venue_type = booking[0].venue_type
        let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
        let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
        let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
        //Activity Log
        let activity_log = {
          datetime: new Date(),
          id:req.userId,
          user_type: req.role?req.role:"user",
          activity: 'slot booking completed',
          name:req.name,
          venue_id:booking[0].venue_id,
          booking_id:booking_id,
          message: "Slot "+booking_id+" booking completed at "+venue_name+" "+datetime+" "+venue_type,
        }
        ActivityLog(activity_log)
      })
    })
  })

  })
})



//Booking completed
router.post('/booking_timeout/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_id:req.params.id}).then(booking=>{
    if(booking[0].booking_status === 'blocked'){
      Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"timeout"}}).then(booking=>{
        res.send({status:"success", message:"booking timedout"})
      })
    }
    else{
      res.send({status:"success", message:"no booking"})

    }
  })
})


router.post('/update_invoice/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id}).then(venue=>{
        Booking.updateMany({booking_id:{$in:req.body.booking_id}},{$set:{invoice:true,invoice_by:req.userId,invoice_date:new Date(),invoice_start_date:req.body.invoice_start_date,invoice_end_date:req.body.invoice_end_date,invoice_id:req.body.invoice_id}},{multi:true}).then(booking=>{
                Booking.find({booking_id:{$in:req.body.booking_id}}).lean().then(booking=>{
                  res.send({status:"success", message:"Invoice generated"})
            }).catch(next);
      })
  }).catch(next)
})

router.post('/checkUserName', (req, res, next) => {
  console.log('hit');
	User.find({"handle":req.body.user_name}).then(user=>{
    console.log(req.body.user_name.match(/^[ A-Za-z0-9_@./#&+-]*$/),req.body.user_name);
        if(user && user.length > 0){
          res.send({status:"success", message:"username exists",data:{error:true,error_description:`The username ${req.body.user_name} is not available.`}})
        }
        else if(!req.body.user_name.match(/^[ A-Za-z0-9_@.]*$/)){
          res.send({status:"success", message:"username exists",data:{error:true,error_description:`Invalid Username`}})
        }
        else if(req.body.user_name.match(/^[0-9_@.]*$/)){
          res.send({status:"success", message:"username exists",data:{error:true,error_description:`Invalid Username`}})
        }
        else if(!req.body.user_name.match(/^\S*$/)){
          res.send({status:"success", message:"username exists",data:{error:true,error_description:`Invalid Username`}})
        }
        else
        res.send({status:"success", message:"username doesnt exist",data:{error:false,error_description:''}})

  }).catch(next)
})

router.post('/checkMobile', (req, res, next) => {
	User.find({"phone":{ "$regex": req.body.mobile, "$options": "i" }}).then(user=>{
    console.log(user)    
    if(user && user.length > 0){
          res.send({status:"success", message:"phone exists",data:{error:true,error_description:`The phone number +91 ${req.body.mobile} is not available.`}})
        }else

        res.send({status:"success", message:"phone doesnt exist",data:{error:false,error_description:''}})

  }).catch(next)
})

router.post('/checkMobileForLogin', (req, res, next) => {
	User.find({"phone":{ "$regex": req.body.mobile, "$options": "i" }}).then(user=>{
        if(user && user.length > 0){
          res.send({status:"success", message:"phone  exist",data:{error:false,error_description:``}})
        }else
        res.send({status:"success", message:"phone doesnt exist",data:{error:true,error_description:`The phone number +91 ${req.body.mobile} is not registered.`}})

  }).catch(next)
})

router.post('/update_invoice_by_group_id/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id}).then(venue=>{
        Booking.updateMany({group_id:{$in:req.body.group_id}},{$set:{invoice:true,invoice_by:req.userId,invoice_date:new Date()}},{multi:true}).then(booking=>{
                Booking.find({group_id:{$in:req.body.group_id}}).lean().then(booking=>{
                  let result = combineRepeatSlots(booking)
                  res.send({status:"success", message:"invoice updated",data:result})
            }).catch(next);
      })
  }).catch(next)
})

router.post('/update_version', verifyToken, (req, res, next) => {
  Version.create({android_version:'26',ios_version:'18'}).then(version=>{
    res.send({status:"success", message:"Version created",data:version})
  }).catch(next)
})

router.post('/get_version', verifyToken, (req, res, next) => {
  Version.findOne({}).then(version=>{
    console.log(version)
    res.send({status:"success", message:"Version Log",data:version})
  }).catch(next)
})


router.post('/test_textlocal', verifyToken, (req, res, next) => {
  // let otp = "5555";
  // let event = 'Sample Event'
  // let date = '12th March 2020'
  // let team_name = 'Cycles FC'
  // let type = '5s'
  // let sport = 'Football'
  // let booking_id = 'TTE001123'
  // let amount = 'Rs.200'
  // let balance = 'Rs.1000'
  // let numbers = "919347603013"
  // let venue = "Whistle"
  // let user = "shankar"
  // let mes = 'You have received a new registration. Event : passs\nDate :12th January 2005\nTeam Name : Hipaass \nType: 5s \nSport: football \nRegisteration ID : TTE00123\nAmount Paid : 100\nBalance to be paid at event : 200\nDo get in touch with the team and communicate further details'
  // let message = "You have received a Turftown event booking \nEvent: "+event+" \nDate: "+date+" \nTeam Name: "+team_name+" \nType: "+type+"\nSport: "+sport+"\nRegisteration ID: "+booking_id+"\nAmount Paid: "+amount+"\nBalance to be paid at the event: "+balance
  // let m = 'This is a test message'
  // let time = "7pm-8pm"
  // let USER_CANCEL_WITHOUT_REFUND1 = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged as a cancellation fee.`//490447
  // let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged as a cancellation fee.`//490447
  // let USER_CANCEL_WITH_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAdvance of ${amount} will be refunded within 3-4 working days.`//490450
  // let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled by the user.\n ${user} \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged to the user as a cancellation fee.`//490533
  // let VENUE_CANCEL_WITH_REFUND = `Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled by the user.\n ${user} \nAdvance of ${amount} will be refunded to the user within 3-4 working days.`///490570
  // let SLOT_BOOKED_USER ='Hey Akshay! Thank you for using Turf Town!\nBooking Id : TT02222\nVenue : Cricket\nSport : Cricket\nDate and Time : Last Time\nvenue discount:0\nTTCoupon:100\nAmount Paid : 100\nBalance to be paid : 100'
  // let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${user} ( ${numbers} \nBooking Id: ${booking_id}\nVenue: ${venue}\nSport: ${sport}\nDate and Time: ${date}\nPrice: ${balance}\nAmount Paid: ${amount}\nVenue Discount: ${amount}\nTT Coupon: ${amount}\nAmount to be collected: ${amount}` //490618
  // let EVENT_BOOKED_USER = `Your Turf Town event booking for ${event} has been confirmed.\nDate : ${date}\nTeam Name : ${team_name}\nSport : ${sport}\nRegisteration ID : ${booking_id}\nTT Coupon : 10000\nAmount Paid : ${amount}\nBalance to be paid at event : ${balance}\nPlease contact ${numbers} for more details.`//491373
  // let EVENT_CANCELLED_FOR_USER =`TURF TOWN event booking ${booking_id} for ${event} scheduled at ${date} has been cancelled by ${user}\nStatus : cancelled comepltety` ///490737
  // let EVENT_CANCELLED_FOR_MANAGER = `Your Turf town booking for event ${booking_id} for ${venue}scheduled at ${date} has been cancelled.\nStatus : USERCANCELLED` ///490748
  // let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${venue} scheduled for ${date} at ${venue} has been cancelled by the venue .\nStatus : cancelled for purpose\nPlease contact the venue ${numbers} for more information.` //490759
  // // let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${date} at ${venue} has been cancelled. Please contact the venue for more info` ///418833
  // // let EVENT_BOOKED_MANAGER = `Event Name : Rookie League\nBalance to be paid at the event : 1000`
  // let EVENT_BOOKED_MANAGER = `You have received a new registration for the event.\n${event}\nDate : ${date}\nName : kumar\nTeam Name : ${team_name}\nSport : ${sport}(${type})\nRegisteration ID : ${booking_id}\nTT Coupon : ${amount}\nAmount Paid : ${balance}${""}\nBalance to be paid at the event : ${balance}`//491373
  // // let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${date} at ${venue},${" "+venue} has been cancelled. Please contact the venue for more info` ///418833
  // // let EVENT_BOOKED_USER = `Your Turf Town event booking for MADRAS MUNDITAL has been confirmed.\nDate : ${date}\nTeam Name : ${team_name}\nSport : ${sport}(${type})\nRegisteration ID : ${booking_id}\nAmount Paid : Rs.${amount}${""}\nTT Coupon : 0\nBalance to be paid at event : ${balance}\nPlease contact ${numbers} for more details.`//491330
  // //Send SMS
  // let sender = "TRFTWN"
  // SendMessage(numbers,sender,EVENT_BOOKED_MANAGER)
  User.find({phone:req.body.phone},{activity_log:0}).lean().then((u)=>{
    console.log(u[0]._id);
    notify(u[0],'total')
    res.send({status:"success", message:"Version Log",data:u[0]})
  }).catch(next)
  // axios.get(`https://api.textlocal.in/send/?apikey=${process.env.TEXT_LOCAL_API_KEY}&numbers=${numbers}&sender=${sender}&message=${SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER}`).then(response => {
  //   res.send(response.data)
  // }).catch(error=>{
  //   console.log(error)
  // })
})

function isEmpty (object){
  if(Object.keys(object).length>0){
    return true
  }else{
    return false
  }
}


function SlotsCheckReverse(body,id){
  return new Promise((resolve,reject)=>{
    Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
      let venue_id;
      if(venue.secondary_venue){
        venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
      }else{
        venue_id = [venue._id.toString()]
      }
      Booking.find({ venue:body.venue, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
      // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
        let slots_available = SlotsAvailable(venue,booking_history)
        if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
          resolve(body.booking_id)
        }else{
          console.log('slot time selected',body.slot_time);
          reject()
        }
      }).catch(error => console.log(error))
    }).catch(error => console.log(error))
  })
}

async function handleSlotAvailabilityWithCancellation(booking1,client){
  let booking = booking1[0]
  const slot_time = { $in: booking1.map((b)=>b.slot_time) }
  console.log('game');
  const x =  await  Booking.find({  venue_id:booking.venue_id, booking_date:booking.booking_date,slot_time:slot_time,booking_status:{$in:["blocked","booked","completed"]}}).lean().then(booking_history=>{
    let promisesToRun = [];
        for(let i=0;i<booking_history.length;i++){
              promisesToRun.push(SlotsCheckReverse(booking_history[i],booking.venue_id))
            }
           return Promise.all(promisesToRun).then((values) => {
             return Game.updateMany({"bookings.booking_id":{$nin:[booking.booking_id]},"booking_date":booking.booking_date,"bookings.booking_status":{$in:['blocked','hosted','cancelled']},"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time },{$set:{status:true,status_description:''}}).lean().then(game1=>{
               return Game.find({"bookings.booking_id":{$nin:[booking.booking_id]},"booking_date":booking.booking_date,"bookings.booking_status":{$in:['blocked','hosted','cancelled']},"bookings.venue_id":booking.venue_id,"bookings.slot_time":slot_time }).lean().populate('conversation').then(game=>{
                console.log('game',game);
                let messages =  game.map((nc)=>{ return {conversation:nc.conversation._id,message:`Hey ! Game ${nc.name} is available again . Please book your slot to confirm the game`,name:'bot',read_status:false,read_by:nc.conversation.members[0],author:nc.conversation.members[0],type:'bot',created_at:new Date()}}) 
                const members = _.flatten(game.map((g)=>g.conversation.members))
                return   User.find({_id: { $in :members } },{activity_log:0}).lean().then(user=> {
                return Message.insertMany(messages).then(message1=>{
                  const message_ids = message1.map((m)=>m._id)
                  return Message.find({_id:{$in:message_ids}}).populate('author', 'name _id').populate('user', 'name _id profile_picture phone handle name_status').populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).then(m => {
                  const cids = m.map((entry)=>{
                    const id = entry && entry.conversation && entry.conversation._id ? entry.conversation._id :entry.conversation
                    Conversation.findByIdAndUpdate({_id:id},{$set:{last_message:entry._id, last_updated:new Date()}}).then((m)=>console.log('pass'))
                    // client && client.to(id).emit('new',entry)
                  client && client.emit('unread',{})
                    return id
                  })
                    const device_token_list=user.map((e)=>e.device_token)
                                                  NotifyArray(device_token_list,'Hey ! Your previously hosted game is available again . Please book your slot ASAP to confirm the game','Turftown Game Availability')
                                                    return user.map((e)=>e._id)
                 }).catch((e)=>console.log(e));
              }).catch(error => console.log(error))
            }).catch(error => console.log(error))
          }).catch(error => console.log(error))
            }).catch(error => console.log(error))
          }).catch(error=>{
            console.log('hit error',error);
            return 'available'
            //res.send({status:"failed", message:"slots not available"})
          })
        }).catch(error => console.log(error))
}

router.post('/cancel_booking/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id}).then(booking=>{
    User.findById({_id:req.userId}).then(user=>{
      Venue.findById({_id:booking.venue_id}).then(venue=>{
      Admin.find({venue:{$in:[booking.venue_id]},notify:true},{activity_log:0}).then(admins=>{
        // const phone_numbers = admins.map((key)=>"91"+key.phone)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let venue_phone = "91"+venue.venue.contact
        let manger_numbers = [...phone_numbers,venue_phone]
        if(booking.booking_type === "app" && req.body.refund_status && booking.transaction_id !== 'free_slot'){
          axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
          .then(response => {
            console.log(response.data);
            if(response.data.entity === "refund") /// user  with refund 
            {
              Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true,game:false,description:'from_game_with_refund'}},{multi:true}).then(booking=>{
                Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
                  Coins.find({ booking_id: req.params.id }).lean().then(coins => {
                  if (coins) {
                      Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
                      }).catch(next);
                    }
                  if(booking[0].game){
                    Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted'}}).then(game=>{
                      Message.create({conversation:game.conversation,message:`Hey ! Slot has been cancelled and refund has been initiated.Amount will be credited in 2 - 4 working days.Please book your slot to confirm the game`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                      }).catch(next);
                      }).catch(next);
                      }).catch(next);
                        }else{
                          res.send({status:"success", message:"booking cancelled"})

                        }
                  
                        
                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let booking_amount = Math.round(booking[0].booking_amount)
                  let phone = "91"+booking[0].phone
                  let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  let time = moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let USER_CANCEL_WITH_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAdvance of Rs.${booking_amount} will be refunded within 3-4 working days.`//490450
                  let VENUE_CANCEL_WITH_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAdvance of Rs.${booking_amount} will be refunded to the user within 3-4 working days.`///490570
                  // let venue_manager_phone =phone_numbers.join(",")
                  let sender = "TRFTWN"
                  //Send SMS
                  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                  //   console.log(response.data)
                  // }).catch(error=>{
                  //   console.log(error.response)
                  // })
                  ////user cancel with refund
                  // SendMessage(phone,sender,USER_CANCEL_WITH_REFUND)
                  // ///venuemanager cancel with refund
                  // SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITH_REFUND)
                  // let obj = {
                  //   name:user.name,
                  //   venue_manager_name:venue.venue.name,
                  //   date:date,
                  //   phone:venue.venue.contact,
                  //   time:time,
                  //   booking_id:booking_id,
                  //   venue_type:venue_type,
                  //   venue_name:venue_name,
                  //   venue_location:venue_area,
                  //   booking_status:`Advance of Rs ${booking_amount} will be refunded within 3 - 4 working days.`
                  // }

                  // ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                  //   let to_emails = `${user.email}, rajasekar@turftown.in`
                  //   mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //       res.send({status:"success"})
                  //     }else{
                  //       res.send({status:"failed"})
                  //     }
                  //   })
                  // }).catch(next)
                  // let manager_mail = ''
                  //  admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                  // console.log(manager_mail);
                  //  ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                  //   //let to_emails = `${req.body.email}, rajasekar@turftown.in`
                  //   mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //       res.send({status:"success"})
                  //     }else{
                  //       res.send({status:"failed"})
                  //     }
                  //   })
                  // }).catch(next)



    
                  //Activity Log
                  let activity_log = {
                    datetime: new Date(),
                    id:req.userId,
                    user_type: req.role?req.role:"user",
                    activity: 'slot booking cancelled',
                    name:req.name,
                    venue_id:booking[0].venue_id,
                    booking_id:booking_id,
                    message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  }
                  ActivityLog(activity_log)
               
            }).catch(next);
          }).catch(next);
        }).catch(next)

            }
          }).catch(error => {
            console.log(error.response.data)
          }).catch(next);
        }else{
          Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true,game:false,}},{multi:true}).then(booking=>{ ////user cancellation without refund
            Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
              if(booking[0].game){
                Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted'}}).then(game=>{
                  Message.create({conversation:game.conversation,message:`Hey ! slot has been cancelled .No refund for this slot. Please book your slot to confirm the game`,name:'bot',read_status:false,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                    Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                      getGame(res,game.conversation,true,next,req)
                      handleSlotAvailabilityWithCancellation(booking,req.socket)
                        }).catch(next);
                      }).catch(next);
                  }).catch(next);
                  }else{
                    res.send({status:"success", message:"booking cancelled"})
                    
                  }
                 

                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let phone = "91"+booking[0].phone
                  let booking_amount = Math.round(booking[0].booking_amount) 
                  let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  // let datetime = date + " " + moment(start_time).subtract(330,"minutes").format("LT") + "-" + moment(end_time).subtract(330,"minutes").format("LT")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let time =  moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let sender = "TRFTWN"
                  //Send SMS
                  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                  //   console.log(response.data)
                  // }).catch(error=>{
                  //   console.log(error.response)
                  // })
                  // let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged as a cancellation fee.`//490447
                  // let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged to the user as a cancellation fee.`//490533
                  let venue_manager_phone = "91"+venue.venue.contact
                  let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged as a cancellation fee.`//490447
                  let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged to the user as a cancellation fee.`//490533
                  ////user cancel with refund
                  // SendMessage(phone,sender,USER_CANCEL_WITHOUT_REFUND)
                  // ///venuemanager cancel with refund
                  // SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITHOUT_REFUND)
                  // let obj = {
                  //   name:user.name,
                  //   venue_manager_name:venue.venue.name,
                  //   date:date,
                  //   phone:venue.venue.contact,
                  //   time:time,
                  //   user_phone:user.phone,
                  //   booking_id:booking_id,
                  //   venue_type:venue_type,
                  //   venue_name:venue_name,
                  //   venue_location:venue_area,
                  //     booking_status:`Advance of Rs ${booking_amount} has been charged as a cancellation fee to the user`
                  //   }
                  //   ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                  //    let to_emails = `${user.email}, rajasekar@turftown.in`
                  //       mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //       if(response){
                  //         res.send({status:"success"})
                  //       }else{
                  //         res.send({status:"failed"})
                  //       }
                  //     })
                  //   }).catch(next)
                  //   let manager_mail = ''
                  //   admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                  //   ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                  //    mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //        res.send({status:"success"})
                  //      }else{
                  //        res.send({status:"failed"})
                  //      }
                  //    })
                  //  }).catch(next)
    
                  // //Activity Log
                  // let activity_log = {
                  //   datetime: new Date(),
                  //   id:req.userId,
                  //   user_type: req.role?req.role:"user",
                  //   activity: 'slot booking cancelled',
                  //   name:req.name,
                  //   venue_id:booking[0].venue_id,
                  //   booking_id:booking_id,
                  //   message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  // }
                  // ActivityLog(activity_log)
            }).catch(next);
          }).catch(next);
       


        }
      })
      
    
  }).catch(next)
  }).catch(next)
}).catch(next)
})


router.post('/cancel_game_booking/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id}).then(booking=>{
    User.findById({_id:req.userId}).then(user=>{
      Venue.findById({_id:booking.venue_id}).then(venue=>{
      Admin.find({venue:{$in:[booking.venue_id]},notify:true},{activity_log:0}).then(admins=>{
        // const phone_numbers = admins.map((key)=>"91"+key.phone)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let venue_phone = "91"+venue.venue.contact
        let manger_numbers = [...phone_numbers,venue_phone]
        if(booking.booking_type === "app" && req.body.refund_status && booking.transaction_id !== 'free_slot'){
          axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
          .then(response => {
            console.log(response.data);
            if(response.data.entity === "refund") /// user  with refund 
            {
              Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true,game:false,description:'from_game_with_refund'}},{multi:true}).then(booking=>{
                Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{

                  Coins.find({ booking_id: req.params.id }).lean().then(coins => {
                     if (coins) {
                      Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
                      }).catch(next);
                    }

                    Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted'}}).then(game=>{
                      Message.create({conversation:game.conversation,message:`Hey ! Slot has been cancelled and refund has been initiated.Amount will be credited in 2 - 4 working days.Please book your slot to confirm the game`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                      }).catch(next);
                      }).catch(next);
                      }).catch(next);
                  
                        
                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let booking_amount = Math.round(booking[0].booking_amount)
                  let phone = "91"+booking[0].phone
                  let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  let time = moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let USER_CANCEL_WITH_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAdvance of Rs.${booking_amount} will be refunded within 3-4 working days.`//490450
                  let VENUE_CANCEL_WITH_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAdvance of Rs.${booking_amount} will be refunded to the user within 3-4 working days.`///490570
                  // let venue_manager_phone =phone_numbers.join(",")
                  let sender = "TRFTWN"
                  //Send SMS
                  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                  //   console.log(response.data)
                  // }).catch(error=>{
                  //   console.log(error.response)
                  // })
                  ////user cancel with refund
                  // SendMessage(phone,sender,USER_CANCEL_WITH_REFUND)
                  // ///venuemanager cancel with refund
                  // SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITH_REFUND)
                  // let obj = {
                  //   name:user.name,
                  //   venue_manager_name:venue.venue.name,
                  //   date:date,
                  //   phone:venue.venue.contact,
                  //   time:time,
                  //   booking_id:booking_id,
                  //   venue_type:venue_type,
                  //   venue_name:venue_name,
                  //   venue_location:venue_area,
                  //   booking_status:`Advance of Rs ${booking_amount} will be refunded within 3 - 4 working days.`
                  // }

                  // ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                  //   let to_emails = `${user.email}, rajasekar@turftown.in`
                  //   mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //       res.send({status:"success"})
                  //     }else{
                  //       res.send({status:"failed"})
                  //     }
                  //   })
                  // }).catch(next)
                  // let manager_mail = ''
                  //  admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                  // console.log(manager_mail);
                  //  ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                  //   //let to_emails = `${req.body.email}, rajasekar@turftown.in`
                  //   mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //       res.send({status:"success"})
                  //     }else{
                  //       res.send({status:"failed"})
                  //     }
                  //   })
                  // }).catch(next)



    
                  //Activity Log
                  let activity_log = {
                    datetime: new Date(),
                    id:req.userId,
                    user_type: req.role?req.role:"user",
                    activity: 'slot booking cancelled',
                    name:req.name,
                    venue_id:booking[0].venue_id,
                    booking_id:booking_id,
                    message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  }
                  ActivityLog(activity_log)
               
            }).catch(next);
          }).catch(next);
        }).catch(next);

            }
          }).catch(error => {
            console.log(error.response.data)
          }).catch(next);
        }else{
          Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true,game:false,}},{multi:true}).then(booking=>{ ////user cancellation without refund
            Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
                Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted'}}).then(game=>{
                  Message.create({conversation:game.conversation,message:`Hey ! slot has been cancelled .No refund for this slot. Please book your slot to confirm the game`,name:'bot',read_status:false,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                    Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                      getGame(res,game.conversation,true,next,req)
                      handleSlotAvailabilityWithCancellation(booking,req.socket)
                        }).catch(next);
                      }).catch(next);
                  }).catch(next);
                 

                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let phone = "91"+booking[0].phone
                  let booking_amount = Math.round(booking[0].booking_amount) 
                  let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  // let datetime = date + " " + moment(start_time).subtract(330,"minutes").format("LT") + "-" + moment(end_time).subtract(330,"minutes").format("LT")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let time =  moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let sender = "TRFTWN"
                  //Send SMS
                  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                  //   console.log(response.data)
                  // }).catch(error=>{
                  //   console.log(error.response)
                  // })
                  // let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged as a cancellation fee.`//490447
                  // let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged to the user as a cancellation fee.`//490533
                  let venue_manager_phone = "91"+venue.venue.contact
                  let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged as a cancellation fee.`//490447
                  let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged to the user as a cancellation fee.`//490533
                  ////user cancel with refund
                  // SendMessage(phone,sender,USER_CANCEL_WITHOUT_REFUND)
                  // ///venuemanager cancel with refund
                  // SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITHOUT_REFUND)
                  // let obj = {
                  //   name:user.name,
                  //   venue_manager_name:venue.venue.name,
                  //   date:date,
                  //   phone:venue.venue.contact,
                  //   time:time,
                  //   user_phone:user.phone,
                  //   booking_id:booking_id,
                  //   venue_type:venue_type,
                  //   venue_name:venue_name,
                  //   venue_location:venue_area,
                  //     booking_status:`Advance of Rs ${booking_amount} has been charged as a cancellation fee to the user`
                  //   }
                  //   ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                  //    let to_emails = `${user.email}, rajasekar@turftown.in`
                  //       mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //       if(response){
                  //         res.send({status:"success"})
                  //       }else{
                  //         res.send({status:"failed"})
                  //       }
                  //     })
                  //   }).catch(next)
                  //   let manager_mail = ''
                  //   admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                  //   ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                  //    mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                  //     if(response){
                  //        res.send({status:"success"})
                  //      }else{
                  //        res.send({status:"failed"})
                  //      }
                  //    })
                  //  }).catch(next)
    
                  // //Activity Log
                  // let activity_log = {
                  //   datetime: new Date(),
                  //   id:req.userId,
                  //   user_type: req.role?req.role:"user",
                  //   activity: 'slot booking cancelled',
                  //   name:req.name,
                  //   venue_id:booking[0].venue_id,
                  //   booking_id:booking_id,
                  //   message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  // }
                  // ActivityLog(activity_log)
            }).catch(next);
          }).catch(next);
       


        }
      })
      
    
  }).catch(next)
  }).catch(next)
}).catch(next)
})




router.post('/group_by_event', verifyToken, (req, res, next) => {
  Event.find({},{format:0,bank:0,created_by:0,modified_by:0,venue:0}).then(event=>{  
  EventBooking.find({}).populate('event_id','event').then(booking=>{   
    let x = {}
    for(let i = 0 ; i < booking.length; i++){
      for(let j = 0 ; j < event.length; j++){
          if(event[j]._id === booking[i].event_id)
              if(x[event[j]._id]){
                x[event[j]._id].push(booking[i])
              }else{
                x[event[j]._id] = []
                x[event[j]._id].push(booking[i])
              }
      }
    }
    res.send({status:"success", message:"booking group by event fetched", data:x})
    }).catch(next)
      }).catch(next)
})
 
//when user clicks follow 

function updateConvoStatus(conversation,body){
  Conversation.findByIdAndUpdate({_id:conversation._id},body).then(ec=>{
  console.log('updateConvoStatus');
  }).catch((e)=>console.log(e))
}

router.post('/send_friend_request/:friend', verifyToken, (req, res, next) => {
  User.findById({_id:req.params.friend},{activity_log:0}).lean().then(friend=>{
    User.findById({_id:req.body.id},{activity_log:0}).lean().then(user=>{    
      let obj = user._id
    if(friend.visibility === 'public'){
      let filter = friend && friend.followers.length > 0 && friend.followers.some(u => u.id === req.body.id)
      if(filter){
        res.send({status:'failiure', message:"following"})
      }else{
        console.log('hit friend request')
        User.findByIdAndUpdate({_id:req.params.friend},{$addToSet: { followers: { $each: [obj] } } }).then(friend=>{  
          User.findByIdAndUpdate({_id:req.body.id},{$addToSet: { following: { $each: [friend._id] } } }).then(user=>{  
            User.findById({_id:req.body.id},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{ 
               sendAlert({created_at:new Date(),created_by:user._id,user:friend._id,type:'following',status_description:`${user.handle} is following you`},'create',next)
                Conversation.find({$or:[{members:[req.params.friend,req.body.id],type:'single'},{members:[req.body.id,req.params.friend],type:'single'}]}).limit(1).lean().then(ec=>{
                  ec.length > 0 && updateConvoStatus(ec[0],{invite_status : false})
               res.send({status:"success", message:"following "+friend.handle, data:user})
            }).catch(next)
          }).catch(next)
        }).catch(next)
      }).catch(next)
      }
    }
    else {
      console.log('hit friend request')

      User.findByIdAndUpdate({_id:req.params.friend},{$addToSet: { requests: { $each: [obj] } } }).then(user=>{  
        User.findByIdAndUpdate({_id:req.body.id},{$addToSet: { sent_requests: { $each: [friend._id] } } }).then(user=>{  
          User.findById({_id:req.body.id},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{ 
            console.log('user hit and asldkjasldkjalskdjalsdkjalsdkjalsdkj',user.handle)
            sendAlert({created_at:new Date(),created_by:req.body.id,user:req.params.friend,type:'follow',status_description:`${user.handle} has sent a follow request`},'create',next)
            res.send({status:"success", message:"Request sent to "+friend.handle, data:user})
          }).catch(next)
      }).catch(next)
    }).catch(next)
    }
  }).catch(next)
  }).catch(next)
})




router.post('/followers/:id', verifyToken, (req, res, next) => {
  User.findById({_id:req.params.id},{activity_log:0}).lean().populate('following','name phone profile_picture handle name_status').then(user=>{
    const folloers = user.following.map((a)=>{
      a['select'] = false
      return a
  })
    res.send({status:"success", message:"followers fetched", data:folloers})
  }).catch(next)
})


router.post('/unfollow_request/:friend', verifyToken, (req, res, next) => {
  User.findById({_id:req.params.friend},{activity_log:0}).lean().then(friend=>{
    User.findById({_id:req.body.id},{activity_log:0}).lean().then(user=>{    

      const following = user.following.filter((u)=>u.toString() !== friend._id.toString())
      const friend_followers = friend.followers.filter((u)=>u.toString() !== user._id.toString())
      User.findByIdAndUpdate({_id:req.params.friend},{$set: { followers: friend_followers } }).then(user=>{  
        User.findByIdAndUpdate({_id:req.body.id},{$set: { following: following } }).then(user=>{  
            User.findById({_id:req.body.id},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{
              Conversation.find({$or:[{members:[req.params.friend,req.userId],type:'single'},{members:[req.userId,req.params.id],type:'single'}]}).limit(1).lean().then(ec=>{
                ec.length > 0 && updateConvoStatus(ec[0],{invite_status : true})
              console.log(user.following)
              Conversation.find({$or:[{members:[req.body.id,req.params.friend],type:'single'},{members:[req.params.friend,req.body.id],type:'single'}]}).limit(1).lean().then(ec=>{
                ec.length > 0 && updateConvoStatus(ec[0],{invite_status : true})  
                sendAlert({created_at:new Date(),created_by:req.body.id,user:req.params.friend,type:'following',status_description:`${friend.handle} is following you`},'delete',next)
                sendAlert({created_at:new Date(),created_by:req.params.friend,user:req.body.id,type:'accepted',status_description:`${friend.handle} has accepted request`},'delete',next)
              res.send({status:"success", message:"Unfollowed "+friend.handle, data:user})
  }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
})
})

router.post('/remove_request/:friend', verifyToken, (req, res, next) => {
  User.findById({_id:req.params.friend},{activity_log:0}).lean().then(friend=>{
    User.findById({_id:req.body.id},{activity_log:0}).lean().then(user=>{    
      //In user followers filter friend id
      const followers = user.followers.filter((u)=>u.toString() !== friend._id.toString())
      // In friend following list remove user id 
      const friend_following = friend.following.filter((u)=>u.toString() !== user._id.toString())
      User.findByIdAndUpdate({_id:req.params.friend},{$set: { following: friend_following } }).then(user=>{  
        User.findByIdAndUpdate({_id:req.body.id},{$set: { followers: followers } }).then(user=>{  
            User.findById({_id:req.body.id},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{ 
              Conversation.find({$or:[{members:[req.body.id,req.params.friend],type:'single'},{members:[req.params.friend,req.body.id],type:'single'}]}).limit(1).lean().then(ec=>{
                ec.length > 0 && updateConvoStatus(ec[0],{invite_status : true})  
                // sendAlert({created_at:new Date(),created_by:req.params.friend,user:req.body.id,type:'following',status_description:`${friend.handle} is following you`},'delete',next)
                sendAlert({created_at:new Date(),created_by:req.params.friend,user:req.body.id,type:'following',status_description:`${friend.handle} is following you`},'delete',next)
                sendAlert({created_at:new Date(),created_by:req.body.id,user:req.params.friend,type:'accepted',status_description:`${friend.handle} has accepted request`},'delete',next) 
                res.send({status:"success", message:"Removed "+friend.handle, data:user})
  }).catch(next)
  }).catch(next)
}).catch(next)

  }).catch(next)
  }).catch(next)
  }).catch(next)
})

router.post('/remove_request_pending/:friend', verifyToken, (req, res, next) => {
  User.findById({_id:req.params.friend},{activity_log:0}).lean().then(friend=>{
    User.findById({_id:req.body.id},{activity_log:0}).lean().then(user=>{    
      //In user followers filter friend id
      const sent_requests = user.sent_requests.filter((u)=>u.toString() !== friend._id.toString())
      // In friend following list remove user id 
      const requests = friend.requests.filter((u)=>u.toString() !== user._id.toString())
      User.findByIdAndUpdate({_id:req.params.friend},{$set: { requests: requests } }).then(user=>{  
        User.findByIdAndUpdate({_id:req.body.id},{$set: { sent_requests: sent_requests } }).then(user=>{  
            User.findById({_id:req.body.id},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{
              sendAlert({created_at:new Date(),created_by:req.body.id,user:req.params.friend,type:'follow',status_description:`${user.handle} has sent a follow request`},'delete',next) 
              res.send({status:"success", message:"Removed "+friend.handle, data:user})
  }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
})

router.post('/get_requests', verifyToken, (req, res, next) => {
  User.findById({ _id: req.userId }, { activity_log: 0 }).lean().then(user => {
    let requests = user.requests
    User.find({ _id: { $in: requests }, status: true }, { activity_log: 0 }).lean().then(user1 => {
      res.send({ status: "success", message: "user requests fetched", data: user1 })
    }).catch(next)
  }).catch(next)
})

router.post('/accept_or_delete_requests', verifyToken, (req, res, next) => {
  User.findById({ _id: req.body.id }, { activity_log: 0 }).lean().then(friend => {
    User.findById({ _id: req.userId }, { activity_log: 0 }).lean().then(user => {
      let type = req.body.type

      const sent_requests = friend.sent_requests.filter((u) => u.toString() !== req.userId.toString())
      const requests = user.requests.filter((u) => u.toString() !== req.body.id.toString())
      let friend1 = type == "accept" ? { $addToSet: { following: { $each: [req.userId] } } ,$set:{sent_requests:sent_requests} } : {$set:{sent_requests:sent_requests} }
      let user_guy = type == "accept" ?  { $addToSet: { followers: { $each: [req.body.id] } } ,$set:{requests:requests} } : {$set:{requests:requests} }
      User.findByIdAndUpdate({ _id: req.body.id },friend1).then(user => {
        User.findByIdAndUpdate({ _id: req.userId },user_guy).then(asd => {
          User.findById({_id:req.userId},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{ 
              let requested_user = user.requests
              User.find({ _id: { $in: requested_user }, status: true }, { activity_log: 0 }).lean().then(user1 => {
                if(type == "accept"){
                  Conversation.find({$or:[{members:[req.body.id,req.userId],type:'single'},{members:[req.userId,req.body.id],type:'single'}]}).limit(1).lean().then(ec=>{
                    ec.length > 0 && updateConvoStatus(ec[0],{invite_status : false})
                    Alert.findOne({user:req.userId,created_by:req.body.id}).populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).populate({ path: 'post', populate: { path: 'event' , populate :{path:'venue',select:'venue'} } }).populate({ path: 'post', populate: { path: 'game' , populate :{path:'venue',select:'venue'} } }).populate('created_by','name _id handle profile_picture').then(a=>{
                    let alert = {...a,type:'following',status_description:`${friend.handle} is following you`}
                sendAlert({created_at:new Date(),created_by:req.body.id,user:req.userId,sent_type:"follow",type:'following',status_description:`${friend.handle} is following you`},'addorupdate',next) 
                sendAlert({created_at:new Date(),created_by:req.userId,user:req.body.id,type:'accepted',status_description:`${asd.handle} has accepted your request`},'create',next)
                res.send({ status: "success", message: "user requests updated", data: {"user":user,"requests_user":user1,alert:alert}})

               }).catch(next)
              }).catch(next)
              }
              else {
                // sendAlert({created_at:new Date(),created_by:req.body.id,user:req.userId,type:'follow',status_description:`${friend.handle} is following you`},'delete',next) 
                Alert.findOneAndDelete({user:req.userId,created_by:req.body.id,type:"follow"}).then((s)=>{
                  Alert.find({user: req.userId,created_by:{$nin:[req.userId]}}).lean().populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).populate({ path: 'post', populate: { path: 'event' , populate :{path:'venue',select:'venue'} } }).populate({ path: 'post', populate: { path: 'game' , populate :{path:'venue',select:'venue'} } }).populate('created_by','name _id handle profile_picture').then(alert=> {
                    let y = alert.filter((key)=>{
                      if(key.type == "shoutout" && key.post.type == "game"){
                        return (key.post.game !== null && key.created_by !== null ) 
                      }
                      else if(key.type == "shoutout" && key.post.type == "event"){
                        return (key.post.event !== null && key.created_by !== null) 
                      }
                      else {
                        return key.created_by !== null
                      }
                    } )
                res.send({ status: "success", message: "user requests updated", data: {"user":user,"requests_user":user1,alert:alert}})
              }).catch(next) 
            }).catch(next) 
            }
          }).catch(next)
        }).catch(next)

        }).catch(next)
      }).catch(next)
    }).catch(next)
  }).catch(next)
})


router.post('/accept_or_delete_requests_alert', verifyToken, (req, res, next) => {
  User.findById({ _id: req.body.id }, { activity_log: 0 }).lean().then(friend => {
    User.findById({ _id: req.userId }, { activity_log: 0 }).lean().then(user => {
      let type = req.body.type

      const sent_requests = friend.sent_requests.filter((u) => u.toString() !== req.userId.toString())
      const requests = user.requests.filter((u) => u.toString() !== req.body.id.toString())
      let friend1 = type == "accept" ? { $addToSet: { following: { $each: [req.userId] } } ,$set:{sent_requests:sent_requests} } : {$set:{sent_requests:sent_requests} }
      let user_guy = type == "accept" ?  { $addToSet: { followers: { $each: [req.body.id] } } ,$set:{requests:requests} } : {$set:{requests:requests} }
      User.findByIdAndUpdate({ _id: req.body.id },friend1).then(user => {
        User.findByIdAndUpdate({ _id: req.userId },user_guy).then(asd => {
          User.findById({_id:req.userId},{activity_log:0}).populate('requests','name profile_picture handle name_status').then(user=>{ 
              let requested_user = user.requests
              User.find({ _id: { $in: requested_user }, status: true }, { activity_log: 0 }).lean().then(user1 => {
                Alert.findOne({_id:req.body.item}).populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } }).populate({ path: 'post', populate: { path: 'event' , populate :{path:'venue',select:'venue'} } }).populate({ path: 'post', populate: { path: 'game' , populate :{path:'venue',select:'venue'} } }).populate('created_by','name _id handle profile_picture').then(a=>{
                if(type == "accept"){
                  Conversation.find({$or:[{members:[req.body.id,req.userId],type:'single'},{members:[req.userId,req.body.id],type:'single'}]}).limit(1).lean().then(ec=>{
                    ec.length > 0 && updateConvoStatus(ec[0],{invite_status : false})
                      a["type"] = "following"
                      a["status_description"] = `${friend.handle} is following you`
                sendAlert({created_by:req.body.id,user:req.userId,sent_type:"follow",type:'following',status_description:`${friend.handle} is following you`},'addorupdate',next) 
                sendAlert({created_at:new Date(),created_by:req.userId,user:req.body.id,type:'accepted',status_description:`${asd.handle} has accepted your request`},'create',next) 
                res.send({ status: "success", message: "user requests updated", data: {"user":user,"requests_user":user1,alert:a}})

              }).catch(next)
              }
              else {
                sendAlert({created_at:new Date(),created_by:req.body.id,user:req.userId,type:'follow',status_description:`${friend.handle} is following you`},'delete',next) 
                res.send({ status: "success", message: "user requests updated", data: {"user":user,"requests_user":user1,alert:a}})
              }
            }).catch(next)
          }).catch(next)
        }).catch(next)

        }).catch(next)
      }).catch(next)
    }).catch(next)
  }).catch(next)
})

router.post('/get_followers_and_following', verifyToken, (req, res, next) => {
  User.findById({_id:req.userId},{activity_log:0}).lean().populate('following','name phone profile_picture handle name_status visibilility').populate('followers','name phone profile_picture handle name_status visibilility').then(user=>{
    const following = user.following.map((a)=>{
      a['select'] = false
      return a
  })
  const followers = user.followers.map((a)=>{
    a['select'] = false
    return a
})
    res.send({status:"success", message:"followers fetched", data:{followers,following}})
  }).catch(next)
})

router.post('/get_followers_and_following_for_user', verifyToken, (req, res, next) => {
  User.findById({_id:req.body.id},{activity_log:0}).lean().populate('following','name phone profile_picture handle name_status visibilility').populate('followers','name phone profile_picture handle name_status visibilility').then(user=>{
    const following = user.following.map((a)=>{
      a['select'] = false
      return a
  })
  const followers = user.followers.map((a)=>{
    a['select'] = false
    return a
})
    res.send({status:"success", message:"followers fetched", data:{followers,following}})
  }).catch(next)
})


router.post('/convos_and_followers/:id', verifyToken, (req, res, next) => {
  Conversation.find({ $and: [ { members: { $in: [req.params.id] } },{$or:[{type:'group'},{type:'game'}]}] }).lean().populate('to',' name _id profile_picture last_active online_status status name_status handle').populate('members','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(existingConversation=>{
      User.findById({_id:req.params.id},{activity_log:0}).lean().populate('following','name phone profile_picture handle name_status _id').then(user=>{
           const folloers = user.following.map((f)=>{
            f['select'] = false
            return f
           })

           const convo = existingConversation.map((f)=>{
            f['select'] = false
            return f
           })
           const games = convo.filter((f)=>{
             return f.type == "game"
           })
           const groups = convo.filter((f)=>{
            return f.type == "group"
          })
           
           const data = [
            {
              title:'clubs',
              data:groups
            }, 
            {
             title:'followers',
             data:folloers
           },
           {
             title:"game",
             data:games
          }
          ]
          console.log("Data",data)
      res.send({status:"success", message:"followers fetched", data:data})
  }).catch(next)
}).catch(next)

})

router.post('/booking_history_from_app_event_bookings', verifyToken, (req, res, next) => {
  EventBooking.find({booking_status:{$in:["booked","completed","cancelled"]}, created_at:{$gte:req.body.fromdate, $lte:req.body.todate},booking_type:"app"}).lean().populate('event_id').then(booking=>{    
    // console.log("veeee",result)
    result = [...booking]
    res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
})

router.post('/cancel_manager_booking/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id}).then(booking=>{
    Venue.findById({_id:booking.venue_id}).then(venue=>{  
      Admin.findById({_id:req.userId}).then(admin=>{
      let role = req.role === "venue_staff" || req.role === "venue_manager"
      let date = new Date().addHours(8,30)
      let refund = req.body.refund_status
        if(booking.booking_type === "app" && (refund)){
          axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
          .then(response => {
            if(response.data.entity === "refund")
            {
              Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true, refund_status:true,cancelled_by:req.body.cancelled_by}},{multi:true}).then(booking=>{
                Booking.find({booking_id:req.params.id}).lean().populate("venue_data").then(booking=>{
                  User.findById({_id:booking[0].user_id},{activity_log:0}).then(user=>{
                  res.send({status:"success", message:"booking cancelled"})
                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let phone = "91"+booking[0].phone
                  let date = moment(booking[0].booking_date).format("MMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  let time = moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let manager_phone = "91"+venue.venue.contact
                  let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${booking_id} scheduled for ${datetime} at ${venue_name},${" "+venue_area}(${venue_type}) has been cancelled by the venue .\nStatus : Advance of Rs.${booking[0].booking_amount} will be refunded within 3-4 working days.\nPlease contact the venue ${venue.venue.contact} for more information.` //491317
                  let sender = "TRFTWN"
                  if(booking[0].game){
                    Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted',status_description:'cancelled by venue manager'}}).then(game=>{
                      Post.deleteMany({game:game._id}).then((a)=>{
                      Message.create({conversation:game.conversation,message:`Hey ! Slot has been cancelled and refund has been initiated.Amount will be credited in 2 - 4 working days.Please book a new slot to confirm the game`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            //getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                             Coins.find({ booking_id: req.params.id }).lean().then(coins => {
                              if (coins) {
                                  Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
                                  }).catch(next);
                                }
                      }).catch(next);
                      }).catch(next);
                    }).catch(next);
                      }).catch(next);
                    }).catch(next);
                        }
                  SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                  //Send Mail
                  let obj = {
                    name:user.name,
                    venue_manager_name:venue.venue.name,
                    date:date,
                    phone:venue.venue.contact,
                    time:time,
                    booking_id:booking_id,
                    venue_type:venue_type,
                    venue_name:venue_name,
                    venue_location:venue_area,
                    booking_status:`Advance of Rs ${booking[0].booking_amount} will be refunded within 3 - 4 working days.`
                  }
                  let to_emails = `${user.email}, rajasekar@turftown.in`
                  ejs.renderFile('views/event_manager/venue_cancel_by_manager.ejs',obj).then(html=>{
                    mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        //res.send({status:"success"})
                      }else{
                        //res.send({status:"failed"})
                      }
                    })
                  }).catch(next)
    
                  //Activity Log
                  let activity_log = {
                    datetime: new Date(),
                    id:req.userId,
                    user_type: req.role?req.role:"user",
                    activity: 'slot booking cancelled',
                    name:req.name,
                    venue_id:booking[0].venue_id,
                    booking_id:booking_id,
                    message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  }
                  ActivityLog(activity_log)
                }).catch(next);
              }).catch(next);
            }).catch(next)
            }
          }).catch(error => {
            console.log(error)
          }).catch(next);
        }else{
          Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refund_status:false,cancelled_by:req.body.cancelled_by}},{multi:true}).then(booking=>{
            Booking.find({booking_id:req.params.id}).lean().populate("venue_data").then(booking=>{
                  User.findById({_id:booking[0].user_id},{"activity_log":0}).then(user=>{
                  res.send({status:"success", message:"booking cancelled"})
                  let booking_id = booking[0].booking_id
                  let venue_name = booking[0].venue
                  let venue_type = SetKeyForSport(booking[0].venue_type)
                  let venue_area = booking[0].venue_data.venue.area
                  let phone = "91"+booking[0].phone
                  let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  // let datetime = date+" "+moment(start_time).subtract(330,"minutes").format("LT")+"-"+moment(end_time).subtract(330,"minutes").format("LT")
                  let time = moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let datetime = date + " " + moment(start_time).utc().format("hh:mma") + "-" + moment(end_time).utc().format("hh:mma")
                  let manager_phone = "91"+venue.venue.contact
                  let booking_amount = booking[0].booking_amount
                  let sport_name_new =SetKeyForSport(booking[0].sport_name)  
                  //Send SMS
                  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&manager_phone='+manager_phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                  //   console.log(response.data)
                  // }).catch(error=>{
                  //   console.log(error.response)
                  // })
                  if(booking[0].game){
                    Game.findOneAndUpdate({'bookings.booking_id':req.params.id},{$set:{bookings:booking,booking_status:'hosted',status_description:'cancelled by venue manager'}}).then(game=>{
                      Post.deleteMany({game:game._id}).then((a)=>{
                        Message.create({conversation:game.conversation,message:`Hey ! Slot has been cancelled No Refund initiated.Please host a new game.`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            //getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                      }).catch(next);
                      }).catch(next);
                    }).catch(next);
                      }).catch(next);
                        }

                  if(booking[0].booking_type === "app"){
                  let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${booking_id} scheduled for ${datetime} at ${venue_name},${" "+venue_area} has been cancelled by the venue .\nStatus : Advance paid of Rs.${booking_amount} will be charged as a cancellation fee.\nPlease contact the venue ${venue.venue.contact} for more information.` //490759
                  let sender = "TRFTWN"
                  SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                  }
                  else if(booking[0].booking_type === "web") {
                    let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${datetime} at ${venue_name},${" "+venue_area}(Sport:${sport_name_new}) has been cancelled. Please contact the venue for more info` ///491375
                    let sender = "TRFTWN"
                    SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER)
                  }
                  console.log(user.name)
                  console.log(venue.venue.name)
                  console.log(date)
                  console.log(venue.venue.contact)
                  console.log(time)
                  console.log(booking_id)
                  console.log(venue_type)
                  console.log(venue_name)
                  console.log(venue_area)
                  console.log(booking[0].booking_amount)

                  let obj = {
                    name:user.name,
                    venue_manager_name:venue.venue.name,
                    date:date,
                    phone:venue.venue.contact,
                    time:time,
                    booking_id:booking_id,
                    venue_type:venue_type,
                    venue_name:venue_name,
                    venue_location:venue_area,
                    booking_status:`Advance of Rs ${booking[0].booking_amount} will be charged as a cancellation fee`
                  }
                  let to_emails = `${user.email}, rajasekar@turftown.in`
                  ejs.renderFile('views/event_manager/venue_cancel_by_manager.ejs',obj).then(html=>{
                    mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        //res.send({status:"success"})
                      }else{
                        //res.send({status:"failed"})
                      }
                    })
                  }).catch(next)

    
                  //Activity Log
                  let activity_log = {
                    datetime: new Date(),
                    id:req.userId,
                    user_type: req.role?req.role:"user",
                    activity: 'slot booking cancelled',
                    name:req.name,
                    venue_id:booking[0].venue_id,
                    booking_id:booking_id,
                    message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  }
                  ActivityLog(activity_log)
            }).catch(next);
          }).catch(next);
        }).catch(next);
        }
      })
      
    
  }).catch(next)
  }).catch(next)
})

router.post('/cancel_manager_repeat_booking/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id}).then(venue=>{
          Booking.updateMany({booking_id:{$in:req.body.booking_id}},{$set:{booking_status:"cancelled", refund_status:false,cancelled_by:req.userId}},{multi:true}).then(booking=>{
                Booking.find({booking_id:{$in:req.body.booking_id}}).lean().then(booking=>{
                  //result = Object.values(combineRepeatSlots(booking))
                  res.send({status:"success", message:"booking cancelled"})
                  // let booking_id = booking[0].booking_id
                  // let venue_name = booking[0].venue
                  // let venue_type = SetKeyForSport(booking[0].venue_type)
                  // let venue_area = booking[0].venue_data.venue.area
                  // let phone = "91"+booking[0].phone
                  // let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
                  // let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
                  // let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
                  // let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
                  // let manager_phone = "91"+venue.venue.contact
    
                  //Activity Log
                  let activity_log = {
                    datetime: new Date(),
                    id:req.userId,
                    user_type: req.role?req.role:"user",
                    activity: 'slot booking cancelled',
                    name:req.name,
                    venue_id:booking[0].venue_id,
                    booking_id:booking_id,
                    message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
                  }
                  ActivityLog(activity_log)
            }).catch(next);
      })
  }).catch(next)
})



//Slot Booked
router.post('/slots_available/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        console.log('req.body',req.body)
  //      Booking.find({ venue:req.body.venue, venue_id:{$in:venue_id}, booking_date:req.body.booking_date,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
   Booking.find({ venue_id:{$in:venue_id}, booking_date:{$gte:new Date(req.body.booking_date),$lt:new Date(req.body.booking_date).addHours(24,0)},booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
      let slots_available = SlotsAvailable(venue,booking_history)
      // console.log(moment(req.body.booking_date).add(1,"day"))
      if(!slots_available)
      {
        res.send({status:"success", message:"available slots fetched", data:[]})
      }else{
        res.send({status:"success", message:"available slots fetched", data:slots_available})
      }
      }).catch(next)
    }).catch(next)
  })


//Booking History
router.post('/slots_list/:venue_id', verifyToken, (req, res, next) => {
  let combinedSlots = [...Slots[0].item, ...Slots[1].item, ...Slots[2].item, ...Slots[3].item];
  Venue.findById({_id:req.params.venue_id}).lean().then(venue=>{
    let venue_type_index = venue.configuration.types.indexOf(req.body.venue_type)
    let find_day = venue.configuration.pricing.filter(value=>value.day===req.body.day)[0]
    let slots = combinedSlots.map(slot=>{
      let find_price = find_day.rate.filter((price,index)=>{
        let price_time = price.time.replace(/[#:]/g,'');
        let price_start_time = price_time.split("-")[0]
        let price_end_time = price_time.split("-")[1]

        let slot_start_time = slot.timeRepresentation.split("-")[0]
        let slot_end_time = slot.timeRepresentation.split("-")[1]
        if(slot_end_time === "0000"){
          // console.log("price_start_time",price_start_time)
          // console.log("price_end_time",price_end_time)
          // console.log("slot_start_time",slot_start_time)
          // console.log("slot_end_time",slot_end_time)
          slot_end_time = "2400"
        }
        if(price_start_time <= slot_start_time && price_end_time >= slot_end_time){
          // 0900 < 1530 && 1600 > 1600
          return price
        }else if(index===find_day.rate.length - 1){
          return price
        }
      })
      let price = find_price[0].pricing[venue_type_index]
      slot.price = parseInt(price,10)
      return slot
    })

    let slots_list = [
      {
        text: "NIGHT",
        name: "One",
        category: "n",
        id: 0,
        item: Object.values(slots).filter((value,index)=>index>=0&&index<13)
      },
      {
        text: "MORNING",
        name: "One",
        category: "m",
        id: 1,
        item: Object.values(slots).filter((value,index)=>index>=13&&index<26)
      },
      {
        text: "AFTERNOON",
        name: "One",
        category: "a",
        id: 2,
        item: Object.values(slots).filter((value,index)=>index>=26&&index<39)
      },
      {
        text: "EVENING",
        name: "One",
        category: "p",
        id: 3,
        item: Object.values(slots).filter((value,index)=>index>=39&&index<52)
      }
    ]

    res.send({slots:slots_list})
  // })
  })
})

router.post('/slots_value/:venue_id', verifyToken, (req, res, next) => {
  console.log(req.body,req.params.venue_id)
  Venue.findById({_id:req.params.venue_id}).lean().then(venue=>{
    Booking.find({ venue_id:req.params.venue_id, booking_date:{$gte:new Date(req.body[0].booking_date),$lt:new Date(req.body[req.body.length-1].booking_date).addHours(24,0)},booking_status:{$in:["booked","blocked","completed"]}}).lean().then(booking_history=>{
      let slots_available = SlotsValueAvailable(venue,booking_history,req.body)
      let final = {}
      req.body.map((a,e)=>{
                let availablility = []
                let price = []
                let venue_type_index = venue.configuration.types.indexOf(a.venue_type)
                let find_day = venue.configuration.pricing.filter(value=>value.day===a.day)[0]
                let bookingHistoryDate =  moment(a.booking_date).format('YYYY-MM-DD')
                a.rate = find_day.rate
                for(let time = 0 ; time<=a.timeRepresentation.length-1;time++){
                                                let find_price = a.rate.filter((price,index)=>{
                                                let price_time = price.time.replace(/[#:]/g,'');
                                                let price_start_time = price_time.split("-")[0]
                                                let price_end_time = price_time.split("-")[1]
                                                let slot_start_time = a.timeRepresentation[time].split("-")[0]
                                                let slot_end_time = a.timeRepresentation[time].split("-")[1]
                                                if(slot_end_time === "0000"){
                                                    slot_end_time = "2400"
                                                    }
                                                  if(price_start_time <= slot_start_time && price_end_time >= slot_end_time){
                                                    return price
                                                  }
                                            else if(index===find_day.rate.length - 1){
                                              return price
                                          }
                                       })
                                 price.push({[a.timeRepresentation[time]]:find_price[0].pricing[venue_type_index]})
                                    }
                                 final[bookingHistoryDate] = price

      })
      slots_available.finalPrice = final
      res.send({status:"success", message:"available slots fetched", data:slots_available})
      }).catch(next)
      
  })
})




//Booking History
router.post('/booking_history', verifyToken, (req, res, next) => {
  let past_date  = moment(req.body.todate).add(1,'month')
  let filter = {
    booking_status:{$in:["booked","completed"]},
    created_by:req.userId,
    end_time:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked","completed"]},
    created_by:req.userId,
    event_booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
  Booking.find(cancel_filter).lean().populate('venue_data','venue').then(cancel_booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
      EventBooking.find(cancel_filter).lean().populate('event_id').then(cancel_event_booking=>{
        result = Object.values(combineSlots1(booking))
         result1 = Object.values(combineSlots1(cancel_booking))
      //result = [...result,...eventBooking]
         result = [...result,...result1,...eventBooking,...cancel_event_booking]
        let finalResult = result.sort((a, b) => moment(a.start_time).format("YYYYMMDDHHmm") > moment(b.start_time).format("YYYYMMDDHHmm") ? 1 : -1 )
       
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
})


router.post('/past_bookings', verifyToken, (req, res, next) => {
  let past_date  = moment(req.body.todate).add(1,'month')
  let filter = {
    booking_status:{$in:["booked","completed"]},
    created_by:req.userId,
    end_time:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked","completed"]},
    created_by:req.userId,
    event_booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
  Booking.find(cancel_filter).lean().populate('venue_data','venue').then(cancel_booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
      EventBooking.find(cancel_filter).lean().populate('event_id').then(cancel_event_booking=>{
        result = Object.values(combineSlots1(booking))
        result1 = Object.values(combineSlots1(cancel_booking))
        result = [...result,...result1]
        let event_result =[...eventBooking,...cancel_event_booking]
        let booking_data = result.filter((key)=>{
          if(key && key.booking_status !== "booked"){
            return key
          }
          else if(key && key.booking_status == "booked" && Math.round(moment(key.end_time).utc().format("YYYYMMDDHmm")) < Math.round(moment().add(330,"minutes").format("YYYYMMDDHmm"))){
            return key
          }
        })
        let event_booking_data = event_result.filter((key)=>{
          console.log("time",moment(key.booking_date).utc().format("YYYYMMDDHmm"))
          console.log("2",moment().add(330,"minutes").format("YYYYMMDDHmm"))
          console.log("keyee",Math.round(moment(key.booking_date).utc().format("YYYYMMDDHmm")) < Math.round(moment().add(330,"minutes").format("YYYYMMDDHmm")))
          if(key && key.booking_status !== "booked"){
            return key
          }
          else if(key && key.booking_status == "booked" && Math.round(moment(key.booking_date).utc().format("YYYYMMDDHmm")) < Math.round(moment().add(330,"minutes").format("YYYYMMDDHmm"))){
            return key
          }
        })
         result = [...booking_data,...event_booking_data]
        let finalResult = result.sort((a, b) => moment(a.start_time).format("YYYYMMDDHHmm") > moment(b.start_time).format("YYYYMMDDHHmm") ? 1 : -1 )
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
  }).catch(next)
  }).catch(next)
})


router.post('/bookings_and_games', verifyToken, (req, res, next) => {
  let past_date  = moment(req.body.todate).add(1,'month')
  let filter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
    game:true
  }

  let old_filter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
    
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled","completed"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
  }
  let booking_ids = []

  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
    Booking.find(old_filter).lean().populate('venue_data','venue').then(old_booking=>{
    Booking.find(cancel_filter).lean().populate('venue_data','venue').then(cancelledBookings=>{
    EventBooking.find(eventFilter).lean().populate({path:"event_id",populate:{path:"venue"}}).then(eventBooking=>{
      EventBooking.find(cancel_filter).lean().populate({path:"event_id",populate:{path:"venue"}}).then(cancelledeventBooking=>{
      Game.find({$or:[{host:{$in:[req.userId]}},{users:{$in:[req.userId]}}]}).lean().populate('venue','venue'). populate("host","name _id handle name_status profile_picture").populate('conversation').populate({ path: 'conversation',populate: { path: 'last_message' }}).then(game=>{
        result = Object.values(combineSlots1(booking))
        let result1 = Object.values(combineSlots1(old_booking))
        cancelled_bookings =  Object.values(combineSlots1(cancelledBookings))
        game.map((key)=>{
         key["end_time"] = key.conversation && key.conversation.end_time ? key.conversation.end_time : key.bookings[key.bookings.length-1].end_time 
        })
        const open_games = game.filter((g)=>{
         return g.share_type === 'open' || (g.share_type === 'closed' && g.host.some(key=>key._id.toString() === req.userId.toString()))
        })
        
        let event_booking_data = eventBooking.filter(a => a.event_id).map((a)=>{
          a['start_time'] = a.event_id.start_date
          a['event'] = a.event_id
          a["end_time"] = moment(a.event_id.start_date).utc().format()
          return a
        })
        let cancelledeventBooking1 = cancelledeventBooking.filter(a => a.event_id).map((a)=>{
          a['start_time'] = a.event_id.start_date
          a['event'] = a.event_id
          a["end_time"] = a.event_id.start_date
          return a
        })

         event_booking_data.reverse()
         booking_data = req.body.type && req.body.type === 'host' ?[...open_games,...event_booking_data,...result,...result1]:[...game,...event_booking_data,...result,...result1]
         var groupBy = (xs, key) => {
          return xs.reduce((rv, x) =>{
            (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
            return rv;
          }, {});
        };
        let finalResult = booking_data.sort((a, b) => moment(a.end_time).format("YYYYMMDDHmm") > moment(b.end_time).format("YYYYMMDDHmm") ? 1 : -1 )
        const present = finalResult.filter((a)=> a && !a.empty && moment().subtract(0,'days').format('YYYYMMDDHHmm') <= moment(a.end_time).subtract(330,'minutes').format('YYYYMMDDHHmm'))
        const past = finalResult.filter((a)=> a && !a.empty && moment().subtract(0,'days').format('YYYYMMDDHHmm') >= moment(a.end_time).subtract(330,'minutes').format('YYYYMMDDHHmm'))
        const apresent = groupBy(present,'end_time')
        const apast = groupBy([...past,...cancelled_bookings,...cancelledeventBooking1],'end_time')
        // const pastCancelled = []
        // const cancelledPast = groupBy(pastCancelled,'start_time')
        // console.log("apaas",apast)
        let qpresent =   Object.entries(apresent).map(([key,value])=>{return {title:key,data:value }})
        let qpast =   Object.entries(apast).map(([key,value])=>{return {title:key,data:value }})
        // let qcancelled = Object.entries(cancelledPast).map(([key,value])=>{return {title:key,data:value }})
        const today_empty = qpresent && qpresent.findIndex((g)=> g.title === moment().subtract(0,'days').format('MM-DD-YYYY')) < 0 && qpresent.push({title:moment().format('MM-DD-YYYY'),empty:true,data:[{none:'No Games Available'}]})
        // const today_empty1 = qpast && qpast.findIndex((g)=> g.title === moment().subtract(0,'days').format('MM-DD-YYYY')) < 0 && qpast.push({title:moment().format('MM-DD-YYYY'),empty:true,data:[{none:'No Games Available'}]})
        qpresent.sort((a,b)=>moment(a.title,"MM-DD-YYYY").format('YYYYMMDD') >= moment(b.title,"MM-DD-YYYY").format('YYYYMMDD') ? 1 : -1)
        qpast.sort((a,b)=>moment(a.title,"MM-DD-YYYY").format('YYYYMMDD') >= moment(b.title,"MM-DD-YYYY").format('YYYYMMDD') ? 1 : -1)
        let qpas = [...qpast]
        let qprs = [...qpresent]
        res.send({status:"success", message:"booking history fetched", data:{past:qpas.slice(qpas.length-5,qpas.length),present:qprs.slice(0,5)}})
        req.redis().set('bookings_present_'+req.userId,JSON.stringify(qpresent))
        req.redis().set('bookings_past_'+req.userId,JSON.stringify(qpast))
    }).catch(next)
  }).catch(next)
  }).catch(next)
}).catch(next)

}).catch(next)
}).catch(next)
})


router.post('/host_and_games', verifyToken, (req, res, next) => {
  let past_date  = moment(req.body.todate).add(1,'month')
  let filter = {
    booking_status:{$in:["booked"]},
    phone:req.phone
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
  }
  let booking_ids = []
      Game.find({$or:[{host:{$in:[req.userId]}},{users:{$in:[req.userId]}}]}).lean().populate('venue','venue'). populate("host","name _id handle name_status profile_picture").populate('conversation').populate({ path: 'conversation',populate: { path: 'last_message' }}).then(game=>{
        let updated_games = game.filter((key)=>moment(key.start_time).subtract(330,"minutes").format("YYYYMMDDHHmm") > moment().format("YYYYMMDDHHmm") )
        updated_games.map((key)=>{
          key["venue"] = key.venue.venue
        })
        const open_games = updated_games.filter((g)=>{
         return g.share_type === 'open' || (g.share_type === 'closed' && g.host.some(key=>key._id.toString() === req.userId.toString()))
        })     
       let booking_data = req.body.type && req.body.type === 'host' ?[...open_games]:[...updated_games]
       //console.log(booking_data.length);
        booking_data = booking_data.filter((key) => key._id.toString() !== req.body.game.toString())
       
        var groupBy = (xs, key) => {
          return xs.reduce((rv, x) =>{
            (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
            return rv;
          }, {});
        };
        
        let finalResult = booking_data.sort((a, b) => moment(a.start_time).format("YYYYMMDDHmm") > moment(b.start_time).format("YYYYMMDDHmm") ? 1 : -1 )
        const a = groupBy(finalResult,'start_time')
        const q =   Object.entries(a).map(([key,value])=>{
                return {title:key,data:value }
          })
        res.send({status:"success", message:"booking history fetched", data:q})
    }).catch(next)
})


router.post('/games_list', verifyToken, (req, res, next) => {
      Game.find({$or:[{host:{$in:[req.userId]}},{users:{$in:[req.userId]}}]}).lean().populate('conversation').populate({ path: 'conversation',populate: { path: 'last_message' }}).then(game=>{
        const x = game.map((a)=>{
          a['status'] = false
          return a
        })
        booking_data = [...x]

        var groupBy = (xs, key) => {
          return xs.reduce((rv, x) =>{
            (rv[moment(x[key]).utc().format('MM-DD-YYYY')] = rv[moment(x[key]).utc().format('MM-DD-YYYY')] || []).push(x);
            return rv;
          }, {});
        };
        
        let finalResult = booking_data.sort((a, b) => moment(a.start_time).format("YYYYMMDDHmm") > moment(b.start_time).format("YYYYMMDDHmm") ? 1 : -1 )
        const a = groupBy(finalResult,'start_time')
        const q =   Object.entries(a).map(([key,value])=>{
                return {title:key,data:value }
          })
        res.send({status:"success", message:"booking history fetched", data:q})
    }).catch(next)
})


router.post('/upcoming_booking', verifyToken, (req, res, next) => {
  let past_date  = moment(req.body.todate).add(1,'month')
  let filter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
    end_time:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked"]},
    created_by:req.userId,
    event_booking_date:{$gte:new Date(), $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
        result = Object.values(combineSlots1(booking))
        let booking_data =result.filter((key)=>{
          if(key && Math.round(moment(key.end_time).utc().format("YYYYMMDDHHmm")) > Math.round(moment().add(330,"minutes").format("YYYYMMDDHHmm"))){
            return key
          }
        })
        let event_booking_data = eventBooking
        // .filter((key)=>{
        //   console.log('bd',moment(key.booking_date).utc().format("YYYYMDDHHmm"))
        //   console.log('bdr',moment().add(330,"minutes").format("YYYYMMDDHHmm"))

        //   if(Math.round(moment(key.booking_date).utc().format("YYYYMDDHHmm")) > Math.round(moment().add(330,"minutes").format("YYYYMMDDHHmm"))){
        //     return key
        //   }
        // })
        let event = event_booking_data.reverse()
        booking_data = [...booking_data,...event]


        let finalResult = booking_data.sort((a, b) => moment(a.start_time).format("YYYYMMDDHmm") > moment(b.start_time).format("YYYYMMDDHmm") ? 1 : -1 )
        
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
})

router.post('/cancelled_booking_history_by_time/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({booking_status:{$in:["cancelled"]},venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}}).then(bookings=>{
      let booking_ids = []
      bookings.filter(booking=>{
        if(booking_ids.indexOf(booking.booking_id)=== -1){
          booking_ids.push(booking.booking_id)
        }
      })
      Booking.find({booking_id:{$in:booking_ids},repeat_booking:false}).lean().populate('cancelled_by','name').then(booking=>{
      Booking.find({booking_id:{$in:booking_ids},repeat_booking:true}).lean().populate('cancelled_by','name').then(bookings=>{
        result = Object.values(combineSlots(booking))
        result1 = Object.values(combineRepeatSlots(bookings))
        let final =  result.concat(result1)
        res.send({status:"success", message:"booking history fetched", data:final})
      })
      }).catch(next)
    }).catch(next)
    }).catch(next)
  })    


  //Booking History Based on venue
router.post('/booking_history_by_venue', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.body.venue_id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({booking_status:{$in:["booked"]}, venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(booking=>{
      result = Object.values(combineSlots(booking))
        let booking_list = []
          result = result.map(booking=>{
              if(booking.end_time.getTime()>new Date().addHours(4,30).getTime()){
              booking_list.push(booking)
            }
          })
        res.send({status:"success", message:"booking history fetched", data:booking_list})
      }).catch(next)
    }).catch(next)
  })

  //Booking History
router.post('/booking_history_by_time/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({booking_status:{$in:["booked","completed"]},venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}}).then(bookings=>{
      let booking_ids = []
      bookings.filter(booking=>{
        if(booking_ids.indexOf(booking.booking_id)=== -1){
          booking_ids.push(booking.booking_id)
        }
      })
      Booking.find({booking_id:{$in:booking_ids},repeat_booking:false}).lean().populate('collected_by','name').then(bookings=>{
        Booking.find({booking_id:{$in:booking_ids},repeat_booking:true}).lean().populate('collected_by','name').then(booking=>{
          result = Object.values(combineSlots(bookings))
         result1 = Object.values(combineRepeatSlots(booking))
         let final =  result.concat(result1)
        res.send({status:"success", message:"booking history fetched", data:final})
      })
    }).catch(next)
      }).catch(next)
    }).catch(next)
  })

 //Booking History_from_app
 router.post('/booking_history_from_app', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked","completed"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').then(booking=>{
    result = Object.values(combineSlots(booking))

      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
  })

  //all repeated bookings (active tab)
  router.post('/booking_history_repeated_bookings/:id', verifyToken, (req, res, next) => {
    Booking.find({booking_status:{$in:["booked","completed","cancelled"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},venue_id:req.params.id,start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time},repeat_booking:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('cancelled_by','name').then(booking=>{
      result = Object.values(combineRepeatSlots(booking)) 
      let status_filter = result.filter((b)=>b.booking_status === 'cancelled')
      let grouped = _.mapValues(_.groupBy(result, 'group_id'), clist => clist.map(result => _.omit(result, 'multiple_id')));
      let x = {}
      let finalBookingList = []
      Object.entries(grouped).map(([i,j])=>{
        const filtered = j.filter((key)=>{
          if( (key.booking_status == "booked" || key.booking_status == "completed")  && !key.invoice){
            return key
          }
        })
        if(filtered.length > 0){
              x[i] = j
            finalBookingList = [...j,...finalBookingList]
        }
      })
        res.send({status:"success", message:"booking history fetched", data:finalBookingList})
      }).catch(next)
    })

    //check if group id exists, if so filter by group id and check if booking_status is booked or cancelled and invoice is false
    router.post('/booking_history_past_repeated_bookings/:id', verifyToken, (req, res, next) => {
      Booking.find({booking_status:{$in:["booked","completed"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},venue_id:req.params.id,start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time},repeat_booking:true}).lean().populate('venue_data','venue').populate('cancelled_by','name').then(bookings=>{
        booking =  Object.values(combineRepeatSlots(bookings)) 
        let grouped = _.mapValues(_.groupBy(booking, 'group_id'),clist => clist.map(booking => _.omit(booking, 'multiple_id')));
        let x ={}
        let finalBookingList = []
        Object.entries(grouped).map(([i,j])=>{
          const filtered = j.filter((key)=>{
            if(key.booking_status == "completed" && key.invoice && moment().isAfter(key.end_date_range) ){
              return key
            }
          })
          if(filtered.length  == j.length){
                x[i] = j
              finalBookingList = [...j,...finalBookingList]
          }

          // j.every((key)=>{
          //     if(moment().isAfter(key.end_date_range) && key.booking_status === 'completed'){
          //         finalBookingList = [...j,...finalBookingList]
          //     }
          // })
      })
        res.send({status:"success", message:"booking history fetched", data:finalBookingList})
        }).catch(next)
      })


    //repeated bookings with group id (active tab)
    router.post('/booking_history_by_group_id/:id', verifyToken, (req, res, next) => {
      Booking.find({booking_status:{$in:["booked","cancelled","completed"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:false}).lean().populate('venue_data','venue').populate('collected_by','name').populate('cancelled_by','name').then(booking=>{
        result = Object.values(combineRepeatSlots(booking)) 
      let grouped = _.mapValues(_.groupBy(result, 'group_id'), clist => clist.map(result => _.omit(result, 'multiple_id')));
      let x = {}
      let finalBookingList = []
      Object.entries(grouped).map(([i,j])=>{
        const filtered = j.filter((key)=>{
           if(key.booking_status !== "cancelled"){
             return key
           }
         })
         if(filtered.length > 0){
               x[i] = j
             finalBookingList = [...j,...finalBookingList]
         }
       })
          res.send({status:"success", message:"booking history fetched", data:finalBookingList, })
        }).catch(next)
      })

      //invoice generation for past bookings with status completed and date
      router.post('/invoice_history_by_group_id/:id', verifyToken, (req, res, next) => {
        Booking.find({booking_status:{$in:["completed","cancelled"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('cancelled_by','name').then(booking=>{
          result = Object.values(combineRepeatSlots(booking)) 
          let grouped = _.mapValues(_.groupBy(result, 'group_id'), clist => clist.map(result => _.omit(result, 'multiple_id')));
          // // let x = {}
          // // let finalBookingList = []
          // // Object.entries(grouped).map(([i,j])=>{
          // //   const filtered = j.filter((key)=>{
          // //     if(key.booking_status !== "cancelled"){
          // //       return key
          // //     }
          // //   })
          // //   if(filtered.length > 0){
          // //         x[i] = j
          // //       finalBookingList = [...j,...finalBookingList]
          // //   }
          // // })
          // console.log("dd",booking)
            res.send({status:"success", message:"booking history fetched", data:result})
          }).catch(next)
        })

        router.post('/invoice_history_by_group_id_by_time/:id', verifyToken, (req, res, next) => {
          Booking.find({booking_status:{$in:["cancelled","completed"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:false,booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}}).lean().populate('venue_data','venue').populate('collected_by','name').populate('cancelled_by','name').then(booking=>{
            result = Object.values(combineRepeatSlots(booking)) 
            const sortedActivities =  result ? result.slice().sort((a, b) => b.date - a.date) : []
            let status_filter = result.filter((b)=>b.booking_status === 'cancelled')
            let grouped = _.mapValues(_.groupBy(result, 'group_id'), clist => clist.map(result => _.omit(result, 'multiple_id')));
            let x = {}
            let finalBookingList = []
            Object.entries(grouped).map(([i,j])=>{

              const filtered = j.filter((key)=>{
                if(key.booking_status !== "cancelled"){
                  return key
                }
              })
              if(filtered.length > 0){
                    x[i] = j
                  finalBookingList = [...j,...finalBookingList]
              }
                // j.every((key)=>{
                //     if(key.booking_status !== "cancelled"){
                //         x[i] = j
                //         finalBookingList = [...j,...finalBookingList]
                //     }
                // })
            })
              res.send({status:"success", message:"booking history fetched", data:finalBookingList ,invoice_date:sortedActivities.length > 0 ? sortedActivities[0].invoice_date : '' })
            }).catch(next)
          })

        //get latest invoice date
        router.post('/invoice_date_by_group_id/:id', verifyToken, (req, res, next) => {
          Booking.find({booking_status:{$in:["cancelled","completed"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(booking=>{
            result = Object.values(combineRepeatSlots(booking))
            const sortedActivities = result.slice().sort((a, b) => b.date - a.date)
              res.send({status:"success", message:"booking history fetched", data:sortedActivities.length > 0 ? sortedActivities[0].invoice_date : ''})
            }).catch(next)
          })

          





// router.post('/booking_history_from_app_by_venue/:id', verifyToken, (req, res, next) => {
//   Booking.find({booking_status:{$in:["completed"]}, venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').then(booking=>{
//       result = Object.values(combineSlots(booking))
//       Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).then(booking1=>{
//         let result1 = Object.values(combineSlots(booking1))
//         let finalResult = [...result,...result1]
//         res.send({status:"success", message:"booking history fetched", data:finalResult})
//     }).catch(next)
//   }).catch(next)
// })

router.post('/booking_id_history/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_id:req.params.id}).lean().populate('venue_data','venue').then(booking=>{
  console.log("Reee",req.params.id)
    if(booking.length >0){
      let result = Object.values(combineSlots(booking))
        res.send({status:"success", message:"booking history fetched", data:result})
  }
  else if(booking.length == 0){
  EventBooking.find({booking_id:req.params.id}).lean().populate('event_id').then(eventBooking=>{
    if(eventBooking){
      res.send({status:"success", message:"booking history fetched", data:eventBooking})
    }
  }).catch(next)
}
}).catch(next)
})
router.post('/booking_history_from_app_by_venue/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').then(booking=>{
      result = Object.values(combineSlots(booking))
      Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).populate('cancelled_by','name').then(booking1=>{
        let result1 = Object.values(combineSlots(booking1))
        let finalResult = [...result,...result1]
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
})

router.post('/payment_tracker_app_bookings', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').then(booking=>{
    Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).lean().populate('venue_data','venue').then(booking1=>{
    let finalResult = [...booking,...booking1]
      result = Object.values(combineSlots(finalResult))
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
  }).catch(next)
  })

// router.post('/booking_history_from_app_bookings', verifyToken, (req, res, next) => {
//   Booking.find({booking_status:{$in:["booked","completed","cancelled"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').then(booking=>{
//     result = Object.values(combineSlots(booking))

//       res.send({status:"success", message:"booking history fetched", data:result})
//     }).catch(next)
//   })
router.post('/booking_history_from_app_event_bookings', verifyToken, (req, res, next) => {
  EventBooking.find({booking_status:{$in:["booked","completed","cancelled"]}, created_at:{$gte:req.body.fromdate, $lte:req.body.todate},booking_type:"app"}).lean().populate('event_id').then(booking=>{    
    // console.log("veeee",result)
    result = [...booking]
    res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
})

router.post('/booking_history_from_app_bookings', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked","completed","cancelled"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).lean().populate('venue_data','venue').populate('collected_by','name').populate("cancelled_by","name").then(booking=>{
    result = Object.values(combineSlots(booking))
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
  })

router.post('/booking_history_from_app_by_venue/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).then(booking=>{
      result = Object.values(combineSlots(booking))
      Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).then(booking1=>{
        result = Object.values(combineSlots(booking))
        let result1 = Object.values(combineSlots(booking1))
        let finalResult = [...result,...result1]
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
})

router.post('/booking_history_from_app_by_venue_completed/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed","cancelled"]}, venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).then(booking=>{
      result = Object.values(combineSlots(booking))
      console.log(result);
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
})

router.post('/booking_completed_list_by_venue', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.body.venue_id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
      Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:venue_id},repeat_booking:true,booking_date:{$gt:req.body.fromdate, $lte:req.body.todate}}).lean().populate('collected_by','name').then(booking2=>{
      Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:venue_id},repeat_booking:false,booking_date:{$gt:req.body.fromdate, $lte:req.body.todate}}).lean().populate('collected_by','name').then(booking=>{
      Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).lean().populate("cancelled_by" ,"name").then(booking1=>{
      
        result = Object.values(combineSlots(booking))
      result1 = Object.values(combineSlots(booking1))
      result2 = Object.values(combineRepeatSlots(booking2))
      let finalResult = [...result,...result1,...result2]
      res.send({status:"success", message:"booking history fetched", data:finalResult})
      }).catch(next)
    }).catch(next)
  }).catch(next)
}).catch(next)
})

  //Booking History_from_app
router.post('/booking_completed_list', verifyToken, (req, res, next) => {
  Booking.find({booking_status:"completed", booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking=>{
    User.find({},{_id:1,name:1,email:1,phone:1},null).lean().then(users=> {
      Admin.find({},{_id:1,name:1,email:1,phone:1},null).lean().then(admins=> {
        result = Object.values(combineSlots(booking,users,admins))
        res.send({status:"success", message:"booking history fetched", data:result})
      }).catch(next)
    }).catch(next)
  }).catch(next)
})

//Incomplete Booking
router.post('/incomplete_booking/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({venue_id:{$in:venue_id}, booking_status:"booked", booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(bookings=>{
      User.find({},{_id:1,name:1,email:1,phone:1},null).lean().then(users=> {
        Admin.find({},{_id:1,name:1,email:1,phone:1},null).lean().then(admins=> {
          result = Object.values(combineSlots(bookings,users,admins))
          let booking_list = []
          result = result.map(booking=>{
              if(booking.end_time.getTime()<=new Date().addHours(4,30).getTime()){
              booking_list.push(booking)
            }
          })
          res.send({status:"success", message:"incomplete booking fetched", data:booking_list})
        }).catch(next)
      }).catch(next)
    }).catch(next)
  }).catch(next)
})


//Event Booking
router.post('/check_booking', verifyToken, (req, res, next) => {
  EventBooking.findOne({event_id: req.body.event_id, created_by: req.userId,booking_status:'booked'}).then(event=>{
    
    if(event){
      res.send({status:"success", message:"Already Registered!", data:{event}})
    }else{
      EventBooking.find({event_id:req.body.event_id,booking_status:'booked'}).lean().populate('event_id').then(bookingOrders=>{
        if(bookingOrders.length<bookingOrders[0].event_id.format.noofteams){
          if(bookingOrders[0].event_id.status){
            res.send({status:"success", message:"no event found"})
          }else{
            res.send({status:"success", message:"no event found"})
          }
        }else{
          res.send({status:"success", message:"Registerations full!", data:{event}})
        }
      
      
      })
    }

})
})


// router.post('/check_booking', verifyToken, (req, res, next) => {
//   EventBooking.find({event_id:req.body.event_id}).lean().populate('event_id').then(bookingOrders=>{
//     if(bookingOrders.length<bookingOrders[0].event_id.format.noofteams){
//       EventBooking.findOne({event_id: req.body.event_id, created_by: req.userId,booking_status:'booked'}).then(event=>{
//     if(event){
//       res.send({status:"success", message:"Already Registered!", data:{event}})
//     }else{
//       res.send({status:"failed", message:"no event found"})
//     }
//   })}
//   else{
//     res.send({status:"success", message:"Registerations full!"})
//   }

// })
// })

//Cancel Booking
router.post('/cancel_event_booking/:id', verifyToken, (req, res, next) => {
  let count = 0
  EventBooking.findOne({booking_id:req.params.id}).lean().populate('event_id').then(eventBooking=>{
    if(eventBooking.free_event){
      EventBooking.findOneAndUpdate({booking_id:req.params.id}, {booking_status: "cancelled"}).then(eventBooking1=>{
        EventBooking.find({booking_id:req.params.id}, {booking_status: "booked"}).then(bookings=>{
          Coins.find({ booking_id: req.params.id }).lean().then(coins => {
          if (coins) {
              Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
              }).catch(next);
          }
          count = bookings.length
          
          res.send({status:"success", message:"Event booking cancelled"})
      })
      })
    })
    }else{
      if(req.body.refund_status){
        axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+eventBooking.transaction_id+'/refund')
        .then(response => {
          if(response.data.entity === "refund"){
            EventBooking.findOneAndUpdate({booking_id:req.params.id}, {booking_status: "cancelled",refund_status:true}).then(eventBooking=>{
              EventBooking.find({booking_id:req.params.id}, {booking_status: "booked"}).then(bookings=>{
                Coins.find({ booking_id: req.params.id }).lean().then(coins => {
                if (coins) {
                      Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
                      }).catch(next);
                  }
                count = bookings.length
                res.send({status:"success", message:"Event booking cancelled"})
            })
            })
          })
          }
        }).catch(next =>{
          console.log('pass',next.response.data);
        })
      }
      else{
        EventBooking.findOneAndUpdate({booking_id:req.params.id}, {booking_status: "cancelled",refund_status:false}).then(eventBookingNew=>{
          EventBooking.find({booking_id:req.params.id}, {booking_status: "booked"}).then(bookings=>{
            count = bookings.length
            res.send({status:"success", message:"Event booking cancelled"})
        }) })
      }
     
    }
    // Send SMS
    let booking_id = eventBooking.booking_id
    let phone = eventBooking.phone
    let event_name = eventBooking.event_id.event.name
    let name = eventBooking.name
    let sport_name = eventBooking.sport_name
    let game_type = SetKeyForEvent(eventBooking.event_id.format.game_type)
    let date = moment(eventBooking.start_time).format("MMMM Do YYYY")
    let Booking_amount = eventBooking.booking_amount
    let sender = "TRFTWN"
    
    //Send SMS to Event Manager
    let amount_paid = eventBooking.booking_amount
    let balance = eventBooking.amount - eventBooking.booking_amount
    let event_manager_phone = "+91"+eventBooking.event_id.event.contact
    //+eventBooking.event_id.event.contact
    let event_email = eventBooking.event_id.event.email
    let event_name1 = eventBooking.event_id.event.name
    let total_teams = eventBooking.event_id.format.noofteams
    // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_event.php?booking_id='+booking_id+'&phone='+phone+'&event_name='+event_name+'&date='+datetime+'&name='+name+'&amount_paid='+amount_paid+'&balance='+balance+'&manager_phone='+event_contact)
    // .then(response => {
    //   console.log(response.data)
    // }).catch(error=>{
    //   console.log(error.response.data)
    // })
    //user details
    if(req.body.refund_status){  
      let EVENT_CANCELLED_FOR_MANAGER_WITH_REFUND =`TURF TOWN event booking ${booking_id} for ${event_name}(${game_type}) scheduled on ${date} has been cancelled by the user.\nuser : ${name}(${phone})\nStatus :  Advance of Rs.${Booking_amount} will be refunded within 3-4 working days to the user` ///490737
      let EVENT_CANCELLED_FOR_USER_WITH_REFUND = `Your Turf town booking ${booking_id} for the event ${event_name}(${game_type}) scheduled on ${date} has been cancelled.\nStatus : Advance of Rs.${Booking_amount} will be refunded within 3-4 working days` ///490748              
      SendMessage(event_manager_phone,sender,EVENT_CANCELLED_FOR_MANAGER_WITH_REFUND) ///manager sms
      SendMessage(phone,sender,EVENT_CANCELLED_FOR_USER_WITH_REFUND) /// user sms
    }
    else {
      let EVENT_CANCELLED_FOR_MANAGER_WITHOUT_REFUND =`TURF TOWN event booking ${booking_id} for ${event_name}(${game_type}) scheduled on ${date} has been cancelled by the user.\nuser : ${name}(${phone})\nStatus : Advance of Rs.${Booking_amount} will be charged as a cancellation fee to the user` ///490737
      let EVENT_CANCELLED_FOR_USER_WITHOUT_REFUND = `Your Turf town booking ${booking_id} for the event ${event_name}(${game_type}) scheduled on ${date} has been cancelled.\nStatus : Advance of Rs.${Booking_amount} will be charged as a cancellation fee` ///490748              
      SendMessage(event_manager_phone,sender,EVENT_CANCELLED_FOR_MANAGER_WITHOUT_REFUND) //manager
      SendMessage(phone,sender,EVENT_CANCELLED_FOR_USER_WITHOUT_REFUND) // user
    }
    //Send Mail
    let mailBody = {
      name:name,
      event_name:event_name1,
      organizer:eventBooking.event_id.event.organizer,
      booking_id:booking_id,
      phone:phone,
      team_name:eventBooking.team_name,
      total_team:15,
      count:count,
      status: req.body.refund_status ? `Advance of Rs ${amount_paid} will be refunded to the user within 3 - 4 working days`:`Advance of Rs ${amount_paid} will be charged as a cancellation fee to the user`
    }

    let to_emails_manager = `${event_email}, rajasekar@turftown.in`

    let to_emails = `${eventBooking.email}, rajasekar@turftown.in`


    ejs.renderFile('views/event_manager/event_cancel.ejs',mailBody).then(html=>{
      mail("support@turftown.in", to_emails,"Event "+booking_id+" has been cancelled","test",html,response=>{
        if(response){
          console.log('success')
        }else{
          console.log('failed')
        }
      })
    }).catch(next)

    ejs.renderFile('views/event_manager/event_cancel_manager.ejs',mailBody).then(html=>{
      mail("support@turftown.in", to_emails_manager,"Event "+booking_id+" has been cancelled for "+mailBody.event_name,"test",html,response=>{
        if(response){
          console.log('success')
        }else{
          console.log('failed')
        }
      })
    }).catch(next)

  })
})

//Event Booking
router.post('/event_booking', verifyToken, (req, res, next) => {
  Event.findOne({_id: req.body.event_id}).then(event=>{
    EventBooking.find({event_id:req.body.event_id,booking_status:"booked"}).lean().populate('event_id').then(bookingOrders=>{
      if(bookingOrders.length<=event.format.noofteams){
          EventBooking.findOne({}, null, {sort: {$natural: -1}}).lean().populate('event_id').then(bookingOrder=>{
            let booking_id;
            if(bookingOrder){
              var numb = bookingOrder.booking_id.match(/\d/g);
              numb = numb.join("");
              var str = "" + (parseInt(numb, 10) + 1)
              var pad = "TTE00000"
              booking_id = pad.substring(0, pad.length - str.length) + str
            }else{
              booking_id = "TTE00001";
            }
        
            let booking_data = {
              booking_id:booking_id,
              booking_date:req.body.booking_date,
              booking_type:req.body.booking_type,
              booking_status:"booked",
              created_by:req.userId,
              event_booking_date:req.body.event_booking_date,
              event_id:req.body.event_id,
              event_name:req.body.event_name,
              sport_name:req.body.sport_name,
              amount:req.body.amount,
              venue:req.body.venue,
              start_time:req.body.start_time,
              team_name:req.body.team_name,
              game_type:req.body.game_type,
              coupons_used:req.body.coupons_used,
              coupon_amount:req.body.coupon_amount,
              offer_amount:req.body.offer_amount,
              commission:req.body.commission,
              booking_amount:req.body.booking_amount,
              name:req.body.name,
              coins:req.body.coins,
              email:req.body.email,
              transaction_id:req.body.transaction_id,
              phone:req.body.phone,
              card:req.body.card,
              upi:req.body.upi,
              cash:req.body.cash,
              free_event: req.body.free_event
            }
            EventBooking.create(booking_data).then(eventBooking=>{
              //EventBooking.findOne({'booking_id':eventBooking.booking_id})
              EventBooking.findOne({'booking_id':eventBooking.booking_id}).populate({path:"event_id",populate:{path:"venue"}}).lean().then(bookingOrder=>{
                if(req.body.free_event){
                  res.send({status:"success", message:"event booked", data:bookingOrder})
                }else{
                  //Capture Payment
                  let data = {
                    amount:req.body.booking_amount*100
                  }
                  if(req.body.transaction_id && req.body.transaction_id !== 'free_slot'){

                  axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body.transaction_id+'/capture',data)
                  .then(response => {
                    console.log(response.data)
                    if(response.data.status === "captured")
                    {
                      res.send({status:"success", message:"event booked", data:bookingOrder})

                    }
                  })
                  .catch(error => {
                    console.log(error.response)
                    res.send({error:error.response});
                  }).catch(next);
                }else {
                  res.send({status:"success", message:"event booked", data:bookingOrder})
                }
                }
              // Send SMS
              req.body.coins > 0 && createCoin({type:'booking',amount:-(req.body.coins),transaction_id:req.body.transaction_id,user:req.userId,booking_id:eventBooking.booking_id,comments:`You have used ${req.body.coins} for this ${req.body.event_name}`},next)
              let booking_id = eventBooking.booking_id
              let phone = eventBooking.phone
              let event_name = req.body.event_name
              let sport_name = SetKeyForSport(req.body.sport_name)
              let game_type = SetKeyForEvent(event.format.game_type)
              let date = moment(eventBooking.booking_date).format("MMMM Do YYYY")
              let event_date = moment(eventBooking.start_time).format("MMMM Do YYYY")
              let datetime = date + " " + moment(eventBooking.start_time).format("hh:mma") 
              //Send SMS to Event Manager
              let name = eventBooking.name
              let amount_paid = eventBooking.booking_amount
              let balance = req.body.amount - eventBooking.booking_amount-eventBooking.coupon_amount
              let event_contact = event.event.contact
              let amountTobePaid = req.body.amount - eventBooking.coupon_amount 
              let sender = "TRFTWN"
              let team_name = eventBooking.team_name
              let Booking_amount = eventBooking.booking_amount
              let EVENT_BOOKED_USER = `Your Turf Town event booking for ${event_name} has been confirmed.\nDate : ${event_date}\nTeam Name : ${team_name}\nSport : ${sport_name}(${game_type})\nRegisteration ID : ${booking_id}\nTT Coupon : ${eventBooking.coupon_amount}\nAmount Paid : ${Booking_amount}${""}\nBalance to be paid at event : ${balance}\nPlease contact ${event_contact} for more details.`//491373
              let EVENT_BOOKED_MANAGER = `You have received a new registration for the event:\n${event_name}\nDate : ${event_date}\nName : ${name}\nTeam Name : ${team_name}\nSport : ${sport_name}(${game_type})\nRegisteration ID : ${booking_id}\nTT Coupon : ${eventBooking.coupon_amount}\nAmount Paid : ${Booking_amount}${""}\nBalance to be paid at the event : ${balance}`//491373
              // let EVENT_BOOKED_USER = `Your Turf Town event booking for ${event_name} has been confirmed.\nDate : ${event_date}\nTeam Name : ${team_name}\nSport : ${sport_name}(${game_type})\nRegisteration ID : ${booking_id}\nTT Coupon : ${eventBooking.coupon_amount}\nAmount Paid : Rs.${Booking_amount}${""}\nTT Coupon : 0\nBalance to be paid at event : ${balance}\nPlease contact ${event_contact} for more details.`//491373
              // SendMessage(event_manager_phone,sender,EVENT_CANCELLED_FOR_MANAGER_WITH_REFUND) ///manager sms
              SendMessage(phone,sender,EVENT_BOOKED_USER) /// user sms
              SendMessage(event_contact,sender,EVENT_BOOKED_MANAGER) /// user sms
              // axios.get(process.env.PHP_SERVER+'/textlocal/event_booking_manager.php?booking_id='+booking_id+'&phone='+phone+'&event_name='+event_name+'&date='+datetime+'&name='+name+'&amount_paid='+amount_paid+'&balance='+balance+'&manager_phone='+event_contact,'&sport='+sport_name,'&game_type='+game_type)
              // .then(response => {
              //   console.log(response.data)
              // }).catch(error=>{
              //   console.log(error.response.data)
              // })
              let mailBody = {
                name:name,
                phone:phone,
                event_name:event_name,
                event_contact:event_contact,
                date:event_date,
                sport_name:sport_name.toUpperCase(),
                total_amount:event.format.entry_fee,
                booking_amount:amount_paid,
                balance:balance,
                manager_name:event.event.organizer,
                booking_id:booking_id,
                coupon_discount:eventBooking.coupon_amount,
                game_type: game_type.toUpperCase(),
                event_discount:0,
                team_name:eventBooking.team_name,
                final_price:amountTobePaid,
              }

              let to_emails = `${bookingOrder.event_id.event.email}, rajasekar@turftown.in`
              let to_emails_user = `${req.body.email}, rajasekar@turftown.in`
              ejs.renderFile('views/event_manager/event_manager.ejs',mailBody).then(html=>{
                mail("support@turftown.in", to_emails_user,"Event Booked","test",html,response=>{
                  if(response){
                    console.log('success')
                  }else{
                    console.log('failed')
                  }
                })
              }).catch(next)

              ejs.renderFile('views/event_manager/event.ejs',mailBody).then(html=>{
                mail("support@turftown.in", to_emails,"New registeration for "+event_name,"test",html,response=>{
                  if(response){
                    console.log('success')
                  }else{
                    console.log('failed')
                  }
                })
              }).catch(next)
              //Activity Log
              let activity_log = {
                datetime: new Date(),
                id:req.userId,
                user_type: req.role?req.role:"user",
                activity: 'event booked',
                name:req.name,
                booking_id:booking_id,
                event_id:eventBooking.event_id,
                message: "event "+booking_id+" booked at "+event_name+" "+datetime,
              }
              ActivityLog(activity_log)
            }).catch(next)
          })
        }).catch(next)
      }else{
        res.send({status:"success", message: "Registrations full"})
      }
    })
  })
})

//Booking History Based on venue

router.post('/revenue_report_cancel', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.body.venue_id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({booking_status:{$in:["cancelled"]},refund_status:false, venue_id:{$in:venue_id},booking_type:"app",booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
      
      Booking.find({booking_status:{$in:["cancelled"]},refund_status:false, venue_id:{$in:venue_id},booking_type:"app",booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1, commission:1,booking_amount:1,coupon_amount:1}).lean().then(booking=>{

        let result = {}
        let bookings = []
        let data = Object.values(booking).map((value,index)=>{
          let date = moment(value.booking_date).format("DD-MM-YYYY")
          let bookings_combined
          if(!result[date]){
            result[date] = value
            result[date].bookings = 1
            result[date].slots_booked = 1
            result[date].commission = value.commission
            result[date].booking_amount = value.booking_amount
            result[date].coupon_amount = 0
            bookings_combined = JSON.stringify([...bookings,booking_list[index]])
            bookings_combined = JSON.parse(bookings_combined)
            result[date].booking = bookings_combined
            result[date].hours_played = 0.5
          }else{
            result[date].amount = result[date].amount + value.amount
            result[date].slots_booked = result[date].slots_booked + 1
            result[date].hours_played = (result[date].slots_booked*30)/60
            result[date].commission = result[date].commission + value.commission
            result[date].booking_amount = result[date].booking_amount + value.booking_amount
            result[date].coupon_amount = 0

            bookings_combined = JSON.stringify([...result[date].booking,booking_list[index]])
            bookings_combined = JSON.parse(bookings_combined)
            result[date].booking = bookings_combined

          }
        })
        result = Object.values(result)
        
        result.forEach(results=>{
          results.booking = combineSlots(results.booking)
          return results
        })

        res.send({status:"success", message:"revenue reports fetched", data:result})
      }).catch(next)
    }).catch(next)
}).catch(next)
})


router.post('/revenue_report', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.body.venue_id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
    let cancelledData = [];
    let cancelledData_bookings = []
    if(venue.secondary_venue){
      venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
    }else{
      venue_id = [venue._id.toString()]
    }
    Booking.find({booking_status:{$in:["cancelled"]},refund_status:false, venue_id:{$in:venue_id},booking_type:"app",booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(data=>{
      cancelledData_bookings = data
    Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(key=>{
      Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1, commission:1,booking_amount:1,coupon_amount:1}).lean().then(booking=>{
        let result = {}
        let bookings = []
        let booking_new = [...booking,...cancelledData_bookings]
        let booking_list =[...key,...cancelledData_bookings]
        let data = Object.values(booking_new).map((value,index)=>{
          let date = moment(value.booking_date).format("DD-MM-YYYY")
          let bookings_combined
          if(!result[date]){
            result[date] = value
            result[date].bookings = 1
            result[date].slots_booked = 1
            result[date].commission = value.commission
            result[date].booking_amount = value.booking_amount
            result[date].coupon_amount = value.coupon_amount ? value.coupon_amount : 0
            bookings_combined = JSON.stringify([...bookings,booking_list[index]])
            bookings_combined = JSON.parse(bookings_combined)
            result[date].booking = bookings_combined
            result[date].hours_played = 0.5
          }else{
            result[date].amount = result[date].amount + value.amount
            result[date].slots_booked = result[date].slots_booked + 1
            result[date].hours_played = (result[date].slots_booked*30)/60
            result[date].commission = result[date].commission + value.commission
            result[date].booking_amount = result[date].booking_amount + value.booking_amount
           // result[date].coupon_amount = result[date].coupon_amount + value.coupon_amount
           result[date].coupon_amount = (result[date].coupon_amount ? result[date].coupon_amount : 0)  + (value.coupon_amount ? value.coupon_amount : 0)
            bookings_combined = JSON.stringify([...result[date].booking,booking_list[index]])
            bookings_combined = JSON.parse(bookings_combined)
            result[date].booking = bookings_combined

          }
        })
        
        result = Object.values(result)
        
        result.forEach(results=>{
          results.booking = combineSlots(results.booking)
          return results
        })

        res.send({status:"success", message:"revenue reports fetched", data:result})
      }).catch(next)
    }).catch(next)
    }).catch(next)
}).catch(next)
})

router.post('/revenue_report_months', verifyToken, (req, res, next) => {
  // Venue.findById({_id:req.body.venue_id},{bank:0,access:0}).lean().then(venue=>{
  //   let venue_id;
  //   let cancelledData_bookings = []
  //   if(venue.secondary_venue){
  //     venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
  //   }else{
  //     venue_id = [venue._id.toString()]
  //   }
    // Booking.find({booking_status:{$in:["cancelled"]},refund_status:false, venue_id:{$in:req.body.venue_id},booking_type:"app",booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,amount:1,commission:1,booking_amount:1} ).lean().then(data=>{
      // cancelledData_bookings = data
    Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:req.body.venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(key=>{
      Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:req.body.venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,amount:1,commission:1,booking_amount:1}).lean().then(booking=>{
        let result = {}
        let booking_new = [...booking]
        let data = Object.values(booking_new).map((value,index)=>{
          let date = moment(value.booking_date).format("DD-MM-YYYY")
          if(!result[date]){
            result[date] = value
            result[date].bookings = 1
            result[date].slots_booked = 1
            result[date].hours_played = 0.5
            // result[date].commission = value.commission
          }else{
          
            let new_amout = result[date].booking_status == "cancelled" ? (result[date].booking_amount)/2 : Math.round(result[date].amount)
            let value_amount = value.booking_status == "cancelled" ? (value.booking_amount)/2 : Math.round(value.amount)
            let new_commission = result[date].booking_status == "cancelled" ? 0 : result[date].commission
            let value_commission = value.booking_status == "cancelled" ? 0 : value.commission
            result[date].amount = new_amout + value_amount
            result[date].commission = new_commission + value_commission
            result[date].slots_booked = result[date].slots_booked + 1
            result[date].hours_played = (result[date].slots_booked*30)/60

          }
        })
        
        result = Object.values(result)
        res.send({status:"success", message:"revenue reports fetched", data:result})
      }).catch(next)
    }).catch(next)
    // }).catch(next)
// }).catch(next)
})

router.post('/revenue_report_app', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, booking_type:'app', booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
    Booking.find({booking_status:{$in:["completed"]},booking_type:'app', booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1, commission:1,venue_id:1}).lean().then(booking=>{
      let result = {}
      let group = booking.reduce((r, a) => {
        r[a.venue_id] = [...r[a.venue_id] || [], a];
        return r;
      }, {});
      let bookings = []
      let data = Object.values(group).map((value,index)=>{
        let date = moment(value.booking_date).format("DD-MM-YYYY")
        let venue_id = value.venue_id
        let bookings_combined
        if(!result[date]){
          result[date] = value
          result[date].bookings = 1
          result[date].slots_booked = 1
          result[date].commission = value.commission
          bookings_combined = JSON.stringify([...bookings,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined
          result[date].hours_played = 0.5
        }else{
          result[date].amount = result[date].amount + value.amount
          result[date].slots_booked = result[date].slots_booked + 1
          result[date].hours_played = (result[date].slots_booked*30)/60
          result[date].commission = result[date].commission + value.commission
          bookings_combined = JSON.stringify([...result[date].booking,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined

        }
      })
      result = Object.values(result)
      result.forEach(results=>{
        results.booking = combineSlots(results.booking)
        return results
      })
      res.send({status:"success", message:"revenue reports fetched", data:result})
    }).catch(next)
  }).catch(next)
})

//Booking History Based on venue
router.post('/revenue_report_booked', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
    Booking.find({booking_status:{$in:["booked"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1}).lean().then(booking=>{
      let result = {}
      let bookings = []
      let data = Object.values(booking).map((value,index)=>{
        let date = moment(value.booking_date).format("DD-MM-YYYY")
        let bookings_combined
        if(!result[date]){
          result[date] = value
          result[date].bookings = 1
          result[date].slots_booked = 1
          bookings_combined = JSON.stringify([...bookings,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined

        }else{
          result[date].amount = result[date].amount + value.amount
          result[date].slots_booked = result[date].slots_booked + 1
          result[date].hours_played = (result[date].slots_booked*30)/60
          bookings_combined = JSON.stringify([...result[date].booking,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined
        }
      })
      
      result = Object.values(result)
      result.forEach(results=>{
        results.booking = combineSlots(results.booking)
        return results
      })

      res.send({status:"success", message:"revenue reports fetched", data:result})
    }).catch(next)
  }).catch(next)
})


router.post('/invoice_report_booked', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
    Booking.find({booking_status:{$in:["completed"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1}).lean().then(booking=>{
      let result = {}
      let bookings = []
      let data = Object.values(booking).map((value,index)=>{
        let date = moment(value.booking_date).format("DD-MM-YYYY")
        let bookings_combined
        if(!result[date]){
          result[date] = value
          result[date].bookings = 1
          result[date].slots_booked = 1
          bookings_combined = JSON.stringify([...bookings,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined

        }else{
          result[date].amount = result[date].amount + value.amount
          result[date].slots_booked = result[date].slots_booked + 1
          result[date].hours_played = (result[date].slots_booked*30)/60
          bookings_combined = JSON.stringify([...result[date].booking,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined
        }
      })
      
      result = Object.values(result)
      result.forEach(results=>{
        results.booking = combineSlots(results.booking)
        return results
      })

      res.send({status:"success", message:"revenue reports fetched", data:result})
    }).catch(next)
  }).catch(next)
})

//// Ads
// router.post('/ads_list',verifyToken,AccessControl('ads', 'read'),(req, res, next) => {
//   Ads.find({$and: [{ start_date: { $lte: new Date(),},}, { end_date: {$gte: new Date(),},},{sport_type: req.body.sport_type},{ page: req.body.page}],}).lean().populate('event').populate('venue').then(ads=>{
    
//    let event_ads = []
//    let final_event_ds = ads.filter((ad,i)=>{
//      if(ad.event.length>0)
//        return ad
//     })
//     let final_venue_ads = ads.filter((ad,i)=>{
//       if(ad.venue.length>0)
//         return ad
//      })
//      if(final_event_ds.length > 0){
//       final_event_ds.map((event_ad,i)=>{
//         Event.find({'_id':event_ad.event[0]._id}).lean().populate('venue').then(event=>{
//             event_ad.event[0] = event
//             event_ads.push(event_ad)
//             if( i === final_event_ds.length - 1){
//               let result = [...final_venue_ads,...event_ads]
//               res.send({status:"success", message:"ads fetched", data:[...final_venue_ads,...event_ads]})
//             }
//         }).catch(next)
//       })
//      }else{
//       res.send({status:"success", message:"ads fetched", data:[...final_venue_ads]})
//      }
    
// 	}).catch(next)
// })
router.post('/ads_list',verifyToken,AccessControl('ads', 'read'),(req, res, next) => {
  Ads.find({$and: [{ start_date: { $lte: new Date(),},}, { end_date: {$gte: new Date(),},},{sport_type: req.body.sport_type}],status:true}).lean().populate('event').populate('venue').then(ads=>{
      Offers.find({}).then(offers=>{

   let event_ads = []
   let final_event_ds = ads.filter((ad,i)=>{
     if(ad.event.length>0)
       return ad
    })
    let final_venue_ads = ads.filter((ad,i)=>{
      if(ad.venue.length>0){
        let list = Object.values(ad.venue).map((value,index)=>{
          let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
          value.rating = value.rating
					value.offers = filteredOffer
					return value
        })
        return list
      }
        
     })
     if(final_event_ds.length > 0){
      final_event_ds.map((event_ad,i)=>{
        Event.find({'_id':event_ad.event[0]._id}).lean().populate('venue').then(event=>{
          Object.values(event).map((key)=>{
            Object.values(key.venue).map((value,index)=>{
              let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
              value.offers = filteredOffer
              return value
            })
          })
            event_ad.event[0] = event
            event_ads.push(event_ad)
            if( i === final_event_ds.length - 1){
              let result = [...final_venue_ads,...event_ads]
              res.send({status:"success", message:"ads fetched", data:[...final_venue_ads,...event_ads]})
            }
        }).catch(next)
      })
     }else{
      res.send({status:"success", message:"ads fetched", data:[...final_venue_ads]})
     }
    
  }).catch(next)
  }).catch(next);

})



router
  .post('/upload_game_image/:string',multer_upload.single('image'),async function (req, res, next) {
    if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});

    const x = await upload(req.files.image,req.params.string)
    res.send({data:x.Location,message:'image uploaded'})
      //upload(req,res,pathLocation,File,filename)
    }
  );

  router
  .post('/upload_invoice_pdf/:string',multer_upload.single('image'),async function (req, res, next) {
    if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});

    const x = await uploadPDF(req.files.image,req.params.string)
    res.send({data:x.Location,message:'image uploaded'})
      //upload(req,res,pathLocation,File,filename)
    }
  );

  router
  .post('/upload_multiple/:string',multer_upload.single("image"),async function (req, res, next) {
    if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});
    console.log(Array.isArray(req.files.image))

    const x =  Array.isArray(req.files.image) ? await uploadMultiple(req.files.image,req.params.string) : await upload(req.files.image,req.params.string)
    const data = Array.isArray(req.files.image) ? x.map((key)=>key.Location) : x.Location
    res.send({data:data,message:'image uploaded'})
      //upload(req,res,pathLocation,File,filename)
    }
  );

// router.post('/ads_list',verifyToken,AccessControl('ads', 'read'),(req, res, next) => {
//   Ads.find({$and: [{ start_date: { $lte: new Date(),},}, { end_date: {$gte: new Date(),},},{sport_type: req.body.sport_type},{ page: req.body.page}],}).lean().populate('event').populate('venue').then(ads=>{
//       Offers.find({}).then(offers=>{

//    let event_ads = []
//    let final_event_ds = ads.filter((ad,i)=>{
//      if(ad.event.length>0)
//        return ad
//     })
//     let final_venue_ads = ads.filter((ad,i)=>{
//       if(ad.venue.length>0){
//         let list = Object.values(ad.venue).map((value,index)=>{
          
// 					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
// 					value.offers = filteredOffer
// 					return value
//         })
//         return list
//       }
        
//      })
//      if(final_event_ds.length > 0){
//       final_event_ds.map((event_ad,i)=>{
//         Event.find({'_id':event_ad.event[0]._id}).lean().populate('venue').then(event=>{
//             event_ad.event[0] = event
//             event_ads.push(event_ad)
//             if( i === final_event_ds.length - 1){
//               let result = [...final_venue_ads,...event_ads]
//               res.send({status:"success", message:"ads fetched", data:[...final_venue_ads,...event_ads]})
//             }
//         }).catch(next)
//       })
//      }else{
//       res.send({status:"success", message:"ads fetched", data:[...final_venue_ads]})
//      }
    
//   }).catch(next)
//   }).catch(next);

// })



router.post('/test_sms', (req, res, next) => {
  let booking_id = "sh.unique"
  let venue_name = "kilpauk"
  let event_name = "kilpauk"
  let phone = "917401415754"
  let manager_phone = "918667309360"
  let datetime = "May 15"
  let venue_type = "kdjflsjf"
  let venue_area = "kdjflsjf"
  let sport_name = "lkdjfsljf"
  let key = '9SkVgIrzjl+PoiOZ5AVMDSHxkQzuS+qt4gYG8BS+'
  let access = 'AKIAJCWCKO7WP7A6PPYQ'
  const bucket_name = 'turftown'
  
 
  //Send SMS
  // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_event.php?booking_id='+booking_id+'&phone='+phone+'&event_name='+event_name+'&date='+datetime+'&name='+event_name+'&amount_paid='+amount_paid+'&balance='+balance+'&manager_phone='+manager_phone).then(response => {
  //   console.log(response.data)
  // }).catch(error=>{
  //   console.log(error)
  // })


})

router.post('/test_php', (req, res, next) => {
  axios.get('textlocal/index.php')
    .then(response => {
      console.log(response.data)
      res.send({data:response.data})
    }).catch(error=>{
      res.send(error)
    })
})


  router
  .post('/test_s3',multer_upload.single('image'),async function (req, res, next) {
    if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});

    console.log(__dirname,req.files,req.body) 
    const x = await upload(req.files.image,'game')
    console.log('hir',x)
    res.send({data:x.Location,message:'image uploaded'})
      //upload(req,res,pathLocation,File,filename)
    }
  );
// //Booking History
router.post('/test_mail', verifyToken, (req, res, next) => {
  // let html = fs.readFileSync('views/mail.ejs',{encoding:'utf-8'});
  console.log(req.body)

  let booking_id='TT000121'
  let booking_amount = '100'
  // let obj = {
  //   name:'Kumar',
  //   date:moment().format('llll'),
  //   time:'4:00 PM - 5:00 pm',
  //   booking_id:booking_id,
  //   venue_name:'Tiki Taka',
  //   venue_location:'Kilpauk',
  //   booking_status:'Advance of Rs 200 will be collected'
  // }
  let obj = {
    name:'Kumar',
    date:moment().format('llll'),
    time:'4:00 PM - 5:00 pm',
    venue_name:'Tiki Taka',
    venue_location:'Kilpauk',
    booking_status:'Advance of Rs 200 will be collected',
    venue_manager_name:'pass',
    phone:'7358496318',
    booking_id:booking_id,
    venue_type:'5s',
    booking_status:`Advance of Rs ${booking_amount} will be refunded within 3 - 4 working days.`
  }
  let to_emails = `rajasekar@turftown.in`
  ejs.renderFile('views/event_manager/venue_cancel_by_manager.ejs',obj).then(html=>{
    mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
      if(response){
        res.send({status:"success"})
      }else{
        res.send({status:"failed"})
      }
    })
  }).catch(next)
})



module.exports = router;

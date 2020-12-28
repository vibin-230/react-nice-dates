const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const constants = require('../scripts/constants');
const link = require('../scripts/uri');
const { check, validationResult } = require('express-validator/check');
const verifyToken = require('../scripts/verifyToken');
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const verifySuperAdmin = require('../scripts/verifySuperAdmin');
const jwt = require('jsonwebtoken');
const config = require('../config');
const data = require('../sample/venue.js')
const mail = require('../scripts/mail');
var mkdirp = require('mkdirp');
const ejs = require('ejs');
const rzp_key = require("../scripts/rzp");

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Booking = require('../models/booking');
const Admin = require('../models/admin');
const Event = require('../models/event');
const Alert = require('../models/alerts');
const Coins = require('../models/coins');
const Conversation = require('../models/conversation');

const Game = require('../models/game');
const Message = require('../models/message');

const Coupon = require('../models/coupon');
const Support = require('../models/support');
const Ads = require('../models/ads');
const Offers = require('../models/offers');
const upload = require("../scripts/aws-s3")
const AccessControl = require("../scripts/accessControl")

if (!('multidelete' in Object.prototype)) {
    Object.defineProperty(Object.prototype, 'multidelete', {
        value: function () {
            for (var i = 0; i < arguments.length; i++) {
                delete this[arguments[i]];
            }
        }
    });
}
function AdsValidation(ad,req){
	let x ;
	if(ad._id == req.params.id ){
		x = false
	}
	else if(ad._id !== req.params.id){
		if(moment(req.body.start_date).isBetween(moment(ad.start_date).format("YYYY-MM-DD"),moment(ad.end_date).format("YYYY-MM-DD"),null,[]) || moment(req.body.end_date).isBetween(moment(ad.start_date).format("YYYY-MM-DD"),moment(ad.end_date).format("YYYY-MM-DD"),null,[])){
			x = true
		}
		else {
			x =false
		}
	}
	return x
}
function ActivityLog(id, user_type, activity, message) {
	let activity_log = {
		datetime: new Date(),
		id:id,
		user_type: user_type,
		activity: activity,
		message: message,
		venue_id:venue_id
	}
	let user = user_type==="user"?User:Admin
	user.findOneAndUpdate({_id:id},{$push:{activity_log:activity_log}}).then(admin=>{
		console.log("activity log updated")
	})
}

function findDay() {
	var d = new Date();
	var weekday = new Array(7);
	weekday[0] = "sunday";
	weekday[1] = "monday";
	weekday[2] = "tuesday";
	weekday[3] = "wednesday";
	weekday[4] = "thursday";
	weekday[5] = "friday";
	weekday[6] = "saturday";
	var n = weekday[d.getDay()];
	return n
  }

function getValue(key,total,type){
	if(key === '5s'){
	  const index = type.indexOf("5s")
	  return total[index]/5
	}
	else if(key === '7s'){
	  const index = type.indexOf("7s")
	  return total[index]/7
	}
	else if(key === '9s'){
	  const index = type.indexOf("9s")
	  return total[index]/9
	}
	else if(key === 'net'){ // 1hour pricing 
	  const index = type.indexOf("net")
	  return total[index]*2
	}
	else if(key === 'ac'){ // 1hour pricing 
	  const index = type.indexOf("ac")
	  return total[index]*2
	}
	else if(key === 'nonac'){ // 1hour pricing 
	  const index= type.indexOf("nonac")
	  return total[index]*2
	}
	else if(key === 'hc'){
	  const index= type.indexOf("hc")
	  return total[index]/3
	}
	else if(key === 'fc'){
	  const index= type.indexOf("fc")
	  return total[index]/5
	}
	else if(key === 'ground' || key === 'pitch'){
	  const index= type.indexOf("ground")
	  return total[index]*2
	}
  };

  function getPrice(key){
	const highestPricing = key.sort((a,b)=> Math.round(b.pricing[0]) > Math.round(a.pricing[0]) ?  1 : -1 )
	return highestPricing[0].pricing
  }

Date.prototype.addHours= function(h,m){
  this.setHours(this.getHours()+h);
  this.setMinutes(this.getMinutes()+m);
  return this;
}


router.post('/create_super_admin',
	check('password').exists().isLength({ min: 6}).withMessage('password length should be minimum 6 letters'),
	(req, res, next) => {
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
	Admin.findOne({username:req.body.username}).then(superAdmin=>{
		if(superAdmin){
			res.send({status:"failure", message:"Email-id already exist"})
		}else{
			bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
			req.body.role = "super_admin";
			req.body.password = hash;
			Admin.create(req.body).then(superAdmin=>{
				res.send({status:"success", message:"super admin added"})
			}).catch(next)
		})
		}
	}).catch(next)
})

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
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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

router.post('/savePassword',
	check('password').exists().isLength({ min: 6}).withMessage('password length should be minimum 6 letters'),
	(req, res, next) => {
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
	
	User.findOne({handle:req.body.user.handle}).then(user1=>{
		if(!user1){
			res.send({status:"failure", message:"No user set."})
		}else{
			console.log(req.body,user1)
			if(req.body.user.otp === user1.otp)
			{
			let user = req.body.user
			bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
			//req.body.role = "user";
			user['password'] = hash;
			user['temporary'] = false
			user['followers'] = []
			user['following'] = []
			user['requests'] = []
			
			user['sent_requests'] = []
			user['_id'] = user1._id
			user['name'] = user1.handle
			user['email'] = `${user1.phone}@turftown.in`
			user['token'] =  jwt.sign({ id: user1._id, phone:user1.phone, role:"user", name:user1.handle }, config.secret);
			User.findOneAndUpdate({phone:user.phone},user).then(u=>{
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
	}).catch(next)
		})
		}else{
		return res.status(422).json({ errors: 'invalid otp'});
		}
	}
	}).catch(next)
})


router.post('/resetPassword',
	check('password').exists().isLength({ min: 6}).withMessage('password length should be minimum 6 letters'),
	(req, res, next) => {
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
	
	User.findOne({handle:req.body.user.handle}).then(user1=>{
		if(!user1){
			res.send({status:"failure", message:"No user set."})
		}else{
			console.log(req.body,user1)
			if(req.body.user.otp === user1.otp)
			{
			let user = req.body.user
			bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
			//req.body.role = "user";
			user['password'] = hash;
			user['temporary'] = false
			// user['followers'] = []
			// user['following'] = []
			// user['requests'] = []
			
			// user['sent_requests'] = []
			// user['_id'] = user1._id
			// user['name'] = user1.handle
			// user['email'] = `${user1.phone}@turftown.in`
			user['token'] =  jwt.sign({ id: user1._id, phone:user1.phone, role:"user", name:user1.handle }, config.secret);
			User.findOneAndUpdate({phone:user.phone},user).then(u=>{
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
	}).catch(next)
		})
		}else{
		return res.status(422).json({ errors: 'invalid otp'});
		}
	}
	}).catch(next)
})


router.post('/admin_login',
	(req, res, next) => {
	Admin.findOne({username:req.body.username},{reset_password_hash:0,reset_password_expiry:0,activity_log:0},null).populate("venue").then(admin=>{
		if(admin){
			if(admin.password){
				if(admin.status){
					bcrypt.compare(req.body.password, admin.password).then(function(response) {
						if(response){
							// Venue.find({_id:{$in:admin.venue}},{bank:0}).lean().then(venue=>{
							// console.log("ssss",venue)
							// admin["venue"] = venue
							var token = jwt.sign({ id: admin._id, username:admin.username, role:admin.role, name:admin.name}, config.secret);
							admin.password = undefined
							res.send({status:"success", message:"login success", token:token, role:admin.role,id:admin._id,data:admin})
							// })
							// ActivityLog(admin._id, admin.role, 'login', admin.username +" logged-in successfully")
						}else{
							res.send({status:"failed", message:"password incorrect"})
						}
					})
				}else{
					res.send({status:"failed", message:"Invalid Email id"})
				}
			}else{
				res.send({status:"failed", message:"Please Reset your password"})
			}
		}else{
			res.send({status:"failed", message:"admin doesn't exist"})
		}
	}).catch(next)
// }).catch(next)
})

router.post('/set_password',
	check('password').exists().isLength({ min: 6}).withMessage('password length should be minimum 6 letters'),
	(req, res, next) => {
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
	
	Admin.findOne({_id:req.body.userId},{reset_password_hash:0,reset_password_expiry:0,activity_log:0},null).populate("venue").then(admin=>{
		if(!admin){
			res.send({status:"failure", message:"No admin set."})
		}else{
			bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
			//req.body.role = "user";
			admin['password'] = hash;
			var token = jwt.sign({ id: admin._id, username:admin.username, role:admin.role, name:admin.name}, config.secret);
							//res.send({status:"success", message:"login success", token:token, role:admin.role,id:admin._id,data:admin})
							admin['token'] =  token
							Admin.findOneAndUpdate({_id:admin._id},admin).then(u=>{
								Admin.findOne({_id:admin._id},{reset_password_hash:0,reset_password_expiry:0,activity_log:0},null).populate("venue").then(admin=>{
					let lin = Object.assign({},admin)
					lin['password'] = undefined
				res.send({status:"success", message:"user added",data:lin})
			}).catch(next)
	}).catch(next)
		})
	}
	}).catch(next)
})
router.post('/login', (req, res, next) => {
	console.log('hit',req.body)
User.findOne({ $or: [ { handle: req.body.username }, { phone: req.body.username } ] },{reset_password_hash:0,reset_password_expiry:0,activity_log:0}).then(user=>{
	if(user){
		if(user.password){
			if(user.status){
				bcrypt.compare(req.body.password, user.password).then(function(response) {
					if(response){
						var token = jwt.sign({ id: user._id, name:user.handle, role:user.role, name:user.name}, config.secret);
						user.password = undefined
						user.token = token
						var count  = 0
      let game_completed_count = 0
			let mvp_count = 0
			req.userId = user._id
      Alert.find({user: req.userId,status:true},{}).lean().then(alert=> {
        Game.find({users: {$in:[req.userId]},completed:true}).lean().then(game=> {
					game_completed_count = game && game.length > 0 ? game.length : 0
          const aw = game && game.length > 0 && game.filter((a)=>{
           let f = a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id && sc.target_id.toString() === req.userId.toString()).length > 0 ? a.mvp.filter((sc)=>sc && sc.target_id.toString() === req.userId.toString()).length : 0
           mvp_count = mvp_count + f
           return a && a.mvp && a.mvp.length > 0 && a.mvp.filter((sc)=>sc && sc.target_id &&  sc.target_id.toString() === req.userId.toString()).length>0
          })
          //mvp_count = aw && aw.length > 0 ? aw.length : 0
          Conversation.find({ $or: [ { members: { $in: [req.userId] } },{ exit_list: { $elemMatch: {user_id:req.userId} } }] }).lean().populate('to',' name _id profile_picture last_active online_status status handle name_status').populate('members','name _id profile_picture last_active online_status status handle name_status').populate('exit_list.user_id','name _id profile_picture last_active online_status status handle name_status').populate('last_message').then(existingConversation=>{
        const exit_convo_list = existingConversation.filter((e)=> {
         return (e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id && a.user_id._id.toString() === req.userId.toString()).length > 0)
         } )
         const exit_convo_list1 = existingConversation.filter((e)=> {
           return !(e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((a)=> a && a.user_id && a.user_id._id && a.user_id._id.toString() === req.userId.toString()).length > 0)
           } )
        //const exit_convo_list1 = existingConversation.filter((e)=> e.exit_list && e.exit_list.length > 0 && e.exit_list.filter((u)=>u.user_id.toString() === req.userId.toString()).length > 0)
        //console.log(exit_convo_list)
        User.findOne({_id: req.userId},{activity_log:0,followers:0,following:0}).then(user=> {
           const date = user.last_active 
          Message.aggregate([{ $match: { $and: [  { conversation: {$in:exit_convo_list1.map((c)=>c._id)} } ] } },{"$group" : {"_id" : "$conversation", "time" : {"$push" : "$created_at"},"user" : {"$push" : "$author"}}}]).then((message)=>{
            let counter
            const x =  existingConversation.map((c)=> {
             let user = {}
             if(exit_convo_list && exit_convo_list.length > 0 && c.exit_list && c.exit_list.length > 0){
               const x =  exit_convo_list.filter((e)=> e.exit_list && c.exit_list.length>0 && e._id.toString() === c._id.toString())
               user  =  x.length > 0 ? x[0].exit_list.filter((e)=>{
                 return e && e.user_id &&  e.user_id._id && e.user_id._id.toString() === req.userId.toString()})[0] : []
              			c.members =  user && user.length > 0 && c.type==='single' ? c.members.concat(user.user_id) : c.members
						 }
             const filter = c && c.last_active ? c.last_active.filter((c)=> c && c.user_id && c.user_id.toString() === req.userId.toString()) : []
             message.length > 0 && message.map((m)=>{
                if(m && c && m._id.toString() === c._id.toString()) { 
                 const time = m.time.filter((timestamp,index)=>{ 
                   if( filter.length > 0 &&  moment(filter[0].last_active).isSameOrBefore(timestamp)&& m.user[index] && m.user[index].toString() !== req.userId.toString()) {
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
              console.log('coins',coins,req.userId);
            if (user) {
             user['total'] = count
               const alerts1 = alert && alert.length > 0 ? alert.filter(a=>moment(a.created_at).isAfter(user.last_active)) : []   
               user['alert_total'] = alerts1.length
               user['game_completed'] = game_completed_count
							 user['mvp_count'] = mvp_count
							 user['password'] = undefined
							 user['token'] = token
               user['refer_custom_value'] = 100
               user['refer_custom_value1'] = 50
               user['coins'] =  coins && coins.length > 0 && coins[0] && coins[0].amount ? coins[0].amount : 0
               user['level'] =  getLevel(250 * mvp_count + 100 * game_completed_count)
               res.status(201).send({status: "success", message: "login success",data:user})
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
       
					//	res.send({status:"success", message:"login success",data:user})
						// ActivityLog(admin._id, admin.role, 'login', admin.username +" logged-in successfully")
					}else{
						res.send({status:"failed", message:"Invalid username or password"})
					}
				})
			}else{
				
				res.send({status:"failed", message:"Invalid username or password"})
			//	res.send({status:"failed", message:"Invalid Email id"})
			}
		}else{
			res.send({status:"failed", message:"Invalid username or password"})

		//	res.send({status:"failed", message:"Invalid user"})
		}
	}else{
		res.send({status:"failed", message:"Invalid username or password"})

		//res.send({status:"failed", message:"admin doesn't exist"})
	}
}).catch(next)
})



////Forget Password
router.post('/forget_password', (req, res, next) => {
	Admin.findOne({username: req.body.email}).then(function(data) {
		if (data) {
			//Send mail
			var id = mongoose.Types.ObjectId();
			let mailBody = {
				name:data.name,
				link:process.env.DOMAIN+"reset-password/"+id
			}
			// ejs.renderFile('views/reset_password/reset_password.ejs',mailBody).then(html=>{
			// 	mail("support@turftown.in", req.body.email,"Reset Password","test",html,response=>{
			// 		if(response){
			// 			let body = {
			// 			reset_password_expiry:moment().add(1,"days"),
			// 			reset_password_hash:id
			// 			}
			// 			Admin.findOneAndUpdate({username: req.body.email},body).then(function(data) {
			// 				res.send({status:"success",message:"Reset password has been sent to the E-mail"})
			// 			}).catch(next);
			// 		}else{
			// 			res.status(409).send({status:"failed", message: "failed to send mail"});
			// 		}
			// 	})
			// }).catch(next)
			let html = "<h4>Please click here to reset your password</h4><a href="+process.env.DOMAIN+"reset-password/"+id+">Reset Password</a>"
			mail("support@turftown.in", req.body.email,"Reset Your Password","test",html,response=>{
				if(response){
								let body = {
								reset_password_expiry:moment().add(1,"days"),
								reset_password_hash:id
								}
								Admin.findOneAndUpdate({username: req.body.email},body).then(function(data) {
									res.send({status:"success",message:"Reset password has been sent to the E-mail"})
								}).catch(next);
							}else{
								res.status(409).send({status:"failed", message: "failed to send mail"});
							}
			})
		} else {
			res.status(409).send({status:"failed", message: "user doesn't exist"});
		}
	}).catch(next);
})

////Users
router.post('/users',
	verifyToken,
	AccessControl('users', 'read'),
	(req, res, next) => {
		User.find({},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
			res.send({status:"success", message:"users fetched", data:user})
	}).catch(next)
})

// let accessControl = AccessControl('super_admin', 'venue', 'read')

////Venue
router.post('/venue',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
		Venue.find({},{bank:0}).lean().then(venue=>{
			Offers.find({}).then(offers=>{

				let venues = Object.values(venue).map((value,index)=>{
					let rating = Object.values(value.rating).reduce((a,b)=>{
						let c = a+b.rating
						return c
					},0)
					value.rating = rating===0?0:rating/value.rating.length
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.offer = filteredOffer
					return value
				})
				res.status(201).send({status:"success", message:"venues fetched", data:venues})
		}).catch(next)
	}).catch(next)
})


////Venue
router.post('/get_venue/:id',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
		Venue.findOne({_id:req.params.id}).lean().then(venue=>{
			res.status(201).send({status:"success", message:"venue fetched", data:venue})
	}).catch(next)
})

router.post('/revenue_report_months1', verifyToken, (req, res, next) => {
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


router.post('/cancel_manager_booking1/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id}).then(booking=>{
    Venue.findById({_id:booking.venue_id}).then(venue=>{  
      Admin.findById({_id:req.userId}).then(admin=>{
      let role = req.role === "venue_staff" || req.role === "venue_manager"
      let date = new Date().addHours(8,30)
      let refund = req.body.refund_status
        if(booking.booking_type === "app" && (refund) && booking.transaction_id !== 'free_slot'){
          axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
          .then(response => {
            if(response.data.entity === "refund")
            {
              Booking.updateMany({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id},{$set:{booking_status:"cancelled", refunded: true, refund_status:true,cancelled_by:req.body.cancelled_by}},{multi:true}).then(booking=>{
                Booking.find({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id}).lean().populate("venue_data").then(booking=>{
                    Coins.find({ booking_id: req.params.id }).lean().then(coins => {
                      if (coins) {
                          Coins.deleteMany({ booking_id: req.params.id }).lean().then(coins => {
                          }).catch(next);
                        }
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
                    Game.findOne({'bookings.booking_id':req.params.id}).populate('users','name _id device_token').then(game=>{
                      Message.create({conversation:game.conversation,message:`Venue has cancelled this slot and a refund has been initiated.`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        const device_token_list=game && game.users && game.users.length> 0 ?game.users.map((e)=>e.device_token) : []
                       NotifyArray(device_token_list,'Venue has cancelled this slot and a refund has been initiated', `${game.name}`)
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            //getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                             
                      }).catch(next);
                    }).catch(next);
                  }).catch(next);
                      }).catch(next);
                        }else{
                          handleSlotAvailabilityWithCancellation(booking,req.socket)

                        }
                  SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                 // notifyRedirect(user,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)

                  //Send Mail
                  let obj = {
                    name:booking[0].name,
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
                  let to_emails = `${booking[0].email}, bookings@turftown.in`
                  ejs.renderFile('views/event_manager/venue_cancel_by_manager.ejs',obj).then(html=>{
                    mail("bookings@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        //res.send({status:"success"})
                      }else{
                        //res.send({status:"failed"})
                      }
                    })
                  }).catch(next)
    
                  //Activity Log
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
            }).catch(next)

            }
          }).catch(error => {
            console.log(error)
          }).catch(next);
        }else{

          Booking.find({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id}).lean().populate("venue_data").then(booking=>{
            Booking.updateMany({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id},{$set:{booking_status:"cancelled", refund_status:false,cancelled_by:req.body.cancelled_by}},{multi:true}).then(booking=>{
              Booking.find({booking_id:req.params.id,venue_id:req.body.venue_id,multiple_id:req.body.multiple_id}).lean().populate("venue_data").then(booking=>{
              
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
                    Game.findOne({'bookings.booking_id':req.params.id}).populate('users','name _id device_token').then(game=>{
                      Message.create({conversation:game.conversation,message:`Venue has cancelled this slot. There will be no refund as it is less than 6 hours to the scheduled time.`,name:'bot',read_status:true,read_by:req.userId,author:req.userId,type:'bot',created_at:new Date()}).then(message1=>{
                        const device_token_list=game && game.users && game.users.length> 0 ?game.users.map((e)=>e.device_token) : []
                       NotifyArray(device_token_list,'Venue has cancelled this slot. There will be no refund as it is less than 6 hours to the scheduled time.', `${game.name}`)
                        Conversation.findByIdAndUpdate({_id:game.conversation},{$set:{last_message:message1._id, last_updated:new Date()}}).then((m)=>{
                            //getGame(res,game.conversation,true,next,req)
                             handleSlotAvailabilityWithCancellation(booking,req.socket)
                             
                      }).catch(next);
                    }).catch(next);
                  }).catch(next);
                      }).catch(next);
                        }
                  else{
                          handleSlotAvailabilityWithCancellation(booking,req.socket)

                        }

                  if(booking[0].booking_type === "app" && !req.body.refund_status){
                  let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${booking_id} scheduled for ${datetime} at ${venue_name},${" "+venue_area} has been cancelled by the venue .\nStatus : Advance paid of Rs.${booking_amount} will be charged as a cancellation fee.\nPlease contact the venue ${venue.venue.contact} for more information.` //490759
                  let sender = "TRFTWN"
                  SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                 // notifyRedirect(user,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                  }
                  if(booking[0].booking_type === "app" && req.body.refund_status){
                    let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${booking_id} scheduled for ${datetime} at ${venue_name},${" "+venue_area}(${venue_type}) has been cancelled by the venue .\nStatus : Advance of Rs.${booking_amount} will be refunded within 3-4 working days.\nPlease contact the venue ${venue.venue.contact} for more information.` //491317
                    let sender = "TRFTWN"
                    SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                   // notifyRedirect(user,SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER)
                    }
                  else if(booking[0].booking_type === "web") {
                    let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${datetime} at ${venue_name},${" "+venue_area}(Sport:${sport_name_new}) has been cancelled. Please contact the venue for more info` ///491375
                    let sender = "TRFTWN"
                    SendMessage(phone,sender,SLOT_CANCELLED_BY_VENUE_MANAGER)
                  }

                  let obj = {
                    name:booking[0].name,
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
                  let to_emails = `${booking[0].email}, bookings@turftown.in`
                  ejs.renderFile('views/event_manager/venue_cancel_by_manager.ejs',obj).then(html=>{
                    mail("bookings@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        //res.send({status:"success"})
                      }else{
                        //res.send({status:"failed"})
                      }
                    })
                  }).catch(next)

    
                  //Activity Log
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
      }).catch(next);

        }
      })
      
    
  }).catch(next)
  }).catch(next)
})

router.post('/add_venue',
verifyToken,
AccessControl('venue', 'create'),
(req, res, next) => {
	req.body.created_by = req.username
	Venue.create(req.body).then(venue=>{
		if(venue.secondary_venue){
			let secondary_venue = {
				secondary_venue : true,
				secondary_venue_id : venue._id
			}
			Venue.findByIdAndUpdate({_id:venue.secondary_venue_id},secondary_venue).then(secondaryVenue=>{
				res.send({status:"success", message:"venue added", data:venue})
				ActivityLog(req.userId, req.role, 'venue created', req.name+" created venue "+venue.venue.name,venue_id)
			})
		}else{
			res.send({status:"success", message:"venue added", data:venue})
				ActivityLog(req.userId, req.role, 'venue created', req.name+" created venue "+venue.venue.name,venue_id)
		}
		}).catch(next)
})


router.put('/edit_venue/:id',
verifyToken,
AccessControl('venue', 'update'),
(req, res, next) => {
	req.body.modified_by = req.username
	req.body.modified_at = new Date()
	Venue.findById({_id:req.params.id}).lean().then(venue=>{
		// let merged_data = _.merge({},venue,req.body)
		req.body.multidelete('review','rating')
		Venue.findByIdAndUpdate({_id:req.params.id},req.body).then(venue=>{
			Venue.findById({_id:req.params.id}).then(venue=>{
				res.send({status:"success", message:"venue edited", data:venue})
				ActivityLog(req.userId, req.role, 'venue modified', req.name+" modified venue "+ venue.venue.name,venue_id)
			}).catch(next)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_venue/:id',
	verifyToken,
	AccessControl('venue', 'delete'),
	(req, res, next) => {
	Venue.findByIdAndRemove({_id:req.params.id},req.body).then(venue=>{
		Venue.find({}).then(venues=>{
			res.send({status:"success", message:"venue deleted", data:venues})
			ActivityLog(req.userId, req.role, 'venue deleted', req.name+" deleted venue "+ venue.venue.name,venue_id)
		}).catch(next)
	}).catch(next)
})


router.post('/check_admin/:id',
	(req, res, next) => {
	Admin.findOne({_id:req.params.id},null).then(admin=>{
		if(admin){
			res.send({status:"sucess", message:"admin exist"})
		}
		else{
			res.send({status:"failed", message:"admin doesn't exist"})
		}
	}).catch(next)
})


//// Venue Manager
router.post('/venue_manager',
	verifyToken,
	AccessControl('venue_manager', 'read'),
	(req, res, next) => {
	Admin.find({role:"venue_manager"},{activity_log:0}).lean().populate('venue','_id name venue type').then(venue=>{
		res.send({status:"success", message:"venue managers fetched", data:venue})
	}).catch(next)
})

router.post('/add_venue_manager',
	verifyToken,
	AccessControl('venue_manager', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Admin.findOne({username:req.body.username}).then(venueManager=>{
		if(venueManager){
			res.send({status:"failure", message:"Email-id already exist"})
		}else{
			req.body.role = "venue_manager";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			Admin.create(req.body).then(venueManager=>{
				var id = mongoose.Types.ObjectId();
				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				let mailBody = {
					name:data.name,
					link:reset_url
				}
				// ejs.renderFile('views/set_password/set_password.ejs',mailBody).then(html=>{search
				// 	mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
				// 		if(response){
				// 			let body = {
				// 			reset_password_expiry:moment().add(1,"days"),
				// 			reset_password_hash:id
				// 			}
				// 			// res.send({status:"success"})
				// 		}else{
				// 			// res.send({status:"failed"});
				// 		}
				// 	})
				// }).catch(next)
				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
					if(response){
					  res.send({status:"success"})
					}else{
					  res.send({status:"failed"})
					}
				})
				Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
					venueManager.venue = venue
					res.send({status:"success", message:"venue manager added", data:venueManager})
					ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.name+" created venue manager "+venueManager.name)
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})

router.put('/edit_venue_manager/:id',
	verifyToken,
	AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(venueManager=>{
		Admin.findById({_id:req.params.id}).lean().populate('venue','_id name venue type').then(venueManager=>{
			res.send({status:"success", message:"venue manager edited", data:venueManager})
			ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
})

router.delete('/delete_venue_manager/:id',
	verifyToken,
	AccessControl('venue_manager', 'delete'),
	(req, res, next) => {
		Admin.findByIdAndRemove({_id:req.params.id}).then(deletedVenueManager=>{
			Admin.find({},{activity_log:0}).then(venueManager=>{
			res.send({status:"success", message:"venue manager deleted", data:[]})
			ActivityLog(req.userId, req.username, req.role, 'venue manager deleted', req.name+" deleted venue manager "+deletedVenueManager.name)
		}).catch(next)
	}).catch(next)
})
// router.post('/add_venue_manager',
// 	verifyToken,
// 	AccessControl('venue_manager', 'create'),
// 	(req, res, next) => {
// 	req.body.created_by = req.username
// 	Admin.findOne({username:req.body.username}).then(venueManager=>{
// 		if(venueManager){
// 			res.send({status:"failure", message:"Email-id already exist"})
// 		}else{
// 			req.body.role = "venue_manager";
// 			req.body.reset_password_hash = mongoose.Types.ObjectId();
// 			req.body.reset_password_expiry = moment().add(1,"days")
// 			Admin.create(req.body).then(venueManager=>{
// 				var id = mongoose.Types.ObjectId();
// 				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
// 				let mailBody = {
// 					name:data.name,
// 					link:reset_url
// 				}
// 				// ejs.renderFile('views/set_password/set_password.ejs',mailBody).then(html=>{search
// 				// 	mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
// 				// 		if(response){
// 				// 			let body = {
// 				// 			reset_password_expiry:moment().add(1,"days"),
// 				// 			reset_password_hash:id
// 				// 			}
// 				// 			// res.send({status:"success"})
// 				// 		}else{
// 				// 			// res.send({status:"failed"});
// 				// 		}
// 				// 	})
// 				// }).catch(next)
// 				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
// 				mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
// 					if(response){
// 					  res.send({status:"success"})
// 					}else{
// 					  res.send({status:"failed"})
// 					}
// 				})
// 				console.log("Venueee",venueManager)
// 				VenueStaff.find({_id:{$in:venueManager.staff}},{_id:1, name:1, venue:1, type:1}).lean().then(staff=>{
// 				Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
// 					venueManager.venue = venue
// 					venueManager.staff = staff
// 					res.send({status:"success", message:"venue manager added", data:venueManager})
// 					// ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.name+" created venue manager "+venueManager.name)
// 				}).catch(next)
// 			}).catch(next)
// 		}).catch(next)
// 		}
// 	}).catch(next)
// })

router.post('/add_admin',
	verifyToken,
	(req, res, next) => {
	req.body.created_by = req.username
	Admin.findOne({username:req.body.username}).then(admin=>{
		if(admin){
			res.send({status:"failure", message:"Email-id already exist"})
		}else{
			// req.body.role = "admin";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			Admin.create(req.body).then(admin=>{
				var id = mongoose.Types.ObjectId();
				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				let mailBody = {
					name:data.name,
					link:reset_url
				}
				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				mail("stage@turftown.in", req.body.username,"Reset Password","test",html,response=>{
					if(response){
					  res.send({status:"success"})
					}else{
					  res.send({status:"failed"})
					}
				})
				// VenueStaff.find({_id:{$in:admin.staff}},{_id:1, name:1, venue:1, type:1}).lean().then(staff=>{
				Venue.find({_id:{$in:admin.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
					admin.venue = venue
					// admin.staff = staff
					res.send({status:"success", message:"venue manager added", data:admin})
				}).catch(next)
			}).catch(next)
		// }).catch(next)
		}
	}).catch(next)
})


router.put('/edit_admin/:id',
	verifyToken,
	// AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(admin=>{
		Admin.findById({_id:admin._id}).lean().populate('venue','_id name venue type').populate('staff','_id name').populate('manager','_id name') .then(admin=>{
			res.send({status:"success", message:"venue manager edited", data:admin})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
})

router.put('/edit_admin_manager/:id',
	verifyToken,
	// AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(admin=>{
		Admin.updateMany({},{$pull:{"manager":req.params.id}},{multi:true}).then((v)=>{
			Admin.updateMany({},{$push:{"staff":req.params.id}},{multi:true}).then((v)=>{
		Admin.findById({_id:admin._id}).lean().populate('venue','_id name venue type').populate('staff','_id name').populate('manager','_id name') .then(admin=>{
			res.send({status:"success", message:"venue manager edited", data:admin})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
	}).catch(next)
}).catch(next)

})

router.put('/edit_admin_staff/:id',
	verifyToken,
	// AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(admin=>{
		Admin.updateMany({},{$pull:{"staff":req.params.id}},{multi:true}).then((v)=>{
			Admin.updateMany({},{$push:{"manager":req.params.id}},{multi:true}).then((v)=>{
		Admin.findById({_id:admin._id}).lean().populate('venue','_id name venue type').populate('staff','_id name').populate('manager','_id name') .then(admin=>{
			res.send({status:"success", message:"venue manager edited", data:admin})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
}).catch(next)
}).catch(next)


})

router.put('/edit_admin_admin/:id',
	verifyToken,
	// AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(admin=>{
		Admin.updateMany({},{$pull:{"staff":req.params.id}},{multi:true}).then((v)=>{
			Admin.updateMany({},{$push:{"manager":req.params.id}},{multi:true}).then((v)=>{
		Admin.findById({_id:admin._id}).lean().populate('venue','_id name venue type').populate('staff','_id name').populate('manager','_id name') .then(admin=>{
			res.send({status:"success", message:"venue manager edited", data:admin})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
}).catch(next)
}).catch(next)


})



router.post('/admin_details',
	verifyToken,
	(req, res, next) => {
		Admin.find({role:req.body.role}).populate("venue").populate({path:"manager",populate:{path:'venue'}}).populate({path:"staff",populate:{path:'venue'}}).then(admin=>{

			// populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } })

			res.send({status:"success", message:"admin data fetched", data:admin})
	}).catch(next)
})



router.post('/get_admin_details/:id',
	verifyToken,
	(req, res, next) => {
		Admin.findById({_id:req.params.id}).populate({path:"manager",populate:{path:'venue'}}).populate({path:"staff",populate:{path:'venue'}}).then(admin=>{

			// populate({ path: 'game', populate: { path: 'conversation' , populate :{path:'last_message'} } })

			let data ={}
			data["staff"] = admin.staff
			data['manager'] = admin.manager
			res.send({status:"success", message:"admin data fetched", data:data})
	}).catch(next)
})


router.post('/get_manager_details/:id',
	verifyToken,
	(req, res, next) => {
		VenueManager.findById({_id:req.params.id}).populate("venue").populate('staff').then(venueManager=>{
			res.send({status:"success", message:"managers fetched", data:venueManager})
	}).catch(next)
})

router.post('/get_staff_details',
	verifyToken,
	(req, res, next) => {
		VenueStaff.findById({_id:req.params.id}).populate("venue").then(venueStaff=>{
			res.send({status:"success", message:"staff data fetched", data:venueStaff})
	}).catch(next)
})

router.post('/get_super_managers',
	verifyToken,
	(req, res, next) => {
		Admin.find({role:"admin"}).then(admin=>{
			res.send({status:"success", message:"managers fetched", data:admin})
	}).catch(next)
})
router.delete('/delete_admin/:id',
	verifyToken,
	(req, res, next) => {
		Admin.findByIdAndRemove({_id:req.params.id}).then(deletedAdmin=>{
			Admin.find({},{activity_log:0}).then(admin=>{
			res.send({status:"success", message:"admin deleted", data:[]})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager deleted', req.name+" deleted venue manager "+deletedVenueManager.name)
		}).catch(next)
	}).catch(next)
})


router.post('/add_venue_manager',
	verifyToken,
	AccessControl('venue_manager', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Admin.findOne({username:req.body.username}).then(venueManager=>{
		if(venueManager){
			res.send({status:"failure", message:"Email-id already exist"})
		}else{
			req.body.role = "venue_manager";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			Admin.create(req.body).then(venueManager=>{
				var id = mongoose.Types.ObjectId();
				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				let mailBody = {
					name:data.name,
					link:reset_url
				}
				// ejs.renderFile('views/set_password/set_password.ejs',mailBody).then(html=>{search
				// 	mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
				// 		if(response){
				// 			let body = {
				// 			reset_password_expiry:moment().add(1,"days"),
				// 			reset_password_hash:id
				// 			}
				// 			// res.send({status:"success"})
				// 		}else{
				// 			// res.send({status:"failed"});
				// 		}
				// 	})
				// }).catch(next)
				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
					if(response){
					  res.send({status:"success"})
					}else{
					  res.send({status:"failed"})
					}
				})
				Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
					venueManager.venue = venue
					res.send({status:"success", message:"venue manager added", data:venueManager})
					ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.name+" created venue manager "+venueManager.name)
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})
router.post('/add_venue_manager1',
	verifyToken,
	AccessControl('venue_manager', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	VenueManager.findOne({username:req.body.username}).then(venueManager=>{
		if(venueManager){
			res.send({status:"failure", message:"Email-id already exist"})
		}else{
			req.body.role = "venue_manager";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			VenueManager.create(req.body).then(venueManager=>{
				var id = mongoose.Types.ObjectId();
				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				let mailBody = {
					name:data.name,
					link:reset_url
				}
				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
					if(response){
					  res.send({status:"success"})
					}else{
					  res.send({status:"failed"})
					}
				})
				console.log("Venueee",venueManager)
				VenueStaff.find({_id:{$in:venueManager.staff}},{_id:1, name:1, venue:1, type:1}).lean().then(staff=>{
				Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
					venueManager.venue = venue
					venueManager.staff = staff
					res.send({status:"success", message:"venue manager added", data:venueManager})
					// ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.name+" created venue manager "+venueManager.name)
				}).catch(next)
			}).catch(next)
		}).catch(next)
		}
	}).catch(next)
})

router.put('/edit_venue_manager1/:id',
	verifyToken,
	// AccessControl('venue_manager', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	VenueManager.findByIdAndUpdate({_id:req.params.id},req.body).then(venueManager=>{
		VenueManager.findById({_id:req.params.id}).lean().populate('venue','_id name venue type').populate('staff','_id name').then(venueManager=>{
			res.send({status:"success", message:"venue manager edited", data:venueManager})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.name+" modified venue manager "+venueManager.name)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_venue_manager1/:id',
	verifyToken,
	// AccessControl('venue_manager', 'delete'),
	(req, res, next) => {
		VenueManager.findByIdAndRemove({_id:req.params.id}).then(deletedVenueManager=>{
			res.send({status:"success", message:"venue manager deleted", data:[]})
			// ActivityLog(req.userId, req.username, req.role, 'venue manager deleted', req.name+" deleted venue manager "+deletedVenueManager.name)
	}).catch(next)
})

//// Venue Staff
router.post('/venue_staff',
	verifyToken,
	AccessControl('venue_staff', 'read'),
	(req, res, next) => {
		VenueStaff.find({role:"venue_staff"}).then(venueStaff=>{
			res.send({status:"success", message:"venue staffs fetched", data:venueStaff})
	}).catch(next)
})

router.post('/add_venue_staff',
	verifyToken,
	AccessControl('venue_staff', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	VenueStaff.findOne({username:req.body.username}).then(venueStaff=>{
		if(venueStaff){
			res.send({status:"failure", message:"username already exist"})
		}else{
			req.body.role = "venue_staff";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			VenueStaff.create(req.body).then(venueStaff=>{
				var id = mongoose.Types.ObjectId();
				// let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				// let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				// mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
				// 	if(response){
				// 	  res.send({status:"success"})
				// 	}else{
				// 	  res.send({status:"failed"})
				// 	}
				// })
				res.send({status:"success", message:"venue staff added", data:venueStaff})
				// ActivityLog(req.userId, req.username, req.role, 'venue staff created', req.name+" created venue staff "+venueStaff.name)
			}).catch(next)
		} 
	}).catch(next)
})


router.put('/edit_venue_staff/:id',
	verifyToken,
	// AccessControl('venue_staff', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	VenueStaff.findByIdAndUpdate({_id:req.params.id},req.body).then(venueStaff=>{
		VenueStaff.findById({_id:req.params.id}).populate('venue','_id name venue type').then(venueStaff=>{
			res.send({status:"success", message:"venue staff edited", data:venueStaff})
			// ActivityLog(req.userId, req.username, req.role, 'venue staff modified', req.name+" modified venue staff "+venueStaff.name)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_venue_staff/:id',
	verifyToken,
	// AccessControl('venue_staff', 'delete'),
	(req, res, next) => {
		VenueStaff.findByIdAndRemove({_id:req.params.id},req.body).then(deletedVenueStaff=>{
			VenueStaff.find({}).then(venueStaff=>{
				res.send({status:"success", message:"venue staff deleted", data:venueStaff})
				// ActivityLog(req.userId, req.username, req.role, 'venue staff deleted', req.name+" deleted venue staff "+deletedVenueStaff.name)
		}).catch(next)
	}).catch(next)
})

//// Event
// router.post('/event',
// 	verifyToken,
// 	// AccessControl('event', 'read'),
// 	(req, res, next) => {
// 	Event.find({status:true}).lean().populate('venue').then(event=>{
// 		Offers.find({}).then(offers=>{
// 				let filteredOffer = Object.values(offers).filter(offer=>offer.event.indexOf(event._id)!== -1)
// 				event.offer = filteredOffer
// 			res.send({status:"success", message:"events fetched", data:event})
// 		}).catch(next)
// 	}).catch(next)
// })

router.post('/check_admin/:id',
	(req, res, next) => {
	Admin.findOne({_id:req.params.id},null).then(admin=>{
		if(admin){
			res.send({status:"sucess", message:"admin exist"})
		}
		else{
			res.send({status:"failed", message:"admin doesn't exist"})
		}
	}).catch(next)
})



router.post('/check_password/:id',
	(req, res, next) => {
	Admin.findOne({_id:req.params.id}).then(admin=>{
		console.log("Admina",admin)
		if(admin){
			bcrypt.compare(req.body.password, admin.password).then(function(result) {
				console.log("eee",result)
				if(result){
					res.send({status:"sucess", message:"password verified successfully"})
				}
				else {
					res.send({status:"failed", message:"incorrect credentials"})
				}
			});
		}
		else{
			res.send({status:"failed", message:"admin doesn't exist"})
		}
	}).catch(next)
})

//// Event
router.post('/event',
	verifyToken,
	// AccessControl('event', 'read'),
	(req, res, next) => {
	Event.find({status:true}).lean().populate('venue').then(event=>{
		Offers.find({}).then(offers=>{
			Object.values(event).map((key)=>{
				Object.values(key.venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.offers = filteredOffer
					return value
				})
			})
			res.send({status:"success", message:"events fetched", data:event})
		}).catch(next)
	}).catch(next)
})

router.post('/admin_event',
	verifyToken,
	// AccessControl('event', 'read'),
	(req, res, next) => {
	Event.find({}).lean().populate('venue').then(event=>{
		Offers.find({}).then(offers=>{
				let filteredOffer = Object.values(offers).filter(offer=>offer.event.indexOf(event._id)!== -1)
				event.offer = filteredOffer
			res.send({status:"success", message:"events fetched", data:event})
		}).catch(next)
	}).catch(next)
})



router.post('/add_event',
	verifyToken,
	AccessControl('event', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Event.create(req.body).then(event=>{
		res.send({status:"success", message:"event added", data:event})
		// ActivityLog(req.userId, req.role, 'event created', req.name+" created event "+event.event.name)
	}).catch(next)
})

router.post('/get_event',
	verifyToken,
	(req, res, next) => {
	Event.findById({_id:req.body.id,status:true}).populate('venue').then(event=>{
		console.log(event)
		Offers.find({event:{$in:[req.body.id]}}).then((f)=>{
			if(f.length > 0){
				event['offer'] = f
			}
			if(moment(event.start_date).format('YYYYMMDD') > moment().format('YYYYMMDD')){
				res.send({status:"success", message:"event fetched", data:event})
			}else{
				res.send({status:"success", message:"event passed"})

			}

		// ActivityLog(req.userId, req.role, 'event created', req.name+" created event "+event.event.name)
	}).catch(next)
}).catch(next)

})


router.put('/edit_event/:id',
	verifyToken,
	AccessControl('event', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	req.body.modified_at = new Date()
	Event.findByIdAndUpdate({_id:req.params.id},req.body).then(event=>{
		Event.findById({_id:req.params.id}).lean().populate('venue','_id name venue type').then(event=>{
			res.send({status:"success", message:"event edited", data:event})
			// ActivityLog(req.userId, req.role, 'event modified', req.name+" modified event "+ event.event.name)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_event/:id',
	verifyToken,
	AccessControl('event', 'delete'),
	(req, res, next) => {
	Event.findByIdAndRemove({_id:req.params.id},req.body).then(event=>{
		Event.find({}).then(event=>{
			res.send({status:"success", message:"event deleted", data:event})
			// ActivityLog(req.userId, req.role, 'event deleted', req.name+" deleted event "+event.event.name)
		}).catch(next)
	}).catch(next)
})

//// Coupon
router.post('/coupon',
	verifyToken,
	AccessControl('coupon', 'read'),
	(req, res, next) => {
	Coupon.find({}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(coupon=>{
		res.send({status:"success", message:"coupons fetched", data:coupon})
	}).catch(next)
})

////Venue List based on coupon
router.post('/venue_list_by_coupon',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
	Coupon.findOne({code:req.body.code}).then(coupon=>{
		let arr = (coupon.venue).map(ele => new mongoose.Types.ObjectId(ele));
		Venue.find({_id:{$in:arr}},{bank:0}).lean().then(venue=>{
			// let venues = Object.values(venue).map((value,index)=>{
			//     let rating = Object.values(value.rating).reduce((a,b)=>{
			//         let c = a+b.rating
			//         return c
			//     },0)
			//     value.rating = rating===0?0:rating/value.rating.length
			//     return value
			// })
			res.status(201).send({status:"success", message:"venues fetched", data:venue})

		}).catch(next)
	}).catch(next)
})

////Coupon list based on venue
router.post('/coupon_list_by_venue/:id',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
		let filter = {
			venue:{$elemMatch:{$eq:req.params.id}},
			event:{$elemMatch:{$eq:req.params.id}}
		}
		
	Coupon.find({ $or: [{venue:{$elemMatch:{$eq: req.params.id}}}, {event:{$elemMatch:{$eq:req.params.id}}}]}).then(coupon=>{
		res.status(201).send({status:"success", message:"coupons fetched", data:coupon})
	}).catch(next)
})

////Venue List based on coupon
router.post('/venue_list_by_id',
	verifyToken,
	//AccessControl('venue', 'read'),
	(req, res, next) => {

	Venue.find({_id:{$in:req.body.venue}},{bank:0}).lean().then(venue=>{
		// let venues = Object.values(venue).map((value,index)=>{
		//     let rating = Object.values(value.rating).reduce((a,b)=>{
		//         let c = a+b.rating
		//         return c
		//     },0)
		//     value.rating = rating===0?0:rating/value.rating.length
		//     return value
		// })
		res.status(201).send({status:"success", message:"venues fetched", data:venue})

	}).catch(next)
})


router.post('/add_coupon',
	verifyToken,
	AccessControl('coupon', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Coupon.find({code:req.body.code}).lean().then(coupon=>{
		if(coupon && coupon.length > 0){
			res.status(409).send({status:"failed", message:"coupon already exist"});
		}else{
			Coupon.create(req.body).then(coupon=>{
				Coupon.findById({_id:coupon._id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(coupon=>{
					res.send({status:"success", message:"coupon added", data:coupon})
					// ActivityLog(req.userId, req.role, 'coupon created', req.name+" created coupon "+coupon.title)
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})


router.put('/edit_coupon/:id',
	verifyToken,
	AccessControl('coupon', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	req.body.modified_at = new Date()
	Coupon.findByIdAndUpdate({_id:req.params.id},req.body).then(coupon=>{
		Coupon.findById({_id:req.params.id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(coupon=>{
			res.send({status:"success", message:"coupon edited", data:coupon})
			// ActivityLog(req.userId, req.role, 'coupon modified', req.name+" modified coupon "+coupon.title)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_coupon/:id',
	verifyToken,
	AccessControl('coupon', 'delete'),
	(req, res, next) => {
	Coupon.findByIdAndRemove({_id:req.params.id},req.body).then(coupon=>{
		Coupon.find({}).then(coupon=>{
			res.send({status:"success", message:"coupon deleted", data:coupon})
			// ActivityLog(req.userId, req.role, 'coupon deleted', req.name+" deleted coupon "+coupon.title)
		}).catch(next)
	}).catch(next)
})

router.post('/coupon_check',
	verifyToken,
	AccessControl('coupon', 'read'),
	(req, res, next) => {
	Coupon.findOne({code:req.body.code}).then(coupon=>{
		if(coupon){
			res.send({status:"success", message:"coupon can be used", data:coupon})
		}else{
			res.send({status:"failed", message:"no coupon exist"})
		}
	}).catch(next)
})

//Upload Venue Display Picture
router.post('/venue_display_picture',
verifyToken,
	AccessControl('venue', 'create'),
	(req, res, next) => {
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
		pathLocation = "assets/images/venues/"
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
					message: "venue display picture uploaded"
			})
		})
	});
});

//Upload Venue Display Picture
router.post('/venue_cover_picture',verifyToken,AccessControl('venue', 'create'), (req, res, next) => {
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
		pathLocation = "assets/images/venues/"
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
					message: "venue cover picture uploaded"
			})
		})
	});
});

//Upload Event Picture
router.post('/event_picture',
verifyToken,
AccessControl('event', 'create'),
(req, res, next) => {
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
		pathLocation = "assets/images/events/"
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
					message: "event picture uploaded"
			})
		})
	});
});

//Upload Event Picture
router.post('/upload_cheque',
verifyToken,
AccessControl('venue', 'create'),
(req, res, next) => {
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
		pathLocation = "assets/images/cheque/"
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
					message: "cheque uploaded"
			})
		})
	});

});



//// Global Search
// router.post('/search',
// 	verifyToken,
// 	AccessControl('venue', 'read'),
// 	(req, res, next) => {
// 	Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
// 		Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" }}).lean().populate('venue').then(event=>{
			
// 			let combinedResult
// 			if(venue){
// 				combinedResult = venue.concat(event);
// 			}else{
// 				combinedResult = event
// 			}
// 			res.send({status:"success", message:"venues and events fetched based on search", data:combinedResult})
// 		}).catch(next)
// 	}).catch(next)
// })

// router.post('/search',
// 	verifyToken,
// 	AccessControl('venue', 'read'),
// 	(req, res, next) => {
// 	Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
// 		Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" }}).lean().populate('venue').then(event=>{
// 			Offers.find({}).then(offers=>{
// 			let combinedResult
// 			if(venue){
// 				let list = Object.values(venue).map((value,index)=>{
// 					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
// 					value.offers = filteredOffer
// 					return value
// 				})
// 				combinedResult = list.concat(event);
// 			}else{
// 				combinedResult = event
// 			}				
// 			res.send({status:"success", message:"venues and events fetched based on search", data:combinedResult})
// 		}).catch(next)
// 	}).catch(next)
// }).catch(next);
// })


router.post('/get_venue_offer_value/:id',verifyToken,(req,res,next)=>{
		Offers.find({venue:[req.params.id]}).then(offers=>{
			res.send({status:"success", message:"offers fetched", data:offers})
}).catch(next)

})
router.post('/search1',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
	User.find({$and:[{ $or: [{"name":{ "$regex": req.body.search, "$options": "i" }}, {"handle":{ "$regex": req.body.search, "$options": "i"}}]},{'handle':{$exists:true,$ne:null }} ]},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
		Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" },status:true}).then(venue=>{
		Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" },status:true,"start_date":{$gte:new Date()}}).lean().populate('venue').then(event=>{
			Offers.find({}).then(offers=>{
			let combinedResult
			let list = []
			Object.values(event).map((key)=>{
				Object.values(key.venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.offers = filteredOffer
					return value
				})
			})
			if(venue){
					list = Object.values(venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.rating = value.rating
					value.offers = filteredOffer
					return value
				})
				combinedResult = list.concat(event);
			}else{
				combinedResult = event
			}
			let finalResult = [...combinedResult,...user]
			if(finalResult && finalResult.length > 0){
				res.send({status:"success", message:"venues and events fetched based on search", data:{error:false,error_description:'',venue:list,event:event,user:user}})
			}else
			res.send({status:"success", message:"empty list",data:{error:true,error_description:'No Results found'}})
		}).catch(next)
	}).catch(next)
}).catch(next);
}).catch(next)

})


router.post('/search',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
	Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
		Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" }}).lean().populate('venue').then(event=>{
			Offers.find({}).then(offers=>{
			let combinedResult
			Object.values(event).map((key)=>{
				Object.values(key.venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.offers = filteredOffer
					return value
				})
			})
			if(venue){
					let list = Object.values(venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.rating = value.rating
					value.offers = filteredOffer
					return value
				})
				combinedResult = list.concat(event);
			}else{
				combinedResult = event
			}			
			res.send({status:"success", message:"venues and events fetched based on search", data:combinedResult})
		}).catch(next)
	}).catch(next)
}).catch(next);
})


router.post('/search_venue',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
		

		Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
			Offers.find({}).then(offers=>{
			let combinedResult
			if(venue){
				
					let list = Object.values(venue).map((value,index)=>{
					let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
					value.rating = value.rating
					value.offers = filteredOffer
					console.log("Aaa",value)
					let pricing = Object.values(value.configuration.pricing).filter(price=>price.day===findDay())
					let highestPricing = getPrice(pricing[0].rate)
					let types = pricing[0].rate[0].types
					value.pricing = Math.round(getValue(value.configuration.base_type,highestPricing,types))
					return value

				})
				combinedResult = list;
			}
			let finalResult = [...combinedResult]
			res.send({status:"success", message:"venues fetched based on search", data:finalResult})
		}).catch(next)
	}).catch(next)
})

router.post('/search_users',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
	 User.find({$and:[{_id:{$nin:[req.userId]}},{ $or: [{"name":{ "$regex": req.body.search, "$options": "i" }},{"handle":{ "$regex": req.body.search, "$options": "i" }}]}, {'handle':{$exists:true,$ne:null }}]}).select("name handle _id name_status profile_picture following visibility").then(user=>{		
		//User.find({$and:[{_id:{$nin:[req.userId]}},{ $or: [{"name":{ "$regex": req.body.search, "$options": "i" }}, {"handle":{ "$regex": req.body.search, "$options": "i" }},]}]},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
			//User.find({$and:[{ $or: [{"name":{ "$regex": req.body.search, "$options": "i" }}, {"handle":{ "$regex": req.body.search, "$options": "i"}}]},{'handle':{$exists:true,$ne:null }} ]},{__v:0,token:0,otp:0,activity_log:0}).then(user=>{
		let finalResult = user
			console.log(finalResult.length)
			res.send({status:"success", message:"venues and events fetched based on search", data:finalResult})
		}).catch(next)
})

//// Support
router.post('/support',
	verifyToken,
	AccessControl('support', 'create'),
	(req, res, next) => {
		Support.create(req.body).then(support=>{
			let html = "<h4><b>E-mail: </b>"+req.body.email+"</h4><h4><b>Phone: </b>"+req.body.phone+"</h4>"+"<h4><b>Name: </b>"+req.body.name+"</h4>"+"<h4><b>Venue Name: </b>"+req.body.venue_name+"</h4>"+"<h4><b>Message: </b>"+req.body.message+"</h4>"
			mail(req.body.email,"support@turftown.in","Support "+req.body.venue_name,req.body.message,html,response=>{
				if(response){
					res.send({status:"success", message:"support request raised"})
				}else{
					res.send({status:"failed"})
				}
				},req.body.name)
		}).catch(next)
})

router.post('/support_email/:id',
	verifyToken,
	AccessControl('support', 'create'),
	(req, res, next) => {
		User.findById({_id:req.params.id},{activity_log:0}).then(user=>{
			console.log("user",user)
			if(user){
				let otp  = Math.floor(999 + Math.random() * 9000);
				let html = "<h4><b>Hey "+user.name+"</b></h4><h4>Your otp is "+otp+"</h4>"
				mail("support@turftown.in",req.body.email,"Email Verification Support",'',html,response=>{
				if(response){
					res.send({status:"success", message:"support request raised",data:{otp:otp,email:req.body.email}})
				}else{
					res.send({status:"failed"})
				}
				},req.body.name)
			}
			
		}).catch(next)
})


router.post('/contact',
	(req, res, next) => {
		Support.create(req.body).then(support=>{
			let html = "<h4><b>E-mail: </b>"+req.body.email+"</h4><h4><b>Phone: </b>"+req.body.phone+"</h4>"+"<h4><b>Name: </b>"+req.body.name+"</h4>"+"<h4><b>Venue Name: </b>"+req.body.venue_name+"</h4>"+"<h4><b>Message: </b>"+req.body.message+"</h4>"
			mail(req.body.email,"support@turftown.in","Support "+req.body.venue_name,req.body.message,html,response=>{
				if(response){
					res.send({status:"success", message:"support request raised"})
				}else{
					res.send({status:"failed"})
				}
				},req.body.name)
		}).catch(next)
})


//// Ads
router.post('/ads',
	verifyToken,
	AccessControl('ads', 'create'),
	(req, res, next) => {
	Ads.create(req.body).lean().populate('event','_id event type').populate('venue','_id name venue type').then(ads=>{
		res.send({status:"success", message:"message sent", data:ads})
	}).catch(next)
})


//Upload Ad Picture
router.post('/cover_picture',
verifyToken,
AccessControl('ads', 'create'),
(req, res, next) => {
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
		pathLocation = "assets/images/custom/"
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
					message: "ad uploaded"
			})
		})
	});
});


//// Ads
router.post('/ads_list',
	verifyToken,
	AccessControl('ads', 'read'),
	(req, res, next) => {
	Ads.find({}).lean().populate('event').populate('venue').then(ads=>{
		res.send({status:"success", message:"ads fetched", data:ads})
	}).catch(next)
})




//// Create ad
router.post('/create_ad',
	verifyToken,
	AccessControl('ads', 'create'),
	(req, res, next) => {
	Ads.find({status:true}).then(ads=>{
		let check_start_date = moment(req.body.start_date).format("YYYY-MM-DD")
		let check_end_date = moment(req.body.end_date).format("YYYY-MM-DD")
		let check_position = ads.filter(ad=>ad.position===req.body.position && ad.sport_type === req.body.sport_type && ad.page === req.body.page && (moment(check_start_date).isBetween(moment(ad.start_date).format("YYYY-MM-DD"),moment(ad.end_date).format("YYYY-MM-DD"),null,[]) || moment(check_end_date).isBetween(moment(ad.start_date).format("YYYY-MM-DD"),moment(ad.end_date).format("YYYY-MM-DD"),null,[]) ))
		if(check_position.length > 0){
			existing_positions = []
			check_position.map(ad=>{
				let x =  'position: '+ad.position.toString()+" already exists in  "+ad.page+' in sport '+ad.sport_type
				existing_positions.push(x)
			})
			res.send({status:"failed", message: existing_positions[0], existing_positions})
		}
		else{
			Ads.create(req.body).then(ads=>{
				Ads.findById({_id:ads.id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(ads=>{
					res.send({status:"success", message:"ad created", data:ads})
					ActivityLog(req.userId, req.role, 'ad created', req.name+" created ad ")
				}).catch(next)
			}).catch(next)
		}
	}).catch(next)
})

//// Edit ad
router.post('/edit_ad/:id',
	verifyToken,
	AccessControl('ads', 'update'),
	(req, res, next) => {
	req.body.modified_at = new Date()
	req.body.modified_by = req.username
	Ads.find({status:true}).then(ads=>{
	let check_start_date = moment(req.body.start_date).format("YYYY-MM-DD")
	let check_end_date = moment(req.body.end_date).format("YYYY-MM-DD")
	let check_position = ads.filter(ad=>ad.position===req.body.position && ad.sport_type === req.body.sport_type && ad.page === req.body.page && AdsValidation(ad,req) )
	if(check_position.length > 0){
		existing_positions = []
		check_position.map(ad=>{
			let x =  'position: '+ad.position.toString()+" already exists in  "+ad.page+' in sport '+ad.sport_type
			existing_positions.push(x)
		})
		res.send({status:"failed", message: existing_positions[0]})
	}
	else {
	Ads.findByIdAndUpdate({_id:req.params.id}, req.body).then(ads=>{
		Ads.findById({_id:req.params.id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(ads=>{
			res.send({status:"success", message:"ad modified", data:ads})
			// ActivityLog(req.userId, req.role, 'ad modified', req.name+" modified ad ")
		}).catch(next) 
	}).catch(next)
}
}).catch(next)
})

//// Delete ad
router.delete('/delete_ad/:id',
	verifyToken,
	AccessControl('ads', 'delete'),
	(req, res, next) => {
	Ads.findByIdAndRemove({_id:req.params.id}).then(ads=>{
		res.send({status:"success", message:"ad deleted"})
		// ActivityLog(req.userId, req.role, 'ad deleted', req.name+" deleted ad ")
	}).catch(next)
})


router.post('/offers_list',
	verifyToken,
	//AccessControl('offers', 'read'),
	(req, res, next) => {
	Offers.find({}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(offers=>{
		res.send({status:"success", message:"offers fetched", data:offers})
	}).catch(next)
})

router.post('/offers_list_by_venue',
	//verifyToken,
	//AccessControl('offers', 'read'),
	(req, res, next) => {
		console.log('pass')
	Offers.find({"venue":{$in:[req.body.id]}}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(offers=>{
		res.send({status:"success", message:"offers fetched", data:offers})
	}).catch(next)
})


router.post('/offers/:id',
	verifyToken,
	AccessControl('offers', 'read'),
	(req, res, next) => {
	Offers.findById({_id:req.params.id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(offers=>{
		res.send({status:"success", message:"offers fetched", data:offers})
	}).catch(next)
})

//// Create ad
router.post('/create_offer',
	verifyToken,
	AccessControl('offers', 'create'),
	(req, res, next) => {
		Offers.find({venue:{$in:req.body.venue},start_date:{$lte:req.body.start_date},end_date:{$gte:req.body.end_date},status:true}).then(offers=>{
			let title_check = offers.filter(value=>value.title===req.body.title)
			if(offers.length>=2){
				res.send({status:"failed",message:"Offers limit reached"})
			}else
			 if(title_check.length){
				res.send({status:"failed",message:"Offer title already exist"})
			}else{
				Offers.create(req.body).then(offers=>{
					Offers.findById({_id:offers._id}).then(offers=>{
						res.send({status:"success", message:"offer created", data:offers})
						ActivityLog(req.userId, req.role, 'offer created', req.name+" created offer "+offers.title,req.body.venue[0])
					}).catch(next)
				}).catch(next)
			}
		}).catch(next)
	})

//// Edit ad
router.post('/edit_offer/:id',
	verifyToken,
	AccessControl('offers', 'update'),
	(req, res, next) => {
	req.body.modified_at = new Date()
	req.body.modified_by = req.username
	Offers.findByIdAndUpdate({_id:req.params.id}, req.body).then(offers=>{
		Offers.findById({_id:req.params.id}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(offers=>{
			res.send({status:"success", message:"offer modified", data:offers})
			ActivityLog(req.userId, req.role, 'offer modified', req.name+" modified offer "+offers.title,offers.venue[0])
		}).catch(next)
	}).catch(next)
})

//// Delete ad
router.post('/delete_offer/:id',
	verifyToken,
	AccessControl('offers', 'delete'),
	(req, res, next) => {
	Offers.findByIdAndRemove({_id:req.params.id}).then(offers=>{
		res.send({status:"success", message:"offer deleted"})
		ActivityLog(req.userId, req.role, 'offer deleted', req.name+" deleted offer "+offers.title,offers.venue[id])
	}).catch(next)
})

router.post('/activity_logs/:id',
	verifyToken,
	(req, res, next) => {
	Admin.find({venue:{$in:[req.params.id]}}).then(admins=>{
		let activity_logs = []
		admins.map(admin=>{
			let activity = admin.activity_log.filter(value=>{
				if(value.venue_id===req.params.id){
					return value
				}
			})
			activity_logs.push(activity)
		})
		res.send({status:"success", message:"activity logs fetched", data:activity_logs})
	}).catch(next)
})

router.post('/reset_password',
	(req, res, next) => {
		Admin.findOne({reset_password_hash:req.body.reset_password_hash}).then(venueStaff=>{
			if(venueStaff){
					bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
						Admin.findOneAndUpdate({reset_password_hash:req.body.reset_password_hash},{password:hash}).then(admin=>{
							mail("support@turftown.in", venueStaff.username,"Password has been Reset Succesfully","Your Password has been Reset Successfully","",response=>{
								if(response){
								  console.log({status:"success"})
								}else{
								  console.log({status:"failed"})
								}
								res.send({status:"success", message:"password changed"})
							})
							ActivityLog(venueStaff._id, venueStaff.username, venueStaff.role, 'password changed', venueStaff.username+" changed password")
						})
					})
			}else{
				res.status(409).send({status:"failed", message:"incorrect credentials"})
			}
	}).catch(next)
})

//Booking History
router.post('/venue_event_list', (req, res, next) => {
  Venue.find({status:true},{configuration:0,bank:0,access:0},null).then(venues=>{
	Event.find({status:true},{configuration:0,bank:0,access:0},null).then(events=>{
	  let data = {
		  venues,
		  events
	  }
	  res.send({status:"success", message:"venues and event fetched", data})
	})
  })
})

//// Ads
router.post('/booking_completed_list',
	verifyToken,
	AccessControl('booking', 'read'),
	(req, res, next) => {
	Booking.find({booking_status:"completed", booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(bookings=>{
		res.send({status:"success", message:"bookings fetched", data:bookings})
	}).catch(next)
})

// router.get('/test_dir',
// 	(req, res, next) => {
// 		console.log("Going to create directory /tmp/test");
// 		fs.mkdir('assets/profile',{ recursive: true },function(err) {
// 			 if (err) {
// 					return console.error(err);
// 			 }
// 		});
// })


module.exports = router;
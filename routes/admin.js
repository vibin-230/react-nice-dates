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

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Booking = require('../models/booking');
const Admin = require('../models/admin');
const Event = require('../models/event');
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

router.post('/admin_login',
	(req, res, next) => {
	Admin.findOne({username:req.body.username},{reset_password_hash:0,reset_password_expiry:0,activity_log:0},null).then(admin=>{
		if(admin){
			if(admin.password){
				if(admin.status){
					bcrypt.compare(req.body.password, admin.password).then(function(response) {
						if(response){
							var token = jwt.sign({ id: admin._id, username:admin.username, role:admin.role, name:admin.name}, config.secret);
							admin.password = undefined
							res.send({status:"success", message:"login success", token:token, role:admin.role,id:admin._id,data:admin})
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
		User.find({},{__v:0,token:0,otp:0}).then(user=>{
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
		Venue.findOne({_id:req.params.id},{bank:0}).lean().then(venue=>{
			res.status(201).send({status:"success", message:"venue fetched", data:venue})
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



//// Venue Manager
router.post('/venue_manager',
	verifyToken,
	AccessControl('venue_manager', 'read'),
	(req, res, next) => {
	Admin.find({role:"venue_manager"}).lean().populate('venue','_id name venue type').then(venue=>{
		res.send({status:"success", message:"venue managers fetched", data:venue})
	}).catch(next)
})


router.post('/add_venue_manager',
	verifyToken,
	AccessControl('venue_manager', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Admin.findOne({username:req.body.username}).then(venueManager=>{
		console.log(venueManager);
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
				// ejs.renderFile('views/set_password/set_password.ejs',mailBody).then(html=>{
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
		Admin.findByIdAndRemove({_id:req.params.id},req.body).then(deletedVenueManager=>{
			Admin.find({}).then(venueManager=>{
			res.send({status:"success", message:"venue manager deleted", data:venueManager})
			ActivityLog(req.userId, req.username, req.role, 'venue manager deleted', req.name+" deleted venue manager "+deletedVenueManager.name)
		}).catch(next)
	}).catch(next)
})

//// Venue Staff
router.post('/venue_staff',
	verifyToken,
	AccessControl('venue_staff', 'read'),
	(req, res, next) => {
		Admin.find({role:"venue_staff"}).then(venueStaff=>{
			res.send({status:"success", message:"venue staffs fetched", data:venueStaff})
	}).catch(next)
})


router.post('/add_venue_staff',
	verifyToken,
	AccessControl('venue_staff', 'create'),
	(req, res, next) => {
	req.body.created_by = req.username
	Admin.findOne({username:req.body.username}).then(venueStaff=>{
		if(venueStaff){
			res.send({status:"failure", message:"username already exist"})
		}else{
			req.body.role = "venue_staff";
			req.body.reset_password_hash = mongoose.Types.ObjectId();
			req.body.reset_password_expiry = moment().add(1,"days")
			Admin.create(req.body).then(venueStaff=>{
				var id = mongoose.Types.ObjectId();
				let reset_url = process.env.DOMAIN+"reset-password/"+req.body.reset_password_hash
				let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
				mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
					if(response){
					  res.send({status:"success"})
					}else{
					  res.send({status:"failed"})
					}
				})
				res.send({status:"success", message:"venue staff added", data:venueStaff})
				ActivityLog(req.userId, req.username, req.role, 'venue staff created', req.name+" created venue staff "+venueStaff.name)
			}).catch(next)
		} 
	}).catch(next)
})


router.put('/edit_venue_staff/:id',
	verifyToken,
	AccessControl('venue_staff', 'update'),
	(req, res, next) => {
	req.body.modified_by = req.username
	Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(venueStaff=>{
		Admin.findById({_id:req.params.id}).then(venueStaff=>{
			res.send({status:"success", message:"venue staff edited", data:venueStaff})
			ActivityLog(req.userId, req.username, req.role, 'venue staff modified', req.name+" modified venue staff "+venueStaff.name)
		}).catch(next)
	}).catch(next)
})


router.delete('/delete_venue_staff/:id',
	verifyToken,
	AccessControl('venue_staff', 'delete'),
	(req, res, next) => {
		Admin.findByIdAndRemove({_id:req.params.id},req.body).then(deletedVenueStaff=>{
			Admin.find({}).then(venueStaff=>{
				res.send({status:"success", message:"venue staff deleted", data:venueStaff})
				ActivityLog(req.userId, req.username, req.role, 'venue staff deleted', req.name+" deleted venue staff "+deletedVenueStaff.name)
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
		ActivityLog(req.userId, req.role, 'event created', req.name+" created event "+event.event.name)
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
			ActivityLog(req.userId, req.role, 'event modified', req.name+" modified event "+ event.event.name)
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
			ActivityLog(req.userId, req.role, 'event deleted', req.name+" deleted event "+event.event.name)
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
		console.log('coupon_list',coupon)
		res.status(201).send({status:"success", message:"coupons fetched", data:coupon})
	}).catch(next)
})

////Venue List based on coupon
router.post('/venue_list_by_id',
	verifyToken,
	AccessControl('venue', 'read'),
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
					ActivityLog(req.userId, req.role, 'coupon created', req.name+" created coupon "+coupon.title)
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
			ActivityLog(req.userId, req.role, 'coupon modified', req.name+" modified coupon "+coupon.title)
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
			ActivityLog(req.userId, req.role, 'coupon deleted', req.name+" deleted coupon "+coupon.title)
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

router.post('/search',
	verifyToken,
	AccessControl('venue', 'read'),
	(req, res, next) => {
	Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
		Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" }}).lean().populate('venue').then(event=>{
			Offers.find({}).then(offers=>{
			let combinedResult
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
			ActivityLog(req.userId, req.role, 'ad modified', req.name+" modified ad ")
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
		console.log('request delete api  ',req)
	Ads.findByIdAndRemove({_id:req.params.id}).then(ads=>{
		res.send({status:"success", message:"ad deleted"})
		ActivityLog(req.userId, req.role, 'ad deleted', req.name+" deleted ad ")
	}).catch(next)
})


router.post('/offers_list',
	verifyToken,
	AccessControl('offers', 'read'),
	(req, res, next) => {
	Offers.find({}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(offers=>{
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
			}else if(title_check.length){
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
		console.log(admins)
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
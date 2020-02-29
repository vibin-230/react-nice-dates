const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
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
const combineRepeatSlots = require('../scripts/combineRepeatedSlots')
const upload = require("../scripts/aws-s3")
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
const Event = require('./../models/event')
const Booking = require('../models/booking');
const EventBooking = require('../models/event_booking');
const Venue = require('../models/venue');
const Version = require('../models/version');
const Admin = require('../models/admin');
const Ads = require('../models/ads')
const rzp_key = require('../scripts/rzp')
 const indianRupeeComma = (value) => {
  return value.toLocaleString('EN-IN');
}

function ActivityLog(activity_log) {
  let user = activity_log.user_type==="user"?User:Admin
  user.findOneAndUpdate({_id:activity_log.id},{$push:{activity_log:activity_log}}).then(admin=>{
      console.log("activity log updated")
  })
}

Date.prototype.addHours= function(h,m){
  this.setHours(this.getHours()+h);
  this.setMinutes(this.getMinutes()+m);
  return this;
}


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
                  console.log('user',user1);
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
  console.log(req.userId);
      //Check if user exist
      User.findOne({_id: req.userId}).then(user=> {
        if (user) {
              req.body.modified_at = moment();
              User.findByIdAndUpdate({_id: req.userId},{force_update:req.body.force_update,version:req.body.version},{activity_log:0}).then(user1=>{
                res.status(201).send({status: "success",});
            })
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
    }).catch(next);
});

router.post('/get_user', [
  verifyToken,
], (req, res, next) => {
      //Check if user exist
      User.findOne({_id: req.userId},{activity_log:0}).then(user=> {
        User.findByIdAndUpdate({_id: req.userId},{version:'26'}).then(user1=>{
        if (user) {
          res.status(201).send({status: "success", message: "user collected",data:user})
        } else {
            res.status(422).send({status: "failure", errors: {user:"force update failed"}});
        }
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
                
                User.findOne({_id:req.userId},{__v:0,token:0},null,{activity_log:0}).then(user=>{
                  console.log('iser',user);
                  let userResponse = {
                    name:user.name,
                    gender:user.gender,
                    email:user.email,
                    phone:user.phone,
                    _id:user._id,
                    last_login:user.last_login,
                    dob:user.dob,
                    modified_at:user.modified_at,
                    profile_picture:user.profile_picture  && user.profile_picture === '' ? '' : user.profile_picture
                  }
                  console.log(userResponse);
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




//Send OTP
router.post('/send_otp',[
  check('phone').isLength({ min: 10, max: 10 }).withMessage('phone number must be 10 digits long'),
], (req, res, next) => {
  console.log("send otp")
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
  User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0},null).then(user=> {
    axios.get(process.env.PHP_SERVER+'/textlocal/otp.php?otp='+otp+'&phone='+phone)
    .then(response => {
      console.log(response.data)
        if(response.data.status === 'success')
        {
          if(user)
          {
            if(user.email)
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
            User.create({phone:req.body.phone,otp:'7484'}).then(user=>{
              console.log(user)
              res.status(201).send({status:"success",message:"new user",otp:user.otp})
            })
          }
            else{
            User.create({phone:req.body.phone,otp:otp}).then(user=>{
              res.status(201).send({status:"success",message:"new user",otp:otp})
            })
          }
          }
        }else
          {
            res.status(422).send({status:"failure", errors:{template:"invalid template"}, data:response.data})
        }
    }).catch(error => {
        console.log(error);
    })
  }).catch(next);
});


//Verify OTP
router.post('/verify_otp', (req, res, next) => {
  User.findOne({phone: req.body.phone}).then(user=> {
    // create a token
    var token;
    console.log(user)
      if(user.otp===req.body.otp){
          User.findOneAndUpdate({phone: req.body.phone},{token,last_login:moment()}).then(user=>{
            User.findOne({phone: req.body.phone},{__v:0,token:0,activity_log:0},null).then(user=> {
            if(user.email){
              token = jwt.sign({ id: user._id, phone:user.phone, role:"user", name:user.name }, config.secret);
              res.status(201).send({status:"success", message:"existing user", token:token, data:user})
              
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
    User.findById({_id: req.params.id},{token:0,},null).then(user=> {
      res.send({status:"success", message:"user edited"})
    }).catch(next);
  }).catch(next);
});

//Delete User
router.delete('/delete_user/:id',verifyToken, AccessControl('users', 'delete'), (req, res, next) => {
  User.findByIdAndRemove({_id: req.params.id}).then(user=> {
      res.send({status:"success", message:"user deleted"})
  }).catch(next);
});


//Upload profile picture
router.post('/profile_picture',verifyToken, (req, res, next) => {
  console.log('hit profile pic')
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
        console.log('pass2',body.booking_date,body.slot_time)
        Booking.find({ venue:venue.venue.name, venue_id:{$in:venue_id}, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
          let conf = venue.configuration;
          let types = conf.types;
          let base_type = conf.base_type;
          let inventory = {};
          let convertable;
          for(let i=0;i<types.length; i++){
            inventory[types[i]] = conf[types[i]];
          }
          console.log(inventory)
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
            console.log(inventory[body.venue_type],booking_history.length)
          }else{
            convertable = inventory[body.venue_type]<=booking_history.length
          }
          console.log(convertable);
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
              cash:body.cash
            }
            console.log('booking ',booking);
            Booking.create(booking).then(booking=>{
              resolve(booking)
              setTimeout(() => {
                Booking.findById({_id:booking._id}).then(booking=>{
                  if(booking.booking_status==="blocked"){
                    Booking.findByIdAndUpdate({_id:booking._id},{booking_status:"timeout"}).then(booking=>{
                      console.log('cancelled')
                    })
                  }
                }).catch(next)
              }, 135000);
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
      console.log('pass '+date+' '+start_time+ ' '+end_time)
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




//Slot Booked
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
   var result = Object.values(combineSlots([...values]))
   console.log('razorpay api',process.env.RAZORPAY_API)
   console.log('transaction api',req.body)

    //Capture Payment
    axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        console.log(response.data)
        if(response.data.status === "captured")
        {
          console.log(result)
          res.send({status:"success", message:"slot booked",data: result})
        }
      })
      .catch(error => {
        console.log(error.response)
        res.send({error:error.response});
      }).catch(next);

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
          let total_amount = Object.values(values).reduce((total,value)=>{
            return total+value.amount
          },0)
          let venue_discount_coupon = result[0].commission == 0 ? "Venue Discount:0" : `Venue Discount:${result[0].commission}`
          let SLOT_BOOKED_USER =`Hey ${values[0].name}! Thank you for using Turf Town!\nBooking Id : ${booking_id}\nVenue : ${venue_name}, ${venue_area}\nSport : ${sport_name}(${venue_type})\nDate and Time : ${datetime}\n${venue_discount_coupon}\nAmount Paid : ${result[0].booking_amount}\nBalance to be paid : ${total_amount}`
          let sender = "TRFTWN"
          SendMessage(phone,sender,SLOT_BOOKED_USER)
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
  function SlotsCheck(body,id){
    return new Promise((resolve,reject)=>{
      Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
        let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        Booking.find({ venue:body.venue, venue_id:req.params.id, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
        // Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
        let slots_available = SlotsAvailable(venue,booking_history)
        if(slots_available.slots_available[body.slot_time][body.venue_type]>0){
            resolve()
          }else{
            reject(body)
          }
        }).catch(next)
      }).catch(next)
    })
  }

  let promisesToRun = [];
  let bookOverTimeSlots = [];
  req.body.map((arr=>{
    for(let i=0;i<arr.block.length;i++){
      promisesToRun.push(SlotsCheck(arr.block[i],req.params.id))
    }
    bookOverTimeSlots.push(promisesToRun)
  
  }))
  
  Promise.all(promisesToRun).then(values => {
      var id = mongoose.Types.ObjectId();
      let promisesToRun = [];
      req.body.map(((arr,index)=>{
          for(let i=0;i<arr.block.length;i++){
            promisesToRun.push(BookRepSlot(arr.block[i],id,params,req,res,(index+1),next))
          }
          bookOverTimeSlots.push(promisesToRun)
        }))
      Promise.all(promisesToRun).then(values => {
        values = {...values}
        //result = Object.values(combineRepeatSlots(values))
         res.send({status:"success", message:"slot booked", data:[]})
      }).catch(next)
  }).catch(error=>{
    res.send({status:"failed", message:"slots not available",data:error})
  })
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

    if(req.body.amount){
      req.body.amount = req.body.amount/booking.length
    }
    if(req.body.commission){
      req.body.commission = req.body.commission/booking.length
    }
    Booking.updateMany({booking_id:req.params.id},req.body,{multi:true}).then(booking=>{
      Booking.find({booking_id:req.params.id}).then(booking=>{
        result = Object.values(combineSlots(booking))
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



//Booking completed
router.post('/booking_timeout/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_id:req.params.id}).then(booking=>{
    Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"timeout"}}).then(booking=>{
      res.send({status:"success", message:"booking timedout"})
    })
  })
})


router.post('/update_invoice/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id}).then(venue=>{
        Booking.updateMany({booking_id:{$in:req.body.booking_id}},{$set:{invoice:true,invoice_by:req.userId,invoice_date:new Date()}},{multi:true}).then(booking=>{
                Booking.find({booking_id:{$in:req.body.booking_id}}).lean().then(booking=>{
                  res.send({status:"success", message:"invoice updated"})
            }).catch(next);
      })
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
  Version.find({}).then(version=>{
    res.send({status:"success", message:"Version Log",data:version})
  }).catch(next)
})


router.post('/test_textlocal', verifyToken, (req, res, next) => {
  let otp = "5555";
  let event = 'Sample Event'
  let date = '12th March 2020'
  let team_name = 'Cycles FC'
  let type = '5s'
  let sport = 'Football'
  let booking_id = 'TTE001123'
  let amount = 'Rs.200'
  let balance = 'Rs.1000'
  let numbers = "919347603013"
  let venue = "Whistle"
  let user = "shankar"
  let mes = 'You have received a new registration. Event : passs\nDate :12th January 2005\nTeam Name : Hipaass \nType: 5s \nSport: football \nRegisteration ID : TTE00123\nAmount Paid : 100\nBalance to be paid at event : 200\nDo get in touch with the team and communicate further details'
  let message = "You have received a Turftown event booking \nEvent: "+event+" \nDate: "+date+" \nTeam Name: "+team_name+" \nType: "+type+"\nSport: "+sport+"\nRegisteration ID: "+booking_id+"\nAmount Paid: "+amount+"\nBalance to be paid at the event: "+balance
  let m = 'This is a test message'
  let time = "7pm-8pm"
  let USER_CANCEL_WITHOUT_REFUND1 = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged as a cancellation fee.`//490447
  let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged as a cancellation fee.`//490447
  let USER_CANCEL_WITH_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled.\nAdvance of ${amount} will be refunded within 3-4 working days.`//490450
  let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled by the user.\n ${user} \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${amount} will be charged to the user as a cancellation fee.`//490533
  let VENUE_CANCEL_WITH_REFUND = `Turf Town booking ${booking_id} scheduled for ${date} at ${venue} has been cancelled by the user.\n ${user} \nAdvance of ${amount} will be refunded to the user within 3-4 working days.`///490570
  let SLOT_BOOKED_USER ='Hey Akshay! Thank you for using Turf Town!\nBooking Id : TT02222\nVenue : Cricket\nSport : Cricket\nDate and Time : Last Time\nvenue discount:0\nTTCoupon:100\nAmount Paid : 100\nBalance to be paid : 100'
  let SLOT_BOOKED_MANAGER = `You have recieved a TURF TOWN booking from ${user} ( ${numbers} \nBooking Id: ${booking_id}\nVenue: ${venue}\nSport: ${sport}\nDate and Time: ${date}\nPrice: ${balance}\nAmount Paid: ${amount}\nVenue Discount: ${amount}\nTT Coupon: ${amount}\nAmount to be collected: ${amount}` //490618
  let EVENT_BOOKED_USER = `Your Turf Town event booking for ${event} has been confirmed.\nDate : ${date}\nTeam Name : ${team_name}\nSport : ${sport}\nRegisteration ID : ${booking_id}\nTT Coupon : 10000\nAmount Paid : ${amount}\nBalance to be paid at event : ${balance}\nPlease contact ${numbers} for more details.`//491373
  let EVENT_CANCELLED_FOR_USER =`TURF TOWN event booking ${booking_id} for ${event} scheduled at ${date} has been cancelled by ${user}\nStatus : cancelled comepltety` ///490737
  let EVENT_CANCELLED_FOR_MANAGER = `Your Turf town booking for event ${booking_id} for ${venue}scheduled at ${date} has been cancelled.\nStatus : USERCANCELLED` ///490748
  let SLOT_CANCELLED_BY_VENUE_MANAGER_TO_USER = `Your Turf town booking ${venue} scheduled for ${date} at ${venue} has been cancelled by the venue .\nStatus : cancelled for purpose\nPlease contact the venue ${numbers} for more information.` //490759
  // let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${date} at ${venue} has been cancelled. Please contact the venue for more info` ///418833
  // let EVENT_BOOKED_MANAGER = `Event Name : Rookie League\nBalance to be paid at the event : 1000`
  let EVENT_BOOKED_MANAGER = `You have received a new registration for the event.\n${event}\nDate : ${date}\nName : kumar\nTeam Name : ${team_name}\nSport : ${sport}(${type})\nRegisteration ID : ${booking_id}\nTT Coupon : ${amount}\nAmount Paid : ${balance}${""}\nBalance to be paid at the event : ${balance}`//491373
  // let SLOT_CANCELLED_BY_VENUE_MANAGER =  `Your booking ${booking_id} scheduled ${date} at ${venue},${" "+venue} has been cancelled. Please contact the venue for more info` ///418833
  // let EVENT_BOOKED_USER = `Your Turf Town event booking for MADRAS MUNDITAL has been confirmed.\nDate : ${date}\nTeam Name : ${team_name}\nSport : ${sport}(${type})\nRegisteration ID : ${booking_id}\nAmount Paid : Rs.${amount}${""}\nTT Coupon : 0\nBalance to be paid at event : ${balance}\nPlease contact ${numbers} for more details.`//491330
  //Send SMS
  let sender = "TRFTWN"
  SendMessage(numbers,sender,EVENT_BOOKED_MANAGER)
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


//Cancel Booking
// router.post('/cancel_booking/:id', verifyToken, (req, res, next) => {
//   Booking.findOne({booking_id:req.params.id}).then(booking=>{
//     Venue.findById({_id:booking.venue_id}).then(venue=>{
//       Admin.findById({_id:req.userId}).then(admin=>{
//       let role = req.role === "venue_staff" || req.role === "venue_manager"
//       let date = new Date().addHours(8,30)
//         if(booking.booking_type === "app" && (booking.start_time > date || role)){
//           console.log(process.env.RAZORPAY_API,booking.transaction_id);
//           axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
//           .then(response => {
//             if(response.data.entity === "refund")
//             {
//               Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true}},{multi:true}).then(booking=>{
//                 Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
//                   res.send({status:"success", message:"booking cancelled"})
//                   let booking_id = booking[0].booking_id
//                   let venue_name = booking[0].venue
//                   let venue_type = SetKeyForSport(booking[0].venue_type)
//                   let venue_area = booking[0].venue_data.venue.area
//                   let phone = "91"+booking[0].phone
//                   let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
//                   let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
//                   let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
//                   let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
//                   //Send SMS
//                   axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
//                     console.log(response.data)
//                   }).catch(error=>{
//                     console.log(error.response)
//                   })
    
//                   //Activity Log
//                   let activity_log = {
//                     datetime: new Date(),
//                     id:req.userId,
//                     user_type: req.role?req.role:"user",
//                     activity: 'slot booking cancelled',
//                     name:req.name,
//                     venue_id:booking[0].venue_id,
//                     booking_id:booking_id,
//                     message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
//                   }
//                   ActivityLog(activity_log)
//                 }).catch(next);
//               }).catch(next);
//             }
//           }).catch(error => {
//             console.log(error)
//           }).catch(next);
//         }else{
//           Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled"},refund_status:false},{multi:true}).then(booking=>{
//                 Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
//                   res.send({status:"success", message:"booking cancelled"})
//                   let booking_id = booking[0].booking_id
//                   let venue_name = booking[0].venue
//                   let venue_type = SetKeyForSport(booking[0].venue_type)
//                   let venue_area = booking[0].venue_data.venue.area
//                   let phone = "91"+booking[0].phone
//                   let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
//                   let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
//                   let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
//                   let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
    
//                   //Send SMS
//                   axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
//                     console.log(response.data)
//                   }).catch(error=>{
//                     console.log(error.response)
//                   })
    
//                   //Activity Log
//                   let activity_log = {
//                     datetime: new Date(),
//                     id:req.userId,
//                     user_type: req.role?req.role:"user",
//                     activity: 'slot booking cancelled',
//                     name:req.name,
//                     venue_id:booking[0].venue_id,
//                     booking_id:booking_id,
//                     message: "Slot "+booking_id+" booking cancelled at "+venue_name+" "+datetime+" "+venue_type,
//                   }
//                   ActivityLog(activity_log)
//             }).catch(next);
//           }).catch(next);
//         }
//       })
//   }).catch(next)
//   }).catch(next)
// })
router.post('/cancel_booking/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id}).then(booking=>{
    User.findById({_id:req.userId}).then(user=>{
      Venue.findById({_id:booking.venue_id}).then(venue=>{
      Admin.find({venue:{$in:[booking.venue_id]},notify:true},{activity_log:0}).then(admins=>{
        // const phone_numbers = admins.map((key)=>"91"+key.phone)
        let phone_numbers =admins.map((admin,index)=>"91"+admin.phone)
        let venue_phone = "91"+venue.venue.contact
        let manger_numbers = [...phone_numbers,venue_phone]
        if(booking.booking_type === "app" && req.body.refund_status){
          axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
          .then(response => {
            if(response.data.entity === "refund") /// user cancellation with refund 
            {
              Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled", refunded: true,refund_status:true}},{multi:true}).then(booking=>{
                Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
                  res.send({status:"success", message:"booking cancelled"})
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
                  SendMessage(phone,sender,USER_CANCEL_WITH_REFUND)
                  ///venuemanager cancel with refund
                  SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITH_REFUND)
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
                    booking_status:`Advance of Rs ${booking_amount} will be refunded within 3 - 4 working days.`
                  }

                  ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                    let to_emails = `${user.email}, rajasekar@turftown.in`
                    mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        res.send({status:"success"})
                      }else{
                        res.send({status:"failed"})
                      }
                    })
                  }).catch(next)
                  let manager_mail = ''
                   admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                  console.log(manager_mail);
                   ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                    //let to_emails = `${req.body.email}, rajasekar@turftown.in`
                    mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                        res.send({status:"success"})
                      }else{
                        res.send({status:"failed"})
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
            }
          }).catch(error => {
            console.log(error)
          }).catch(next);
        }else{
          Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled"},refund_status:false},{multi:true}).then(booking=>{ ////user cancellation without refund
                Booking.find({booking_id:req.params.id}).lean().populate('venue_data').then(booking=>{
                  res.send({status:"success", message:"booking cancelled"})
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
                  SendMessage(phone,sender,USER_CANCEL_WITHOUT_REFUND)
                  ///venuemanager cancel with refund
                  SendMessage(manger_numbers.join(","),sender,VENUE_CANCEL_WITHOUT_REFUND)
                  let obj = {
                    name:user.name,
                    venue_manager_name:venue.venue.name,
                    date:date,
                    phone:venue.venue.contact,
                    time:time,
                    user_phone:user.phone,
                    booking_id:booking_id,
                    venue_type:venue_type,
                    venue_name:venue_name,
                    venue_location:venue_area,
                      booking_status:`Advance of Rs ${booking_amount} has been charged as a cancellation fee to the user`
                    }
                    ejs.renderFile('views/event_manager/venue_cancel.ejs',obj).then(html=>{
                     let to_emails = `${user.email}, rajasekar@turftown.in`
                        mail("support@turftown.in", to_emails,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                        if(response){
                          res.send({status:"success"})
                        }else{
                          res.send({status:"failed"})
                        }
                      })
                    }).catch(next)
                    let manager_mail = ''
                    admins.map((admin,index)=>{manager_mail+=(admin.length-1) === index ?admin.email :admin.email + ','})
                    ejs.renderFile('views/event_manager/venue_cancel_manager.ejs',obj).then(html=>{
                     mail("support@turftown.in", manager_mail,booking_id+" has been cancelled","Slot Cancellation",html,response=>{
                      if(response){
                         res.send({status:"success"})
                       }else{
                         res.send({status:"failed"})
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
                  User.findById({_id:booking[0].user_id},{"activity_log":0}).then(user=>{
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
    booking_status:{$in:["booked","completed","cancelled"]},
    created_by:req.userId,
    end_time:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked","completed","cancelled"]},
    created_by:req.userId,
    event_booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
  Booking.find(cancel_filter).lean().populate('venue_data','venue').then(cancel_booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
      EventBooking.find(cancel_filter).lean().populate('event_id').then(cancel_event_booking=>{
        result = Object.values(combineSlots(booking))
         result1 = Object.values(combineSlots(cancel_booking))
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
    booking_status:{$in:["booked","completed","cancelled"]},
    created_by:req.userId,
    end_time:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let cancel_filter = {
    booking_status:{$in:["cancelled"]},
    created_by:req.userId,
  }
  let eventFilter = {
    booking_status:{$in:["booked","completed","cancelled"]},
    created_by:req.userId,
    event_booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
  Booking.find(cancel_filter).lean().populate('venue_data','venue').then(cancel_booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
      EventBooking.find(cancel_filter).lean().populate('event_id').then(cancel_event_booking=>{
        result = Object.values(combineSlots(booking))
        result1 = Object.values(combineSlots(cancel_booking))
        result = [...result,...result1]
        let event_result =[...eventBooking,...cancel_event_booking]
        let booking_data = result && result.length > 0 ? result.filter((key)=>{
          if(key.booking_status !== "booked"){
            return key
          }
          else if(key.booking_status == "booked" && moment(key.end_time).utc().format("YYYYMMDDHmm") < moment().format("YYYYMMDDHmm")){
            return key
          }
        }) : []
        let event_booking_data = event_result && event_result.length > 0 ? event_result.filter((key)=>{
          if(key.booking_status !== "booked"){
            return key
          }
          else if(key.booking_status == "booked" && moment(key.start_time).utc().format("YYYYMMDDHmm") < moment().format("YYYYMMDDHmm")){
            return key
          }
        }) :[]
         result = [...booking_data,...event_booking_data]
        let finalResult = result.sort((a, b) => moment(a.start_time).format("YYYYMMDDHHmm") > moment(b.start_time).format("YYYYMMDDHHmm") ? 1 : -1 )
        res.send({status:"success", message:"booking history fetched", data:finalResult})
    }).catch(next)
  }).catch(next)
  }).catch(next)
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
    event_booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  let booking_ids = []
  //req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
    EventBooking.find(eventFilter).lean().populate('event_id').then(eventBooking=>{
        result = Object.values(combineSlots(booking))
        let booking_data =result.filter((key)=>{
          if( moment(key.end_time).utc().format("YYYYMMDDHmm") > moment().format("YYYYMMDDHmm")){
            return key
          }
        })
        let event_booking_data = eventBooking.filter((key)=>{
          if( moment(key.booking_date).utc().format("YYYYMMDDHmm") > moment().format("YYYYMMDDHmm")){
            return key
          }
        })
        console.log("booking",booking_data)
        console.log('------',event_booking_data)
        booking_data = [...booking_data,...event_booking_data]
        let finalResult = booking_data.sort((a, b) => moment(a.start_time).format("YYYYMMDDHHmm") > moment(b.start_time).format("YYYYMMDDHHmm") ? 1 : -1 )
        
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
    console.log(req.body);
    Booking.find({booking_status:{$in:["booked","completed","cancelled"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},venue_id:req.params.id,start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time},repeat_booking:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(booking=>{
      result = Object.values(combineRepeatSlots(booking)) 
      let status_filter = result.filter((b)=>b.booking_status === 'cancelled')
      let grouped = _.mapValues(_.groupBy(result, 'group_id'), clist => clist.map(result => _.omit(result, 'multiple_id')));
      let x = {}
      let finalBookingList = []
      Object.entries(grouped).map(([i,j])=>{
       const filtered = j.filter((key)=>{
          if(key.booking_status == "booked"){
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
      Booking.find({booking_status:{$in:["booked","completed"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},venue_id:req.params.id,start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time},repeat_booking:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(bookings=>{
        booking =  Object.values(combineRepeatSlots(bookings)) 
        let grouped = _.mapValues(_.groupBy(booking, 'group_id'),clist => clist.map(booking => _.omit(booking, 'multiple_id')));
        let finalBookingList = []
        Object.entries(grouped).map(([i,j])=>{
          const filtered = j.filter((key)=>{
            if(key.booking_status == "completed" && moment().isAfter(key.end_date_range) ){
              return key
            }
          })
          if(filtered.length > 0){
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
      Booking.find({booking_status:{$in:["booked","cancelled"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(booking=>{
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
        Booking.find({booking_status:{$in:["cancelled","completed"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:true}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(booking=>{
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
          console.log(finalBookingList,sortedActivities[0].invoice_date);
            res.send({status:"success", message:"booking history fetched", data:finalBookingList ,invoice_date:sortedActivities.length > 0 ? sortedActivities[0].invoice_date : '' })
          }).catch(next)
        })

        router.post('/invoice_history_by_group_id_by_time/:id', verifyToken, (req, res, next) => {
          Booking.find({booking_status:{$in:["cancelled","completed"]},venue_id:req.params.id,group_id:{$in:req.body.group_id},repeat_booking:true,invoice:false,booking_date:{$gte:req.body.fromdate, $lte:req.body.todate},start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}}).lean().populate('venue_data','venue').populate('collected_by','name').populate('created_by','name').then(booking=>{
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
              res.send({status:"success", message:"booking history fetched", data:sortedActivities[0].invoice_date})
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
    Booking.find({booking_status:{$in:["completed"]}, venue_id:{$in:venue_id}, booking_date:{$gt:req.body.fromdate, $lte:req.body.todate}}).lean().populate('collected_by','name').then(booking=>{
      Booking.find({booking_status:{$in:["cancelled"]},refund_status:false,venue_id:{$in:venue_id}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).lean().populate("cancelled_by" ,"name").then(booking1=>{
      result = Object.values(combineSlots(booking))
      result1 = Object.values(combineSlots(booking1))
      let finalResult = [...result,...result1]
      res.send({status:"success", message:"booking history fetched", data:finalResult})
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
      EventBooking.find({event_id:req.body.event_id}).lean().populate('event_id').then(bookingOrders=>{
        if(bookingOrders.length<bookingOrders[0].event_id.format.noofteams){
          res.send({status:"success", message:"no event found"})
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
          count = bookings.length
          res.send({status:"success", message:"Event booking cancelled"})
      })
      })
    }else{
      if(req.body.refund_status){
        axios.post('https://'+rzp_key+'@api.razorpay.com/v1/payments/'+eventBooking.transaction_id+'/refund')
        .then(response => {
          if(response.data.entity === "refund"){
            EventBooking.findOneAndUpdate({booking_id:req.params.id}, {booking_status: "cancelled",refund_status:true}).then(eventBooking=>{
              EventBooking.find({booking_id:req.params.id}, {booking_status: "booked"}).then(bookings=>{
                count = bookings.length
                res.send({status:"success", message:"Event booking cancelled"})
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
    EventBooking.find({event_id:req.body.event_id}).lean().populate('event_id').then(bookingOrders=>{
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
              EventBooking.findOne({'booking_id':eventBooking.booking_id}).lean().populate('event_id').then(bookingOrder=>{
                if(req.body.free_event){
                  res.send({status:"success", message:"event booked", data:bookingOrder})
                }else{
                  //Capture Payment
                  let data = {
                    amount:req.body.booking_amount*100
                  }
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
                }
              // Send SMS
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

router.post('/revenue_report_app', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, booking_type:'app', booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
    Booking.find({booking_status:{$in:["completed"]},booking_type:'app', booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1, commission:1,venue_offer:1,turftown_offer:1,venue_id:1}).lean().then(booking=>{
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
          result[date].venue_offer = value.venue_offer
          result[date].turftown_offer = value.turftown_offer
          bookings_combined = JSON.stringify([...bookings,booking_list[index]])
          bookings_combined = JSON.parse(bookings_combined)
          result[date].booking = bookings_combined
          result[date].hours_played = 0.5
        }else{
          result[date].amount = result[date].amount + value.amount
          result[date].slots_booked = result[date].slots_booked + 1
          result[date].hours_played = (result[date].slots_booked*30)/60
          result[date].commission = result[date].commission + value.commission
          result[date].venue_offer = value.venue_offer
          result[date].turftown_offer = value.turftown_offer
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
  Ads.find({$and: [{ start_date: { $lte: new Date(),},}, { end_date: {$gte: new Date(),},},{sport_type: req.body.sport_type},{ page: req.body.page}],}).lean().populate('event').populate('venue').then(ads=>{
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
  let balance = 500
  let amount_paid = 500
  //Send SMS
  axios.get(process.env.PHP_SERVER+'/textlocal/cancel_event.php?booking_id='+booking_id+'&phone='+phone+'&event_name='+event_name+'&date='+datetime+'&name='+event_name+'&amount_paid='+amount_paid+'&balance='+balance+'&manager_phone='+manager_phone).then(response => {
    console.log(response.data)
  }).catch(error=>{
    console.log(error)
  })
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



router.post('/test_s3', (req, res, next) => {
  if (!req.files)
    return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});
    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    let File = req.files.image;
    let filename = req.files.image.name;
    //filename = path.pathname(filename)
    let name = path.parse(filename).name
    let ext = path.parse(filename).ext
    ext = ext.toLowerCase()
    filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "folder"
          message = "profile picture uploaded successfully"
          upload(filename, folder, message, res)
        }
    })
})
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

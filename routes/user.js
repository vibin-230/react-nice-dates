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
const upload = require("../scripts/aws-s3")
const AccessControl = require("../scripts/accessControl")
const SetKeyForSport = require("../scripts/setKeyForSport")
const SlotsAvailable = require("../helper/slots_available")
const BookSlot = require("../helper/book_slot")

const User = require('../models/user');
const Booking = require('../models/booking');
const EventBooking = require('../models/event_booking');
const Venue = require('../models/venue');
const Admin = require('../models/admin');


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
                User.findOne({phone:req.phone},{__v:0,token:0},null).then(user=>{
                res.status(201).send({status: "success", message: "user created", data:user})
                let activity_log = {
                  datetime: new Date(),
                  id:req.userId,
                  user_type: "user",
                  activity: "user created",
                  name:req.name,
                  message: user.name + " created successfully",
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
            console.log('test')
            User.create({phone:req.body.phone,otp:otp}).then(user=>{
              res.status(201).send({status:"success",message:"new user",otp:otp})
            })
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
router.post('/profile_picture/',verifyToken, (req, res, next) => {
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
  console.log(req.body);
  function BlockSlot(body,id,booking_id){
    return new Promise(function(resolve, reject){
      Venue.findById({_id:req.params.id}).then(venue=>{
        console.log(venue.venue.name)
        Booking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{
        Booking.find({venue:venue.venue.name, venue_id:req.params.id, booking_date:body.booking_date, slot_time:body.slot_time,booking_status:{$in:["blocked","booked"]}}).then(booking_history=>{
          // console.log(booking_history)
          let conf = venue.configuration;
          let types = conf.types;
          let base_type = conf.base_type;
          let inventory = {};
          let convertable;
          for(let i=0;i<types.length; i++){
            inventory[types[i]] = conf[types[i]];
          }
          // console.log(inventory)
          if(venue.configuration.convertable){
            if(booking_history.length>0){
              let available_inventory = Object.values(booking_history).map(booking =>{
                inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.event_type])
                for(let i=0;i<types.length-1; i++){
                inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
                }
                // console.log(inventory)
              })
            }
            convertable = inventory[body.venue_type]<=0
            console.log(inventory[body.venue_type],booking_history.length)
          }else{
            convertable = inventory[body.venue_type]<=booking_history.length
          }
          if(convertable){
            res.status(409).send({status:"failed", message:"slot already booked"})
          }else{
              if(booking_id){
                var numb = bookingOrder.booking_id.match(/\d/g);
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
              }, 305000);
            }).catch(error=>{
              reject()
            })
          }
        }).catch(next)
      }).catch(next)
    }).catch(next)
    }).catch(next)
  }
  Booking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{
    var id = mongoose.Types.ObjectId();
    let promisesToRun = [];
    for(let i=0;i<req.body.length;i++)
    {
      promisesToRun.push(BlockSlot(req.body[i],id,bookingOrder.booking_id))
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


//Slot Booked
router.post('/book_slot', verifyToken, (req, res, next) => {
  function BookSlot(body,id){
    return new Promise(function(resolve, reject){
      Booking.findByIdAndUpdate({_id:body._id},{booking_status:"booked", transaction_id:body.transaction_id, booking_amount:body.booking_amount, multiple_id:id}).lean().then(booking=>{
        Booking.findById({_id:body._id}).lean().then(booking=>{
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
    //Capture Payment
    axios.post('https://'+process.env.RAZORPAY_API+'@api.razorpay.com/v1/payments/'+req.body[0].transaction_id+'/capture',data)
      .then(response => {
        console.log(response.data)
        if(response.data.status === "captured")
        {
          res.send({status:"success", message:"slot booked"})
        }
      })
      .catch(error => {
        console.log(error.response)
        res.send({error:error.response});
      }).catch(next);

    //Send Sms
      Venue.findById({_id:values[0].venue_id}).then(venue=>{
        let booking_id = values[0].booking_id
        let phone = "91"+values[0].phone
        console.log(phone)
        let venue_name = values[0].venue
        let venue_type = SetKeyForSport(values[0].venue_type)
        let venue_area = venue.venue.area
        let date = moment(values[0].booking_date).format("MMMM Do YYYY")
        let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
        let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},req.body[0].end_time)
        let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
        let directions = "https://www.google.com/maps/dir/"+venue.venue.latLong[0]+","+venue.venue.latLong[1]
        let total_amount = Object.values(values).reduce((total,value)=>{
          return total+value.amount
        },0)
        axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
        .then(response => {
          console.log(response.data)
        }).catch(error=>{
          console.log(error.response.data)
        })

      //Send Mail
      let mailBody = {
        name:values[0].name,
        date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
        day:moment(values[0].booking_date).format("Do"),
        venue:values[0].venue,
        area:values[0].area,
        venue_type:values[0].venue_type,
        booking_id:values[0].booking_id,
        slot_time:datetime,
        quantity:1,
        total_amount:total_amount,
        booking_amount:values[0].booking_amount,
        directions:directions
      }
      // console.log(mailBody)
      ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
        mail("support@turftown.in", values[0].email,"Venue Booked","test",html,response=>{
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
  })
})

router.post('/book_slot_for_admin/:id', verifyToken, AccessControl('booking', 'create'), (req, res, next) => {
  let params = req.params.id
  //Check of Slot Exist
  function SlotsCheck(body,id){
    return new Promise((resolve,reject)=>{
      Venue.findById({_id:id},{bank:0,access:0}).lean().then(venue=>{
        Booking.find({$and:[{venue:body.venue, venue_id:id, booking_date:{$gte:body.booking_date,$lt:moment(body.booking_date).add(1,"days")}}],booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
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
      var id = mongoose.Types.ObjectId();
      let promisesToRun = [];
      for(let i=0;i<req.body.length;i++)
      {
        promisesToRun.push(BookSlot(req.body[i],id,bookingOrder.booking_id,params,req,res,next))
      }
  
      Promise.all(promisesToRun).then(values => {
        values = {...values}
        res.send({status:"success", message:"slot booked", data:values})
        Venue.findById({_id:values[0].venue_id}).then(venue=>{
          // Send SMS
          let booking_id = values[0].booking_id
          let phone = "91"+values[0].phone
          let venue_name = values[0].venue
          let venue_type = SetKeyForSport(req.body[0].venue_type) 
          let venue_area = venue.venue.area
          let date = moment(values[0].booking_date).format("MMMM Do YYYY")
          let start_time = Object.values(values).reduce((total,value)=>{return total<value.start_time?total:value.start_time},req.body[0].start_time)
          let end_time = Object.values(values).reduce((total,value)=>{return total>value.end_time?total:value.end_time},values[0].end_time)
          let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
          let directions = "https://www.google.com/maps/dir/"+venue.venue.latLong[0]+","+venue.venue.latLong[1]
          let total_amount = Object.values(values).reduce((total,value)=>{
            return total+value.amount
          },0)
          axios.get(process.env.PHP_SERVER+'/textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+values[0].venue_type+'&sport_name='+values[0].sport_name+'&venue_area='+venue_area+'&amount='+total_amount)
          .then(response => {
            console.log(response.data)
          }).catch(error=>{
            console.log(error.response)
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
    }).catch(next)
  }).catch(error=>{
    res.send({status:"failed", message:"slots not available"})
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


function isEmpty (object){
  if(Object.keys(object).length>0){
    return true
  }else{
    return false
  }
}


//Cancel Booking
router.post('/cancel_booking/:id', verifyToken, (req, res, next) => {
  Booking.findOne({booking_id:req.params.id}).then(booking=>{
    Venue.findById({_id:booking.venue_id}).then(venue=>{
    if(booking.booking_type === "app"){
      axios.post('https://'+process.env.RAZORPAY_API+'@api.razorpay.com/v1/payments/'+booking.transaction_id+'/refund')
      .then(response => {
        if(response.data.entity === "refund")
        {
          Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled"}},{multi:true}).then(booking=>{
            Booking.find({booking_id:req.params.id}).lean().then(booking=>{
              res.send({status:"success", message:"booking cancelled"})
              console.log(booking);
              let booking_id = booking[0].booking_id
              let venue_name = booking[0].venue
              let venue_type = SetKeyForSport(booking[0].venue_type)
              let venue_area = booking[0].venue_area
              let phone = "91"+booking[0].phone
              let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
              let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
              let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
              let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
              //Send SMS
              axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                console.log(response.data)
              }).catch(error=>{
                console.log(error.response)
              })

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
      Booking.updateMany({booking_id:req.params.id},{$set:{booking_status:"cancelled"}},{multi:true}).then(booking=>{
            Booking.find({booking_id:req.params.id}).lean().then(booking=>{
              res.send({status:"success", message:"booking cancelled"})
              console.log(booking);
              let booking_id = booking[0].booking_id
              let venue_name = booking[0].venue
              let venue_type = SetKeyForSport(booking[0].venue_type)
              let venue_area = booking[0].venue_area
              let phone = "91"+booking[0].phone
              let date = moment(booking[0].booking_date).format("MMMM Do YYYY")
              let start_time = Object.values(booking).reduce((total,value)=>{return total<value.start_time?total:value.start_time},booking[0].start_time)
              let end_time = Object.values(booking).reduce((total,value)=>{return total>value.end_time?total:value.end_time},booking[0].end_time)
              let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")

              //Send SMS
              axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                console.log(response.data)
              }).catch(error=>{
                console.log(error.response)
              })

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
  }).catch(next)
  }).catch(next)
})


//Slot Booked
router.post('/slots_available/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    Booking.find({venue:req.body.venue, venue_id:req.params.id, booking_date:{$gte:new Date(req.body.booking_date),$lt:new Date(req.body.booking_date).addHours(24,0)},booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
      console.log(booking_history)
      let slots_available = SlotsAvailable(venue,booking_history)
      // console.log(moment(req.body.booking_date).add(1,"day"))
      console.log(new Date(req.body.booking_date).addHours(5,30))
      console.log(new Date(req.body.booking_date).addHours(29,30))
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


//Booking History
router.post('/booking_history', verifyToken, (req, res, next) => {
  let filter = {
    booking_status:{$in:["booked","completed"]},
    created_by:req.userId,
    booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}
  }
  req.role==="super_admin"?delete filter.created_by:null
  Booking.find(filter).lean().populate('venue_data','venue').then(booking=>{
    EventBooking.find(filter).lean().populate('event_id','event','format').then(eventBooking=>{
      result = Object.values(combineSlots(booking))
      result = [...result,...eventBooking]
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
  }).catch(next)
})

  //Booking History Based on venue
router.post('/booking_history_by_venue', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(booking=>{
    result = Object.values(combineSlots(booking))
      let booking_list = []
        result = result.map(booking=>{
            // console.log(new Date().addHours(4,30))
            // console.log("booking.end_time",new Date(booking.end_time))
            if(booking.end_time.getTime()>new Date().addHours(4,30).getTime()){
            booking_list.push(booking)
          }
        })
      res.send({status:"success", message:"booking history fetched", data:booking_list})
    }).catch(next)
  })

  //Booking History
router.post('/booking_history_by_time/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked","completed"]},venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}}).then(bookings=>{
    let booking_ids = []
    bookings.filter(booking=>{
      if(booking_ids.indexOf(booking.booking_id)=== -1){
        booking_ids.push(booking.booking_id)
      }
    })
    Booking.find({booking_id:{$in:booking_ids}}).lean().then(bookings=>{
      result = Object.values(combineSlots(bookings))
      res.send({status:"success", message:"booking history fetched", data:result})
    })
    }).catch(next)
  })

 //Booking History_from_app
 router.post('/booking_history_from_app', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked"]}, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, start_time:{$gte:req.body.start_time},end_time:{$lte:req.body.end_time}, booking_type:"app"}).then(booking=>{
      result = Object.values(combineSlots(booking))
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
  })

//Booking History_from_app
router.post('/booking_history_from_app_by_venue/:id', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["booked"]}, venue_id:req.params.id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}, booking_type:"app"}).then(booking=>{
      result = Object.values(combineSlots(booking))
      res.send({status:"success", message:"booking history fetched", data:result})
    }).catch(next)
})



//Booking History_from_app
router.post('/booking_completed_list_by_venue', verifyToken, (req, res, next) => {
  Booking.find({booking_status:"completed", venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().populate('admin','_id name').then(booking=>{
      result = Object.values(combineSlots(booking))
      res.send({status:"success", message:"booking history fetched", data:result})
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
  Booking.find({venue_id:req.params.id, booking_status:"booked", booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(bookings=>{
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
})

//Event Booking
router.post('/event_booking', verifyToken, (req, res, next) => {
  EventBooking.findOne({}, null, {sort: {$natural: -1}}).then(bookingOrder=>{

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
      event_id:req.body.event_id,
      event_name:req.body.event_name,
      sport_name:req.body.sport_name,
      amount:req.body.amount,
      coupons_used:req.body.coupons_used,
      coupon_amount:body.coupon_amount,
      offer_amount:body.offer_amount,
      commission:req.body.commission,
      booking_amount:req.body.booking_amount,
      name:req.body.name,
      email:req.body.email,
      phone:req.body.phone,
      card:req.body.card,
      upi:req.body.upi,
      cash:req.body.cash
    }
    EventBooking.create(booking_data).then(eventBooking=>{
      res.send({status:"success", message:"event booked", data:eventBooking})

      // Send SMS
      let booking_id = eventBooking.booking_id
      let phone = eventBooking.phone
      let event_name = eventBooking.venue
      let date = moment(eventBooking.booking_date).format("MMMM Do YYYY")
      let datetime = date + " " + moment(start_time).format("hh:mma") + "-" + moment(end_time).format("hh:mma")
      axios.get('textlocal/slot_booked.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+event_name+'&date='+datetime)
      .then(response => {
        console.log(response.data)
      }).catch(error=>{
        console.log(error.response.data)
      })
      console.log(values[0].amount)
      //Send Mail
      let mailBody = {
        name:values[0].name,
        date:moment(values[0].booking_date).format("dddd, MMM Do YYYY"),
        venue:values[0].venue,
        booking_id:values[0].booking_id,
        slot_time:datetime,
        quantity:1,
        total_amount:total_amount,
        booking_amount:values[0].booking_amount
      }
      console.log(req.body[0].email)
      // console.log(mailBody)
      ejs.renderFile('views/mail.ejs',mailBody).then(html=>{
        mail("support@turftown.in", req.body[0].email,"Venue Booked","test",html,response=>{
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
        message: "event "+booking_id+" booked at "+event_name+" "+datetime+" "+venue_type,
      }
      ActivityLog(activity_log)
    }).catch(next)
  })
})

//Booking History Based on venue
router.post('/revenue_report', verifyToken, (req, res, next) => {
  Booking.find({booking_status:{$in:["completed"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).lean().then(booking_list=>{
    
    Booking.find({booking_status:{$in:["completed"]}, venue_id:req.body.venue_id, booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}},{booking_date:1,booking_id:1,amount:1,multiple_id:1, commission:1,venue_offer:1,turftown_offer:1}).lean().then(booking=>{

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

//// Ads
router.post('/ads_list',
	verifyToken,
	AccessControl('ads', 'read'),
	(req, res, next) => {
	Ads.find({}).lean().populate('event','_id event type').populate('venue','_id name venue type').then(ads=>{
		res.send({status:"success", message:"ads fetched", data:ads})
	}).catch(next)
})


router.post('/test_sms', (req, res, next) => {
  let booking_id = "sh.unique"
  let venue_name = "kilpauk"
  let phone = "7401415754"
  let datetime = "May 15"
  let venue_type = "kdjflsjf"
  let venue_area = "kdjflsjf"
  let sport_name = "lkdjfsljf"
  //Send SMS
  axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+venue_type+'&sport_name='+sport_name+'&venue_area='+venue_area).then(response => {
    console.log(response.data)
  }).catch(error=>{
    console.log(error.response)
  })
})

router.post('/test_php', (req, res, next) => {
  axios.get('textlocal/index.php')
    .then(response => {
      console.log(response.data)
      res.send({data:response.data})
    }).catch(error=>{
      res.send(error.response)
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
// router.post('/test_mail', verifyToken, (req, res, next) => {
//   // let html = fs.readFileSync('views/mail.ejs',{encoding:'utf-8'});
//   ejs.renderFile('views/mail.ejs',{name:req.body.name}).then(html=>{
//     mail("support@turftown.in", "kishorepadmanaban@gmail.com","test","test",html,response=>{
//       if(response){
//         res.send({status:"success"})
//       }else{
//         res.send({status:"failed"})
//       }
//     })
//   }).catch(next)
// })



module.exports = router;

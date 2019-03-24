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
const jwt = require('jsonwebtoken');
const config = require('../config');

const User = require('../models/user');
const Booking = require('../models/booking');
const Venue = require('../models/venue');

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
                User.findOne({phone:req.phone},{__v:0,token:0,_id:0},null).then(user=>{
                res.status(201).send({status: "success", message: "user created", data:user})
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
    axios.get(link.domain+'/textlocal/otp.php?otp='+otp+'&phone='+phone)
    .then(response => {
        if(response.data.status === 'success')
        {
          if(user)
          {
            if(user.email)
            {
              User.findOneAndUpdate({phone: req.body.phone},{otp}).then(user=> {
                User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0},null).then(user=> {
                  res.status(201).send({status:"success",message:"existing user",otp:otp,data:user})
                })
              })
            }else{
              User.create({phone:req.body.phone,otp}).then(user=>{
                res.status(201).send({status:"success",message:"new user",otp:otp})
              })
            }
          }else{
            User.create({phone:req.body.phone,otp}).then(user=>{
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
    var token = jwt.sign({ id: user._id, phone:user.phone }, config.secret);
      if(user.otp===req.body.otp){
          User.findOneAndUpdate({phone: req.body.phone},{token,last_login:moment()}).then(user=>{
            User.findOne({phone: req.body.phone},{__v:0,token:0,_id:0},null).then(user=> {
            if(user.email){
              res.status(201).send({status:"success", message:"existing user", token:token, data:user})
            }else{
              res.status(201).send({status:"success", message:"new user", token:token})
            }
          }).catch(next);
        }).catch(next);
      }else{
        res.status(422).send({status:"failure", errors:{otp:"incorrect otp"}})
      }
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
    filename = name + Date.now() + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv('assets/images/profile/' + filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
        let image = link.domain+'/assets/images/profile/' + filename;
        User.findOneAndUpdate({_id:req.userId},{profile_picture:image}).then(user=>{
        res.status(201).send({
            image,
            status: 'success',
            message: "profile picture uploaded successfully"
        })
        })
        }
    })
});



router.post('/block_slot_for_football', verifyToken, (req, res, next) => {
  Venue.findOne({"venue.name":req.body.venue}).then(venue=>{
    Booking.find({$and:[{venue:req.body.venue, booking_date:req.body.booking_date, slot_time:req.body.slot_time}],$or:[{booking_status:"booked",booking_status:"blocked"}]}).then(booking_history=>{
      let conf = venue.configuration;
      let types = conf.types;
      let base_type = conf.base_type;
      let inventory = {}
      for(let i=0;i<types.length; i++){
        inventory[types[i]] = conf[types[i]];
      }
      console.log(inventory)
      if(booking_history.length>0){
        let available_inventory = Object.values(booking_history).map(booking =>{
          inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type])
          for(let i=0;i<types.length-1; i++){
          inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
          }
          console.log(inventory)
        })
      }

      if(inventory[req.body.venue_type]<=0){
        res.status(409).send({status:"failed", message:"slot already booked"})
      }else{
        let booking = {
          booking_date:req.body.booking_date,
          booking_type:req.body.booking_type,
          booking_status:"blocked",
          created_by:req.userId,
          venue:req.body.venue,
          sport_name:req.body.sport_name,
          venue_type:req.body.venue_type,
          amount:req.body.amount,
          coupons_used:req.body.coupons_used,
          commission:req.body.commission,
          slot_time:req.body.slot_time
        }
        Booking.create(booking).then(booking=>{
          res.status(201).send({
            data: booking,
            status:'success',
            message:"slot blocked"
          })
          setTimeout(() => {
            Booking.findById({_id:booking._id}).then(booking=>{
              if(booking.booking_status==="blocked"){
                Booking.findByIdAndUpdate({_id:booking._id},{booking_status:"timeout"}).then(booking=>{
                  console.log('cancelled')
                })
              }
            }).catch(next)
          }, 305000);
        }).catch(next)
      }
    }).catch(next)
  }).catch(next)
})


router.post('/block_slot', verifyToken, (req, res, next) => {
  Venue.findOne({"venue.name":req.body.venue}).then(venue=>{
    Booking.find({$and:[{venue:req.body.venue, booking_date:req.body.booking_date, slot_time:req.body.slot_time, venue_type:req.body.venue_type}],$or:[{booking_status:"booked",booking_status:"blocked"}]}).then(booking_history=>{
      let conf = venue.configuration;
      let types = conf.types;

      if(conf[req.body.venue_type]<=booking_history.length){
        res.status(409).send({status:"failed", message:"slot already booked"})
      }else{
        let booking = {
          booking_date:req.body.booking_date,
          booking_type:req.body.booking_type,
          booking_status:"blocked",
          created_by:req.userId,
          venue:req.body.venue,
          sport_name:req.body.sport_name,
          venue_type:req.body.venue_type,
          amount:req.body.amount,
          coupons_used:req.body.coupons_used,
          commission:req.body.commission,
          slot_time:req.body.slot_time
        }
        Booking.create(booking).then(booking=>{
          res.status(201).send({
            data: booking,
            status:'success',
            message:"slot blocked"
          })
          setTimeout(() => {
            Booking.findById({_id:booking._id}).then(booking=>{
              if(booking.booking_status==="blocked"){
                Booking.findByIdAndUpdate({_id:booking._id},{booking_status:"timeout"}).then(booking=>{
                  console.log('cancelled')
                })
              }
            }).catch(next)
          }, 305000);
        }).catch(next)
      }
    }).catch(next)
  }).catch(next)
})

//Slot Booked
router.post('/slot_booked/:id', verifyToken, (req, res, next) => {
  Booking.findByIdAndUpdate({_id:req.parmas.id},{booking_status:"booked", transaction_id:req.body.transaction_id}).then(booking=>{
    res.send({
      data: booking,
      status:'success',
      message:"slot booked"
    })
  })
})





// router.post('/create_token', (req, res, next) => {
//   User.create(req.body).then(user=>{
//     // create a token
//     var token = jwt.sign({ id: user._id, phone:user.phone }, config.secret);
//     User.findOneAndUpdate({_id:user._id}, {token}).then(user=>{
//       res.status(201).send({ auth: true, token: token });
//     })
//   })
// });

// router.post('/verify_token', [verifyToken,
//   check('email').isEmail().withMessage('email is incorrect'),
//   check('email').exists().isLength({ min: 1}).withMessage('email cannot be empty'),
//   check('name').exists().isLength({ min: 1}).withMessage('name cannot be empty'),
//   check('dob').isISO8601().withMessage('date of birth needs to be a valid date'),
//   check('gender').exists().isLength({ min: 1}).withMessage('gender cannot be empty'),
// ], (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     var result = {};
//     var errorsList = errors.array();
//     for(var i = 0; i < errorsList.length; i++)
//     {
//         result[errorsList[i].param] = errorsList[i].msg;
//     }
//     return res.status(422).json({ errors: result});
//   }
//   // res.send({id:req.userId,phone:req.phone})
// });



module.exports = router;

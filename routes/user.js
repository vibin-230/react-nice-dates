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

const User = require('../models/user');


//User Registration
router.post('/create_user',[
  check('email').isEmail().withMessage('email is incorrect'),
  check('email').exists().withMessage('email cannot be empty'),
  check('name').exists().withMessage('name cannot be empty'),
  check('dob').isISO8601().withMessage('date of birth needs to be a valid date'),
  check('gender').exists().withMessage('gender cannot be empty'),
  check('phone').isLength({ min: 10, max: 10 }).withMessage('phone number must be 10 digits long')
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
    req.body.date = moment();
    User.findOne({},null,{sort: {$natural:-1}}).then(users=> {
      if(!users){
        req.body.userid = 1;
      }else{
        req.body.userid = users.userid + 1;
      }
      User.findOne({phone: req.body.phone}).then(user=> {
        if (user) {
            req.body.last_login = moment();
            User.findOneAndUpdate({phone:req.body.phone},{last_login:req.body.last_login}).then(user=>{
              User.findOne({phone:req.body.phone}).then(user=>{
              res.send({status: "success", message: "user already exist", data:user})
            })
          })
        } else {
          req.body.created_at = moment();
          req.body.last_login = moment();
          User.create(req.body).then(aqua=> {
            res.send({status: "success", message: "new user", data:user, data:user});
          })
        }
      })
    }).catch(next);
  });
  
  
//User Login
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
  axios.get(link.domain+'/textlocal/otp.php?otp='+otp+'&phone='+phone)
  .then(response => {
      if(response.data.status === 'success')
      {
      res.send({status:"success",message:"otp sent successfully",otp:otp,data:response.data})
      }
  })
  .catch(error => {
      console.log(error);
  }).catch(next);
});


router.post('/profile_picture/:phone', (req, res, next) => {
if (!req.files)
    return res.status(400).send('No files were uploaded.');
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
        User.findOneAndUpdate({phone:req.params.phone},{profile_picture:image}).then(user=>{
        res.send({
            image,
            status: 'success',
            message: "profile picture uploaded successfully"
        })
        })
        }
    })
});


module.exports = router;

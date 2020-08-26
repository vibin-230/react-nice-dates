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
const Bookings = require('../models/booking');
const Conversation = require('../models/conversation');
const sendAlert = require('./../scripts/sendAlert')
const Alert = require('./../models/alerts')
const Experience = require('./../models/experience')


  router.post('/get_booking_id', [
    verifyToken,
  ], (req, res, next) => {
        Bookings.find({booking_id:req.body.booking_id}).then((a)=>{
        a && a.length > 0 && res.status(201).send({status: "success", message: "coin created",data:a})
}).catch(next);

  });


 

module.exports = router;

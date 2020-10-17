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
const Cashflow = require('../models/cashflow');

const Conversation = require('../models/conversation');
const sendAlert = require('./../scripts/sendAlert')
const Alert = require('./../models/alerts')
const collectReport = require('./../scripts/collectReport')

const Experience = require('./../models/experience')


  router.post('/get_booking_id', [
    verifyToken,
  ], (req, res, next) => {
        Cashflow.find({booking_id:req.body.booking_id}).then((a)=>{
        a && a.length > 0 && res.status(201).send({status: "success", message: "coin created",data:a})
}).catch(next);

  });


  router.post('/save_expense', [
    verifyToken,
  ], (req, res, next) => {
      const body = req.body
          Cashflow.create(body).then((a)=>{
            res.status(201).send({status: "success", message: "cashflow created",data:a})
            //NotifyUsers([body.user],body.status_description)
          }).catch(next)
  });


  router.post('/view_expense', [
    verifyToken,
  ], (req, res, next) => {
      const body = req.body
          Cashflow.find({venue_id:req.body.venue_id,created_at:{$gte:req.body.fromdate,$lt:req.body.todate} }).populate('created_by').lean().then((a)=>{
            Bookings.find({booking_id:{$in:a.filter(s=>s.booking_id).map(s=>s.booking_id) },created_at:{$gte:req.body.fromdate, $lte:req.body.todate} }).lean().populate('collected_by','name _id email').then(booking=>{
            const x = a.map((l)=>{
                    if(l && booking && booking.filter((book)=>book.booking_id === l.booking_id).length >0){
                        l['booking_data'] = booking.filter((book)=>book.booking_id === l.booking_id)
                        return l
                    }else{
                        l['booking_data'] = []
                        return l

                    }
                    
            })
               // console.log(x)
                res.status(201).send({status: "success", message: "cashflow generated",data:x})
            //NotifyUsers([body.user],body.status_description)
          }).catch(next)
        }).catch(next)

  });


 

module.exports = router;

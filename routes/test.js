const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const moment = require("moment");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const nodemailer = require("nodemailer");
const server = require("../scripts/constants");
const link = require("../scripts/uri");
const { check, validationResult } = require("express-validator/check");
const verifyToken = require("../scripts/verifyToken");
const verifySuperAdmin = require("../scripts/verifySuperAdmin");
const jwt = require("jsonwebtoken");
const config = require("../config");
const SlotsAvailableNoOfCourts = require("../helper/slots_available_with_numb")
const data = require("../sample/venue.js");
const distance = require("../scripts/distance.js");

const User = require("../models/user");
const Coins = require("../models/coins");
const Post = require("../models/post");
const Bookings = require("../models/booking");
const Cashflow = require("../models/cashflow");
const Venue = require("../models/venue");
const Admin = require("../models/admin");
const Message = require("../models/message");
const BookRepSlot = require("../helper/book_repeated_slot1")

const Conversation = require("../models/conversation");
const sendAlert = require("./../scripts/sendAlert");
const Alert = require("./../models/alerts");
const Game = require("../models/game");
const combineSlots = require('../scripts/combineSlots')
const createReport = require('../scripts/collectReport')

const Experience = require("./../models/experience");


router.post('/book_slot_for_value1/:id', verifyToken, AccessControl('booking', 'create'), (req, res, next) => {
  let params = req.params.id
  Venue.findById({_id:req.params.id}).then(venue=>{
  Bookings.find({}).sort({"booking_id" : -1}).collation( { locale: "en_US", numericOrdering: true }).limit(1).then(bookingOrder=>{
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
            Bookings.insertMany(values).then(booking=>{
              let values = booking
              Invoice.find({repeat_id: booking[0].repeat_id}).limit(1).then(invoice=> {
                let bookings = booking.map((b)=>b.booking_id)
                if (invoice && invoice.length > 0) {
                    let advance = req.body.bookObject[0].total_advance && (req.body.bookObject[0].total_advance !== '0' || req.body.bookObject[0].total_advance !== '') ? req.body.bookObject[0].total_advance : 0 
                    let total = invoice[0].advance+parseInt(advance,10)
                        createReport({type:'booking',comments:values[0].comments ? booking[0].comments:'',repeat_id:booking[0].repeat_id,venue_id:booking[0].venue_id,booking_id:values[0].booking_id,name:booking[0].name,status:true,admin:values[0].created_by,card:values[0].card?values[0].card:0,coins:0,cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
                        res.status(201).send({status: "success",data:invoice});
                } else {
                    createReport({repeat_id: booking[0].repeat_id,name: booking[0].name,venue_id:values[0].venue_id,booking_id:values[0].booking_id,status:true,admin:values[0].created_by,card:values[0].card?values[0].card:0,coins:0,cash:values[0].cash?values[0].cash:0,upi:values[0].upi?values[0].upi:0},'create',next)
                    res.send({status:"success", message:"slot booked", data:invoice})
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

router.post("/modify_booking/:id", verifyToken, (req, res, next) => {
  Bookings.find({
    booking_id: req.params.id,
    venue_id: req.body.venue_id,
    multiple_id: req.body.multiple_id,
  }).then((booking) => {
    const amount = req.body.amount;
    if (req.body.amount) {
      req.body.amount = req.body.amount / booking.length;
    }
    if (req.body.commission) {
      req.body.commission = req.body.commission / booking.length;
    }
    if (req.body.booking_amount) {
      req.body.booking_amount = req.body.booking_amount / booking.length;
    }
    Bookings.updateMany(
      {
        booking_id: req.params.id,
        venue_id: req.body.venue_id,
        multiple_id: req.body.multiple_id,
      },
      req.body,
      { multi: true }
    ).then((booking) => {
      Bookings.find({
        booking_id: req.params.id,
        venue_id: req.body.venue_id,
        multiple_id: req.body.multiple_id,
      }).then((booking) => {
        const values = booking;
        result = Object.values(combineSlots(booking));
        console.log("report img", req.body.img1);
        createReport(
          {
            type: "booking",
            comments: values[0].comments ? values[0].comments : "",
            venue_id: values[0].venue_id,
            booking_id: values[0].booking_id,
            status: true,
            created_by:values[0].created_by,
            user: values[0].user_id,
            card: values[0].card ? values[0].card : 0,
            coins: 0,
            cash: values[0].cash ? values[0].cash : 0,
            upi: values[0].upi ? values[0].upi : 0,
            image: req.body.img1,
          },
          "create",
          next
        );
        res.send({
          status: "success",
          message: "booking modified",
          data: result,
        });
        let booking_id = booking[0].booking_id;
        let venue_name = booking[0].venue;
        let venue_type = booking[0].venue_type;
        let date = moment(booking[0].booking_date).format("MMMM Do YYYY");
        let start_time = Object.values(booking).reduce((total, value) => {
          return total < value.start_time ? total : value.start_time;
        }, booking[0].start_time);
        let end_time = Object.values(booking).reduce((total, value) => {
          return total > value.end_time ? total : value.end_time;
        }, booking[0].end_time);
        let datetime =
          date +
          " " +
          moment(start_time).format("hh:mma") +
          "-" +
          moment(end_time).format("hh:mma");
        //Activity Log
        // let activity_log = {
        //   datetime: new Date(),
        //   id:req.userId,
        //   user_type: req.role?req.role:"user",
        //   activity: 'slot modified',
        //   name:req.name,
        //   booking_id:booking_id,
        //   venue_id:booking[0].venue_id,
        //   message: "Slot "+booking_id+" modified at "+venue_name+" "+datetime+" "+venue_type,
        // }
        // ActivityLog(activity_log)
      });
    });
  });
});

router.post("/get_booking_id", [verifyToken], (req, res, next) => {
  Cashflow.find({ booking_id: req.body.booking_id })
    .then((a) => {
      a &&
        a.length > 0 &&
        res
          .status(201)
          .send({ status: "success", message: "coin created", data: a });
    })
    .catch(next);
});

router.post("/save_expense", [verifyToken], (req, res, next) => {
  const body = req.body;
  Cashflow.create(body)
    .then((a) => {
      res
        .status(201)
        .send({ status: "success", message: "cashflow created", data: a });
      //NotifyUsers([body.user],body.status_description)
    })
    .catch(next);
});

 
router.post('/slots_available1/:id', verifyToken, (req, res, next) => {
  Venue.findById({_id:req.params.id},{bank:0,access:0}).lean().then(venue=>{
    let venue_id;
        if(venue.secondary_venue){
          venue_id = [venue._id.toString(),venue.secondary_venue_id.toString()]
        }else{
          venue_id = [venue._id.toString()]
        }
        console.log('req.body',req.body)
  //      Booking.find({ venue:req.body.venue, venue_id:{$in:venue_id}, booking_date:req.body.booking_date,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
       Bookings.find({ venue_id:{$in:venue_id}, booking_date:{$gte:new Date(req.body.booking_date),$lt:new Date(req.body.booking_date).addHours(24,0)},booking_status:{$in:["booked","blocked","completed"]}}).then(booking_history=>{
      let slots_available = SlotsAvailableNoOfCourts(venue,booking_history)
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




router.post("/view_expense", [verifyToken], (req, res, next) => {
  const body = req.body;
  Cashflow.find({ venue_id: req.body.venue_id })
    .populate("created_by")
    .lean()
    .then((a) => {
      Bookings.find({
        booking_id: {
          $in: a.filter((s) => s.booking_id).map((s) => s.booking_id),
        },
        created_at: { $gte: req.body.fromdate, $lte: req.body.todate },
      })
        .lean()
        .populate("collected_by", "name _id email")
        .then((booking) => {
          const x = a.map((l) => {
            if (
              l &&
              booking &&
              booking.filter((book) => book.booking_id === l.booking_id)
                .length > 0
            ) {
              l["booking_data"] = booking.filter(
                (book) => book.booking_id === l.booking_id
              );
              return l;
            } else {
              l["booking_data"] = [];
              return l;
            }
          });
          res.status(201).send({
            status: "success",
            message: "cashflow generated",
            data: x,
          });
          //NotifyUsers([body.user],body.status_description)
        })
        .catch(next);
    })
    .catch(next);
});

router.post("/view_game", [verifyToken], (req, res, next) => {
  const body = req.body;
  Game.find({})
    .lean()
    .populate("created_by")
    .populate("venue")
    .populate("users")
    .populate("host")
    .then((a) => {
      res.status(201).send({
        status: "success",
        message: "games data recieved",
        data: a,
      });
      //NotifyUsers([body.user],body.status_description)
    })
    .catch(next);
});


// user list -vibin

router.post(
  "/user",
  verifySuperAdmin,
  // AccessControl("users", "read"),
  (req, res, next) => {
    User.find({})
      .then((user) => {
        res.send({
          status: "success",
          message: "Users fetched",
          data: user,
        });
      })
      .catch(next);
  }
);

//create new multi user coins -vibin
router.post("/create_multiuser_coin", [verifyToken], (req, res, next) => {
  // await Promise.all(req.body.map(async (p) =>
  let userID = req.body.map((u) => u.user);
  User.find({ _id: { $in: userID } })
    .lean()
    .then((users) => {
      if (users.length === req.body.length) {
        Coins.insertMany(req.body).then((coins) => {
          res.send({
            status: "success",
            message: "Coins multiple users updated",
            data: coins,
          });
        });
      }
    })
    .catch(next);
});

router.post("/view_booking_history", [verifyToken], (req, res, next) => {
  const body = req.body;
  Cashflow.find({
    venue_id: req.body.venue_id,
    booking_id: req.body.booking_id,
  })
    .populate("created_by")
    .lean()
    .then((a) => {
      Bookings.find({
        booking_id: {
          $in: [req.body.booking_id],
        },
      })
        .lean()
        .populate("collected_by", "name _id email")
        .then((booking) => {
          const x = a.map((l) => {
            if (
              l &&
              booking &&
              booking.filter((book) => book.booking_id === l.booking_id)
                .length > 0
            ) {
              l["booking_data"] = booking.filter(
                (book) => book.booking_id === l.booking_id
              );
              return l;
            } else {
              l["booking_data"] = [];
              return l;
            }
          });
          res.status(201).send({
            status: "success",
            message: "cashflow generated",
            data: x,
          });
          //NotifyUsers([body.user],body.status_description)
        })
        .catch(next);
    })
    .catch(next);
});
module.exports = router;

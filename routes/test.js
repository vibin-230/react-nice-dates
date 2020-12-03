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

const Conversation = require("../models/conversation");
const sendAlert = require("./../scripts/sendAlert");
const Alert = require("./../models/alerts");
const collectReport = require("./../scripts/collectReport");
const Game = require("../models/game");

const Experience = require("./../models/experience");

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

//modified cancel game booking  // by vibin

router.post("/cancel_game_booking/:id", (req, res, next) => {
  Bookings.findOne({
    booking_id: req.params.id,
    multiple_id: req.body.multiple_id,
  })
    .then((booking) => {
      User.findById({ _id: req.userId })
        .then((user) => {
          Venue.findById({ _id: booking.venue_id })
            .then((venue) => {
              Admin.find(
                { venue: { $in: [booking.venue_id] }, notify: true },
                { activity_log: 0 }
              ).then((admins) => {
                // const phone_numbers = admins.map((key)=>"91"+key.phone)
                let phone_numbers = admins.map(
                  (admin, index) => "91" + admin.phone
                );
                let venue_phone = "91" + venue.venue.contact;
                let manger_numbers = [...phone_numbers, venue_phone];
                if (
                  booking.booking_type === "app" &&
                  req.body.refund_status &&
                  booking.transaction_id !== "free_slot"
                ) {
                  axios
                    .post(
                      "https://" +
                        rzp_key +
                        "@api.razorpay.com/v1/payments/" +
                        booking.transaction_id +
                        "/refund"
                    )
                    .then((response) => {
                      if (response.data.entity === "refund") {
                        /// user  with refund
                        Bookings.updateMany(
                          {
                            booking_id: req.params.id,
                            multiple_id: req.body.multiple_id,
                          },
                          {
                            $set: {
                              booking_status: "cancelled",
                              refunded: true,
                              refund_status: true,
                              game: false,
                              description: "from_game_with_refund",
                            },
                          },
                          { multi: true }
                        )
                          .then((booking) => {
                            Bookings.find({
                              booking_id: req.params.id,
                              multiple_id: req.body.multiple_id,
                            })
                              .lean()
                              .populate("venue_data")
                              .then((booking) => {
                                Coins.find({ booking_id: req.params.id })
                                  .lean()
                                  .then((coins) => {
                                    if (coins) {
                                      Coins.deleteMany({
                                        booking_id: req.params.id,
                                      })
                                        .lean()
                                        .then((coins) => {})
                                        .catch(next);
                                    }

                                    Game.findOneAndUpdate(
                                      { "bookings.booking_id": req.params.id },
                                      {
                                        $set: {
                                          bookings: booking,
                                          booking_status: "hosted",
                                        },
                                      }
                                    )
                                      .then((game) => {
                                        Message.create({
                                          conversation: game.conversation,
                                          message: `${
                                            user && user.handle
                                              ? user.handle
                                              : user.name
                                          } has cancelled this slot and a refund has been initiated.`,
                                          name: "bot",
                                          read_status: true,
                                          read_by: req.userId,
                                          author: req.userId,
                                          type: "bot",
                                          created_at: new Date(),
                                        })
                                          .then((message1) => {
                                            Conversation.findByIdAndUpdate(
                                              { _id: game.conversation },
                                              {
                                                $set: {
                                                  last_message: message1._id,
                                                  last_updated: new Date(),
                                                },
                                              }
                                            )
                                              .then((m) => {
                                                getGame(
                                                  res,
                                                  game.conversation,
                                                  true,
                                                  next,
                                                  req
                                                );
                                                handleSlotAvailabilityWithCancellation(
                                                  booking,
                                                  req.socket
                                                );
                                              })
                                              .catch(next);
                                          })
                                          .catch(next);
                                      })
                                      .catch(next);
                                    let booking_id = booking[0].booking_id;
                                    let venue_name = booking[0].venue;
                                    let venue_type = SetKeyForSport(
                                      booking[0].venue_type
                                    );
                                    let venue_area =
                                      booking[0].venue_data.venue.area;
                                    let booking_amount =
                                      Math.round(booking[0].booking_amount) *
                                      booking.length;
                                    let phone = "91" + booking[0].phone;
                                    let date = moment(
                                      booking[0].booking_date
                                    ).format("MMMM Do YYYY");
                                    let start_time = Object.values(
                                      booking
                                    ).reduce((total, value) => {
                                      return total < value.start_time
                                        ? total
                                        : value.start_time;
                                    }, booking[0].start_time);
                                    let end_time = Object.values(
                                      booking
                                    ).reduce((total, value) => {
                                      return total > value.end_time
                                        ? total
                                        : value.end_time;
                                    }, booking[0].end_time);
                                    let time =
                                      moment(start_time)
                                        .utc()
                                        .format("hh:mma") +
                                      "-" +
                                      moment(end_time).utc().format("hh:mma");
                                    let datetime =
                                      date +
                                      " " +
                                      moment(start_time)
                                        .utc()
                                        .format("hh:mma") +
                                      "-" +
                                      moment(end_time).utc().format("hh:mma");
                                    let USER_CANCEL_WITH_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAdvance of Rs.${booking_amount} will be refunded within 3-4 working days.`; //490450
                                    let VENUE_CANCEL_WITH_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAdvance of Rs.${booking_amount} will be refunded to the user within 3-4 working days.`; ///490570
                                    // let venue_manager_phone =phone_numbers.join(",")
                                    let sender = "TRFTWN";
                                    //Send SMS
                                    // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                                    // }).catch(error=>{
                                    // })
                                    ////user cancel with refund
                                    SendMessage(
                                      phone,
                                      sender,
                                      USER_CANCEL_WITH_REFUND
                                    );
                                    notifyRedirect(
                                      user,
                                      USER_CANCEL_WITH_REFUND
                                    );
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
                                      id: req.userId,
                                      user_type: req.role ? req.role : "user",
                                      activity: "slot booking cancelled",
                                      name: req.name,
                                      venue_id: booking[0].venue_id,
                                      booking_id: booking_id,
                                      message:
                                        "Slot " +
                                        booking_id +
                                        " booking cancelled at " +
                                        venue_name +
                                        " " +
                                        datetime +
                                        " " +
                                        venue_type,
                                    };
                                    ActivityLog(activity_log);
                                  })
                                  .catch(next);
                              })
                              .catch(next);
                          })
                          .catch(next);
                      }
                    })
                    .catch((error) => {
                      console.log(error.response.data);
                    })
                    .catch(next);
                } else {
                  Bookings.updateMany(
                    { booking_id: req.params.id, created_by: req.userId },
                    {
                      $set: {
                        booking_status: "cancelled",
                        refund_status: false,
                        game: false,
                      },
                    },
                    { multi: true }
                  )
                    .then((booking) => {
                      ////user cancellation without refund
                      Bookings.find({
                        booking_id: req.params.id,
                        created_by: req.userId,
                      })
                        .lean()
                        .populate("venue_data")
                        .then((booking) => {
                          Coins.find({ booking_id: req.params.id })
                            .lean()
                            .then((coins) => {
                              if (coins && req.body.refund_status) {
                                Coins.deleteMany({ booking_id: req.params.id })
                                  .lean()
                                  .then((coins) => {})
                                  .catch(next);
                              }

                              Game.findOneAndUpdate(
                                { "bookings.booking_id": req.params.id },
                                {
                                  $set: {
                                    bookings: booking,
                                    booking_status: "hosted",
                                  },
                                }
                              );
                              Game.findOne({
                                "bookings.booking_id": req.params.id,
                              })
                                .then((game) => {
                                  Message.create({
                                    conversation: game.conversation,
                                    message: `${
                                      user && user.handle
                                        ? user.handle
                                        : user.name
                                    } has cancelled this slot. There will be no refund as there is less than 6 hours to the scheduled time.`,
                                    name: "bot",
                                    read_status: false,
                                    read_by: req.userId,
                                    author: req.userId,
                                    type: "bot",
                                    created_at: new Date(),
                                  })
                                    .then((message1) => {
                                      Conversation.findByIdAndUpdate(
                                        { _id: game.conversation },
                                        {
                                          $set: {
                                            last_message: message1._id,
                                            last_updated: new Date(),
                                          },
                                        }
                                      )
                                        .then((m) => {
                                          getGame(
                                            res,
                                            game.conversation,
                                            true,
                                            next,
                                            req
                                          );
                                          handleSlotAvailabilityWithCancellation(
                                            booking,
                                            req.socket
                                          );
                                        })
                                        .catch(next);
                                    })
                                    .catch(next);
                                })
                                .catch(next);

                              let booking_id = booking[0].booking_id;
                              let venue_name = booking[0].venue;
                              let venue_type = SetKeyForSport(
                                booking[0].venue_type
                              );
                              let venue_area = booking[0].venue_data.venue.area;
                              let phone = "91" + booking[0].phone;
                              let booking_amount =
                                Math.round(booking[0].booking_amount) *
                                booking.length;
                              let date = moment(booking[0].booking_date).format(
                                "MMMM Do YYYY"
                              );
                              let start_time = Object.values(booking).reduce(
                                (total, value) => {
                                  return total < value.start_time
                                    ? total
                                    : value.start_time;
                                },
                                booking[0].start_time
                              );
                              let end_time = Object.values(booking).reduce(
                                (total, value) => {
                                  return total > value.end_time
                                    ? total
                                    : value.end_time;
                                },
                                booking[0].end_time
                              );
                              // let datetime = date + " " + moment(start_time).subtract(330,"minutes").format("LT") + "-" + moment(end_time).subtract(330,"minutes").format("LT")
                              let datetime =
                                date +
                                " " +
                                moment(start_time).utc().format("hh:mma") +
                                "-" +
                                moment(end_time).utc().format("hh:mma");
                              let time =
                                moment(start_time).utc().format("hh:mma") +
                                "-" +
                                moment(end_time).utc().format("hh:mma");
                              let sender = "TRFTWN";
                              //Send SMS
                              // axios.get(process.env.PHP_SERVER+'/textlocal/cancel_slot.php?booking_id='+booking_id+'&phone='+phone+'&venue_name='+venue_name+'&date='+datetime+'&venue_type='+booking[0].venue_type+'&sport_name='+booking[0].sport_name+'&venue_area='+venue_area).then(response => {
                              // }).catch(error=>{
                              // })
                              // let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged as a cancellation fee.`//490447
                              // let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${booking[0].phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of ${booking_amount} will be charged to the user as a cancellation fee.`//490533
                              let venue_manager_phone =
                                "91" + venue.venue.contact;
                              let USER_CANCEL_WITHOUT_REFUND = `Your Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled.\nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged as a cancellation fee.`; //490447
                              let VENUE_CANCEL_WITHOUT_REFUND = `Turf Town booking ${booking_id} scheduled for ${datetime} at ${venue_name}, ${venue_area} (${venue_type}) has been cancelled by the user.\n ${booking[0].name}(${phone}) \nAs the slot has been cancelled with less than 6 hours to the scheduled time, advance paid of Rs.${booking_amount} will be charged to the user as a cancellation fee.`; //490533
                              ////user cancel with refund
                              SendMessage(
                                phone,
                                sender,
                                USER_CANCEL_WITHOUT_REFUND
                              );
                              notifyRedirect(user, USER_CANCEL_WITHOUT_REFUND);
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
                            })
                            .catch(next);
                        })
                        .catch(next);
                    })
                    .catch(next);
                }
              });
            })
            .catch(next);
        })
        .catch(next);
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

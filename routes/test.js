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
const SlotsAvailableNoOfCourts = require("../helper/slots_available_with_numb");
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
const Game = require("../models/game");
const combineSlots = require("../scripts/combineSlots");
const createReport = require("../scripts/collectReport");

const Experience = require("./../models/experience");
const rzp_key = require("../scripts/rzp");
const weekData = require("../scripts/occupancyHelper");

const BookRepSlot = require("../helper/book_repeated_slot1");

router.post("/book_slot_for_value1/:id", verifyToken, (req, res, next) => {
  let params = req.params.id;
  Venue.findById({ _id: req.params.id })
    .then((venue) => {
      Bookings.find({})
        .sort({ booking_id: -1 })
        .collation({ locale: "en_US", numericOrdering: true })
        .limit(1)
        .then((bookingOrder) => {
          let promisesToRun = [];
          var id = mongoose.Types.ObjectId();
          req.body.bookObject.map((arr, index) => {
            let record = [];
            for (let i = 0; i < arr.block.length; i++) {
              let repeat_data = { ...arr.block[i], ...req.body.repeat_data };
              promisesToRun.push(
                BookRepSlot(
                  repeat_data,
                  id,
                  params,
                  req,
                  res,
                  index + 1,
                  record,
                  bookingOrder,
                  venue,
                  next
                )
              );
            }
          });
          Promise.all(promisesToRun)
            .then((values) => {
              // Bookings.insertMany(values)
              //   .then((booking) => {
              const x = req.body && req.body.create_report;
              x &&
                createReport(
                  {
                    type: "booking",
                    comments: req.body.create_report_body.comments,
                    venue_id: req.body.create_report_body.venue_id,
                    booking_id: values[0].booking_id,
                    name: req.body.create_report_body.name,
                    status: true,
                    created_by: req.body.create_report_body.admin,
                    card: req.body.create_report_body.card,
                    coins: 0,
                    cash: req.body.create_report_body.cash,
                    upi: req.body.create_report_body.upi,
                    image: req.body.create_report_body.image,
                  },
                  "create",
                  next
                );
              res.status(201).send({ status: "success", data: values });
              // })
              // .catch((error) => {
              //   console.log(error);
              //   reject();
              // });
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
});
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

        createReport(
          {
            type: "booking",
            comments: values[0].comments ? values[0].comments : "",
            venue_id: values[0].venue_id,
            booking_id: values[0].booking_id,
            status: true,
            created_by: values[0].created_by,
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
          message: "cash card upi modified",
          data: result,
        });
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

router.post("/slots_available1/:id", verifyToken, (req, res, next) => {
  Venue.findById({ _id: req.params.id }, { bank: 0, access: 0 })
    .lean()
    .then((venue) => {
      let venue_id;
      if (venue.secondary_venue) {
        venue_id = [venue._id.toString(), venue.secondary_venue_id.toString()];
      } else {
        venue_id = [venue._id.toString()];
      }
      console.log("req.body", req.body);
      //      Booking.find({ venue:req.body.venue, venue_id:{$in:venue_id}, booking_date:req.body.booking_date,booking_status:{$in:["blocked","booked","completed"]}}).then(booking_history=>{
      Bookings.find({
        venue_id: { $in: venue_id },
        booking_date: {
          $gte: new Date(req.body.booking_date),
          $lt: new Date(req.body.booking_date).addHours(24, 0),
        },
        booking_status: { $in: ["booked", "blocked", "completed"] },
      })
        .then((booking_history) => {
          console.log(booking_history.map((a) => a.booking_id));
          let slots_available = SlotsAvailableNoOfCourts(
            venue,
            booking_history
          );
          // console.log(moment(req.body.booking_date).add(1,"day"))
          if (!slots_available) {
            res.send({
              status: "success",
              message: "available slots fetched",
              data: [],
            });
          } else {
            res.send({
              status: "success",
              message: "available slots fetched",
              data: slots_available,
            });
          }
        })
        .catch(next);
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
  console.log("coins add", req.body, userID);
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

router.post("/booking_completed1/:id", verifyToken, (req, res, next) => {
  Bookings.find({ booking_id: req.params.id, venue_id: req.body.venue_id })
    .then((booking) => {
      if (req.body.commission) {
        req.body.commission = req.body.commission / booking.length;
      }
      Bookings.updateMany(
        { booking_id: req.params.id, venue_id: req.body.venue_id },
        req.body,
        { multi: true }
      )
        .then((booking) => {
          Bookings.find({
            booking_id: req.params.id,
            venue_id: req.body.venue_id,
          })
            .then((booking) => {
              const values = booking;
              Game.findOne({ "bookings.booking_id": booking[0].booking_id })
                .then((g) => {
                  if (g) {
                    Game.findOneAndUpdate(
                      { "bookings.booking_id": booking[0].booking_id },
                      {
                        $set: {
                          bookings: booking,
                          completed: true,
                          booking_status: "completed",
                        },
                      }
                    )
                      .populate("users", "name handle device_token")
                      .then((a) => {
                        let final_Game =
                          a.sport_name == "cricket" ||
                          a.sport_name == "badminton"
                            ? a.users.length >= 3
                              ? true
                              : false
                            : a.sport_name == "football" ||
                              a.sport_name == "basketball"
                            ? a.users.length >= 4
                              ? true
                              : false
                            : false;
                        if (final_Game) {
                          Message.create({
                            conversation: a.conversation,
                            message: `Game completed! Please pick an MVP for this game '${a.name}'.`,
                            name: "bot",
                            read_status: true,
                            read_by: a.host[0],
                            author: a.host[0],
                            type: "bot",
                            created_at: new Date(),
                          }).then((message1) => {
                            Conversation.findByIdAndUpdate(
                              { _id: a.conversation },
                              {
                                $set: {
                                  last_message: message1._id,
                                  last_updated: new Date(),
                                },
                              }
                            ).then((m) => {
                              Conversation.findById({ _id: a.conversation })
                                .populate(
                                  "members",
                                  "name _id handle profile_picture name_status device_token"
                                )
                                .lean()
                                .then((m) => {
                                  const device_token_list = a.users.map(
                                    (e) => e.device_token
                                  );
                                  NotifyArray(
                                    device_token_list,
                                    `Game completed! Please pick an MVP for this game.`,
                                    `${a.name}`,
                                    m
                                  );
                                  return a.users.map((e) => e._id);
                                });
                            });
                          });
                        }
                      });
                  }
                  result = Object.values(combineSlots(booking));
                  res.send({
                    status: "success",
                    message: "booking completed",
                    data: result,
                  });

                  let booking_id = booking[0].booking_id;
                  let venue_name = booking[0].venue;
                  let venue_type = booking[0].venue_type;
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
                      return total > value.end_time ? total : value.end_time;
                    },
                    booking[0].end_time
                  );
                  let datetime =
                    date +
                    " " +
                    moment(start_time).format("hh:mma") +
                    "-" +
                    moment(end_time).format("hh:mma");
                  // //Activity Log
                  // let activity_log = {
                  //   datetime: new Date(),
                  //   id:req.userId,
                  //   user_type: req.role?req.role:"user",
                  //   activity: 'slot booking completed',
                  //   name:req.name,
                  //   venue_id:booking[0].venue_id,
                  //   booking_id:booking_id,
                  //   message: "Slot "+booking_id+" booking completed at "+venue_name+" "+datetime+" "+venue_type,
                  // }
                  // ActivityLog(activity_log)
                })
                .catch(next);
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
});

router.post("/modify_booking1/:id", verifyToken, (req, res, next) => {
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

        res.send({
          status: "success",
          message: "booking modified",
          data: result,
        });
      });
    });
  });
});

router.post("/venue_analytics/:id", (req, res, next) => {
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
  Bookings.find({
    booking_status: { $in: ["completed"] },
    venue_id: req.params.id,
    booking_date: { $gte: req.body.fromdate, $lte: req.body.todate },
    booking_type: "app",
  })
    .lean()
    .populate("venue_data", "venue")
    .populate("collected_by", "name")
    .then((booking_completed) => {
      Bookings.find({
        booking_status: { $in: ["completed"] },
        venue_id: { $in: req.body.venue_id },
        booking_date: { $gte: req.body.fromdate, $lte: req.body.todate },
      })
        .lean()
        .then((booking) => {
          let result = {};
          let revenueForCurrentMonth = 0;
          let revenueForPreviousMonthTillToday = 0;
          let data = booking.map((value, index) => {
            let date = moment(value.booking_date).format("DD-MM-YYYY");
            if (!result[date]) {
              result[date] = value;
              result[date].bookings = 1;
              result[date].slots_booked = 1;
              result[date].hours_played = 0.5;
              // result[date].commission = value.commission
            } else {
              let new_amout =
                result[date].booking_status == "cancelled"
                  ? result[date].booking_amount / 2
                  : Math.round(result[date].amount);
              let value_amount =
                value.booking_status == "cancelled"
                  ? value.booking_amount / 2
                  : Math.round(value.amount);
              let new_commission =
                result[date].booking_status == "cancelled"
                  ? 0
                  : result[date].commission;
              let value_commission =
                value.booking_status == "cancelled" ? 0 : value.commission;
              result[date].amount = new_amout + value_amount;
              result[date].commission = new_commission + value_commission;
              result[date].slots_booked = result[date].slots_booked + 1;
              result[date].hours_played = (result[date].slots_booked * 30) / 60;
            }
          });

          result = Object.values(result);

          //  edited by vibin ----revenue and last month revenu
          let group = result.reduce((r, a) => {
            r[moment(a.booking_date).format("YYYYMM")] = [
              ...(r[moment(a.booking_date).format("YYYYMM")] || []),
              a,
            ];
            return r;
          }, {});

          Object.keys(group).map((key) => {
            if (key === moment().format("YYYYMM")) {
              for (let i = 0; i < group[key].length; i++) {
                revenueForCurrentMonth += Math.round(
                  (group[key][i].amount ? group[key][i].amount : 0) -
                    (group[key][i].commission ? group[key][i].commission : 0)
                );
              }
            }
            if (key === moment().subtract(1, "month").format("YYYYMM")) {
              for (let i = 0; i < group[key].length; i++) {
                if (
                  moment(group[key][i].booking_date).format("YYYYMMDD") <=
                  moment().subtract(1, "month").utc().format("YYYYMMDD")
                ) {
                  revenueForPreviousMonthTillToday += Math.round(
                    parseInt(group[key][i].amount) -
                      parseInt(group[key][i].commission)
                  );
                }
              }
            }
          });
          let total_Revenue = revenueForCurrentMonth;
          let total_no_of_days = moment().subtract(1, "days").format("D");
          let total_no_of_days_in_month = moment().daysInMonth();
          let projected_Revenue =
            (total_Revenue / total_no_of_days) * total_no_of_days_in_month;
          const weekDataResult = weekData(result);

          let completed_slots = booking_completed.filter(
            (payments) =>
              (payments.booking_type === "app" &&
                payments.booking_status == "completed") ||
              (payments.booking_status == "cancelled" &&
                (payments.refund_status == true || payments.refunded == false))
          );
          let total_amount = completed_slots.reduce((payment1, payment2) => {
            let total =
              payment2.booking_status == "completed" ||
              (payment2.booking_status == "cancelled" &&
                (payment2.refund_status == true || payment2.refunded == false))
                ? payment2.coupon_amount
                  ? payment2.coupon_amount
                  : 0 + payment2.coins
                  ? payment2.coins
                  : 0 + payment2.booking_amount
                  ? payment2.booking_amount
                  : 0
                : 0;
            return payment1 + total;
          }, 0);

          res.send({
            status: "success",
            message: "revenue reports fetched",
            data: {
              amount: revenueForCurrentMonth,
              lastMonth_revenue: revenueForPreviousMonthTillToday,
              projected_Revenue: projected_Revenue,
              projected_weekdays_data: weekDataResult.weekDay,
              projected_weekends_data: weekDataResult.weekEnd,
              completed_slots: completed_slots.length,
              total_amount: total_amount,
            },
          });
        })
        .catch(next);
    })
    .catch(next);
  // }).catch(next)
});

router.post(
  "/booking_completed_with_record/:id",
  verifyToken,
  (req, res, next) => {
    Booking.find({
      booking_id: req.params.id,
      venue_id: req.body.venue_id,
      multiple_id: req.body.multiple_id,
    })
      .then((booking) => {
        if (req.body.commission) {
          req.body.commission = req.body.commission / booking.length;
        }
        Booking.updateMany(
          {
            booking_id: req.params.id,
            venue_id: req.body.venue_id,
            multiple_id: req.body.multiple_id,
          },
          req.body,
          { multi: true }
        )
          .then((booking) => {
            Booking.find({
              booking_id: req.params.id,
              venue_id: req.body.venue_id,
              multiple_id: req.body.multiple_id,
            })
              .then((booking) => {
                const values = booking;
                Game.findOne({ "bookings.booking_id": booking[0].booking_id })
                  .then((g) => {
                    if (g) {
                      Game.findOneAndUpdate(
                        { "bookings.booking_id": booking[0].booking_id },
                        {
                          $set: {
                            bookings: booking,
                            completed: true,
                            booking_status: "completed",
                          },
                        }
                      )
                        .populate("users", "name handle device_token")
                        .then((a) => {
                          let final_Game =
                            a.sport_name == "cricket" ||
                            a.sport_name == "badminton"
                              ? a.users.length >= 3
                                ? true
                                : false
                              : a.sport_name == "football" ||
                                a.sport_name == "basketball"
                              ? a.users.length >= 4
                                ? true
                                : false
                              : false;
                          if (final_Game) {
                            Message.create({
                              conversation: a.conversation,
                              message: `Game completed! Please pick an MVP for this game '${a.name}'.`,
                              name: "bot",
                              read_status: true,
                              read_by: a.host[0],
                              author: a.host[0],
                              type: "bot",
                              created_at: new Date(),
                            }).then((message1) => {
                              Conversation.findByIdAndUpdate(
                                { _id: a.conversation },
                                {
                                  $set: {
                                    last_message: message1._id,
                                    last_updated: new Date(),
                                  },
                                }
                              ).then((m) => {
                                Conversation.findById({ _id: a.conversation })
                                  .populate(
                                    "members",
                                    "name _id handle profile_picture name_status device_token"
                                  )
                                  .lean()
                                  .then((m) => {
                                    const device_token_list = a.users.map(
                                      (e) => e.device_token
                                    );
                                    NotifyArray(
                                      device_token_list,
                                      `Game completed! Please pick an MVP for this game.`,
                                      `${a.name}`,
                                      m
                                    );
                                    return a.users.map((e) => e._id);
                                  });
                              });
                            });
                          }
                        });
                    }
                    result = Object.values(combineSlots(booking));
                    res.send({
                      status: "success",
                      message: "booking completed",
                      data: result,
                    });

                    let booking_id = booking[0].booking_id;
                    let venue_name = booking[0].venue;
                    let venue_type = booking[0].venue_type;
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
                        return total > value.end_time ? total : value.end_time;
                      },
                      booking[0].end_time
                    );
                    let datetime =
                      date +
                      " " +
                      moment(start_time).format("hh:mma") +
                      "-" +
                      moment(end_time).format("hh:mma");
                    // //Activity Log
                    // let activity_log = {
                    //   datetime: new Date(),
                    //   id:req.userId,
                    //   user_type: req.role?req.role:"user",
                    //   activity: 'slot booking completed',
                    //   name:req.name,
                    //   venue_id:booking[0].venue_id,
                    //   booking_id:booking_id,
                    //   message: "Slot "+booking_id+" booking completed at "+venue_name+" "+datetime+" "+venue_type,
                    // }
                    // ActivityLog(activity_log)
                  })
                  .catch(next);
              })
              .catch(next);
          })
          .catch(next);
      })
      .catch(next);
  }
);

//booking history by app by venue ---vibin
router.post("/booking_history_from_app_by_venue1", (req, res, next) => {
  Bookings.find({
    booking_date: { $gte: req.body.todate, $lte: req.body.fromdate },
    booking_type: "app",
    turftown_payment_status: req.body.turftown_payment_status,
  })
    .lean()
    .populate("venue_data", "venue")
    .populate("collected_by", "name")
    .then((booking1) => {
      console.log(booking1);
      let result1 = Object.values(combineSlots(booking1));
      let finalResult = [...result1];
      res.send({
        status: "success",
        message: "booking history fetched",
        data: finalResult,
      });
    })
    .catch(next);
});

router.post("/update_booking_history_from_app_by_venue1", (req, res, next) => {
  Bookings.find({ booking_id: { $in: req.body.id } })
    .lean()
    .then((booking) => {
      Bookings.updateMany(
        { booking_id: { $in: req.body.id } },
        {
          turftown_payment_status: req.body.turftown_payment_status,
          turftown_payment_time: moment().utc().format(),
        }
      ).then((payments) => {
        res.send({
          status: "success",
          message: "TurfTown payments updated",
          data: payments,
        });
      });
      // }
    })
    .catch(next);
});

router.post("/past_turftown_payments", (req, res, next) => {
  Bookings.find({
    booking_date: { $gte: req.body.todate, $lte: req.body.fromdate },
    booking_type: "app",
    turftown_payment_status: true,
  })
    .lean()
    .populate("venue_data", "venue")
    .populate("collected_by", "name")

    .then((booking1) => {
      let group2 = booking1.reduce((r, a) => {
        r[`${moment(a.turftown_payment_time).format("DDMMYYYY")}`] = [
          ...(r[`${moment(a.turftown_payment_time).format("DDMMYYYY")}`] || []),
          a,
        ];
        return r;
      }, {});
      let finalResult =
        // let result1 = Object.values(combineSlots(booking1));
        // let finalResult = [...result1];
        res.send({
          status: "success",
          message: "booking history fetched",
          data: group2,
        });
    })
    .catch(next);
});

module.exports = router;

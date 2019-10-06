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
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const SuperAdmin = require('../models/superAdmin');
const Offer = require('../models/offers');

function ActivityLogForUser(id, phone, activity, description) {
  let activity_log = {
      datetime: new Date(),
      id:id,
      phone:phone,
      activity: activity,
      description: description
  }
  User.findOneAndUpdate({_id:id},{$push:{activity_log:activity_log}}).then(admin=>{
      console.log("activity log updated")
  })
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1);
    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km
    return d;
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

// router.post('/venue_list', verifyToken, (req, res, next) => {
//     let zipcode;
//     axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=13.0389622,80.236313&key=AIzaSyBg-CZ9Fk94r5uFwvmVp-U1XSXDvJRAnmo').then(response=>{
//         zipcode = Object.values(response.data.results[0].address_components).filter(value=>value.types[0]==='postal_code')
//         zipcode = zipcode[0].long_name
//         console.log(zipcode)
//         var list = Object.values(data.venues).map((value,index)=>{
//             let distance = getDistanceFromLatLonInKm(req.body.latLong[0],req.body.latLong[1],value.latLong[0],value.latLong[1])
//             value.distance = distance
//             let featured = value.featured.filter(featured=>featured.zipcode==zipcode)
//             let zCode = (featured.length>0?featured[0].type*20:null)+(value.exclusive?1*3:0)+(value.new?1*0.5:0)+(value.venuePrice*0.5)-(distance*3)+(value.venueRating*2)
//             value.zCode = zCode
//             return value
//         })
//         list.sort(function(a, b) {
//             return b.zCode - a.zCode;
//         });
//         res.status(201).send(list);
//     }).catch(next);
// });


function findTime() {
  var d = new Date();
  return d.getDay()
}

router.post('/venue_list', verifyToken, (req, res, next) => {
  console.log(req.body);
  function findDay() {
    var d = new Date();
    var weekday = new Array(7);
    weekday[0] = "sunday";
    weekday[1] = "monday";
    weekday[2] = "tuesday";
    weekday[3] = "wednesday";
    weekday[4] = "thursday";
    weekday[5] = "friday";
    weekday[6] = "saturday";
    var n = weekday[d.getDay()];
    return n
  }
  let zipcode;
  axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+req.body.latLong[0]+','+req.body.latLong[1]+'&key=AIzaSyAJUmuoOippG_r1aw3e32kW1ceIA3yexHQ').then(response=>{

    if(response.data.error_message){
      zipcode = "600017"
    }else{
      zipcode = Object.values(response.data.results[0].address_components).filter(value=>value.types[0]==='postal_code')
      zipcode = zipcode[0].long_name
    }
    console.log(zipcode);
    if(parseInt(zipcode, 10) > 600120 || parseInt(zipcode, 10) < 600000){
      res.status(409).send({status:"failed", message: "No venues available at this location"})
    }else{
      Venue.find({type:req.body.sport_type, "configuration.types":{$in:[req.body.venue_type]},status:true},{bank:0, offers:0, access:0}).lean().then(venue=>{
        Offer.find({}).then(offers=>{

          var list = Object.values(venue).map((value,index)=>{
              let distance = getDistanceFromLatLonInKm(req.body.latLong[0],req.body.latLong[1],value.venue.latLong[0],value.venue.latLong[1])

              let featured = value.featured.filter(featured=>featured.zipcode==zipcode)
              
              let pricing = Object.values(value.configuration.pricing).filter(price=>price.day===findDay())
              let price = Math.min(...pricing[0].rate[0].pricing)
              let rating = Object.values(value.rating).reduce((a,b)=>{
                let c = a+b.rating.rating
                return c
              },0)
              rating = rating/value.rating.length
              let zCode = (featured.length>0?featured[0].type*20:0)+(value.exclusive?1*3:0)+(value.new?1*0.5:0)+(price?price*0.5:0)-(distance?distance*3:0)+(rating?rating*2:0)
              value.z_code = zCode
              value.rating = value.rating
              value.distance = distance.toFixed(2)
              value.pricing = price
              let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
              value.offer = filteredOffer
              return value
          })
          list.sort(function(a, b) {
              return b.zCode - a.zCode;
          });
          res.status(201).send(list);
      }).catch(next);
    }).catch(next);
    }
  }).catch(next);
});


router.post('/venue_list_for_website', (req, res, next) => {
  function findDay() {
    var d = new Date();
    var weekday = new Array(7);
    weekday[0] = "sunday";
    weekday[1] = "monday";
    weekday[2] = "tuesday";
    weekday[3] = "wednesday";
    weekday[4] = "thursday";
    weekday[5] = "friday";
    weekday[6] = "saturday";
    var n = weekday[d.getDay()];
    return n
  }
  let zipcode;
  axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng='+req.body.latLong[0]+','+req.body.latLong[1]+'&key=AIzaSyBg-CZ9Fk94r5uFwvmVp-U1XSXDvJRAnmo').then(response=>{
      // zipcode = Object.values(response.data.results[0].address_components).filter(value=>value.types[0]==='postal_code')
      // zipcode = zipcode[0].long_name
      zipcode = "600017"
      Venue.find({type:req.body.sport_type, "configuration.types":{$in:[req.body.venue_type]},status:true},{bank:0, offers:0, access:0}).lean().then(venue=>{
        // venue = JSON.stringify(venue)
        // venue = JSON.parse(venue)
        // console.log(venue)
        Offer.find({}).then(offers=>{

          var list = Object.values(venue).map((value,index)=>{
              let distance = getDistanceFromLatLonInKm(req.body.latLong[0],req.body.latLong[1],value.venue.latLong[0],value.venue.latLong[1])

              let featured = value.featured.filter(featured=>featured.zipcode==zipcode)
              
              console.log(value.configuration.pricing)
              let pricing = Object.values(value.configuration.pricing).filter(price=>price.day===findDay())
              let price = Math.min(...pricing[0].rate[0].pricing)
              let rating = Object.values(value.rating).reduce((a,b)=>{
                let c = a+b.rating
                return c
              },0)
              rating = rating/value.rating.length
              let zCode = (featured.length>0?featured[0].type*20:0)+(value.exclusive?1*3:0)+(value.new?1*0.5:0)+(price?price*0.5:0)-(distance?distance*3:0)+(rating?rating*2:0)
              value.z_code = zCode
              value.rating = rating.toFixed(1)
              value.distance = distance.toFixed(2)
              value.pricing = price
              let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
              value.offer = filteredOffer
              return value
          })
          list.sort(function(a, b) {
              return b.zCode - a.zCode;
          });
          res.status(201).send(list);
      }).catch(next);
    }).catch(next);
  }).catch(next);
});

// //Post Ratings
// router.post('/rating/:id', verifyToken, (req, res, next) => {
//   let rating = {
//     user_id:req.userId,
//     phone:req.phone,
//     rating:req.body.rating,
//     review:req.body.review,
//     sport:req.body.sport,
//     date:new Date()
//   }
//   Venue.findByIdAndUpdate({_id:req.params.id}, {$push:{rating:rating}}).then(venue=>{
//     Venue.findById({_id:req.params.id}).then(venue=>{
//       res.status(201).send({
//         data: venue,
//         status:'success',
//         message:"rating posted"
//       })
//       ActivityLogForUser(req.userId,  req.phone, 'venue rated', req.phone + " rated " +req.body.rating+ " star for " + venue.venue.name)
//     }).catch(next);
//   }).catch(next);
// })

//Post Review
router.post('/review/:id', verifyToken, (req, res, next) => {
  let review = {
    user_id:req.userId,
    name:req.name,
    phone:req.phone,
    review:req.body.review,
    date:new Date()
  }
  Venue.findByIdAndUpdate({_id:req.params.id}, {$push:{review:review}}).then(venue=>{
    Venue.findById({_id:req.params.id}).then(venue=>{
      res.status(201).send({
        data: venue,
        status:'success',
        message:"review posted"
      })
      ActivityLogForUser(req.userId,  req.phone, 'venue reviewed', req.phone + " reviewed " + venue.venue.name)
    }).catch(next);
  }).catch(next);
})

//Post Review
router.get('/ratings_by_user/:id', verifyToken, (req, res, next) => {
  Venue.find({}).then(venues=>{
    user_reviews = []
    venues.map(venue=>{
      venue.rating.map(rating=>{
        if(rating.user_id === req.params.id){
          rating.venue = venue.venue
          user_reviews.push(rating)
        }
      })
    })
    res.send({status:"success", message:"Reviews fetched successfully", data: user_reviews})
  }).catch(next);
})

//Post Rating
router.post('/rating/:id', verifyToken, (req, res, next) => {
  let rating = {
    user_id:req.userId,
    name:req.name,
    rating:req.body,
    date:new Date(),
    sport_name:req.body.sport_name
  }
  Venue.findOne({_id:req.params.id}).then(venue=>{
    rating_list = venue.rating.filter(value=>value.user_id === rating.user_id)
    if(rating_list.length){
      Venue.findByIdAndUpdate({_id:req.params.id},{$pull:{rating:{user_id:rating.user_id}}}).then(venue=>{
        Venue.findByIdAndUpdate({_id:req.params.id},{$push:{rating:rating}}).then(venue=>{
          Venue.findById({_id:req.params.id}).then(venue=>{
            res.status(201).send({
              data: venue,
              status:'success',
              message:"rating posted"
            })
            ActivityLogForUser(req.userId,  req.phone, 'venue rated', req.phone + " rated " + venue.venue.name)
          }).catch(next);
        })
      })
    }else{
      Venue.findByIdAndUpdate({_id:req.params.id},{$push:{rating:rating}}).then(venue=>{
        Venue.findById({_id:req.params.id}).then(venue=>{
          res.status(201).send({
            data: venue,
            status:'success',
            message:"rating posted"
          })
          ActivityLogForUser(req.userId,  req.phone, 'venue rated', req.phone + " rated " + venue.venue.name)
        }).catch(next);
      })
    }
  }).catch(next);
  // Venue.findByIdAndUpdate({_id:req.params.id}, {$push:{rating:rating}}).then(venue=>{
  //   Venue.findById({_id:req.params.id}).then(venue=>{
  //     res.status(201).send({
  //       data: venue,
  //       status:'success',
  //       message:"rating posted"
  //     })
  //     ActivityLogForUser(req.userId,  req.phone, 'venue rated', req.phone + " rated " + venue.venue.name)
  //   }).catch(next);
  // }).catch(next);
})


module.exports = router;

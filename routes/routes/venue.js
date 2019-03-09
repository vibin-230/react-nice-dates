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

router.post('/venue_list', verifyToken, (req, res, next) => {
    let zipcode;
    axios.get('https://maps.googleapis.com/maps/api/geocode/json?latlng=13.0389622,80.236313&key=AIzaSyBg-CZ9Fk94r5uFwvmVp-U1XSXDvJRAnmo').then(response=>{
        zipcode = Object.values(response.data.results[0].address_components).filter(value=>value.types[0]==='postal_code')
        zipcode = zipcode[0].long_name
        console.log(zipcode)
        var list = Object.values(data.venues).map((value,index)=>{
            let distance = getDistanceFromLatLonInKm(req.body.latLong[0],req.body.latLong[1],value.latLong[0],value.latLong[1])
            value.distance = distance
            let featured = value.featured.filter(featured=>featured.zipcode==zipcode)
            let zCode = (featured.length>0?featured[0].type*20:null)+(value.exclusive?1*3:0)+(value.new?1*0.5:0)+(value.venuePrice*0.5)-(distance*3)+(value.venueRating*2)
            value.zCode = zCode
            return value
        })
        list.sort(function(a, b) {
            return b.zCode - a.zCode;
        });
        res.send(list);
    }).catch(next);
});



module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const _ = require('lodash');
const router = express.Router();
const moment = require('moment');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const nodemailer = require('nodemailer');
const constants = require('../scripts/constants');
const link = require('../scripts/uri');
const { check, validationResult } = require('express-validator/check');
const verifyToken = require('../scripts/verifyToken');
const verifySuperAdmin = require('../scripts/verifySuperAdmin');
const jwt = require('jsonwebtoken');
const config = require('../config');
const data = require('../sample/venue.js')

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Event = require('../models/event');
const Coupon = require('../models/coupon');

const Access = {
    super_admin:{
        venue:['read','create','update','delete'],
        venue_manager:['read','create','update','delete'],
        venue_staff:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        users:['read','create','update','delete']
    },
    venue_manager:{
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete']
    },
    venue_staff:{
        event:['read'],
        coupon:['read']
    },
}

function AccessControl(api_type, action_type) {
    return function(req,res,next){
        console.log(req.role)
        if(!Access[req.role][api_type]){
            res.status(403).send({status:"failed", message:"permission denied"})
        }else{
            if(Access[req.role][api_type].indexOf(action_type)!== -1){
                next();
            }else{
                res.status(403).send({status:"failed", message:"permission denied"})
            }
        }
    }
}

router.post('/create_super_admin',
    check('password').exists().isLength({ min: 6}).withMessage('password length should be minimum 6 letters'),
    (req, res, next) => {
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
    SuperAdmin.findOne({username:req.body.username}).then(superAdmin=>{
        if(superAdmin){
            res.send({status:"failure", message:"username already exist"})
        }else{
            SuperAdmin.create(req.body).then(superAdmin=>{
                res.send({status:"success", message:"super admin added"})
            }).catch(next)
        }
    }).catch(next)
})

router.post('/super_admin_login',
    (req, res, next) => {
    SuperAdmin.findOne({username:req.body.username, password:req.body.password}).then(superAdmin=>{
        var token = jwt.sign({ id: superAdmin._id, username:superAdmin.username, role:"super_admin"}, config.secret);
        res.send({status:"success", message:"login success", token:token})
    }).catch(next)
})

router.post('/venue_manager_login',
    (req, res, next) => {
    VenueManager.findOne({username:req.body.username, password:req.body.password}).then(venueManager=>{
        var token = jwt.sign({ id: venueManager._id, username:venueManager.username, role:"venue_manager"}, config.secret);
        res.send({status:"success", message:"login success", token:token})
    }).catch(next)
})

router.post('/venue_staff_login',
    (req, res, next) => {
    VenueStaff.findOne({username:req.body.username, password:req.body.password}).then(venueStaff=>{
        var token = jwt.sign({ id: venueStaff._id, username:venueStaff.username, role:"venue_staff"}, config.secret);
        res.send({status:"success", message:"login success", token:token})
    }).catch(next)
})

////Users
router.post('/users',
    verifySuperAdmin,
    AccessControl('users', 'read'),
    (req, res, next) => {
        User.find({},{__v:0,token:0,otp:0}).then(user=>{
            res.send({status:"success", message:"users fetched", data:user})
    }).catch(next)
})

// let accessControl = AccessControl('super_admin', 'venue', 'read')

////Venue
router.post('/venue',
    verifySuperAdmin,
    AccessControl('venue', 'read'),
    (req, res, next) => {
        Venue.find({},{bank:0}).lean().then(venue=>{
            let venues = Object.values(venue).map((value,index)=>{
                let rating = Object.values(value.rating).reduce((a,b)=>{
                    let c = a+b.rating
                    return c
                  },0)
                  value.rating = rating===0?0:rating/value.rating.length
                  return value
            })
            res.status(201).send({status:"success", message:"venues fetched", data:venues})
    }).catch(next)
})


router.post('/add_venue',
verifySuperAdmin,
AccessControl('venue', 'create'),
(req, res, next) => {
    req.body.created_by = req.username
    console.log(req.body)
    Venue.create(req.body).then(venue=>{
        res.send({status:"success", message:"venue added", data:venue})
    }).catch(next)
})


router.put('/edit_venue/:id',
verifySuperAdmin,
AccessControl('venue', 'update'),
(req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Venue.findById({_id:req.params.id}).lean().then(venue=>{
        let merged_data = _.merge({},venue,req.body)
        Venue.findByIdAndUpdate({_id:req.params.id},merged_data).then(venue=>{
            Venue.findById({_id:req.params.id}).then(venue=>{
                res.send({status:"success", message:"venue edited", data:venue})
            }).catch(next)
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue/:id',
    verifySuperAdmin,
    AccessControl('venue', 'delete'),
    (req, res, next) => {
    Venue.findByIdAndRemove({_id:req.params.id},req.body).then(venue=>{
        Venue.find({}).then(venue=>{
            res.send({status:"success", message:"venue deleted", data:venue})
        }).catch(next)
    }).catch(next)
})

//// Venue Manager
router.post('/venue_manager',
    verifySuperAdmin,
    AccessControl('venue_manager', 'read'),
    (req, res, next) => {
    VenueManager.find({}).then(venue=>{
        res.send({status:"success", message:"venue managers fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue_manager',
    verifySuperAdmin,
    AccessControl('venue_manager', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    VenueManager.findOne({username:req.body.username}).then(venueManager=>{
        if(venueManager){
            res.send({status:"failure", message:"username already exist"})
        }else{
            VenueManager.create(req.body).then(venueManager=>{
                res.send({status:"success", message:"venue manager added", data:venueManager})
            }).catch(next)
        }
    }).catch(next)
})


router.put('/edit_venue_manager/:id',
    verifySuperAdmin,
    AccessControl('venue_manager', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    VenueManager.findByIdAndUpdate({_id:req.params.id},req.body).then(venueManager=>{
        VenueManager.findById({_id:req.params.id}).then(venueManager=>{
            res.send({status:"success", message:"venue manager edited", data:venueManager})
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue_manager/:id',
    verifySuperAdmin,
    AccessControl('venue_manager', 'delete'),
    (req, res, next) => {
    VenueManager.findByIdAndRemove({_id:req.params.id},req.body).then(venueManager=>{
        VenueManager.find({}).then(venueManager=>{
            res.send({status:"success", message:"venue manager deleted", data:venueManager})
        }).catch(next)
    }).catch(next)
})

//// Venue Staff
router.post('/venue_staff',
    verifySuperAdmin,
    AccessControl('venue_staff', 'read'),
    (req, res, next) => {
    VenueStaff.find({}).then(venue=>{
        res.send({status:"success", message:"venue staffs fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue_staff',
    verifySuperAdmin,
    AccessControl('venue_staff', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    VenueStaff.create(req.body).then(venueStaff=>{
        res.send({status:"success", message:"venue staff added", data:venueStaff})
    }).catch(next)
})


router.put('/edit_venue_staff/:id',
    verifySuperAdmin,
    AccessControl('venue_staff', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username

    VenueStaff.findByIdAndUpdate({_id:req.params.id},req.body).then(venueStaff=>{
        VenueStaff.findById({_id:req.params.id}).then(venueStaff=>{
            res.send({status:"success", message:"venue staff edited", data:venueStaff})
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue_staff/:id',
    verifySuperAdmin,
    AccessControl('venue_staff', 'delete'),
    (req, res, next) => {
    VenueStaff.findByIdAndRemove({_id:req.params.id},req.body).then(venueStaff=>{
        VenueStaff.find({}).then(venueStaff=>{
            res.send({status:"success", message:"venue staff deleted", data:venueStaff})
        }).catch(next)
    }).catch(next)
})

//// Event
router.post('/event',
    verifySuperAdmin,
    AccessControl('event', 'read'),
    (req, res, next) => {
    Event.find({}).then(event=>{
        res.send({status:"success", message:"events fetched", data:event})
    }).catch(next)
})


router.post('/add_event',
    verifySuperAdmin,
    AccessControl('event', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Event.create(req.body).then(event=>{
        res.send({status:"success", message:"event added", data:event})
    }).catch(next)
})


router.put('/edit_event/:id',
    verifySuperAdmin,
    AccessControl('event', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Event.findByIdAndUpdate({_id:req.params.id},req.body).then(event=>{
        Event.findById({_id:req.params.id}).then(event=>{
            res.send({status:"success", message:"event edited", data:event})
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_event/:id',
    verifySuperAdmin,
    AccessControl('event', 'delete'),
    (req, res, next) => {
    Event.findByIdAndRemove({_id:req.params.id},req.body).then(event=>{
        Event.find({}).then(event=>{
            res.send({status:"success", message:"event deleted", data:event})
        }).catch(next)
    }).catch(next)
})

//// Coupon
router.post('/coupon',
    verifySuperAdmin,
    AccessControl('coupon', 'read'),
    (req, res, next) => {
    Coupon.find({}).then(coupon=>{
        res.send({status:"success", message:"coupons fetched", data:coupon})
    }).catch(next)
})


router.post('/add_coupon',
    verifySuperAdmin,
    AccessControl('coupon', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Coupon.create(req.body).then(coupon=>{
        res.send({status:"success", message:"coupon added", data:coupon})
    }).catch(next)
})


router.put('/edit_coupon/:id',
    verifySuperAdmin,
    AccessControl('coupon', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Coupon.findByIdAndUpdate({_id:req.params.id},req.body).then(coupon=>{
        Coupon.findById({_id:req.params.id}).then(coupon=>{
            res.send({status:"success", message:"coupon edited", data:coupon})
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_coupon/:id',
    verifySuperAdmin,
    AccessControl('coupon', 'delete'),
    (req, res, next) => {
    Coupon.findByIdAndRemove({_id:req.params.id},req.body).then(coupon=>{
        Coupon.find({}).then(coupon=>{
            res.send({status:"success", message:"coupon deleted", data:coupon})
        }).catch(next)
    }).catch(next)
})

//Upload Venue Display Picture
router.post('/venue_display_picture',
verifySuperAdmin,
    AccessControl('venue', 'create'),
    (req, res, next) => {
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
        File.mv('assets/images/venues/' + filename, function(err) {
            if (err) {
            return res.status(500).send(err);
            } else {
            let image = link.domain+'/assets/images/venues/' + filename;
            // Venue.findOneAndUpdate({_id:req.params.id},{"venue.venue_display_picture":image}).then(user=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "venue display picture uploaded"
            })
        // })
        }
    })
});

//Upload Venue Display Picture
router.post('/venue_cover_picture',
verifySuperAdmin,
    AccessControl('venue', 'create'),
    (req, res, next) => {
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
        File.mv('assets/images/venues/' + filename, function(err) {
            if (err) {
            return res.status(500).send(err);
            } else {
            let image = link.domain+'/assets/images/venues/' + filename;
            // Venue.findOneAndUpdate({_id:req.params.id},{$push:{"venue.venue_cover_picture":image}}).then(user=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "venue cover picture uploaded"
            })
        // })
        }
    })
});

//Upload Event Picture
router.post('/event_picture',
verifySuperAdmin,
AccessControl('event', 'create'),
(req, res, next) => {
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
        File.mv('assets/images/event/' + filename, function(err) {
            if (err) {
            return res.status(500).send(err);
            } else {
            let image = link.domain+'/assets/images/event/' + filename;
            // Event.findOneAndUpdate({_id:req.params.id},{$push:{"event.picture":image}}).then(event=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "event picture uploaded"
            })
        // })
        }
    })
});


module.exports = router;

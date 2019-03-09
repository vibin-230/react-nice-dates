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

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Event = require('../models/event');
const Coupon = require('../models/coupon');


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
        var token = jwt.sign({ id: superAdmin._id, username:superAdmin.username}, config.secret);
        res.send({status:"success", message:"login success", token:token})
    }).catch(next)
})

////Venue
router.post('/venue',
    verifySuperAdmin,
    (req, res, next) => {
        Venue.find({}).then(venue=>{
            res.send({status:"success", message:"venues fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue',
verifySuperAdmin,
(req, res, next) => {
    req.body.created_by = req.username
    Venue.create(req.body).then(venue=>{
        res.send({status:"success", message:"venue added", data:venue})
    }).catch(next)
})


router.put('/edit_venue/:id',
verifySuperAdmin,
(req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Venue.findByIdAndUpdate({_id:req.params.id},req.body).then(venue=>{
        Venue.findById({_id:req.params.id}).then(venue=>{
            res.send({status:"success", message:"venue edited", data:venue})
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue/:id',
    verifySuperAdmin,
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
    (req, res, next) => {
    VenueManager.find({}).then(venue=>{
        res.send({status:"success", message:"venue managers fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue_manager',
    verifySuperAdmin,
    (req, res, next) => {
    req.body.created_by = req.username

    VenueManager.create(req.body).then(venueManager=>{
        res.send({status:"success", message:"venue manager added", data:venueManager})
    }).catch(next)
})


router.put('/edit_venue_manager/:id',
    verifySuperAdmin,
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
    (req, res, next) => {
    VenueStaff.find({}).then(venue=>{
        res.send({status:"success", message:"venue staffs fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue_staff',
    verifySuperAdmin,
    (req, res, next) => {
    req.body.created_by = req.username
    VenueStaff.create(req.body).then(venueStaff=>{
        res.send({status:"success", message:"venue staff added", data:venueStaff})
    }).catch(next)
})


router.put('/edit_venue_staff/:id',
    verifySuperAdmin,
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
    (req, res, next) => {
    Event.find({}).then(event=>{
        res.send({status:"success", message:"events fetched", data:event})
    }).catch(next)
})


router.post('/add_event',
    verifySuperAdmin,
    (req, res, next) => {
    req.body.created_by = req.username
    Event.create(req.body).then(event=>{
        res.send({status:"success", message:"event added", data:event})
    }).catch(next)
})


router.put('/edit_event/:id',
    verifySuperAdmin,
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
    (req, res, next) => {
    Coupon.find({}).then(coupon=>{
        res.send({status:"success", message:"coupons fetched", data:coupon})
    }).catch(next)
})


router.post('/add_coupon',
    verifySuperAdmin,
    (req, res, next) => {
    req.body.created_by = req.username
    Coupon.create(req.body).then(coupon=>{
        res.send({status:"success", message:"coupon added", data:coupon})
    }).catch(next)
})


router.put('/edit_coupon/:id',
    verifySuperAdmin,
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
    (req, res, next) => {
    Coupon.findByIdAndRemove({_id:req.params.id},req.body).then(coupon=>{
        Coupon.find({}).then(coupon=>{
            res.send({status:"success", message:"coupon deleted", data:coupon})
        }).catch(next)
    }).catch(next)
})

//Upload Venue Display Picture
router.post('/venue_display_picture/:id',verifyToken, (req, res, next) => {
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
            Venue.findOneAndUpdate({_id:req.params.id},{venue_display_picture:image}).then(user=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "venue display picture uploaded"
            })
        })
        }
    })
});

//Upload Venue Display Picture
router.post('/venue_cover_picture/:id',verifyToken, (req, res, next) => {
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
            Venue.findOneAndUpdate({_id:req.params.id},{$push:{venue_cover_picture:image}}).then(user=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "venue cover picture uploaded"
            })
        })
        }
    })
});

//Upload Event Picture
router.post('/event_picture/:id',verifyToken, (req, res, next) => {
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
            Event.findOneAndUpdate({_id:req.params.id},{$push:{event_picture:image}}).then(event=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "event picture uploaded"
            })
        })
        }
    })
});


module.exports = router;

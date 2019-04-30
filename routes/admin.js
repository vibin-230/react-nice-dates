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
// const verifySuperAdmin = require('../scripts/verifySuperAdmin');
const jwt = require('jsonwebtoken');
const config = require('../config');
const data = require('../sample/venue.js')

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Admin = require('../models/admin');
const Event = require('../models/event');
const Coupon = require('../models/coupon');
const Support = require('../models/support');
const Ads = require('../models/ads');

const Access = {
    super_admin:{
        venue:['read','create','update','delete'],
        venue_manager:['read','create','update','delete'],
        venue_staff:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        users:['read','create','update','delete'],
        support:['read', 'create','delete'],
        ads:['read', 'create','delete']
    },
    venue_manager:{
        venue:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        support:['read', 'create']
    },
    venue_staff:{
        venue:['read', 'update'],
        event:['read'],
        coupon:['read'],
        support:['read', 'create']
    },
    user:{
        venue:['read'],
        event:['read'],
        coupon:['read'],
        users:['read','create','update','delete']
    }
}

function ActivityLog(id, username, role, activity, description) {
    let activity_log = {
        datetime: new Date(),
        id:id,
        username: username,
        role: role,
        activity: activity,
        description: description
    }
    Admin.findOneAndUpdate({username:username},{$push:{activity_log:activity_log}}).then(admin=>{
        console.log("activity log updated")
    })
}

function AccessControl(api_type, action_type) {
    return function(req,res,next){
        console.log(req.role)
        if(!Access[req.role][api_type]){
            res.status(403).send({status:"failed", message:"permission denied"})
        }else{
            if(Access[req.role][api_type].indexOf(action_type)!== -1){
                next();
            }else {
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
    Admin.findOne({username:req.body.username}).then(superAdmin=>{
        if(superAdmin){
            res.send({status:"failure", message:"username already exist"})
        }else{
            req.body.role = "super_admin";
            Admin.create(req.body).then(superAdmin=>{
                res.send({status:"success", message:"super admin added"})
            }).catch(next)
        }
    }).catch(next)
})

router.post('/admin_login',
    (req, res, next) => {
        console.log(req.body)
    Admin.findOne({username:req.body.username, password:req.body.password}).then(admin=>{
        if(admin){
            var token = jwt.sign({ id: admin._id, username:admin.username, role:admin.role}, config.secret);
            res.send({status:"success", message:"login success", token:token, role:admin.role})
            ActivityLog(admin._id, admin.username, admin.role, 'login', admin.username +" loggedin successfully")
        }else{
            res.send({status:"failed", message:"username or password incorrect"})
        }
    }).catch(next)
})


////Users
router.post('/users',
    verifyToken,
    AccessControl('users', 'read'),
    (req, res, next) => {
        User.find({},{__v:0,token:0,otp:0}).then(user=>{
            res.send({status:"success", message:"users fetched", data:user})
    }).catch(next)
})

// let accessControl = AccessControl('super_admin', 'venue', 'read')

////Venue
router.post('/venue',
    verifyToken,
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


////Venue
router.post('/get_venue/:id',
    verifyToken,
    AccessControl('venue', 'read'),
    (req, res, next) => {
        Venue.findOne({_id:req.params.id},{bank:0, configuration:0}).lean().then(venue=>{
            res.status(201).send({status:"success", message:"venue fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue',
verifyToken,
AccessControl('venue', 'create'),
(req, res, next) => {
    req.body.created_by = req.username
    Venue.create(req.body).then(venue=>{
        res.send({status:"success", message:"venue added", data:venue})
        ActivityLog(req.userId, req.username, req.role, 'venue created', req.username+" created venue")
        }).catch(next)
})


router.put('/edit_venue/:id',
verifyToken,
AccessControl('venue', 'update'),
(req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Venue.findById({_id:req.params.id}).lean().then(venue=>{
        let merged_data = _.merge({},venue,req.body)
        Venue.findByIdAndUpdate({_id:req.params.id},merged_data).then(venue=>{
            Venue.findById({_id:req.params.id}).then(venue=>{
                res.send({status:"success", message:"venue edited", data:venue})
                ActivityLog(req.userId, req.username, req.role, 'venue modified', req.username+" modified venue")
            }).catch(next)
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue/:id',
    verifyToken,
    AccessControl('venue', 'delete'),
    (req, res, next) => {
    Venue.findByIdAndRemove({_id:req.params.id},req.body).then(venue=>{
        Venue.find({}).then(venue=>{
            res.send({status:"success", message:"venue deleted", data:venue})
            ActivityLog(req.userId, req.username, req.role, 'venue deleted', req.username+" deleted venue")
        }).catch(next)
    }).catch(next)
})



//// Venue Manager
router.post('/venue_manager',
    verifyToken,
    AccessControl('venue_manager', 'read'),
    (req, res, next) => {
    Admin.find({role:"venue_manager"}).then(venue=>{
        res.send({status:"success", message:"venue managers fetched", data:venue})
    }).catch(next)
})


router.post('/add_venue_manager',
    verifyToken,
    AccessControl('venue_manager', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Admin.findOne({username:req.body.username}).then(venueManager=>{
        if(venueManager){
            res.send({status:"failure", message:"username already exist"})
        }else{
            req.body.role = "venue_manager";
            Admin.create(req.body).then(venueManager=>{
                res.send({status:"success", message:"venue manager added", data:venueManager})
                ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.username+" created venue manager")
            }).catch(next)
        }
    }).catch(next)
})


router.put('/edit_venue_manager/:id',
    verifyToken,
    AccessControl('venue_manager', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(venueManager=>{
        Admin.findById({_id:req.params.id}).then(venueManager=>{
            res.send({status:"success", message:"venue manager edited", data:venueManager})
            ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.username+" modified venue manager")
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue_manager/:id',
    verifyToken,
    AccessControl('venue_manager', 'delete'),
    (req, res, next) => {
        Admin.findByIdAndRemove({_id:req.params.id},req.body).then(venueManager=>{
            Admin.find({}).then(venueManager=>{
            res.send({status:"success", message:"venue manager deleted", data:venueManager})
            ActivityLog(req.userId, req.username, req.role, 'venue manager deleted', req.username+" deleted venue manager")
        }).catch(next)
    }).catch(next)
})

//// Venue Staff
router.post('/venue_staff',
    verifyToken,
    AccessControl('venue_staff', 'read'),
    (req, res, next) => {
        Admin.find({role:"venue_staff"}).then(venueStaff=>{
            res.send({status:"success", message:"venue staffs fetched", data:venueStaff})
            ActivityLog(req.userId, req.username, req.role, 'venue staff created', req.username+" created venue staff")
    }).catch(next)
})


router.post('/add_venue_staff',
    verifyToken,
    AccessControl('venue_staff', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Admin.findOne({username:req.body.username}).then(venueStaff=>{
        if(venueStaff){
            res.send({status:"failure", message:"username already exist"})
        }else{
            req.body.role = "venue_staff";
            Admin.create(req.body).then(venueStaff=>{
                res.send({status:"success", message:"venue staff added", data:venueStaff})
                ActivityLog(req.userId, req.username, req.role, 'venue staff created', req.username+" created venue staff")
            }).catch(next)
        }
    }).catch(next)
})


router.put('/edit_venue_staff/:id',
    verifyToken,
    AccessControl('venue_staff', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    Admin.findByIdAndUpdate({_id:req.params.id},req.body).then(venueStaff=>{
        Admin.findById({_id:req.params.id}).then(venueStaff=>{
            res.send({status:"success", message:"venue staff edited", data:venueStaff})
            ActivityLog(req.userId, req.username, req.role, 'venue staff modified', req.username+" modified venue staff")
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_venue_staff/:id',
    verifyToken,
    AccessControl('venue_staff', 'delete'),
    (req, res, next) => {
        Admin.findByIdAndRemove({_id:req.params.id},req.body).then(venueStaff=>{
            Admin.find({}).then(venueStaff=>{
                res.send({status:"success", message:"venue staff deleted", data:venueStaff})
                ActivityLog(req.userId, req.username, req.role, 'venue staff deleted', req.username+" deleted venue staff")
        }).catch(next)
    }).catch(next)
})

//// Event
router.post('/event',
    verifyToken,
    // AccessControl('event', 'read'),
    (req, res, next) => {
    Event.find({}).then(event=>{
        res.send({status:"success", message:"events fetched", data:event})
    }).catch(next)
})


router.post('/add_event',
    verifyToken,
    AccessControl('event', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Event.create(req.body).then(event=>{
        res.send({status:"success", message:"event added", data:event})
        ActivityLog(req.userId, req.username, req.role, 'event created', req.username+" created event")
    }).catch(next)
})


router.put('/edit_event/:id',
    verifyToken,
    AccessControl('event', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Event.findByIdAndUpdate({_id:req.params.id},req.body).then(event=>{
        Event.findById({_id:req.params.id}).then(event=>{
            res.send({status:"success", message:"event edited", data:event})
            ActivityLog(req.userId, req.username, req.role, 'event modified', req.username+" modified event")
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_event/:id',
    verifyToken,
    AccessControl('event', 'delete'),
    (req, res, next) => {
    Event.findByIdAndRemove({_id:req.params.id},req.body).then(event=>{
        Event.find({}).then(event=>{
            res.send({status:"success", message:"event deleted", data:event})
            ActivityLog(req.userId, req.username, req.role, 'event deleted', req.username+" deleted event")
        }).catch(next)
    }).catch(next)
})

//// Coupon
router.post('/coupon',
    verifyToken,
    AccessControl('coupon', 'read'),
    (req, res, next) => {
    Coupon.find({}).then(coupon=>{
        res.send({status:"success", message:"coupons fetched", data:coupon})
    }).catch(next)
})

////Venue List based on coupon
router.post('/venue_list_by_coupon',
    verifyToken,
    AccessControl('venue', 'read'),
    (req, res, next) => {
    Coupon.findOne({code:req.body.code}).then(coupon=>{
        let arr = (coupon.venue).map(ele => new mongoose.Types.ObjectId(ele));
        Venue.find({_id:{$in:arr}},{bank:0}).lean().then(venue=>{
            // let venues = Object.values(venue).map((value,index)=>{
            //     let rating = Object.values(value.rating).reduce((a,b)=>{
            //         let c = a+b.rating
            //         return c
            //     },0)
            //     value.rating = rating===0?0:rating/value.rating.length
            //     return value
            // })
            res.status(201).send({status:"success", message:"venues fetched", data:venue})
        }).catch(next)
    }).catch(next)
})


router.post('/add_coupon',
    verifyToken,
    AccessControl('coupon', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Coupon.create(req.body).then(coupon=>{
        res.send({status:"success", message:"coupon added", data:coupon})
        ActivityLog(req.userId, req.username, req.role, 'coupon created', req.username+" created coupon")
    }).catch(next)
})


router.put('/edit_coupon/:id',
    verifyToken,
    AccessControl('coupon', 'update'),
    (req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Coupon.findByIdAndUpdate({_id:req.params.id},req.body).then(coupon=>{
        Coupon.findById({_id:req.params.id}).then(coupon=>{
            res.send({status:"success", message:"coupon edited", data:coupon})
            ActivityLog(req.userId, req.username, req.role, 'coupon modified', req.username+" modified coupon")
        }).catch(next)
    }).catch(next)
})


router.delete('/delete_coupon/:id',
    verifyToken,
    AccessControl('coupon', 'delete'),
    (req, res, next) => {
    Coupon.findByIdAndRemove({_id:req.params.id},req.body).then(coupon=>{
        Coupon.find({}).then(coupon=>{
            res.send({status:"success", message:"coupon deleted", data:coupon})
            ActivityLog(req.userId, req.username, req.role, 'coupon deleted', req.username+" deleted coupon")
        }).catch(next)
    }).catch(next)
})

router.post('/coupon_check',
    verifyToken,
    AccessControl('coupon', 'read'),
    (req, res, next) => {
    Coupon.findOne({code:req.body.code}).then(coupon=>{
        if(coupon){
            res.send({status:"success", message:"coupon can be used", data:coupon})
        }else{
            res.send({status:"failed", message:"no coupon exist"})
        }
    }).catch(next)
})

//Upload Venue Display Picture
router.post('/venue_display_picture',
verifyToken,
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
verifyToken,
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
verifyToken,
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


//// Global Search
router.post('/search',
    verifyToken,
    AccessControl('venue', 'read'),
    (req, res, next) => {
    Venue.find({"venue.name":{ "$regex": req.body.search, "$options": "i" }}).then(venue=>{
        Event.find({"event.name":{ "$regex": req.body.search, "$options": "i" }}).then(event=>{
            console.log(venue)
            let combinedResult = venue.concat(event);
            res.send({status:"success", message:"venues and events fetched based on search", data:combinedResult})
        }).catch(next)
    }).catch(next)
})


//// Support
router.post('/support',
    verifyToken,
    AccessControl('support', 'create'),
    (req, res, next) => {
    Support.create(req.body).then(support=>{
        res.send({status:"success", message:"message sent", data:support})
    }).catch(next)
})


//// Ads
router.post('/ads',
    verifyToken,
    AccessControl('ads', 'create'),
    (req, res, next) => {
    Ads.create(req.body).then(ads=>{
        res.send({status:"success", message:"message sent", data:ads})
    }).catch(next)
})


//Upload Event Picture
router.post('/ad_picture',
verifyToken,
AccessControl('ads', 'create'),
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
        File.mv('assets/images/ads/' + filename, function(err) {
            if (err) {
            return res.status(500).send(err);
            } else {
            let image = link.domain+'/assets/images/ads/' + filename;
            // Event.findOneAndUpdate({_id:req.params.id},{$push:{"event.picture":image}}).then(event=>{
            res.status(201).send({
                image,
                status: 'success',
                message: "ad picture uploaded"
            })
        // })
        }
    })
});


//// Ads
router.post('/ads_list',
    verifyToken,
    AccessControl('ads', 'read'),
    (req, res, next) => {
    Ads.find({}).then(ads=>{
        res.send({status:"success", message:"ads fetched", data:ads})
    }).catch(next)
})


//// Access to user
router.post('/create_ad',
    verifyToken,
    AccessControl('ads', 'create'),
    (req, res, next) => {
    Ads.create(req.body).then(ads=>{
        res.send({status:"success", message:"ad created", data:ads})
    }).catch(next)
})


module.exports = router;
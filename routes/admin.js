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
const bcrypt = require('bcrypt');
const saltRounds = 10;
// const verifySuperAdmin = require('../scripts/verifySuperAdmin');
const jwt = require('jsonwebtoken');
const config = require('../config');
const data = require('../sample/venue.js')
const mail = require('../scripts/mail');

const User = require('../models/user');
const Venue = require('../models/venue');
const VenueManager = require('../models/venueManager');
const VenueStaff = require('../models/venueStaff');
const SuperAdmin = require('../models/superAdmin');
const Booking = require('../models/booking');
const Admin = require('../models/admin');
const Event = require('../models/event');
const Coupon = require('../models/coupon');
const Support = require('../models/support');
const Ads = require('../models/ads');
const Offers = require('../models/offers');
const upload = require("../scripts/aws-s3")

const Access = {
    super_admin:{
        venue:['read','create','update','delete'],
        venue_manager:['read','create','update','delete'],
        venue_staff:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        users:['read','create','update','delete'],
        support:['read', 'create'],
        ads:['read', 'create','update','delete'],
        booking:['read', 'create','update','delete'],
        offers:['read', 'create','update','delete'],
    },
    venue_manager:{
        
        venue:['read','create','update','delete'],
        event:['read','create','update','delete'],
        coupon:['read','create','update','delete'],
        offers:['read', 'create','update','delete'],
        booking:['read', 'create','update','delete'],
        support:['read', 'create'],
        ads:['read', 'create','update','delete'],
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
        support:['read', 'create'],
        users:['read','create','update','delete']
    }
}

function ActivityLog(id, user_type, activity, message) {
    let activity_log = {
        datetime: new Date(),
        id:id,
        user_type: user_type,
        activity: activity,
        message: message
    }
    let user = user_type==="user"?User:Admin
    user.findOneAndUpdate({_id:id},{$push:{activity_log:activity_log}}).then(admin=>{
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
            bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
            req.body.role = "super_admin";
            req.body.password = hash;
            Admin.create(req.body).then(superAdmin=>{
                res.send({status:"success", message:"super admin added"})
            }).catch(next)
        })
        }
    }).catch(next)
})

router.post('/admin_login',
    (req, res, next) => {
    Admin.findOne({username:req.body.username},{reset_password_hash:0,reset_password_expiry:0,activity_log:0},null).then(admin=>{
        if(admin){
            if(admin.status){
                bcrypt.compare(req.body.password, admin.password).then(function(response) {
                    if(response){
                        var token = jwt.sign({ id: admin._id, username:admin.username, role:admin.role}, config.secret);
                        admin.password = undefined
                        res.send({status:"success", message:"login success", token:token, role:admin.role,id:admin._id,data:admin})
                        // ActivityLog(admin._id, admin.role, 'login', admin.username +" logged-in successfully")
                    }else{
                        res.send({status:"failed", message:"password incorrect"})
                    }
                })
            }else{
                res.send({status:"failed", message:"admin status disabled"})
            }
        }else{
            res.send({status:"failed", message:"admin doesn't exist"})
        }
    }).catch(next)
})



////Forget Password
router.post('/forget_password', (req, res, next) => {
    Admin.findOne({username: req.body.email}).then(function(data) {
        if (data) {
            //Send mail
            var id = mongoose.Types.ObjectId();
            let html = "<h4>Please click here to reset your password</h4><a href='http://test.turftown.in/reset-password/"+id+"'>Reset Password</a>"
            mail("support@turftown.in", req.body.email,"Reset Your Password","test",html,response=>{
            if(response){
                let body = {
                reset_password_expiry:moment().add(1,"days"),
                reset_password_hash:id
                }
                Admin.findOneAndUpdate({email: req.body.email},body).then(function(data) {
                res.send({status:"success",message:"reset password link sent to mail"})
                }).catch(next);
            }else{
                res.status(409).send({status:"failed", message: "failed to send mail"});
            }
            })
        } else {
            res.status(409).send({status:"failed", message: "user doesn't exist"});
        }
    }).catch(next);
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
            Offers.find({}).then(offers=>{

                let venues = Object.values(venue).map((value,index)=>{
                    let rating = Object.values(value.rating).reduce((a,b)=>{
                        let c = a+b.rating
                        return c
                    },0)
                    value.rating = rating===0?0:rating/value.rating.length
                    let filteredOffer = Object.values(offers).filter(offer=>offer.venue.indexOf(value._id)!== -1)
                    value.offer = filteredOffer
                    return value
                })
                res.status(201).send({status:"success", message:"venues fetched", data:venues})
        }).catch(next)
    }).catch(next)
})


////Venue
router.post('/get_venue/:id',
    verifyToken,
    AccessControl('venue', 'read'),
    (req, res, next) => {
        Venue.findOne({_id:req.params.id},{bank:0}).lean().then(venue=>{
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
        ActivityLog(req.userId, req.role, 'venue created', req.username+" created venue "+venue.venue.name)
        }).catch(next)
})


router.put('/edit_venue/:id',
verifyToken,
AccessControl('venue', 'update'),
(req, res, next) => {
    req.body.modified_by = req.username
    req.body.modified_at = new Date()
    Venue.findById({_id:req.params.id}).lean().then(venue=>{
        // let merged_data = _.merge({},venue,req.body)
        Venue.findByIdAndUpdate({_id:req.params.id},req.body).then(venue=>{
            Venue.findById({_id:req.params.id}).then(venue=>{
                res.send({status:"success", message:"venue edited", data:venue})
                ActivityLog(req.userId, req.role, 'venue modified', req.username+" modified venue "+ venue.venue.name)
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
            ActivityLog(req.userId, req.role, 'venue deleted', req.username+" deleted venue "+ venue.venue.name)
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
            req.body.reset_password_hash = mongoose.Types.ObjectId();
            req.body.reset_password_expiry = moment().add(1,"days")
            Admin.create(req.body).then(venueManager=>{
                var id = mongoose.Types.ObjectId();
                let reset_url = "http://test.turftown.in/reset-password/"+req.body.reset_password_hash
                let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
                mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
                    if(response){
                      res.send({status:"success"})
                    }else{
                      res.send({status:"failed"})
                    }
                })
                Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
                    venueManager.venue = venue
                    res.send({status:"success", message:"venue manager added", data:venueManager})
                    ActivityLog(req.userId, req.username, req.role, 'venue manager created', req.username+" created venue manager")
                }).catch(next)
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
            console.log(venueManager);
            Venue.find({_id:{$in:venueManager.venue}},{_id:1, name:1, venue:1, type:1}).lean().then(venue=>{
                venueManager.venue = venue
                res.send({status:"success", message:"venue manager edited", data:venueManager})
                ActivityLog(req.userId, req.username, req.role, 'venue manager modified', req.username+" modified venue manager")
            }).catch(next)
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
            req.body.reset_password_hash = mongoose.Types.ObjectId();
            req.body.reset_password_expiry = moment().add(1,"days")
            Admin.create(req.body).then(venueStaff=>{
                var id = mongoose.Types.ObjectId();
                let reset_url = "http://localhost:3001/reset-password/"+req.body.reset_password_hash
                let html = "<h4>Please click here to reset your password</h4><a href="+reset_url+">Reset Password</a>"
                mail("support@turftown.in", req.body.username,"Reset Password","test",html,response=>{
                    if(response){
                      res.send({status:"success"})
                    }else{
                      res.send({status:"failed"})
                    }
                })
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
        Offers.find({}).then(offers=>{
                let filteredOffer = Object.values(offers).filter(offer=>offer.event.indexOf(event._id)!== -1)
                event.offer = filteredOffer
            res.send({status:"success", message:"events fetched", data:event})
        }).catch(next)
    }).catch(next)
})


router.post('/add_event',
    verifyToken,
    AccessControl('event', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Event.create(req.body).then(event=>{
        Venue.find({_id:{$in:event.venue}},{_id:1, name:1, venue:1, type:1}, null).lean().then(venue=>{
            event.venue = venue
            res.send({status:"success", message:"event added", data:event})
            ActivityLog(req.userId, req.role, 'event created', req.username+" created event "+event.event.name)
        }).catch(next)
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
            Venue.find({_id:{$in:event.venue}},{_id:1, name:1, venue:1, type:1}, null).lean().then(venue=>{
                event.venue = venue
                res.send({status:"success", message:"event edited", data:event})
                ActivityLog(req.userId, req.role, 'event modified', req.username+" modified event "+ event.event.name)
            }).catch(next)
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
            ActivityLog(req.userId, req.role, 'event deleted', req.username+" deleted event "+event.event.name)
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

////Venue List based on coupon
router.post('/venue_list_by_id',
    verifyToken,
    AccessControl('venue', 'read'),
    (req, res, next) => {

    Venue.find({_id:{$in:req.body.venue}},{bank:0}).lean().then(venue=>{
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
})


router.post('/add_coupon',
    verifyToken,
    AccessControl('coupon', 'create'),
    (req, res, next) => {
    req.body.created_by = req.username
    Coupon.create(req.body).then(coupon=>{
        Venue.find({_id:{$in:coupon.venue}},{_id:1, name:1, venue:1, type:1}, null).lean().then(venue=>{
            Event.find({_id:{$in:coupon.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                coupon.event = event
                coupon.venue = venue
                res.send({status:"success", message:"coupon added", data:coupon})
                ActivityLog(req.userId, req.role, 'coupon created', req.username+" created coupon "+coupon.title)
            }).catch(next)
        }).catch(next)
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
            Venue.find({_id:{$in:coupon.venue}},{_id:1, name:1, venue:1, type:1}, null).lean().then(venue=>{
                Event.find({_id:{$in:coupon.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                    coupon.event = event
                    coupon.venue = venue
                    res.send({status:"success", message:"coupon edited", data:coupon})
                    ActivityLog(req.userId, req.role, 'coupon modified', req.username+" modified coupon "+coupon.title)
                }).catch(next)
            }).catch(next)
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
            ActivityLog(req.userId, req.role, 'coupon deleted', req.username+" deleted coupon "+coupon.title)
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
        filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "venue"
          message = "venue display picture uploaded"
          upload(filename, folder, message, res)
        }
    })
});

//Upload Venue Display Picture
router.post('/venue_cover_picture',verifyToken,AccessControl('venue', 'create'), (req, res, next) => {
    if (!req.files)
        return res.status(400).send({status:"failure", errors:{file:'No files were uploaded.'}});
        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        let File = req.files.image;
        let filename = req.files.image.name;
        //filename = path.pathname(filename)
        let name = path.parse(filename).name
        let ext = path.parse(filename).ext
        ext = ext.toLowerCase()
        filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "venue"
          message = "venue cover picture uploaded"
          upload(filename, folder, message, res)
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
        filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "event"
          message = "venue cover picture uploaded"
          upload(filename, folder, message, res)
        }
    })
});

//Upload Event Picture
router.post('/upload_cheque',
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
        filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "cheque"
          message = "cheque uploaded"
          upload(filename, folder, message, res)
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
            let combinedResult
            if(venue){
                combinedResult = venue.concat(event);
            }else{
                combinedResult = event
            }
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
            let html = "<h4>email: "+req.body.email+"</h4><h4>message: "+req.body.message+"</h4>"
            mail(req.body.email,"support@turftown.in","Support",req.body.message,html,response=>{
                if(response){
                    res.send({status:"success", message:"support request raised"})
                }else{
                    res.send({status:"failed"})
                }
                })
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


//Upload Ad Picture
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
        filename = "image" + ext
    // Use the mv() method to place the file somewhere on your server
    File.mv("assets/"+filename, function(err) {
        if (err) {
        return res.status(500).send(err);
        } else {
          folder = "ads"
          message = "ad picture uploaded"
          upload(filename, folder, message, res)
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




//// Create ad
router.post('/create_ad',
    verifyToken,
    AccessControl('ads', 'create'),
    (req, res, next) => {
    Ads.find({}).then(ads=>{
        let check_position = ads.map(ad=>ad.position===req.body.position)

        if(check_position.length){
            existing_positions = []
            ads.map(ad=>{
                existing_positions.push(ad.position)
            })
            res.send({status:"failed", message:"position already exists", existing_positions})
        }else{
            Ads.create(req.body).then(ads=>{
                Venue.find({_id:{$in:ads.venue}},{_id:1, name:1, venue:1, type:1},null).lean().then(venue=>{
                    Event.find({_id:{$in:ads.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                        ads.event = event
                        ads.venue = venue
                        res.send({status:"success", message:"ad created", data:ads})
                        ActivityLog(req.userId, req.role, 'ad created', req.username+" created ad ")
                    }).catch(next)
                }).catch(next)
            }).catch(next)
        }
    }).catch(next)
})

//// Edit ad
router.post('/edit_ad/:id',
    verifyToken,
    AccessControl('ads', 'update'),
    (req, res, next) => {
    req.body.modified_at = new Date()
    req.body.modified_by = req.username
    Ads.findByIdAndUpdate({_id:req.params.id}, req.body).then(ads=>{
        Ads.findById({_id:req.params.id}).then(ads=>{
            Venue.find({_id:{$in:ads.venue}},{_id:1, name:1, venue:1, type:1},null).lean().then(venue=>{
                Event.find({_id:{$in:ads.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                    ads.event = event
                    ads.venue = venue
                    res.send({status:"success", message:"ad modified", data:ads})
                    ActivityLog(req.userId, req.role, 'ad modified', req.username+" modified ad ")
                }).catch(next)
            }).catch(next)
        }).catch(next)
    }).catch(next)
})

//// Delete ad
router.post('/delete_ad/:id',
    verifyToken,
    AccessControl('ads', 'delete'),
    (req, res, next) => {
    Ads.findByIdAndRemove({_id:req.params.id}).then(ads=>{
        res.send({status:"success", message:"ad deleted"})
        ActivityLog(req.userId, req.role, 'ad deleted', req.username+" deleted ad ")
    }).catch(next)
})

//// Offers List
router.post('/offers_list',
    verifyToken,
    AccessControl('offers', 'read'),
    (req, res, next) => {
    Offers.find({}).then(offers=>{
        res.send({status:"success", message:"offers fetched", data:offers})
    }).catch(next)
})


//// Create ad
router.post('/create_offer',
    verifyToken,
    AccessControl('offers', 'create'),
    (req, res, next) => {
    Offers.create(req.body).then(offers=>{
        Venue.find({_id:{$in:offers.venue}},{_id:1, name:1, venue:1, type:1},null).lean().then(venue=>{
            Event.find({_id:{$in:offers.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                offers.event = event
                offers.venue = venue
                res.send({status:"success", message:"offer created", data:offers})
                ActivityLog(req.userId, req.role, 'offer created', req.username+" created offer ")
            }).catch(next)
        }).catch(next)
    }).catch(next)
})

//// Edit ad
router.post('/edit_offer/:id',
    verifyToken,
    AccessControl('offers', 'update'),
    (req, res, next) => {
    req.body.modified_at = new Date()
    req.body.modified_by = req.username
    Offers.findByIdAndUpdate({_id:req.params.id}, req.body).then(offers=>{
        Offers.findById({_id:req.params.id}).then(offers=>{
            Venue.find({_id:{$in:offers.venue}},{_id:1, name:1, venue:1, type:1},null).lean().then(venue=>{
                Event.find({_id:{$in:offers.event}},{_id:1, event:1, type:1},null).lean().then(event=>{
                    offers.event = event
                    offers.venue = venue
                    res.send({status:"success", message:"offer modified", data:offers})
                    ActivityLog(req.userId, req.role, 'offer modified', req.username+" modified offer ")
                }).catch(next)
            }).catch(next)
        }).catch(next)
    }).catch(next)
})

//// Delete ad
router.post('/delete_offer/:id',
    verifyToken,
    AccessControl('offers', 'delete'),
    (req, res, next) => {
    Offers.findByIdAndRemove({_id:req.params.id}).then(offers=>{
        res.send({status:"success", message:"offer deleted"})
        ActivityLog(req.userId, req.role, 'offer deleted', req.username+" deleted offer ")
    }).catch(next)
})

router.post('/activity_logs/:id',
    verifyToken,
    (req, res, next) => {
    const user_type = req.role==="user"?User:Admin
    user_type.findById({_id:req.params.id}).then(data=>{
        res.send({status:"success", message:"activity logs fetched", data:data.activity_log})
    }).catch(next)
})

router.post('/reset_password',
    (req, res, next) => {
        Admin.findOne({reset_password_hash:req.body.reset_password_hash}).then(venueStaff=>{
            if(venueStaff){
                if(venueStaff.reset_password_expiry>moment()){
                    bcrypt.hash(req.body.password, saltRounds).then(function(hash) {
                        Admin.findOneAndUpdate({reset_password_hash:req.body.reset_password_hash},{password:hash}).then(admin=>{
                            mail("support@turftown.in", venueStaff.username,"Password has been Reset Succesfully","Your Password has been Reset Successfully","",response=>{
                                if(response){
                                  console.log({status:"success"})
                                }else{
                                  console.log({status:"failed"})
                                }
                                res.send({status:"success", message:"password changed"})
                            })
                            ActivityLog(venueStaff._id, venueStaff.username, venueStaff.role, 'password changed', venueStaff.username+" changed password")
                        })
                    })
                }else{
                    res.status(409).send({status:"failed", message:"reset expired"})
                }
            }else{
                res.status(409).send({status:"failed", message:"incorrect credentials"})
            }
    }).catch(next)
})

//Booking History
router.post('/venue_event_list', (req, res, next) => {
  Venue.find({status:true},{configuration:0,bank:0,access:0},null).then(venues=>{
    Event.find({status:true},{configuration:0,bank:0,access:0},null).then(events=>{
      let data = {
          venues,
          events
      }
      res.send({status:"success", message:"venues and event fetched", data})
    })
  })
})

//// Ads
router.post('/booking_completed_list',
    verifyToken,
    AccessControl('booking', 'read'),
    (req, res, next) => {
    Booking.find({booking_status:"completed", booking_date:{$gte:req.body.fromdate, $lte:req.body.todate}}).then(bookings=>{
        res.send({status:"success", message:"bookings fetched", data:bookings})
    }).catch(next)
})

module.exports = router;
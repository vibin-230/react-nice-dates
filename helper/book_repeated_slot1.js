const Venue = require('../models/venue');
const Booking = require('../models/booking');

module.exports = function BookSlot(body,id,params,req,res,i,record,bookingOrder,venue,next){
  return new Promise(function(resolve, reject){
        Booking.find({$and:[{venue:body.venue,venue_id:req.params.id, booking_date:body.booking_date, slot_time:body.slot_time}],$or:[{booking_status:"booked",booking_status:"blocked"}]}).then(booking_history=>{
          // console.log(booking_history)
          let conf = venue.configuration;
          let types = conf.types;
          let base_type = conf.base_type;
          let inventory = {}
          let convertable;
          if(venue.configuration.convertable){
            for(let i=0;i<types.length; i++){
              inventory[types[i]] = conf[types[i]];
            }
            if(booking_history.length>0){
              let available_inventory = Object.values(booking_history).map(booking =>{
                inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type])
                for(let i=0;i<types.length-1; i++){
                inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
                }
              })
            }
            convertable = inventory[body.venue_type]<=0
          }else{
            convertable = inventory[body.venue_type]<=booking_history.length
          }
          if(convertable){
            reject()
            res.status(409).send({status:"failed", message:"slot already booked"})
          }else{
            let booking_id 
            if(bookingOrder){
              var numb = bookingOrder[0].booking_id.match(/\d/g);
              numb = numb.join("");
              var str = "" + (parseInt(numb, 10) + i )
              var pad = "TT000000"
              booking_id = pad.substring(0, pad.length - str.length) + str
            }else{
              booking_id = "TT000001";
            }
            let booking_data = {
              booking_id:booking_id,
              booking_date:body.booking_date,
              booking_type:body.booking_type,
              booking_status:"booked",
              created_by:req.userId,
              booked_by:body.booked_by,
              venue:body.venue,
              area:venue.area,
              venue_id:body.venue_id,
              venue_data:body.venue_id,
              venue_location:venue.venue.lat_long,
              user_id:body.user_id,
              sport_name:body.sport_name,
              venue_type:body.venue_type,
              amount:body.amount,
              coupons_used:body.coupons_used,
              commission:body.commission,
              start_time:body.start_time,
              end_time:body.end_time,
              slot_time:body.slot_time,
              booking_amount:body.booking_amount,
              multiple_id:id,
              start_date_range:body.start_date_range,
              end_date_range:body.end_date_range,
              group_id:body.group_id,
              selected_days:body.selected_days,
              repeat_booking:false,
              repeat_id:body.repeat_id,
              no_charge:body.no_charge,
              closed:body.closed,
              payment_option:body.payment_option,
              name:body.name,
              email:body.email,
              phone:body.phone,
              card:body.card,
              upi:body.upi,
              group_id:body.group_id,
              cash:body.cash,
              venue_discount:body.venue_discount,
              academy:body.academy,
              membership:body.membership,
              comments:body.comments,
              courts:body.courts,
              alternate:body.alternate
            }

            resolve(booking_data)
            // Booking.create(booking_data).then(booking=>{
            //   resolve(booking)
            // }).catch(error=>{
            //   console.log('pass')
            //   console.log(error)
            //   reject()
            // })
          }
        }).catch(next)
   }).catch(next)
}

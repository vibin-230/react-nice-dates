const User = require('../models/user');
const Admin = require('../models/admin');
const moment = require('moment');

const combineSlots=(booking, users, admins)=>{
    let result = {}
    let data = Object.values(booking).map((value,index)=>{
      let UserType;
      if(value.booking_type === "web"){
        UserType = admins
      }else{
        UserType = users
      }
      let user_array ={}
      var collected_by ={}
      if(UserType){
        let user = UserType.map(userValue=>{
          if(value.created_by == userValue._id){
            user_array = userValue
          }
        })
        admins.map(userValue=>{
          if((value.collected_by?value.collected_by.toString():"") === userValue._id.toString()){
              collected_by = userValue
            }
          })

      }

      
      if(!result[value.booking_id]){
        result[value.booking_id] = value
        result[value.booking_id].created_by = user_array
        //result[value.booking_id].collected_by = collected_by

      }else{
        result[value.booking_id].created_by = user_array
        //result[value.booking_id].collected_by = collected_by

        result[value.booking_id].amount = result[value.booking_id].amount + value.amount
        result[value.booking_id].commission = result[value.booking_id].commission + value.commission
        ////Slot time combining
        let slot_time = result[value.booking_id].slot_time.split("-")
        let value_slot_time = value.slot_time.split("-")
        let array = [...slot_time,...value_slot_time]
        array = array.map(function (x) {
          return parseInt(x);
        }); 
        let start_time = Math.min(...array)
        let end_time = Math.max(...array)
        
        start_time = start_time.toString().length === 1?"000"+start_time.toString():start_time.toString().length === 2?"00"+start_time.toString():start_time.toString().length === 3?"0"+start_time.toString():start_time

        end_time = end_time.toString().length === 1?"000"+end_time.toString():end_time.toString().length === 2?"00"+end_time.toString():end_time.toString().length === 3?"0"+end_time.toString():end_time
        let new_start_time = result[value.booking_id].start_time?result[value.booking_id].start_time<value.start_time?result[value.booking_id].start_time:value.start_time:value.start_time
        let new_end_time =  result[value.booking_id].end_time?result[value.booking_id].end_time>value.end_time?result[value.booking_id].end_time:value.end_time:value.end_time
        
        result[value.booking_id].slot_time = moment(new_start_time).utc().format("HHmm") +"-"+ moment(new_end_time).utc().format("HHmm")
        result[value.booking_id].start_time = result[value.booking_id].start_time?result[value.booking_id].start_time<value.start_time?result[value.booking_id].start_time:value.start_time:value.start_time

        result[value.booking_id].end_time = result[value.booking_id].end_time?result[value.booking_id].end_time>value.end_time?result[value.booking_id].end_time:value.end_time:value.end_time
      }
    })
    result = Object.values(result)
    
    return result

  }

module.exports = combineSlots
const User = require('../models/user');
const Admin = require('../models/admin');


const combineSlots=(booking, users, admins)=>{
    let result = {}
    let data = Object.values(booking).map((value,index)=>{
      // let UserType;
      // if(value.booking_type = "web"){
      //   UserType = admins
      // }else{
      //   UserType = users
      // }
      // let user_array ={}
      // if(UserType){
      //   let user = UserType.map(userValue=>{
      //     if(value.created_by === "5d2f455764273e3a2feac901"){
      //       user_array = userValue
      //     }
      //   })
      // }

      
      // console.log(user_array)
      if(!result[value.multiple_id]){
        console.log('object');
        result[value.multiple_id] = value
        // result[value.multiple_id].created = user_array
        // console.log(result[value.multiple_id].created_by);

      }else{
        console.log('object2');
        
        // result[value.multiple_id].created = user_array
        // console.log(result[value.multiple_id].created_by);

        result[value.multiple_id].amount = result[value.multiple_id].amount + value.amount
        result[value.multiple_id].commission = result[value.multiple_id].commission + value.commission
        ////Slot time combining
        let slot_time = result[value.multiple_id].slot_time.split("-")
        let value_slot_time = value.slot_time.split("-")
        let array = [...slot_time,...value_slot_time]
        array = array.map(function (x) {
          return parseInt(x);
        }); 
        let start_time = Math.min(...array)
        let end_time = Math.max(...array)
        start_time = start_time.toString().length === 1?"000"+start_time.toString():start_time.toString().length === 2?"00"+start_time.toString():start_time.toString().length === 3?"0"+start_time.toString():start_time

        end_time = end_time.toString().length === 1?"000"+end_time.toString():end_time.toString().length === 2?"00"+end_time.toString():end_time.toString().length === 3?"0"+end_time.toString():end_time
        result[value.multiple_id].slot_time = start_time +"-"+ end_time

        result[value.multiple_id].start_time = result[value.multiple_id].start_time?result[value.multiple_id].start_time<value.start_time?result[value.multiple_id].start_time:value.start_time:value.start_time

        result[value.multiple_id].end_time = result[value.multiple_id].end_time?result[value.multiple_id].end_time>value.end_time?result[value.multiple_id].end_time:value.end_time:value.end_time
      }
    })
    result = Object.values(result)
    
    return result

  }

module.exports = combineSlots
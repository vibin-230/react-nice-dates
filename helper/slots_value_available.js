const Slots = require('../sample/slots');
const moment = require('moment')
let combinedSlots = [...Slots[0].item, ...Slots[1].item, ...Slots[2].item, ...Slots[3].item];

module.exports =  function slotsValueAvailable(venue,booking_history,body){

  if(venue.configuration.convertable){
    let conf = venue.configuration;
    let types = conf.types;
    let base_type = conf.base_type;
    let stock = {}
    let slots_available = {}
    let inventory = {}
    for(let i=0;i<types.length; i++){
      stock[types[i]] = conf[types[i]];
    }
    if(booking_history.length>0){
      console.log('hit');
      let total_map = body.map((requestObject,index)=>{
        let requestDate =   moment(requestObject.booking_date).format('YYYY-MM-DD')
        slots_available[requestDate] = {}  

      let available_inventory = Object.values(booking_history).map(booking =>{
        if(!slots_available[requestDate][booking.slot_time]){
        inventory = Object.assign({}, stock);
        }else{
        inventory = slots_available[requestDate][booking.slot_time]
        }
        inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type])
        for(let i=0;i<types.length-1; i++){
        inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
        }
        slots_available[requestDate][booking.slot_time]=inventory
        return slots_available
      })
     // available_inventory = available_inventory[available_inventory.length-1]
      console.log(slots_available);
    })
      venue.slots_available = slots_available
      return venue
      res.send({status:"success", message:"available slots fetched", data:venue})
    }else{
      let available_slots = {}
      let total_map = body.map((object,index)=>{
          let previous_date = moment(object.booking_date).format('YYYY-MM-DD')
          available_slots[previous_date] = {}
                  object.timeRepresentation.map((n)=>{
                      available_slots[previous_date][n] = Object.assign({}, stock);
                  })
      })
      console.log(available_slots)
      venue.slots_available = available_slots
      return venue
    }
  }else{
    let conf = venue.configuration;
    let types = conf.types;
    let stock = {}
    let array3 = []
    let slots_available = {}
    let slots_total = {}
    for(let i=0;i<types.length; i++){
      stock[types[i]] = conf[types[i]];
    }
    
    if(booking_history.length>0){
        let total_map = body.map((requestObject,index)=>{
            let requestDate =   moment(requestObject.booking_date).format('YYYY-MM-DD')
            slots_available[requestDate] = {}  
            //let available = Object.values(booking_history).map((booking)=> booking.slot_time)
            // if(available.length > requestObject.timeRepresentation.length){
            //      array3 = available.filter(function(obj) { return requestObject.timeRepresentation.indexOf(obj) == -1; });
            // }else{
            //     array3 = requestObject.timeRepresentation.filter(function(obj) { return available.indexOf(obj) == -1; });
            // }
          let available_inventory = Object.values(booking_history).map((booking,index) =>{
            let inventory =  Object.assign({}, stock);
        let bookingHistoryDate =  moment(booking.booking_date).format('YYYY-MM-DD')
        if(requestDate == bookingHistoryDate ){
            requestObject.timeRepresentation.map((representation)=>{
                if(representation === booking.slot_time && requestObject.timeRepresentation.includes(booking.slot_time)){
                    if(!slots_available[requestDate][booking.slot_time]){
                                    console.log('slot_time hit',booking.slot_time, inventory,requestObject.timeRepresentation)
                                                        slots_available[requestDate][booking.slot_time] = inventory
                                                        slots_available[requestDate][booking.slot_time][booking.venue_type] =  parseInt(inventory[booking.venue_type] - 1)
                                                    }else{

                                                      console.log('slot_time pass',slots_available[requestDate][booking.slot_time])
                                                        slots_available[requestDate][booking.slot_time][booking.venue_type] = parseInt(slots_available[requestDate][booking.slot_time][booking.venue_type] - 1)

                                                    }
                                                    
                    }
            })
            // array3.map((a)=>{
            //     slots_available[requestDate][a] = Object.assign({}, stock);
            // })
          

        }else{
        //     console.log('hit')
        //     requestObject.timeRepresentation.map((representation)=>{ 
        //             slots_available[requestDate][representation] = Object.assign({}, stock);
        // })
        }
     
       })
    })

      //available_inventory = available_inventory[available_inventory.length-1]
      let available_slots = {}
      venue.slots_available = slots_available
      return venue
    }
    else{
        let available_slots = {}
        let total_map = body.map((object,index)=>{
            let previous_date = moment(object.booking_date).format('YYYY-MM-DD')
            available_slots[previous_date] = {}
                    object.timeRepresentation.map((n)=>{
                        available_slots[previous_date][n] = Object.assign({}, stock);
                    })
        })
    
        console.log(available_slots)
        venue.slots_available = available_slots
        return venue
        res.send({status:"success", message:"available slots fetched", data:[]})
      }
  }
}

const Slots = require('../sample/slots');
let combinedSlots = [...Slots[0].item, ...Slots[1].item, ...Slots[2].item, ...Slots[3].item];

module.exports =  function slotsAvailable(venue,booking_history){
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
      let available_inventory = Object.values(booking_history).map(booking =>{
        if(!slots_available[booking.slot_time]){
        inventory = Object.assign({}, stock);
        }else{
        inventory = slots_available[booking.slot_time]
        }
        inventory[base_type] = parseInt(inventory[base_type] - conf.ratio[booking.venue_type]* ((booking.courts == null || booking.courts == undefined) ? 1 : booking.courts) ) ////multiplet
        for(let i=0;i<types.length-1; i++){
        inventory[types[i]] = parseInt(inventory[base_type] / conf.ratio[types[i]])
        }
        
        slots_available[booking.slot_time]=inventory
        return slots_available
      })
      available_inventory = available_inventory[available_inventory.length-1]
      
      let available_slots = {}
      available_inventory = combinedSlots.map(value=>{
        if(available_inventory[value.timeRepresentation]){
          available_slots[value.timeRepresentation] = available_inventory[value.timeRepresentation]
        }else{
          available_slots[value.timeRepresentation] = Object.assign({}, stock);
        }
      })
      venue.slots_available = available_slots
      return venue
      res.send({status:"success", message:"available slots fetched", data:venue})
    }else{
      let available_slots = {}
      combinedSlots.map(value=>{
          available_slots[value.timeRepresentation] = Object.assign({}, stock);
      })
      venue.slots_available = available_slots
      return venue
      res.send({status:"success", message:"available slots fetched", data:[]})
    }
  }else{
    let conf = venue.configuration;
    let types = conf.types;
    let stock = {}
    let slots_available = {}
    for(let i=0;i<types.length; i++){
      stock[types[i]] = conf[types[i]];
    }
    if(booking_history.length>0){
      let available_inventory = Object.values(booking_history).map(booking =>{
        inventory =  Object.assign({}, stock);
        if(!slots_available[booking.slot_time]){
          slots_available[booking.slot_time] = inventory
          slots_available[booking.slot_time][booking.venue_type] = parseInt(inventory[booking.venue_type] - 1*((booking.courts == null || booking.courts == undefined) ? 1 : booking.courts)) /// mulitply
        }else if(slots_available[booking.slot_time]){
          slots_available[booking.slot_time][booking.venue_type] = parseInt(slots_available[booking.slot_time][booking.venue_type] - 1*((booking.courts == null || booking.courts == undefined) ? 1 : booking.courts)) /// mulitply
        }
        return slots_available
      })
      available_inventory = available_inventory[available_inventory.length-1]
      
      let available_slots = {}
      available_inventory = combinedSlots.map(value=>{
        if(available_inventory[value.timeRepresentation]){
          available_slots[value.timeRepresentation] = available_inventory[value.timeRepresentation]
        }else{
          available_slots[value.timeRepresentation] = Object.assign({}, stock);
        }
      })
      venue.slots_available = available_slots
      return venue
      res.send({status:"success", message:"available slots fetched", data:venue})
    }else{
      let available_slots = {}
      combinedSlots.map(value=>{
          available_slots[value.timeRepresentation] = Object.assign({}, stock);
      })
      venue.slots_available = available_slots
      return venue
      res.send({status:"success", message:"available slots fetched", data:[]})
    }
  }
}

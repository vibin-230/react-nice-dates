const setKeyForEvent=(key)=>{
  if(key === '5s'){
    return "5's"
  }
  else if(key === '6s'){
    return "6's"
  }
  else if(key === '7s'){
    return "7's"
  }
  else if(key === '8s'){
    return "8's"
  }
  else if(key === '9s'){
    return "9's"
  }
  else if(key === '10s'){
    return "10's"
  }
  else if(key === '11s'){
    return "11's"
  }
  else if(key === 'singles'){
    return 'Singles'
  }
  else if(key === 'doubles'){
    return 'Doubles'
  }
  else if(key === 'halfcourt'){
    return 'Half Court'
  }
  else if(key === 'fullcourt'){
    return 'Full Court'
  }
  else if(key === 'group&knockout'){
    return 'Group & Knockout'
  }
  else if(key === 'group'){
    return 'League'
  }
  else if(key === 'knockout'){
    return 'Knockout'
  }
}

module.exports = setKeyForEvent
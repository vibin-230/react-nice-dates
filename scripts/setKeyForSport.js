const setKeyForSport=(key)=>{
  if(key === '5s'){
    return "5's"
  }
  else if(key === '7s'){
    return "7'5"
  }
  else if(key === '9s'){
    return "9'5"
  }
  else if(key === 'net'){
    return 'Nets'
  }
  else if(key === 'ac'){
    return 'A/C'
  }
  else if(key === 'nonac'){
    return 'Non A/C'
  }
  else if(key === 'hc'){
    return 'Half Court'
  }
  else if(key === 'fc'){
    return 'Full Court'
  }
  else if(key === 'ground' || key === 'pitch'){
    return 'Pitch'
  }
  else if(key == "football"){
    return "Football"
  }
  else if(key == "basketball"){
    return "Basketball"
  }
  else if(key == "badminton"){
    return "Badminton"
  }
  else if(key == "cricket"){
    return "Cricket"
  }
}

module.exports = setKeyForSport
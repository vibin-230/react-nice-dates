module.exports = setKeyForSport = (key) =>{
  if(key === '5s'){
    return "5-A-SIDE"
  }
  else if(key === '7s'){
    return "7-A-SIDE"
  }
  else if(key === '9s'){
    return "9-A-SIDE"
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
}
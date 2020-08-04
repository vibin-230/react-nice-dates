
const axios = require('axios');
module.exports =  function SendOTPMessage(numbers,sender,message){
    return new Promise(function(resolve, reject){
        axios.get(`https://api.textlocal.in/send/?apikey=gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX&numbers=${numbers}&sender=${sender}&message=${message}`).then(response => {
        console.log("response date",response.data)
   resolve( response.data )  
            // res.send(response.data)  
    }).catch(error=>{
        console.log(error)
        reject( error.response )  
      })
      })
    }


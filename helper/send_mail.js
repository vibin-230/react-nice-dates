const axios = require('axios');
const ejs = require('ejs');
const mail = require('../scripts/mail');
const mail = require('../scripts/mail');

module.exports = function SendMessage(numbers,sender,message){
    axios.get(`https://api.textlocal.in/send/?apikey=gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX&numbers=${numbers}&sender=${sender}&message=${message}`).then(response => {
        console.log("response date",response.data)
            // res.send(response.data)  
    }).catch(error=>{
        console.log(error)
      })
}

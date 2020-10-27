const axios = require('axios');
module.exports = function SendMessage(numbers,sender,message){

    console.log(numbers,sender,message);
    axios.get(`https://api.textlocal.in/send/?apikey=gpmTc4Ygis4-x4GFBQUxFcflj1qQl3ra6onj0xZhRX&numbers=${numbers}&sender=${sender}&message=${message}`).then(response => {
        console.log("response date",response.data)
            // res.send(response.data)  
    }).catch(error=>{
        console.log(error)
      })
	//   }
}

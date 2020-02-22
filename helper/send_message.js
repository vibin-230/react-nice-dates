const axios = require('axios');
module.exports = function SendMessage(numbers,sender,message){
    axios.get(`https://api.textlocal.in/send/?apikey=${process.env.TEXT_LOCAL_API_KEY}&numbers=${numbers}&sender=${sender}&message=${message}`).then(response => {
        console.log("response date",response.data)
            // res.send(response.data)  
    }).catch(error=>{
        console.log(error)
      })
}

const gcm = require('node-gcm');
const sender = new gcm.Sender('AAAAa6sWgd8:APA91bGNw2CJaOhW6EjEUB1Vw88ahctBpG2zn00l7oPFYB21GP5VUiMxEtA0QtPepmhf6S65dpcSP4SIN9cntzXjmhqzRwjGo7ASQ-S2K1LVC7Q2kB1eNAv08iJZRg4jK2e_IdqX4xDk');

function NotifyArray(device_token, message,title,chatroom1) {
  //console.log(chatroom)
    let chatroom = Object.assign({},chatroom1)
      if(chatroom && chatroom._id){
        chatroom['exit_list'] = []
        chatroom['join_date'] = []
        chatroom['last_active'] = []
        chatroom['last_message'] = {}
      }
    const title1 = title.toString.length > 0 ? title : 'Turftown'
    var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        contentAvailable: true,
        timeToLive: 3,
        //to:receiver_user.device_token,
        //dryRun: true,
        notification: {
          title: title,
          icon: "ic_launcher",
          body: message
        },
        data:{
          chatroom:chatroom,
          key:'Details'
        }
      });
      sender.send(message, { registrationTokens: device_token }, function (err, response) {
        if (err) console.error(err);
        else console.log(response);
      }); 

}

module.exports = NotifyArray;
const gcm = require('node-gcm');
const sender = new gcm.Sender('AAAAa6sWgd8:APA91bGNw2CJaOhW6EjEUB1Vw88ahctBpG2zn00l7oPFYB21GP5VUiMxEtA0QtPepmhf6S65dpcSP4SIN9cntzXjmhqzRwjGo7ASQ-S2K1LVC7Q2kB1eNAv08iJZRg4jK2e_IdqX4xDk');
var apn = require('apn')
const key = '/AuthKey_S4V3AKYZM4.p8'
var fs = require('fs'),
path = require('path'),    
filePath = path.join(__dirname, key);


function NotifyIOSDevices(token,message,title,payload){
  var options = {
    token: {
      key:filePath,
      keyId: "S4V3AKYZM4",
      teamId: "Y5N5LD2WUK"
    },
    production: false
  };
  var apnProvider = new apn.Provider(options);
  var note = new apn.Notification();
        note.topic = "com.turftown";
         note.sound = "ping.aiff";
      note.expiry = Math.floor(Date.now() / 1000) + 2000; // Expires 1 hour from now.
      note.badge = 0;
      //note.alert = "\uD83D\uDCE7 \u2709 Welcome to turftown";
      note.alert = message.params.notification.body
      note.payload = payload;
      note.title = title
      apnProvider.send(note, token).then( (result) => {
        // see documentation for an explanation of result
        console.log('result',result,result.response);
      }).catch(err=>console.log(err));

}    

function Notify(receiver_user, message) {
  
    var message = new gcm.Message({
        collapseKey: 'demo',
        priority: 'high',
        //contentAvailable: true,
        //timeToLive: 3,
        //to:receiver_user.device_token,
        //dryRun: true,
        notification: {
          title: ``,
          icon: "ic_launcher",
          body: message,
          color:"#0956E6"
        },
        data:{
          key:'No'
        }
      });
      sender.send(message, { registrationTokens: [receiver_user.device_token] }, function (err, response) {
        if (err) console.error('err',err.response);
        else console.log(response);
      }); 
      receiver_user.device_token.length === 64 && NotifyIOSDevices([receiver_user.device_token],message,'Turftown',{chatroom:user,key:type})


}

module.exports = Notify;
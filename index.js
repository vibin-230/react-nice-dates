const express = require('express');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
mongoose.Promise = require('bluebird');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
require('dotenv').config();
const axios = require('axios');
const redisAdapter = require('socket.io-redis');
const ClientManager = require('./chat/ClientManager')
const ChatroomManager = require('./chat/ChatroomManager')
const makeHandlers = require('./chat/handlers')
const clientManager = ClientManager()
const chatroomManager = ChatroomManager()
const redis = require("redis").createClient;
const io = require('socket.io')(server,{
  pingInterval: 25000,
  pingTimeout: 60000,
  autoConnect:false,
})
const port = 6379;
const host = '127.0.0.1';
const  adapter = require('socket.io-redis');

//const password = config.redis.password;
const pubClient = redis(port, host);
const subClient = redis(port, host, { return_buffers: true, });
io.adapter(adapter({ pubClient, subClient }));
// io.set('transports', ['websocket']);
// set the view engine to ejs
app.set('view engine', 'ejs');

mongoose.Promise  = global.Promise;

//Mongodb connection
mongoose.connect(process.env.DB_CONN,{ useNewUrlParser: true });
mongoose.set('useFindAndModify', false);
mongoose.connection.once('open', function() {
	console.log("Database connected successfully");
});

//To enable Cross-Origin Resource Sharing
app.use(cors());

app.use(function(req, res, next) {
  req.redis = redis;
  next();
});


// default options
app.use(fileUpload());


app.use(bodyParser.json({
  parameterLimit: 1000000,
  limit: '90mb',
  extended: true
}));

app.use(function(req,res,next){
  req.io = io;
  next();
});

//Route
app.use('/api/user',require('./routes/user'));
app.use('/api/venue',require('./routes/venue'));
app.use('/api/feed',require('./routes/feed'));
app.use('/api/chat',require('./routes/chat'));
app.use('/api/admin',require('./routes/admin'));
app.use('/api/test',require('./routes/test'));


io.use((socket, next) => {
  let token = socket.handshake.query.token;
  if ((token)) {
    return next();
  }
  return next(new Error('authentication error'));
});

io.on('connection', function (client) {
  const {
    handleRegister,
    handleJoin,
    handleLeave,
    handleMessage,
    handleGetChatrooms,
    handleLeaveChatrooms,
    handleSendMultiple,
    handleGetAvailableUsers,
    handleMessageGames,
    handleMvp,
    handleSlotAvailability,
    handleSlotAvailabilityDueToCancellation,
    handleDisconnect,
    handleJoinGame,
    handleInvites,
    handleTyping,
    handleUpdateImage,
    handleSendBroadcast,
    handleUpdateGroup,
    handleUpdateParams,
    handleProfileAlerts,
    handleSingleLeaveConnection,
    handleEventInvites,
    handleProfileAccepted,
  } = makeHandlers(client, clientManager, chatroomManager,io)

  const token = client.handshake.query.token;
  console.log(token);
  clientManager.addClient(client,token)
  client.on('register', handleRegister)
  client.on('join', handleJoin)
  client.on('join_game', handleJoinGame)
  client.on('leave', handleLeave)
  client.on('send_broadcast',handleSendBroadcast)
  client.on('handleMvp',handleMvp)
  client.on('message', handleMessage)
  client.on('games_message', handleMessageGames)
  client.on('update_messages', handleUpdateImage)
  client.on('update_group',handleUpdateGroup)
  client.on('update_parameters',handleUpdateParams)
  client.on('chatrooms', handleGetChatrooms)

  client.on('leave_chatrooms', handleLeaveChatrooms)

  client.on('availableUsers', handleGetAvailableUsers)

  client.on('invite', handleInvites)
  client.on('send_many', handleSendMultiple)
  client.on('leave_single_connection',handleSingleLeaveConnection)
  client.on('event_invite', handleEventInvites)
  client.on('typing', handleTyping)
  client.on('handleSlotAvailability',handleSlotAvailability)
  client.on('handleSlotAvailabilityCancel',handleSlotAvailabilityDueToCancellation)
  client.on('profile_alerts',handleProfileAlerts)
  client.on('profile_accepted',handleProfileAccepted)
  client.on('disconnect', function () {
    console.log('client disconnect...', client.id)
    
    handleDisconnect(token)
  })
  client.on('disconnect1',function(){

        handleDisconnect(token)
  })
  client.on('error', function (err) {
    console.log('received error from client:', client.id)
    console.log(err)
  })
})

//Error Handling
app.use(function(err,req,res,next){
  //console.log(err);
  res.status(422).send({error:err.message});
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

console.log(process.env.DOMAIN)
console.log(__dirname)
console.log(process.env.DB_CONN)
//Port listen
server.listen( process.env.PORT || 3040, function(){
  console.log("Port Listening "+port);
});



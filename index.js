const express = require('express');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
mongoose.Promise = require('bluebird');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
require('dotenv').config();
const axios = require('axios');
const ClientManager = require('./chat/ClientManager')
const ChatroomManager = require('./chat/ChatroomManager')
const makeHandlers = require('./chat/handlers')
const clientManager = ClientManager()
const chatroomManager = ChatroomManager()
const io = require('socket.io')(server)
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
app.use('/api/admin',require('./routes/admin'));

io.on('connection', function (client) {
  const {
    handleRegister,
    handleJoin,
    handleLeave,
    handleMessage,
    handleGetChatrooms,
    handleGetAvailableUsers,
    handleDisconnect
  } = makeHandlers(client, clientManager, chatroomManager)

  console.log('client connected...', client.id)
  clientManager.addClient(client)

  client.on('register', handleRegister)

  client.on('join', handleJoin)

  client.on('leave', handleLeave)

  client.on('message', handleMessage)

  client.on('chatrooms', handleGetChatrooms)

  client.on('availableUsers', handleGetAvailableUsers)

  client.on('disconnect', function () {
    console.log('client disconnect...', client.id)
    handleDisconnect()
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
console.log(process.env.DB_CONN)
//Port listen
let port = process.env.PORT || 3040  ;
server.listen( port, function(){
  console.log("Port Listening "+port);
});



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
const io = socketIO(server)
require('dotenv').config();


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

//BodyParser
app.use(bodyParser.json());

//Route
app.use('/api/user',require('./routes/user'));
app.use('/api/venue',require('./routes/venue'));
app.use('/api/admin',require('./routes/admin'));

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    setInterval(() => {
      client.emit('timer', new Date());
    }, interval);
  });
});

//Error Handling
app.use(function(err,req,res,next){
  //console.log(err);
  res.status(422).send({error:err.message});
});

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

//Port listen
let port = process.env.PORT || 3040  ;
server.listen( port, function(){
  console.log("Port Listening "+port);
});



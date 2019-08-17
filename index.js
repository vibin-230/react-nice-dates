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
const axios = require('axios');


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

app.use(function(req,res,next){
  req.io = io;
  next();
});

//Route
app.use('/api/user',require('./routes/user'));
app.use('/api/venue',require('./routes/venue'));
app.use('/api/admin',require('./routes/admin'));

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to timer with interval ', interval);
    let body = {
      booking_date:new Date(),
      venue:"Test QA Football",
      venue_type:"ground"
    }
    // axios.post('http://ec2-13-233-94-159.ap-south-1.compute.amazonaws.com/api/user/slots_available/5d41472f6aedb8465eb632bb',body).then(response=>{
    setInterval(() => {
        client.emit('timer', "response.data");
      }, interval);
    // })
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



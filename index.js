const express = require('express');
const bodyParser = require('body-parser');
const mongoose  = require('mongoose');
mongoose.Promise = require('bluebird');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

mongoose.Promise  = global.Promise;

//Mongodb connection
mongoose.connect('mongodb://akshay:qwerty@13.233.94.159/turftown',{ useNewUrlParser: true });
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


//Error Handling
app.use(function(err,req,res,next){
  //console.log(err);
  res.status(422).send({error:err.message});
});

app.use(express.static(path.join(__dirname, 'build')));

// app.get('*', function (req, res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

//Port listen
let port = 3040;
app.listen(process.env.port || port, function(){
  console.log("Port Listening "+port);
});

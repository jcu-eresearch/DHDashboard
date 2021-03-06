// modules =================================================
var express        = require('express');
var app            = express();
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');



// configuration ===========================================
	
// config files
var port = process.env.PORT || 8080; // set our port
var db = require('./config/db');

var enable_static = process.env.DH_ENABLE_STATIC_FILES || false;
var static_dir = process.env.DH_STATIC_DIR || "static";
var static_path = process.env.DH_STATIC_PATH || "/api/static";

console.log("Current Working Directory: "+process.cwd());
console.log("Static Redirect Enabled: "+enable_static);
console.log("Static Files located in: "+static_dir);
console.log("Static Redirected to: "+static_path);

// connect to our mongoDB database (commented out after you enter in your own credentials)
connectionsubject = mongoose.createConnection(db.urlSubjectViews);
var taggle = require('./app/taggle');
taggle.init(connectionsubject);


// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json 
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded

app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

// routes ==================================================
require('./app/routes')(app, enable_static, static_dir, static_path); // pass our application into our routes

// start app ===============================================
app.listen(port);	
console.log('Magic happens on port ' + port); 			// shoutout to the user
exports = module.exports = app; 						// expose app
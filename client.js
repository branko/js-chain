var connect = require('connect');
var http = require('http');

var app = connect();
const Cache = require('./cache');

// respond to all requests
app.use(function(req, res){
  res.end(Cache.readJSON());
});

//create node.js http server and listen on port
http.createServer(app).listen(3000);

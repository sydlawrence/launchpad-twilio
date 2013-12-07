// include the node twilio helper library
var config = require('./config').config,
    speakers = require('./speakers').speakers;
    express = require('express'),
    routes = require('./routes'),
    requestify = require('requestify'),
    app = express.createServer(),
    io = require('socket.io').listen(app);

io.set('log level', 1);

speakers.init();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.post("/call", function(req, res) {
  speakers.create(req, res, io.sockets);
});

app.post("/status", function(req, res) {
  speakers.status(req, res);
});

app.listen(config.port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);


var fetchChannels = function(cb) {
  
      var channels = {
        0:[],
        1:[],
        2:[],
        3:[]
      };
      cb(channels);
};



setTimeout(function() {
  speakers.launchpad.getButton(0,8).light(speakers.launchpad.colors.red.high);
},5000);

fetchChannels(function(channels) {
  // btn.light(speakers.launchpad.colors.green.high);
  console.log(channels);
  // speakers.call(channels);  
});

speakers.launchpad.on("press", function(btn) {
  if (btn.x === 0 && btn.y === 8) {
    btn.light(speakers.launchpad.colors.orange.high);
    fetchChannels(function(channels) {
      btn.light(speakers.launchpad.colors.green.high);
      speakers.call(channels);  
    });
  }
});

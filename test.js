// include the node twilio helper library
var Launchpad = require('./launchpad'),
    config = require('./config').config,
    express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app);




var launchpad = new Launchpad.Launchpad(config.midiPort);

setTimeout(function() {
  launchpad.allLight(Launchpad.colors.green.high);
}, 500);

launchpad.on("press", function(btn) {
  if (btn.special) {
    console.log("special pressed: "+btn.special+" "+btn.x+" "+btn.y);
  }
  else {
    console.log("pressed: "+btn.x+" "+btn.y);
  }
});




app.listen(1338);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

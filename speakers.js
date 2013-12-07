var Launchpad = require('./launchpad'),
    io = require('socket.io').listen(2000),
    sounds = require('./sounds').sounds,
    config = require('./config').config;

var twilio = require('twilio');

var twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

var speakers;

var fs = require("fs");
    var lame = require("lame");
    var Speaker = require("speaker");



speakers = exports.speakers = {
	count:0,
	channelCount:4,
	channels: [],

	call: function(speakers) {
		for (var channel in speakers) {
			for (var i in speakers[channel]) {
				twilioClient.makeCall({
					to: speakers[channel][i],
					from:config.twilio.number,
					url: config.domain + "/call?channel="+channel
				});
			}
		}
	},

	create: function(req, res, sockets) {
		var channel = this.count % this.channelCount;
		if (req.query.channel) channel = req.query.channel >> 0;

		var speaker = new this.Speaker(this.count, channel);


		this.channels[channel].add(speaker);

		launchpad.getButton(channel,this.channels[channel].speakerCount-1).light(Launchpad.colors.green.high);


		this.count++;
		sockets.emit('call',{speaker:speaker, body:req.body.From});
		var twiml = new twilio.TwimlResponse();
		twiml.say("please wait");
		res.send(speaker.response(twiml).toString());

		return speaker;
	},
	play: function(channel,mp3) {
		var stream = fs.createReadStream(mp3.replace("http://astleystems.s3.amazonaws.com/","audio/"));
        stream.pipe(new lame.Decoder()).pipe(new Speaker());
		this.channels[channel].play(mp3);
	},
	status: function(req, res) {

		var speaker = this.find(req.query.name, req.query.channel);
		var twiml = new twilio.TwimlResponse();
		res.send(speaker.response(twiml).toString());
	},
	find: function(name, channel) {
		var channel = this.channels[channel];
		return channel.find(name);
	},
	Speaker: function(name, channel) {
		var status = false;
		var obj = {};
		obj.name = name;
		obj.channel = channel;

		obj.play = function(mp3) {
			status = mp3;
		};

		obj.response = function(resp) {
			if (status) {
				resp.play(status);
				status = false;
			}
			resp.redirect("/status?name="+name+"&channel="+channel);
			return resp;
		};

		return obj;
	},
	Channel: function() {
		var obj = {};
		obj.speakers = {};
		obj.speakerCount = 0;

		obj.find = function(name) {
			return obj.speakers[name+""];
		};

		obj.add = function(speaker) {
			obj.speakers[speaker.name] = speaker;
			obj.speakerCount++;
		};

		obj.play = function(mp3){
			for (var i in obj.speakers) {
				obj.speakers[i].play(mp3);
			}
		};

		return obj;
	},
	init: function() {
		for (var i = 0; i < this.channelCount; i++) {
			this.channels.push(new this.Channel());
		}
	}
};

var launchpad = new Launchpad.Launchpad(config.midiPort);


launchpad.on("press", function(btn) {
	console.log(btn.x+"-"+btn.y);
	if (sounds[btn.x+"-"+btn.y]) {
		var sound = sounds[btn.x+"-"+btn.y];
		speakers.play(sound.channel, sound.mp3);

	}
});

speakers.launchpad = launchpad;
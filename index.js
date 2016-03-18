"use strict";
var express = require('express');
var p2 = require('p2');
var app = express();
var fs = require("fs");
const Round = require("./classes/round.js");
const World = require("./classes/world.js");
const Level = require("./classes/level.js");
const Flag = require("./classes/flag.js");
const Player = require("./classes/player.js");
const Bullet = require("./classes/entities/bullet.js");

var TICKRATE = 45;

var tickLengthMs = 1000 / TICKRATE;

var previousTick = Date.now()
var actualTicks = 0;

var lastID = 0;

var ROUND_TIME = 5;
var ROUND_SCORE = 10;

var roundCount = 0;

var gameScore = {
	red: 0,
	blue: 0
}

app.get('/', function (req, res) {
	res.sendFile(__dirname + "/html/index.html");
});

app.get('/js/pixi.js', function(req,res){
	res.sendFile(__dirname + "/js/pixi.min.js");
});

app.get('/js/moment.js', function(req,res){
	res.sendFile(__dirname + "/node_modules/moment/min/moment.min.js");
});

app.get('/js/physics.js', function(req,res){
	res.sendFile(__dirname + "/node_modules/p2/build/p2.min.js");
});

app.get('/js/bootbox.js', function(req,res){
	res.sendFile(__dirname + "/node_modules/bootbox/bootbox.min.js");
});

app.use('/images', express.static(__dirname + '/images'));
app.use('/js/client', express.static(__dirname + '/js/client'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});

var io = require('socket.io')(server);
var FeedServer = require(__dirname + "/js/FeedServer.js");
var feed = new FeedServer(io.sockets);

var currentRound = new Round(ROUND_TIME, ROUND_SCORE, feed);

io.on('connection', function(socket){
	var player = new Player(socket, currentRound.smallestTeam(), lastID);
	socket.emit("connectionInfo", {ID:player.ID, Team: player.Team});
	socket.on("name", function(name){
		player.name = name;
		currentRound.addPlayer(player);
	});
	lastID++;
	socket.on("update", function(update){
		currentRound.playerUpdate(player, update);
	});
	socket.on('disconnect', function(event) {
		currentRound.removePlayer(player);
	});
});

var gameLoop = function(){
	var now = Date.now() 

	actualTicks++
	if (previousTick + tickLengthMs <= now) {
		var delta = (now - previousTick) / 1000;
		previousTick = now;

		currentRound.update(delta);

		actualTicks = 0
	}

	if(currentRound.isComplete()){
		let players = currentRound.getPlayers();
		currentRound = new Round(ROUND_TIME, ROUND_SCORE, feed);
		for (var i = players.length - 1; i >= 0; i--) {
			players[i].reset();
			currentRound.addPlayer(players[i]);
		}
		roundCount++;
	}

	if (Date.now() - previousTick < tickLengthMs - 16) {
		setTimeout(gameLoop, 1)
	} else {
		setImmediate(gameLoop)
	}
}

gameLoop();
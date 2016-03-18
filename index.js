var express = require('express');
var p2 = require('p2');
var app = express();
var fs = require("fs");
const World = require("./classes/world.js");
const Level = require("./classes/level.js");
const Flag = require("./classes/flag.js");
const Player = require("./classes/player.js");
const Player = require("./classes/entities/bullet.js");

var TICKRATE = 45;

var tickLengthMs = 1000 / TICKRATE;

var previousTick = Date.now()
var actualTicks = 0;

var clients = [];

var lastID = 0;

var teamRed = false;

var redTeamCount = 0;
var blueTeamCount = 0;

var ROUND_TIME = 5;
var ROUND_SCORE = 10;

var round_start_time = new Date();
var round_end_time = new Date(round_start_time.getTime() + (ROUND_TIME*60*1000));

var roundCount = 0;

var directions = {
	LEFT:65,
	RIGHT:68,
	UP:87,
	DOWN:83,
	SPACE:32
};

var mouseButtons = {
	LEFT: 0
};

var PLAYER = Math.pow(2,1);
var FLAG =  Math.pow(2,2);
var GROUND = Math.pow(2,3);
var OTHER = Math.pow(2,4);
var BULLET = Math.pow(2,5);
var TRIGGER = Math.pow(2,6);

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
var feed = new require(__dirname + "/js/FeedServer.js")(io.sockets);

io.on('connection', function(socket){
	if(blueTeamCount > redTeamCount){
		teamRed = true;
	}else{
		teamRed = false;
	}
	var player = new Player(socket, teamRed ? "Red" : "Blue", lastID);
	player.setPosition(teamRed ? currentLevel.redStart.x : currentLevel.blueStart.x, teamRed ? currentLevel.redStart.y : currentLevel.blueStart.y);
	player.setSpawn(teamRed ? currentLevel.redStart : currentLevel.blueStart);
	world.addBody(player.physicsBody);
	socket.emit("connectionInfo", {ID:lastID, Team: teamRed ? "Red" : "Blue"});
	socket.on("name", function(name){
		player.name = name;
		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + name + "</b> Joined the game.");
	});
	
	if(teamRed){
		redTeamCount++;
	}else{
		blueTeamCount++;
	}
	teamRed = !teamRed;
	lastID++;
	clients.push(player);
	socket.on("update", function(update){
		if(!player.isHit){
			player.pressed = update.pressed;
			player.mousePressed = update.mousePressed;
			if(player.isDown(directions.LEFT) && player.physicsBody.position[0] > 0) player.physicsBody.velocity[0] = -100;
			if(player.isDown(directions.RIGHT) &&  player.physicsBody.position[0] < 790) player.physicsBody.velocity[0] = 100;
			if((player.isDown(directions.UP) || player.isDown(directions.SPACE))  && player.physicsBody.position[1] < 590 && !player.jumping){
				player.physicsBody.velocity[1] = 100;
				player.jumping = true;
			}
			if(player.isDown(directions.DOWN) && player.physicsBody.position[1] > 0) player.physicsBody.velocity[1] = -500;

			if(!player.isDown(directions.LEFT) && !player.isDown(directions.RIGHT)){
				player.physicsBody.velocity[0] = 0;
			}

			if(player.isPressed(mouseButtons.LEFT) && player.bulletFired === false){
				var angle = player.mousePressed[mouseButtons.LEFT].angle;
				var bullet = new Bullet(currentLevel.getEntityID(), player.physicsBody.position[0]+-Math.cos(angle) * 10, player.physicsBody.position[1]+Math.sin(angle) * 10, 200, angle, 3000);
				world.addBody(bullet);
				bullet.physicsBody.owner = player;
				player.bullets.push(bullet);
				player.bulletFired = true;
				setTimeout(function(){
					player.bullets = player.bullets.filter(function(index) {
						return index !== bullet;
					});
					world.removeBody(bullet.physicsBody);
					notifyBulletRemoved(bullet.ID);
				}, bullet.range);
			}else if(!player.isPressed(mouseButtons.LEFT)){
				if(player.reloading === false){
					setTimeout(function(){
						player.bulletFired = false;
						player.reloading = false;
					}, 200);
					player.reloading = true;
				}
			}
		}
	});
	socket.on('disconnect', function(event) {
		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> left the game");
		world.removeBody(player.physicsBody);
		if(player.Team === "Blue"){
			blueTeamCount--;
		}else{
			redTeamCount--;
		}
		clients = clients.filter(function(index) {
			return index.skt !== socket;
		});
		notifyDisconnect(player.ID);
	});
});

//Define Server Physics
var world = new World();
world.on("beginContact", doCollisions);
var currentLevel = new Level("definition", world);

var RedFlag = new Flag(10,0);
world.addBody(RedFlag.getBody());
var BlueFlag = new Flag(760,0);
world.addBody(BlueFlag.getBody());

function doCollisions(evt){
	var shapeA = evt.shapeA;
	var shapeB = evt.shapeB;
	if((shapeA.collisionGroup == GROUND || shapeB.collisionGroup == GROUND) && (shapeA.collisionGroup == PLAYER || shapeB.collisionGroup == PLAYER)){
		var player = findPlayer(clients, shapeA.collisionGroup == PLAYER ? shapeA.body :shapeB.body);
		if(player){
			player.jumping = false;
		}
	}
	if((shapeA.collisionGroup == TRIGGER || shapeB.collisionGroup == TRIGGER) && (shapeA.collisionGroup == PLAYER || shapeB.collisionGroup == PLAYER)){
		var player = findPlayer(clients, shapeA.collisionGroup == PLAYER ? shapeA.body :shapeB.body);
		var trigger = shapeA.body.owner ? shapeA.body.owner : shapeB.body.owner;
		trigger.trigger();
	}
	if((shapeA.collisionGroup == BULLET || shapeB.collisionGroup == BULLET) && (shapeA.body.health || shapeB.body.health)){
		var destructableShape = shapeA.body.health ? shapeA.body : shapeB.body;
		destructableShape.health--;
		if(destructableShape.health == 0){
			destructableShape.owner.die();
		}
	}
	if((shapeA.collisionGroup == BULLET || shapeB.collisionGroup == BULLET) && (shapeA.collisionGroup == PLAYER || shapeB.collisionGroup == PLAYER)){
		var player = findPlayer(clients, shapeA.collisionGroup == PLAYER ? shapeA.body :shapeB.body);
		var bullet = shapeA.collisionGroup == BULLET ? shapeA.body :shapeB.body;
		if(player && !player.isHit){
			feed.sendMessage("<b style=\"color:" + bullet.owner.Team + "\">" + bullet.owner.name + "</b> Killed <b style=\"color:" + player.Team + "\">" + player.name + "</b>");
			player.isHit = true;
			if(player.hasFlag){
				player.hasFlag = false;
				if(player.Team == "Red"){
					BlueFlag.setHome(true);
					notifyFlagCapture("Red");
				}else{
					RedFlag.setHome(true);
					notifyFlagCapture("Blue");
				}
			}
			setTimeout(function(){
				world.removeBody(player.physicsBody);
				player.reset();
				if (player.hasFlag) {
					if(player.Team == "Red"){
						notifyFlagCapture("Blue");
						BlueFlag.isHome(true);
					}else{
						notifyFlagCapture("Red");
						RedFlag.isHome(true);
					}
				}
				world.addBody(player.physicsBody);
			}, 5000);
		}
	}else{
		var player = findPlayer(clients, shapeB.body)
	    if(shapeA.body == RedFlag.getBody() || shapeB.body == RedFlag.getBody()){
	    	if(player && player.Team == "Blue" && RedFlag.isHome()){
	    		player.hasFlag = true;
	    		RedFlag.setHome(false);
	    		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> has the Red Flag!");
	    	}else if(player && RedFlag.isHome()){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			BlueFlag.setHome(true);
	    			gameScore.red++;
	    			notifyFlagCapture("Red");
	    			feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Captured the Flag!");
	    		}
	    	}
	    }else if(shapeA.body == BlueFlag.getBody() || shapeB.body == BlueFlag.getBody()){
	    	if(player && player.Team == "Red" && BlueFlag.isHome()){
	    		player.hasFlag = true;
	    		BlueFlag.setHome(false);
	    		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> has the Blue Flag!");
	    	}else if(player && BlueFlag.isHome()){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			RedFlag.setHome(true);
	    			gameScore.blue++;
	    			notifyFlagCapture("Blue");
	    			feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Captured the Flag!");
	    		}
	    	}
	    }
	}
}	

function findPlayer(source, physicsObject) {
  for (var i = 0; i < source.length; i++) {
    if (source[i].physicsBody === physicsObject) {
      return source[i];
    }
  }
}

var gameLoop = function(){
	var now = Date.now() 

	actualTicks++
	if (previousTick + tickLengthMs <= now) {
		var delta = (now - previousTick) / 1000;
		previousTick = now;

		world.step(delta);
		update(delta);

		actualTicks = 0
	}

	if(gameScore.blue >= ROUND_SCORE || gameScore.red >= ROUND_SCORE || timeExpired()){
		newRound(ROUND_TIME, ROUND_SCORE);
	}

	if (Date.now() - previousTick < tickLengthMs - 16) {
		setTimeout(gameLoop, 1)
	} else {
		setImmediate(gameLoop)
	}
}

var update = function(delta){
	var levelInfo = currentLevel.levelUpdateInfo();
	var dynamicLevelInfo = currentLevel.levelDynamicUpdateInfo();
	let updateData = updateInfo();
	for (var i = clients.length - 1; i >= 0; i--) {
		if(clients[i] && clients[i].skt){
			clients[i].skt.emit("update", updateData);
			if(clients[i] && clients[i].skt){
				clients[i].skt.emit("levelUpdate", dynamicLevelInfo);
				if(clients[i] && !clients[i].staticObjectsSent){
					clients[i].skt.emit("levelUpdate", levelInfo);
					clients[i].staticObjectsSent = true;
				}
			}
		}
	};
}

var updateInfo = function(){
	var clientInfo = [];
	for (var i = clients.length - 1; i >= 0; i--) {
		clientInfo.push({
			ID:clients[i].ID,
			Team: clients[i].Team,
			Data: {position:{x:clients[i].physicsBody.position[0],y:clients[i].physicsBody.position[1]}, hasFlag: clients[i].hasFlag, rotation:clients[i].physicsBody.angle},
			Score: gameScore,
			Name: clients[i].name,
			Dead: clients[i].isHit,
			TimeRemaining: roundTimeRemaining(),
			Bullets: getBulletPositions(clients[i].bullets)
		});
	};
	return clientInfo;
};

var getBulletPositions = function(bullets){
	var bulletPositions = [];
	for (var i = bullets.length - 1; i >= 0; i--) {
		bulletPositions.push({
			id: bullets[i].ID,
			x: bullets[i].physicsBody.position[0],
			y: bullets[i].physicsBody.position[1]
		})
	};

	return bulletPositions;
};
   
var notifyDisconnect = function(clientID){
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].skt.emit("clientDisconnected", clientID);
	};	
}

var notifyFlagCapture = function(team){
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].skt.emit("flagCaptured", team);
	};	
}

var notifyRoundWinner = function(team){
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].skt.emit("roundComplete", team);
	};	
}

var notifyBulletRemoved = function(id){
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].skt.emit("bulletRemoved", id);
	};	
}

var newRound = function(time, score){
	if(gameScore.blue > gameScore.red){
		notifyRoundWinner("Blue");
	}else if(gameScore.red > gameScore.blue){
		notifyRoundWinner("Red");
	}else{
		notifyRoundWinner("Draw");
	}
	round_start_time = new Date();
	round_end_time = new Date(round_start_time.getTime() + ROUND_TIME*60*1000);
	ROUND_SCORE = score;
	notifyFlagCapture("Red");
	notifyFlagCapture("Blue");
	gameScore.blue = 0;
	gameScore.red = 0;

	//Reset Level
	world = new World();
	world.on("beginContact", doCollisions);
	currentLevel = new Level("definition", world);

	RedFlag = new Flag(10,0);
	world.addBody(RedFlag.getBody());
	BlueFlag = new Flag(760,0);
	world.addBody(BlueFlag.getBody());
	BlueFlag.setHome(true);
	RedFlag.setHome(true);
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].reset();
		world.addBody(clients[i].physicsBody);
	};
	roundCount++;
}

var roundTimeRemaining = function(){
	var t = round_end_time - Date.now();
	var seconds = Math.floor( (t/1000) % 60 );
  	var minutes = Math.floor( (t/1000/60) % 60 );
  	return ('0' + minutes).slice(-2) + " : " + ('0' + seconds).slice(-2);
}

var timeExpired = function(){
	var t = round_end_time - Date.now();
	if(t <= 0){
		return true;
	}
	return false;
}


gameLoop();
var express = require('express');
var p2 = require('p2');
var app = express();
var fs = require("fs");

var TICKRATE = 60;

var tickLengthMs = 1000 / TICKRATE;

var previousTick = Date.now()
var actualTicks = 0;

var clients = [];

var lastID = 0;

var entityID = 0

var teamRed = false;

var redTeamCount = 0;
var blueTeamCount = 0;

var ROUND_TIME = 10;
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
	var ClientObj = {
		skt: socket,
		ID: lastID,
		Team: teamRed ? "Red" : "Blue",
		Data: {position:{x:0,y:0}},
		pressed: {},
		mousePressed: {},
		bullets: [],
		physicsBody: createPlayerBody(teamRed ? 50 : 750, 70),
		isDown: function(keyCode){
			return this.pressed[keyCode];
		},
		isPressed: function(mouseButton){
			return this.mousePressed[mouseButton];
		},
		hasFlag: false,
		bulletFired: false,
		reloading: false,
		jumping: false,
		isHit:false,
		staticObjectsSent: false,
		name: "unnamed",
		reset: function(){
			this.physicsBody.position[0] = this.Team == "Red" ? 50 : 750;
			this.physicsBody.position[1] = 70;
			this.hasFlag = false;
			this.isHit = false;
			if(this.Team == "Red"){
				notifyFlagCapture("Blue");
				BlueFlag.isHome = true;
			}else{
				notifyFlagCapture("Red");
				RedFlag.isHome = true;
			}
		}
	};
	socket.emit("connectionInfo", {ID:lastID, Team: teamRed ? "Red" : "Blue"});
	socket.on("name", function(name){
		ClientObj.name = name;
		feed.sendMessage("<b style=\"color:" + ClientObj.Team + "\">" + name + "</b> Joined the game.");
	});
	
	if(teamRed){
		redTeamCount++;
	}else{
		blueTeamCount++;
	}
	teamRed = !teamRed;
	lastID++;
	clients.push(ClientObj);
	socket.on("update", function(update){
		if(!ClientObj.isHit){
			ClientObj.pressed = update.pressed;
			ClientObj.mousePressed = update.mousePressed;
			if(ClientObj.isDown(directions.LEFT) && ClientObj.physicsBody.position[0] > 0) ClientObj.physicsBody.velocity[0] = -100;
			if(ClientObj.isDown(directions.RIGHT) &&  ClientObj.physicsBody.position[0] < 790) ClientObj.physicsBody.velocity[0] = 100;
			if((ClientObj.isDown(directions.UP) || ClientObj.isDown(directions.SPACE))  && ClientObj.physicsBody.position[1] < 590 && !ClientObj.jumping){
				ClientObj.physicsBody.velocity[1] = 100;
				ClientObj.jumping = true;
			}
			if(ClientObj.isDown(directions.DOWN) && ClientObj.physicsBody.position[1] > 0) ClientObj.physicsBody.velocity[1] = -500;

			if(!ClientObj.isDown(directions.LEFT) && !ClientObj.isDown(directions.RIGHT)){
				ClientObj.physicsBody.velocity[0] = 0;
			}

			if(ClientObj.isPressed(mouseButtons.LEFT) && ClientObj.bulletFired === false){
				var angle = ClientObj.mousePressed[mouseButtons.LEFT].angle;
				var bullet = createBulletBody(ClientObj.physicsBody.position[0]+-Math.cos(angle) * 10, ClientObj.physicsBody.position[1]+Math.sin(angle) * 10, 200, angle);
				bullet.physicsBody.owner = ClientObj;
				ClientObj.bullets.push(bullet);
				ClientObj.bulletFired = true;
				setTimeout(function(){
					ClientObj.bullets = ClientObj.bullets.filter(function(index) {
						return index !== bullet;
					});
					world.removeBody(bullet.physicsBody);
					notifyBulletRemoved(bullet.ID);
				}, 3000);
			}else if(!ClientObj.isPressed(mouseButtons.LEFT)){
				if(ClientObj.reloading === false){
					setTimeout(function(){
						ClientObj.bulletFired = false;
						ClientObj.reloading = false;
					}, 200);
					ClientObj.reloading = true;
				}
			}
		}
	});
	socket.on('disconnect', function(event) {
		feed.sendMessage("<b style=\"color:" + ClientObj.Team + "\">" + ClientObj.name + "</b> left the game");
		world.removeBody(ClientObj.physicsBody);
		if(ClientObj.Team === "Blue"){
			blueTeamCount--;
		}else{
			redTeamCount--;
		}
		clients = clients.filter(function(index) {
			return index.skt !== socket;
		});
		notifyDisconnect(ClientObj.ID);
	});
});

//Define Server Physics
var world = new p2.World({
	gravity:[0, -100]
});

world.setGlobalStiffness(1e8);
world.setGlobalRelaxation(10);

// Create an infinite ground plane.
var groundBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [0,0]
});

var groundShape = new p2.Plane();
groundBody.addShape(groundShape);
groundShape.collisionGroup = GROUND;
groundShape.collisionMask = PLAYER | BULLET | GROUND | OTHER;
world.addBody(groundBody);
var wallBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [-5,0],
	angle:4.71238898
});
var wallShape = new p2.Plane();
wallShape.collisionGroup = GROUND;
wallShape.collisionMask = PLAYER | BULLET | GROUND | OTHER;
wallBody.addShape(wallShape);
world.addBody(wallBody);
var wallBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [800,0],
	angle:1.57079633
});
var wallShape = new p2.Plane();
wallShape.collisionGroup = GROUND;
wallShape.collisionMask = PLAYER | BULLET | GROUND | OTHER;
wallBody.addShape(wallShape);
world.addBody(wallBody);
var ceilingBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [0,600],
	angle:3.14159265
});
var ceilingShape = new p2.Plane();
ceilingShape.collisionGroup = GROUND;
ceilingShape.collisionMask = PLAYER | BULLET | GROUND | OTHER;
ceilingBody.addShape(ceilingShape);
world.addBody(ceilingBody);

var createFlagBody = function(x,y){
	var body = new p2.Body({
					mass:0,
					position: [x,0]
				});
	var bodyShape = new p2.Box({
					width:15,
					height:40,
					sensor:true
				});

	bodyShape.collisionGroup = FLAG;

	bodyShape.collisionMask = PLAYER;

	body.addShape(bodyShape);
	world.addBody(body);

	return body;
}

var RedFlag = {
	body: createFlagBody(10,0),
	isHome: true
};
var BlueFlag = {
	body: createFlagBody(760,0),
	isHome: true
};

world.on("beginContact",function(evt){
	var shapeA = evt.shapeA;
	var shapeB = evt.shapeB;
	if((shapeA.collisionGroup == GROUND || shapeB.collisionGroup == GROUND) && (shapeA.collisionGroup == PLAYER || shapeB.collisionGroup == PLAYER)){
		var player = findPlayer(clients, shapeA.collisionGroup == PLAYER ? shapeA.body :shapeB.body);
		player.jumping = false;
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
		if(!player.isHit){
			feed.sendMessage("<b style=\"color:" + bullet.owner.Team + "\">" + bullet.owner.name + "</b> Killed <b style=\"color:" + player.Team + "\">" + player.name + "</b>");
			player.isHit = true;
			if(player.hasFlag){
				player.hasFlag = false;
				if(player.Team == "Red"){
					BlueFlag.isHome = true;
					notifyFlagCapture("Red");
				}else{
					RedFlag.issssHome = true;
					notifyFlagCapture("Blue");
				}
			}
			setTimeout(function(){
				player.reset();
			}, 5000);
		}
	}else{
		var player = findPlayer(clients, shapeB.body)
	    if(shapeA.body == RedFlag.body || shapeB.body == RedFlag.body){
	    	if(player && player.Team == "Blue" && RedFlag.isHome){
	    		player.hasFlag = true;
	    		RedFlag.isHome = false;
	    		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> has the Red Flag!");
	    	}else if(player && RedFlag.isHome){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			BlueFlag.isHome = true;
	    			gameScore.red++;
	    			notifyFlagCapture("Red");
	    			feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Captured the Flag!");
	    		}
	    	}
	    }else if(shapeA.body == BlueFlag.body || shapeB.body == BlueFlag.body){
	    	if(player && player.Team == "Red" && BlueFlag.isHome){
	    		player.hasFlag = true;
	    		BlueFlag.isHome = false;
	    		feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> has the Blue Flag!");
	    	}else if(player && BlueFlag.isHome){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			RedFlag.isHome = true;
	    			gameScore.blue++;
	    			notifyFlagCapture("Blue");
	    			feed.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Captured the Flag!");
	    		}
	    	}
	    }
	}
});	

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
	var levelInfo = levelUpdateInfo();
	var dynamicLevelInfo = levelDynamicUpdateInfo();
	for (var i = clients.length - 1; i >= 0; i--) {
		if(clients[i] && clients[i].skt){
			clients[i].skt.emit("update", updateInfo());
			clients[i].skt.emit("levelUpdate", dynamicLevelInfo);
			if(clients[i] && !clients[i].staticObjectsSent){
				clients[i].skt.emit("levelUpdate", levelInfo);
				clients[i].staticObjectsSent = true;
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

var loadLevel = function(name){
	var levelDefinition = JSON.parse(fs.readFileSync(__dirname + "/level/" + name + ".json", 'utf8'));
	var levelEntities = {
		static:[],
		dynamic:[]
	};
	for (var i = levelDefinition.length - 1; i >= 0; i--) {
		var levelEntity = levelDefinition[i];
		var body = new p2.Body({
			mass: levelEntity.mass,
			position: [levelEntity.position.x,levelEntity.position.y]
		});
		var shape = new p2[levelEntity.shape](levelEntity.shapeOptions);
		body.addShape(shape);
		if(levelEntity.type === "wall"){
			shape.collisionGroup = OTHER;
			shape.collisionMask = PLAYER | GROUND | BULLET | OTHER;
			levelEntities.static.push({
				ID:entityID++,
				physicsBody: body,
				key: levelEntity.key,
				type: levelEntity.type,
				shape: levelEntity.shape,
				shapeOptions: levelEntity.shapeOptions
			});
		}else if(levelEntity.type === "floor"){
			shape.collisionGroup = GROUND;
			shape.collisionMask = PLAYER | GROUND | BULLET | OTHER;
			levelEntities.static.push({
				ID:entityID++,
				physicsBody: body,
				key: levelEntity.key,
				type: levelEntity.type,
				shape: levelEntity.shape,
				shapeOptions: levelEntity.shapeOptions
			});
		}else if(levelEntity.type === "slider"){
			shape.collisionGroup = GROUND;
			shape.collisionMask = PLAYER | GROUND | BULLET | OTHER;
			levelEntities.dynamic.push({
				ID:entityID++,
				physicsBody: body,
				key: levelEntity.key,
				type: levelEntity.type,
				shape: levelEntity.shape,
				shapeOptions: levelEntity.shapeOptions,
				startPosition: levelEntity.startPosition,
				endPosition: levelEntity.endPosition,
				repeat: levelEntity.repeat,
				complete: false,
				speedX: levelEntity.speedX,
				speedY: levelEntity.speedY,	
				update: function(){
					if(this.complete === false || this.repeat === true){
						if((this.physicsBody.position[0] + this.speedX) > this.endPosition.x){
							this.speedX = -this.speedX;
						}
						if((this.physicsBody.position[1] + this.speedY) > this.endPosition.y){
							this.speedY = -this.speedY;
						}

						if((this.physicsBody.position[0] + this.speedX) < this.startPosition.x){
							this.speedX = -this.speedX;
							this.complete = true;
						}
						if((this.physicsBody.position[1] + this.speeY) < this.startPosition.y){
							this.speedY = -this.speedY;
							this.complete = true;
						}

						this.physicsBody.velocity[0] = this.speedX;
						this.physicsBody.velocity[1] = this.speedY;
					}else if(this.complete === true){
						this.physicsBody.velocity[0] = 0;
						this.physicsBody.velocity[1] = 0;
					}
				},
				triggerBehaviour: function(){
					this.complete = false;
					this.physicsBody.velocity[0] = this.speedX;
					this.physicsBody.velocity[1] = this.speedY;
				}
			});
		}else if(levelEntity.type === "crate"){
			shape.collisionGroup = OTHER;
			shape.collisionMask = PLAYER | GROUND | BULLET | OTHER;
			if(levelEntity.health){
				body.health = levelEntity.health;
			}
			var entity = {
				ID:entityID++,
				key: levelEntity.key,
				physicsBody: body,
				type: levelEntity.type,
				shape: levelEntity.shape,
				shapeOptions: levelEntity.shapeOptions,
				initialHealth: levelEntity.health,
				initialPosition: {
					x: levelEntity.position.x,
					y: levelEntity.position.y
				},
				update: function(){
				},
				die: function(){
					this.physicsBody.position[0] = this.initialPosition.x;
					this.physicsBody.position[1] = this.initialPosition.y;
					this.physicsBody.health = this.initialHealth;
					this.physicsBody.velocity[0] = 0;
					this.physicsBody.velocity[1] = 0;
					this.physicsBody.setZeroForce();
					world.removeBody(this.physicsBody);
					world.addBody(this.physicsBody);
				}
			};
			levelEntities.dynamic.push(entity);
			body.owner = entity;
		}else if(levelEntity.type === "trigger"){
			shape.collisionGroup = TRIGGER;
			shape.collisionMask = PLAYER;
			body.mass = 0;
			var triggerKey = levelEntity.key;
			var entity = {
				ID:entityID++,
				physicsBody: body,
				type: levelEntity.type,
				shape: levelEntity.shape,
				shapeOptions: levelEntity.shapeOptions,
				initialHealth: levelEntity.health,
				triggerTimeInterval: levelEntity.interval,
				key: triggerKey,
				initialPosition: {
					x: levelEntity.position.x,
					y: levelEntity.position.y
				},
				lastTriggered: null,
				trigger: function(){
					if(this.lastTriggered === null || this.lastTriggered + this.triggerTimeInterval < Date.now()){
						this.lastTriggered = Date.now();
						var items = findByKey(levelEntities.dynamic, this.key);
						for (var i = items.length - 1; i >= 0; i--) {
							var item = items[i];
							if(item.triggerBehaviour){
								item.triggerBehaviour();
							}
						};
					}
				}
			};
			body.owner = entity;
			levelEntities.static.push(entity);
		}
		world.addBody(body);
	};
	return levelEntities;
}

function findByKey(source, key) {
  var items = [];
  for (var i = 0; i < source.length; i++) {
    if (source[i].key === key) {
      items.push(source[i]);
    }
  }
  return items;
}

var levelEntities = loadLevel("definition");

var levelDynamicUpdateInfo = function(){
	var updateInfo = [];
	for (var i = levelEntities.dynamic.length - 1; i >= 0; i--) {
		var entity = levelEntities.dynamic[i];
		entity.update();
		updateInfo.push({
			ID:entity.ID,
			position:{
				x:entity.physicsBody.position[0],
				y:entity.physicsBody.position[1]
			},
			type:entity.type,
			shape: entity.shape,
			shapeOptions: entity.shapeOptions
		});
	};
	return updateInfo;
};

var levelUpdateInfo = function(){
	var updateInfo = [];
	for (var i = levelEntities.static.length - 1; i >= 0; i--) {
		var entity = levelEntities.static[i];
		updateInfo.push({
			ID:entity.ID,
			position:{
				x:entity.physicsBody.position[0],
				y:entity.physicsBody.position[1]
			},
			type:entity.type,
			shape: entity.shape,
			shapeOptions: entity.shapeOptions
		});
	};
	return updateInfo;
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

var createPlayerBody = function(x,y){
	var playerBody = new p2.Body({
		mass:1,
		position: [x, y]
	});

	var playerShape = new p2.Box({
		width:10,
		height:10
	});

	playerShape.collisionGroup = PLAYER;

	playerShape.collisionMask = PLAYER | FLAG | GROUND | OTHER | BULLET | TRIGGER;

	playerBody.addShape(playerShape);
	world.addBody(playerBody);

	return playerBody;
}

var createBulletBody = function(x,y,speed, angle){
	var body = new p2.Body({
		mass: 10,
		position: [x,y],
		velocity: [-Math.cos(angle) * speed, Math.sin(angle) * speed]
	})

	var shape = new p2.Circle({ radius: 2 });

	shape.collisionGroup = BULLET;
	shape.collisionMask = PLAYER | GROUND | BULLET | OTHER;

	body.addShape(shape);

	world.addBody(body);

	return {
		ID:entityID++,
		physicsBody: body
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
	BlueFlag.isHome = true;
	RedFlag.isHome = true;
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].reset();
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
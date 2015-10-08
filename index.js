var express = require('express');
var p2 = require('p2');
var app = express();

var TICKRATE = 60;

var tickLengthMs = 1000 / TICKRATE;

var previousTick = Date.now()
var actualTicks = 0;

var clients = [];

var lastID = 0;

var entityID = 0

var teamRed = false;

var directions = {
	LEFT:65,
	RIGHT:68,
	UP:87,
	DOWN:83
};

var mouseButtons = {
	LEFT: 0
};

var PLAYER = Math.pow(2,1);
var FLAG =  Math.pow(2,2);
var GROUND = Math.pow(2,3);
var OTHER = Math.pow(2,4);
var BULLET = Math.pow(2,5);

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

app.get('/js/physics.js', function(req,res){
	res.sendFile(__dirname + "/node_modules/p2/build/p2.min.js");
});

app.use('/images', express.static(__dirname + '/images'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});

var io = require('socket.io')(server);

io.on('connection', function(socket){
	socket.emit("connectionInfo", {ID:lastID, Team: teamRed ? "Red" : "Blue"});
	var ClientObj = {
		skt: socket,
		ID: lastID,
		Team: teamRed ? "Red" : "Blue",
		Data: {position:{x:0,y:0}},
		pressed: {},
		mousePressed: {},
		bullets: [],
		physicsBody: createPlayerBody(teamRed ? 50 : 750, teamRed ? 50 : 50),
		isDown: function(keyCode){
			return this.pressed[keyCode];
		},
		isPressed: function(mouseButton){
			return this.mousePressed[mouseButton];
		},
		hasFlag: false,
		bulletFired: false,
		isHit:false,
		reset: function(){
			this.physicsBody.position[0] = this.Team == "Red" ? 50 : 750;
			this.physicsBody.position[1] = this.Team == "Red" ? 50 : 50;
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
	teamRed = !teamRed;
	lastID++;
	clients.push(ClientObj);
	socket.on("update", function(update){
		if(!ClientObj.isHit){
			ClientObj.pressed = update.pressed;
			ClientObj.mousePressed = update.mousePressed;
			if(ClientObj.isDown(directions.LEFT) && ClientObj.physicsBody.position[0] > 0) ClientObj.physicsBody.velocity[0] = -100;
			if(ClientObj.isDown(directions.RIGHT) &&  ClientObj.physicsBody.position[0] < 790) ClientObj.physicsBody.velocity[0] = 100;
			if(ClientObj.isDown(directions.UP) && ClientObj.physicsBody.position[1] < 590) ClientObj.physicsBody.velocity[1] = 100;
			if(ClientObj.isDown(directions.DOWN) && ClientObj.physicsBody.position[1] > 0) ClientObj.physicsBody.velocity[1] = -500;

			if(!ClientObj.isDown(directions.LEFT) && !ClientObj.isDown(directions.RIGHT)){
				ClientObj.physicsBody.velocity[0] = 0;
			}

			if(ClientObj.isPressed(mouseButtons.LEFT) && ClientObj.bulletFired === false){
				var angle = ClientObj.mousePressed[mouseButtons.LEFT].angle;
				var bullet = createBulletBody(ClientObj.physicsBody.position[0]+-Math.cos(angle) * 10, ClientObj.physicsBody.position[1]+Math.sin(angle) * 10, 500, angle);
				ClientObj.bullets.push(bullet);
				ClientObj.bulletFired = true;
				setTimeout(function(){
					ClientObj.bullets = ClientObj.bullets.filter(function(index) {
						return index !== bullet;
					});
					world.removeBody(bullet.physicsBody);
					notifyBulletRemoved(bullet.ID);
				}, 1000);
			}else if(!ClientObj.isPressed(mouseButtons.LEFT)){
				ClientObj.bulletFired = false;
			}
		}
	});
	socket.on('disconnect', function(event) {
		console.log("User Disconnected");
		world.removeBody(ClientObj.physicsBody);
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
groundShape.collisionMask = PLAYER | BULLET;
world.addBody(groundBody);
var wallBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [-5,0],
	angle:4.71238898
});
var wallShape = new p2.Plane();
wallShape.collisionGroup = GROUND;
wallShape.collisionMask = PLAYER | BULLET;
wallBody.addShape(wallShape);
world.addBody(wallBody);
var wallBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [800,0],
	angle:1.57079633
});
var wallShape = new p2.Plane();
wallShape.collisionGroup = GROUND;
wallShape.collisionMask = PLAYER | BULLET;
wallBody.addShape(wallShape);
world.addBody(wallBody);
var ceilingBody = new p2.Body({
	mass: 0, // Setting mass to 0 makes the body static
	position: [0,600],
	angle:3.14159265
});
var ceilingShape = new p2.Plane();
ceilingShape.collisionGroup = GROUND;
ceilingShape.collisionMask = PLAYER | BULLET;
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
	body: createFlagBody(780,0),
	isHome: true
};

world.on("beginContact",function(evt){
	var shapeA = evt.shapeA;
	var shapeB = evt.shapeB;
	if((shapeA.collisionGroup == BULLET || shapeB.collisionGroup == BULLET) && (shapeA.collisionGroup == PLAYER || shapeB.collisionGroup == PLAYER)){
		var player = findPlayer(clients, shapeA.collisionGroup == PLAYER ? shapeA.body :shapeB.body);
		if(!player.isHit){
			player.isHit = true;
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
	    	}else if(player && RedFlag.isHome){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			BlueFlag.isHome = true;
	    			gameScore.red++;
	    			notifyFlagCapture("Red");
	    		}
	    	}
	    }else if(shapeA.body == BlueFlag.body || shapeB.body == BlueFlag.body){
	    	if(player && player.Team == "Red" && BlueFlag.isHome){
	    		player.hasFlag = true;
	    		BlueFlag.isHome = false;
	    	}else if(player && BlueFlag.isHome){
	    		if(player.hasFlag){
	    			player.hasFlag = false;
	    			RedFlag.isHome = true;
	    			gameScore.blue++;
	    			notifyFlagCapture("Blue");
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

	if (Date.now() - previousTick < tickLengthMs - 16) {
		setTimeout(gameLoop, 1)
	} else {
		setImmediate(gameLoop)
	}
}

var update = function(delta){
	for (var i = clients.length - 1; i >= 0; i--) {
		clients[i].skt.emit("update", updateInfo());
	};
}

var updateInfo = function(){
	var clientInfo = [];
	for (var i = clients.length - 1; i >= 0; i--) {
		clientInfo.push({
			ID:clients[i].ID,
			Team: clients[i].Team,
			Data: {position:{x:clients[i].physicsBody.position[0],y:clients[i].physicsBody.position[1]}, hasFlag: clients[i].hasFlag},
			Score: gameScore,
			Bullets: getBulletPositions(clients[i].bullets)
		});
	};
	return clientInfo;
}

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

	playerShape.collisionMask = PLAYER | FLAG | GROUND | OTHER | BULLET;

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


gameLoop();
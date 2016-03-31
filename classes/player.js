"use strict";
const p2 = require('p2');
const constants = require("./constants.js");
class Player{
	constructor(socket, team, id){
		this.skt = socket;
		this.ID = id;
		this.Team = team;
		this.Data = {position:{x:0,y:0}};
		this.pressed = {};
		this.mousePressed = {};
		this.bullets = [];
		this.physicsBody = createPlayerBody(0,0);
		this.hasFlag = false;
		this.bulletFired = false;
		this.reloading = false;
		this.jumping = false;
		this.isHit = false;
		this.staticObjectsSent = false;
		this.name = "unnamed";
		this.o2 = 100;
		this.health = 100;
		this.lastHealthDepletion = null;
		this.interval = 1000;
	}

	isDown(keyCode){
		return this.pressed[keyCode];
	}

	isPressed(mouseButton){
		return this.mousePressed[mouseButton];
	}

	setPosition(x,y){
		this.physicsBody.position[0] = x;
		this.physicsBody.position[1] = y;
	}

	setSpawn(position){
		this.spawn = position;
	}

	reset(){
		this.physicsBody = createPlayerBody(0,0);
		this.hasFlag = false;
		this.isHit = false;
		this.o2 = 100;
		this.health = 100;
		this.setPosition(this.spawn.x, this.spawn.y);
	}

	die(spawnTime, world){
		this.isHit = true;
		this.health = 0;
		setTimeout(() => {
				world.removeBody(this.physicsBody);
				this.reset();
				world.addBody(this.physicsBody);
			}, spawnTime);
	}

	update(spawnTime, world){
		if(!this.isHit){
			if(this.health <= 0){
				this.die(spawnTime, world);
			}
			if(this.o2 <= 0){
				if(this.lastHealthDepletion === null || this.lastHealthDepletion + this.interval < Date.now()){
					this.lastActivated = Date.now();
					this.health -= 10;
				}
			}
		}
	}

	isDead(){
		return this.health <= 0;
	}
}

var createPlayerBody = function(x,y){
	var playerBody = new p2.Body({
		mass:1,
		position: [x, y]
	});

	var playerShape = new p2.Box({
		width:20,
		height:20
	});

	playerShape.collisionGroup = constants.PLAYER;

	playerShape.collisionMask = constants.PLAYER | constants.FLAG | constants.GROUND | constants.OTHER | constants.BULLET | constants.TRIGGER;

	playerBody.addShape(playerShape);

	return playerBody;
}

module.exports = Player;
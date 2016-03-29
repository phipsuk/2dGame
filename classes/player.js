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
		this.setPosition(this.spawn.x, this.spawn.y);
	}
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

	playerShape.collisionGroup = constants.PLAYER;

	playerShape.collisionMask = constants.PLAYER | constants.FLAG | constants.GROUND | constants.OTHER | constants.BULLET | constants.TRIGGER;

	playerBody.addShape(playerShape);

	return playerBody;
}

module.exports = Player;
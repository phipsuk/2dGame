"use strict";
const p2 = require('p2');
const World = require("./world.js");
const Level = require("./level.js");
const Flag = require("./flag.js");
const Player = require("./player.js");
const Bullet = require("./entities/bullet.js");
const constants = require("./constants.js");

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

class Round{
	constructor(maxTime, maxScore, feed){
		this.world = new World();
		this.currentLevel = new Level("definition", this.world);
		this.round_start_time = new Date();
		this.round_end_time = new Date(this.round_start_time.getTime() + (maxTime*60*1000));
		this.score = {
			red: 0,
			blue: 0
		};
		this.world.on("beginContact", () => {
			return (evt) => {
				this.doCollisions(evt); 
			}
		}());
		this.feed = feed;
		this.clients = [];
		this.teamCount = {
			red: 0,
			blue: 0
		};

		this.flags = {
			red: new Flag(this.currentLevel.definition.flags.red.x, this.currentLevel.definition.flags.red.y, "Red"),
			blue: new Flag(this.currentLevel.definition.flags.blue.x, this.currentLevel.definition.flags.blue.y, "Blue")
		}

		this.world.addBody(this.flags.red.getBody());
		this.world.addBody(this.flags.blue.getBody());

		this.maxScore = maxScore;

		this.playerUpdate = this.getUpdatePlayer();
	}

	addPlayer(player){
		player.Team === "Red" ? this.teamCount.red++ : this.teamCount.blue++;
		this.clients.push(player);
		player.setSpawn(player.Team === "Red" ? this.currentLevel.redStart : this.currentLevel.blueStart);
		player.reset();
		this.world.addBody(player.physicsBody);
		this.feed.playerJoined(player);
	}

	removePlayer(player){
		player.Team === "Red" ? this.teamCount.red-- : this.teamCount.blue--;
		this.clients = this.clients.filter((index) => {
			return index.ID !== player.ID;
		});
		this.world.removeBody(player.physicsBody);
		this.feed.playerDisconnected(player);
		this.notifyDisconnect(player.ID);
	}

	smallestTeam(){
		if(this.teamCount.red > this.teamCount.blue){
			return "Blue";
		}
		return "Red";
	}

	doCollisions(evt){
		var shapeA = evt.shapeA;
		var shapeB = evt.shapeB;
		if((shapeA.collisionGroup == constants.GROUND || shapeB.collisionGroup == constants.GROUND) && (shapeA.collisionGroup == constants.PLAYER || shapeB.collisionGroup == constants.PLAYER)){
			var player = this.findPlayer(this.clients, shapeA.collisionGroup == constants.PLAYER ? shapeA.body :shapeB.body);
			if(player){
				player.jumping = false;
			}
		}
		if((shapeA.collisionGroup == constants.TRIGGER || shapeB.collisionGroup == constants.TRIGGER) && (shapeA.collisionGroup == constants.PLAYER || shapeB.collisionGroup == constants.PLAYER)){
			var player = this.findPlayer(this.clients, shapeA.collisionGroup == constants.PLAYER ? shapeA.body :shapeB.body);
			var trigger = shapeA.body.owner ? shapeA.body.owner : shapeB.body.owner;
			trigger.trigger(player);
		}
		if((shapeA.collisionGroup == constants.BULLET || shapeB.collisionGroup == constants.BULLET) && (shapeA.body.health || shapeB.body.health)){
			var destructableShape = shapeA.body.health ? shapeA.body : shapeB.body;
			destructableShape.health--;
			if(destructableShape.health == 0){
				destructableShape.owner.die();
			}
		}
		if((shapeA.collisionGroup == constants.BULLET || shapeB.collisionGroup == constants.BULLET) && (shapeA.collisionGroup == constants.PLAYER || shapeB.collisionGroup == constants.PLAYER)){
			var player = this.findPlayer(this.clients, shapeA.collisionGroup == constants.PLAYER ? shapeA.body :shapeB.body);
			var bullet = shapeA.collisionGroup == constants.BULLET ? shapeA.body :shapeB.body;
			if(player && !player.isHit){
				this.feed.playerKilled(player, bullet);
				player.isHit = true;
				if(player.hasFlag){
					player.hasFlag = false;
					if(player.Team == "Red"){
						this.flags.blue.setHome(true);
						this.notifyFlagCapture("Red");
					}else{
						this.flags.red.setHome(true);
						this.notifyFlagCapture("Blue");
					}
				}
				player.die(this.currentLevel.definition.settings.spawnTime, this.world);
			}
		}else{
			var player = this.findPlayer(this.clients, shapeB.body)
		    if(shapeA.body == this.flags.red.getBody() || shapeB.body == this.flags.red.getBody()){
		    	if(player && player.Team == "Blue" && this.flags.red.isHome()){
		    		player.hasFlag = true;
		    		this.flags.red.setHome(false);
		    		this.feed.gotFlag(player, this.flags.red);
		    	}else if(player && this.flags.red.isHome()){
		    		if(player.hasFlag){
		    			player.hasFlag = false;
		    			this.flags.blue.setHome(true);
		    			this.score.red++;
		    			this.notifyFlagCapture("Red");
		    			this.feed.captureFlag(player);
		    		}
		    	}
		    }else if(shapeA.body == this.flags.blue.getBody() || shapeB.body == this.flags.blue.getBody()){
		    	if(player && player.Team == "Red" && this.flags.blue.isHome()){
		    		player.hasFlag = true;
		    		this.flags.blue.setHome(false);
		    		this.feed.gotFlag(player, this.flags.blue);
		    	}else if(player && this.flags.blue.isHome()){
		    		if(player.hasFlag){
		    			player.hasFlag = false;
		    			this.flags.red.setHome(true);
		    			this.score.blue++;
		    			this.notifyFlagCapture("Blue");
		    			this.feed.captureFlag(player);
		    		}
		    	}
		    }
		}
	}

	getPlayers(){
		return this.clients;
	}

	update(delta){
		this.world.step(delta);
		var levelInfo = this.currentLevel.levelUpdateInfo();
		var dynamicLevelInfo = this.currentLevel.levelDynamicUpdateInfo();
		let updateData = this.updateInfo();
		for (var i = this.clients.length - 1; i >= 0; i--) {
			this.clients[i].update(this.currentLevel.definition.settings.spawnTime, this.world);
			if(this.clients[i] && this.clients[i].skt){
				this.clients[i].skt.emit("update", updateData);
				if(this.clients[i] && this.clients[i].skt){
					this.clients[i].skt.emit("levelUpdate", dynamicLevelInfo);
					if(this.clients[i] && !this.clients[i].staticObjectsSent){
						this.clients[i].skt.emit("levelUpdate", levelInfo);
						this.clients[i].staticObjectsSent = true;
					}
				}
			}
		};
	}

	updateInfo(){
		var clientInfo = [];
		for (var i = this.clients.length - 1; i >= 0; i--) {
			clientInfo.push({
				ID: this.clients[i].ID,
				Team: this.clients[i].Team,
				Data: {
					position:{
						x:this.clients[i].physicsBody.position[0],
						y:this.clients[i].physicsBody.position[1]
					},
					hasFlag: this.clients[i].hasFlag,
					rotation:this.clients[i].physicsBody.angle,
					avatar: this.currentLevel.definition.playerAvatars[this.clients[i].Team]
				},
				Score: this.score,
				Name: this.clients[i].name,
				Dead: this.clients[i].isHit,
				TimeRemaining: this.timeRemaining(),
				Bullets: this.getBulletPositions(this.clients[i].bullets)
			});
		};
		return clientInfo;
	}

	findPlayer(source, physicsObject) {
		for (var i = 0; i < source.length; i++) {
			if (source[i].physicsBody === physicsObject) {
			 	return source[i];
			}
		}
	}

	notifyDisconnect(clientID){
		for (var i = this.clients.length - 1; i >= 0; i--) {
			this.clients[i].skt.emit("clientDisconnected", clientID);
		};	
	}

	notifyFlagCapture(team){
		for (var i = this.clients.length - 1; i >= 0; i--) {
			this.clients[i].skt.emit("flagCaptured", team);
		};	
	}

	notifyRoundWinner(team){
		for (var i = this.clients.length - 1; i >= 0; i--) {
			this.clients[i].skt.emit("roundComplete", team);
		};	
	}

	notifyBulletRemoved(id){
		for (var i = this.clients.length - 1; i >= 0; i--) {
			this.clients[i].skt.emit("bulletRemoved", id);
		};	
	}

	isComplete(){
		if(this.timeExpired() || this.score.blue >= this.maxScore || this.score.red >= this.maxScore){
			if(this.score.blue > this.score.red){
				this.notifyRoundWinner("Blue");
			}else if(this.score.red > this.score.blue){
				this.notifyRoundWinner("Red");
			}else{
				this.notifyRoundWinner("Draw");
			}
			return true;
		}
		return false;
	}

	timeRemaining(){
		var t = this.round_end_time - Date.now();
		var seconds = Math.floor( (t/1000) % 60 );
	  	var minutes = Math.floor( (t/1000/60) % 60 );
	  	return ('0' + minutes).slice(-2) + " : " + ('0' + seconds).slice(-2);
	}

	timeExpired(){
		var t = this.round_end_time - Date.now();
		if(t <= 0){
			return true;
		}
		return false;
	}

	getUpdatePlayer(){
		return (player, update) => {
			//this.updatePlayer.prototype.bind(self);
			this.updatePlayer(player, update);
		}
	}

	updatePlayer(player, update){
		if(!player.isHit){
			player.pressed = update.pressed;
			player.mousePressed = update.mousePressed;
			if(player.isDown(directions.LEFT) && player.physicsBody.position[0] > 0) player.physicsBody.velocity[0] = -100;
			if(player.isDown(directions.RIGHT) &&  player.physicsBody.position[0] < constants.SCREEN.WIDTH) player.physicsBody.velocity[0] = 100;
			if((player.isDown(directions.UP) || player.isDown(directions.SPACE))  && player.physicsBody.position[1] < constants.SCREEN.HEIGHT && !player.jumping){
				player.physicsBody.velocity[1] = 100;
				player.jumping = true;
			}
			if(player.isDown(directions.DOWN) && player.physicsBody.position[1] > 0) player.physicsBody.velocity[1] = -500;

			if(!player.isDown(directions.LEFT) && !player.isDown(directions.RIGHT)){
				player.physicsBody.velocity[0] = 0;
			}

			if(player.isPressed(mouseButtons.LEFT) && player.bulletFired === false){
				var angle = player.mousePressed[mouseButtons.LEFT].angle;
				var bullet = new Bullet(this.currentLevel.getEntityID(), player.physicsBody.position[0]+-Math.cos(angle) * 10, player.physicsBody.position[1]+Math.sin(angle) * 10, 200, angle, 3000);
				this.world.addBody(bullet.physicsBody);
				bullet.physicsBody.owner = player;
				player.bullets.push(bullet);
				player.bulletFired = true;
				setTimeout(() => {
					player.bullets = player.bullets.filter(function(index) {
						return index !== bullet;
					});
					this.world.removeBody(bullet.physicsBody);
					this.notifyBulletRemoved(bullet.ID);
				}, bullet.range);
			}else if(!player.isPressed(mouseButtons.LEFT)){
				if(player.reloading === false){
					setTimeout(() => {
						player.bulletFired = false;
						player.reloading = false;
					}, 200);
					player.reloading = true;
				}
			}
		}
	}

	getBulletPositions(bullets){
		var bulletPositions = [];
		for (var i = bullets.length - 1; i >= 0; i--) {
			bulletPositions.push({
				id: bullets[i].ID,
				x: bullets[i].physicsBody.position[0],
				y: bullets[i].physicsBody.position[1]
			})
		};

		return bulletPositions;
	}
}
module.exports = Round;
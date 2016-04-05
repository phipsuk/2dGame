"use strict";
const p2 = require('p2');
const constants = require("../constants.js");
class PowerUp{
	constructor(entityID, levelEntity, world){
		var body = new p2.Body({
			mass: levelEntity.mass,
			position: [this.getRandomArbitrary(600, 1300),1000]
		});
		var shape = new p2[levelEntity.shape](levelEntity.shapeOptions);
		shape.collisionGroup = constants.POWER;
		shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER | constants.POWER;
		body.addShape(shape);
		this.ID = entityID;
		this.physicsBody = body;
		this.physicsBody.owner = this;
		this.initialHealth = 1;
		this.physicsBody.health = this.initialHealth;
		this.world = world;
		for(let prop in levelEntity){
			this[prop]=levelEntity[prop];
		}
		this.world.addBody(this.physicsBody);
	}

	update(){
	}

	die(){
		this.health = 0;
		this.world.removeBody(this.physicsBody);
		this.addSelf();
	}

	addSelf(){
		setTimeout(() => {
			console.log("Maybe spawning " + this.type);
			if(this.chance > Math.random()){
				this.world.addBody(this.physicsBody);
				this.physicsBody.position[0] = this.getRandomArbitrary(600, 1300);
				this.physicsBody.position[1] = 1000;
				this.physicsBody.health = this.initialHealth;
				this.health = this.physicsBody.health;
				this.physicsBody.velocity[0] = 0;
				this.physicsBody.velocity[1] = 0;
				this.physicsBody.setZeroForce();
			}else{
				this.addSelf();
			}
		}, this.getRandomArbitrary(1000, 15000));
	}

	activate(player){
		player.addPowerUp(this);
		this.die();
	}

	getRandomArbitrary(min, max) {
		return Math.random() * (max - min) + min;
	}
}

module.exports = PowerUp;
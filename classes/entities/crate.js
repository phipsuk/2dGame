"use strict";
class Crate{
	constructor(entityID, levelEntity, body, world){
		this.ID = entityID;
		this.physicsBody = body;
		this.physicsBody.owner = this;
		this.initialHealth = levelEntity.health;
		this.initialPosition = {
			x: levelEntity.position.x,
			y: levelEntity.position.y
		};
		this.world = world;
		for(let prop in levelEntity){
			this[prop]=levelEntity[prop];
		}
	}

	update(){
	}

	die(){
		this.physicsBody.position[0] = this.initialPosition.x;
		this.physicsBody.position[1] = this.initialPosition.y;
		this.physicsBody.health = this.initialHealth;
		this.physicsBody.velocity[0] = 0;
		this.physicsBody.velocity[1] = 0;
		this.physicsBody.setZeroForce();
	}
}

module.exports = Crate;
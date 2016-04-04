"use strict";
class PowerUp{
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
		this.health = 0;
		this.world.removeBody(this.physicsBody);
		setTimeout(() => {
			this.world.addBody(this.physicsBody);
			this.physicsBody.position[0] = this.initialPosition.x;
			this.physicsBody.position[1] = this.initialPosition.y;
			this.physicsBody.health = this.initialHealth;
			this.health = this.physicsBody.health;
			this.physicsBody.velocity[0] = 0;
			this.physicsBody.velocity[1] = 0;
			this.physicsBody.setZeroForce();
		}, 1000);
	}

	activate(player){
		if(this.effects){
			for (var i = 0; i < this.effects.length; i++) {
				let effect = this.effects[i];
				player.addEffect(effect);
			}
		}
	}
}

module.exports = Crate;
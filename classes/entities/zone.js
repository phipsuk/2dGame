"use strict";
class Zone{
	constructor(entityID, levelEntity, body){
		this.ID = entityID;
		this.physicsBody = body;
		this.complete = false;
		for(let prop in levelEntity){
			this[prop]=levelEntity[prop];
		}
		this.physicsBody.mass = 0; //Zones are static
		this.physicsBody.owner = this;
	}

	update(){

	}

	activate(player){
		if(this.effects){
			for (var i = 0; i < this.effects.length; i++) {
				let effect = this.effects[i];
				player.addEffect(effect);
			}
		}
	}

	deactivate(player){
		if(this.effects){
			for (var i = 0; i < this.effects.length; i++) {
				let effect = this.effects[i];
				player.removeEffect(effect);
			}
		}
	}
}

module.exports = Zone;
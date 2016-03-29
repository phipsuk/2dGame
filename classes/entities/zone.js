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
		this.lastActivated = null;
		if(!this.interval){
			this.interval = 1000;
		}
	}

	update(){

	}

	trigger(player){
		if(this.lastActivated === null || this.lastActivated + this.interval < Date.now()){
			this.lastActivated = Date.now();
			for (var i = 0; i < this.effects.length; i++) {
				let effect = this.effects[i];
				
			}
		}
	}
}

module.exports = Zone;
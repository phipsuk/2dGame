"use strict";
class Slider{
	constructor(entityID, levelEntity, body){
		this.ID = entityID;
		this.physicsBody = body;
		this.complete = false;
		for(let prop in levelEntity){
			//if (this.hasOwnProperty(prop)) {
				this[prop]=levelEntity[prop];
			//}
		}
	}

	update(){
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
	}

	triggerBehaviour(){
		this.complete = false;
		this.physicsBody.velocity[0] = this.speedX;
		this.physicsBody.velocity[1] = this.speedY;
	}
}

module.exports = Slider;
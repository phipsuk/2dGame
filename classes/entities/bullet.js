"use strict";
const p2 = require('p2');
const constants = require("../constants.js");
class Bullet{
	constructor(id, x, y, speed, angle, range){
		this.ID = id;
		this.range = range;
		this.physicsBody = new p2.Body({
			mass: 10,
			position: [x,y],
			velocity: [-Math.cos(angle) * speed, Math.sin(angle) * speed]
		})

		this.physicsBody.damage = 15;
		this.physicsBody.active = true;
		this.physicsBody.ID = id;
		this.physicsBody.owner = this;

		var shape = new p2.Circle({ radius: 1 });

		shape.collisionGroup = constants.BULLET;
		shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;

		this.physicsBody.addShape(shape);
	}
}
module.exports = Bullet;
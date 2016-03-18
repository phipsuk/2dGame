"use strict";
const constants = require("./constants.js");
class Bullet{
	constructor(id, x, y, speed, angle, range){
		this.ID = id;
		this.range = range;
		this.physicsBody = new p2.Body({
			mass: 10,
			position: [x,y],
			velocity: [-Math.cos(angle) * speed, Math.sin(angle) * speed]
		})

		var shape = new p2.Circle({ radius: 2 });

		shape.collisionGroup = constants.BULLET;
		shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;

		body.addShape(shape);
	}
}
module.exports = Bullet;
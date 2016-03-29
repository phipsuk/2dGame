"use strict";
const p2 = require('p2');
const constants = require("./constants.js");
class World{
	constructor(){
		this.physics = new p2.World( { gravity:[0, -100] } );
		this.physics.setGlobalStiffness(1e8);
		this.physics.setGlobalRelaxation(10);
		this.setBoundaries(this.physics);
	}

	setBoundaries(world){
		// Create an infinite ground plane.
		var groundBody = new p2.Body({
			mass: 0, // Setting mass to 0 makes the body static
			position: [0,-5]
		});
		var groundShape = new p2.Plane();
		groundBody.addShape(groundShape);
		groundShape.collisionGroup = constants.GROUND;
		groundShape.collisionMask = constants.PLAYER | constants.BULLET | constants.GROUND | constants.OTHER;
		world.addBody(groundBody);
	}

	step(delta){
		this.physics.step(delta);
	}

	addBody(body){
		this.physics.addBody(body);
	}

	on(event, func){
		this.physics.on(event, func);
	}

	removeBody(body){
		this.physics.removeBody(body);
	}
}

module.exports = World;
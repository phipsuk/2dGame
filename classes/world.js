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
			position: [0,0]
		});
		var groundShape = new p2.Plane();
		groundBody.addShape(groundShape);
		groundShape.collisionGroup = constants.GROUND;
		groundShape.collisionMask = constants.PLAYER | constants.BULLET | constants.GROUND | constants.OTHER;
		world.addBody(groundBody);

		var wallBody = new p2.Body({
			mass: 0, // Setting mass to 0 makes the body static
			position: [-5,0],
			angle:4.71238898
		});
		var wallShape = new p2.Plane();
		wallShape.collisionGroup = constants.GROUND;
		wallShape.collisionMask = constants.PLAYER | constants.BULLET | constants.GROUND | constants.OTHER;
		wallBody.addShape(wallShape);
		world.addBody(wallBody);

		var wallBody = new p2.Body({
			mass: 0, // Setting mass to 0 makes the body static
			position: [800,0],
			angle:1.57079633
		});
		var wallShape = new p2.Plane();
		wallShape.collisionGroup = constants.GROUND;
		wallShape.collisionMask = constants.PLAYER | constants.BULLET | constants.GROUND | constants.OTHER;
		wallBody.addShape(wallShape);
		world.addBody(wallBody);

		var ceilingBody = new p2.Body({
			mass: 0, // Setting mass to 0 makes the body static
			position: [0,600],
			angle:3.14159265
		});
		var ceilingShape = new p2.Plane();
		ceilingShape.collisionGroup = constants.GROUND;
		ceilingShape.collisionMask = constants.PLAYER | constants.BULLET | constants.GROUND | constants.OTHER;
		ceilingBody.addShape(ceilingShape);
		world.addBody(ceilingBody);
	}

	addBody(body){
		this.physics.addBody(body);
	}

	on(event, func){
		this.physics.on(event, func);
	}
}

module.exports = World;
"use strict";
const constants = require("./constants.js");
const p2 = require('p2');
class Flag{
	constructor(x,y){
		this.body = new p2.Body({
						mass:0,
						position: [x,0]
					});
		var bodyShape = new p2.Box({
						width:15,
						height:40,
						sensor:true
					});

		bodyShape.collisionGroup = constants.FLAG;

		bodyShape.collisionMask = constants.PLAYER;

		this.body.addShape(bodyShape);

		this.home = true;
	}

	getBody(){
		return this.body;
	}

	isHome(){
		return this.home;
	}

	setHome(home){
		this.home = home;
	}
}

module.exports = Flag;
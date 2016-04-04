"use strict";
const constants = require("./constants.js");
const p2 = require('p2');
class Flag{
	constructor(x, y, team){
		this.body = new p2.Body({
						mass:0,
						position: [x,y]
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

		this.Team = team;

		this.heldBy = null;
	}

	getHeldBy(){
		if(this.heldBy !== null && this.heldBy.hasFlag === false){
			this.heldBy = null;
		}
		return this.heldBy;
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
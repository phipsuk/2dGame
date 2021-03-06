"use strict";
const p2 = require('p2');
const constants = require("./constants.js");
class Player{
	constructor(socket, team, id){
		this.skt = socket;
		this.ID = id;
		this.Team = team;
		this.Data = {position:{x:0,y:0}};
		this.pressed = {};
		this.mousePressed = {};
		this.bullets = [];
		this.physicsBody = createPlayerBody(0,0);
		this.hasFlag = false;
		this.bulletFired = false;
		this.reloading = false;
		this.jumping = false;
		this.isHit = false;
		this.staticObjectsSent = false;
		this.name = "unnamed";
		this.o2 = 100;
		this.health = 100;
		this.lastHealthDepletion = null;
		this.interval = 1000;
		this.lastAppliedEffectTimes = {};
		this.effectList = [];
		this.activePowerUps = [];
		this.speed = 100;
	}

	isDown(keyCode){
		return this.pressed[keyCode];
	}

	isPressed(mouseButton){
		return this.mousePressed[mouseButton];
	}

	setPosition(x,y){
		this.physicsBody.position[0] = x;
		this.physicsBody.position[1] = y;
	}

	setSpawn(position){
		this.spawn = position;
	}

	reset(){
		this.physicsBody = createPlayerBody(0,0);
		this.hasFlag = false;
		this.isHit = false;
		this.o2 = 100;
		this.health = 100;
		this.setPosition(this.spawn.x, this.spawn.y);
		this.effectList = [];
	}

	die(spawnTime, world){
		this.isHit = true;
		this.health = 0;
		setTimeout(() => {
				world.removeBody(this.physicsBody);
				this.reset();
				world.addBody(this.physicsBody);
			}, spawnTime);
	}

	update(spawnTime, world){
		if(this.health > 100){
			this.health = 100;
		}
		if(this.o2 > 100){
			this.o2 = 100;
		}

		if(this.health < 0){
			this.health = 0;
		}
		if(this.o2 < 0){
			this.o2 = 0;
		}
		if(!this.isHit){
			if(this.health <= 0){
				this.die(spawnTime, world);
			}
			if(this.o2 <= 0){
				if(this.lastHealthDepletion === null || this.lastHealthDepletion + this.interval < Date.now()){
					this.lastHealthDepletion = Date.now();
					this.health -= 10;
				}
			}
		}
	}

	addPowerUp(powerup){
		if(!this.hasPowerUp(powerup.type)){
			this.activePowerUps.push(powerup.type);
			
			if(powerup.effects){
				for (var i = 0; i < powerup.effects.length; i++) {
					let effect = powerup.effects[i];
					this.applyEffectDirectly(effect);
					if(powerup.duration){
						effect.timer = setTimeout(() => {
							effect.effect = -effect.effect;
							this.applyEffectDirectly(effect);
							effect.effect = -effect.effect;
							this.removePowerUp(powerup.type);
						}, powerup.duration);
					}
				}
			}
		}
	}

	hasPowerUp(effect){
		return this.activePowerUps.indexOf(effect) === -1 ? false : true;
	}

	removePowerUp(effect){
		this.activePowerUps = this.activePowerUps.filter((object) => {
			return object !== effect;
		});
	}

	addEffect(effect){
		for (var i = 0; i < this.effectList.length; i++) {
			let e = this.effectList[i];
			if(e.property === effect.property){
				let computedEffect = e.effect + effect.effect;
				if(computedEffect !== 0){
					this.effectList.push({
						"interval": Math.min(e.interval, effect.interval),
						"property": e.property,
						"effect": computedEffect,
						"originalValue": this[e.property],
						"type": e.type
					});
					return;
				}
			}
		}
		this.effectList.push(effect);
	}

	removeEffect(effect){
		this.effectList = this.effectList.filter((object) => {
			return object.property !== effect.property;
		});
	}

	applyEffectDirectly(effect){
		this[effect.property] += effect.effect;
	}

	applyEffects(baseEffects){
		let activeEffects = this.consolodateEffects(baseEffects, this.effectList);
		for (var i = 0; i < activeEffects.length; i++) {
			let activeEffect = activeEffects[i];
			if(typeof(this.lastAppliedEffectTimes[activeEffect.property]) === "undefined" || this.lastAppliedEffectTimes[activeEffect.property] + activeEffect.interval < Date.now()){
				this.lastAppliedEffectTimes[activeEffect.property] = Date.now();
				this.applyEffectDirectly(activeEffect);
			}
		}
	}

	consolodateEffects(baseEffects, effects){
		let activeEffects = [];
		for (var i = 0; i < effects.length; i++) {
			let effect = effects[i];
			let added = false;
			for (var i = 0; i < baseEffects.length; i++) {
				let baseEffect = baseEffects[i];
				if(baseEffect.property === effect.property){
					let computedEffect = baseEffect.effect + effect.effect;
					if(computedEffect !== 0){
						activeEffects.push({
							"interval": Math.min(baseEffect.interval, effect.interval),
							"property": baseEffect.property,
							"effect": computedEffect
						});
					}
					added = true;
				}
			}
			if(!added){
				activeEffects.push(effect);
			}
		}

		for (var i = 0; i < baseEffects.length; i++) {
			let effect = baseEffects[i];
			let added = false;
			for (var i = 0; i < activeEffects.length; i++) {
				let activeEffect = activeEffects[i];
				if(activeEffect.property === effect.property){
					added = true;
				}
			}
			if(!added){
				activeEffects.push(effect);
			}
		}

		return activeEffects;
	}

	isDead(){
		return this.health <= 0;
	}
}

var createPlayerBody = function(x,y){
	var playerBody = new p2.Body({
		mass:1,
		position: [x, y]
	});

	var playerShape = new p2.Box({
		width:20,
		height:20
	});

	playerShape.collisionGroup = constants.PLAYER;

	playerShape.collisionMask = constants.PLAYER | constants.FLAG | constants.GROUND | constants.OTHER | constants.BULLET | constants.TRIGGER | constants.ZONE | constants.POWER;

	playerBody.addShape(playerShape);

	return playerBody;
}

module.exports = Player;
"use strict";
const fs = require("fs");
const p2 = require('p2');
const constants = require("./constants.js");
const Slider = require("./entities/slider.js");
const Crate = require("./entities/crate.js");
const Zone = require("./entities/zone.js");

class Level{
	constructor(name, world){
		this.entityID = 0;
		this.world = world;
		this.entities = this.loadLevelEntities(name, this.world);
	}

	levelDynamicUpdateInfo(){
		var updateInfo = {
			entities: []
		};
		for (var i = this.entities.dynamic.length - 1; i >= 0; i--) {
			var entity = this.entities.dynamic[i];
			entity.update();
			if(!entity.hidden){
				updateInfo.entities.push({
					ID:entity.ID,
					position:{
						x:entity.physicsBody.position[0],
						y:entity.physicsBody.position[1]
					},
					rotation: entity.physicsBody.angle,
					type:entity.type,
					nonTileable: entity.nonTileable,
					health: entity.health,
					shape: entity.shape,
					shapeOptions: entity.shapeOptions
				});
			}
		};
		return updateInfo;
	};

	levelUpdateInfo(){
		var updateInfo = {
			entities: [],
			definition: this.definition
		};
		for (var i = this.entities.static.length - 1; i >= 0; i--) {
			var entity = this.entities.static[i];
			if(!entity.hidden){
				updateInfo.entities.push({
					ID:entity.ID,
					position:{
						x:entity.physicsBody.position[0],
						y:entity.physicsBody.position[1]
					},
					type:entity.type,
					shape: entity.shape,
					shapeOptions: entity.shapeOptions,
				});
			}
		};
		return updateInfo;
	};

	getEntityID(){
		return this.entityID++;
	}

	getEffects(){
		return this.definition.effects;
	}

	loadLevelEntities(name, world){
		var levelDefinition = JSON.parse(fs.readFileSync(__dirname + "/../level/" + name + ".json", 'utf8'));
		this.definition = levelDefinition;
		this.redStart = levelDefinition.playerSpawns.red;
		this.blueStart = levelDefinition.playerSpawns.blue;
		var levelEntities = {
			static:[],
			dynamic:[]
		};
		for (var i = levelDefinition.entities.length - 1; i >= 0; i--) {
			var levelEntity = levelDefinition.entities[i];
			var body = new p2.Body({
				mass: levelEntity.mass,
				position: [levelEntity.position.x,levelEntity.position.y]
			});
			var shape = new p2[levelEntity.shape](levelEntity.shapeOptions);
			body.addShape(shape);
			if(levelEntity.type === "wall"){
				shape.collisionGroup = constants.OTHER;
				shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;
				levelEntities.static.push({
					ID:this.getEntityID(),
					physicsBody: body,
					key: levelEntity.key,
					type: levelEntity.type,
					shape: levelEntity.shape,
					shapeOptions: levelEntity.shapeOptions,
					hidden: levelEntity.hidden
				});
			}else if(levelEntity.type === "floor"){
				shape.collisionGroup = constants.GROUND;
				shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;
				levelEntities.static.push({
					ID:this.getEntityID(),
					physicsBody: body,
					key: levelEntity.key,
					type: levelEntity.type,
					shape: levelEntity.shape,
					shapeOptions: levelEntity.shapeOptions,
					hidden: levelEntity.hidden
				});
			}else if(levelEntity.type === "slider"){
				shape.collisionGroup = constants.GROUND;
				shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;
				levelEntities.dynamic.push(new Slider(this.getEntityID(), levelEntity, body));
			}else if(levelEntity.type === "crate"){
				shape.collisionGroup = constants.OTHER;
				shape.collisionMask = constants.PLAYER | constants.GROUND | constants.BULLET | constants.OTHER;
				if(levelEntity.health){
					body.health = levelEntity.health;
				}
				levelEntities.dynamic.push(new Crate(this.getEntityID(), levelEntity, body, world));
			}else if(levelEntity.type === "trigger"){
				shape.collisionGroup = constants.TRIGGER;
				shape.collisionMask = constants.PLAYER;
				body.mass = 0;
				var triggerKey = levelEntity.key;
				var entity = {
					ID:this.getEntityID(),
					physicsBody: body,
					type: levelEntity.type,
					shape: levelEntity.shape,
					shapeOptions: levelEntity.shapeOptions,
					initialHealth: levelEntity.health,
					triggerTimeInterval: levelEntity.interval,
					key: triggerKey,
					initialPosition: {
						x: levelEntity.position.x,
						y: levelEntity.position.y
					},
					lastTriggered: null,
					trigger: function(){
						if(this.lastTriggered === null || this.lastTriggered + this.triggerTimeInterval < Date.now()){
							this.lastTriggered = Date.now();
							var items = findByKey(levelEntities.dynamic, this.key);
							for (var i = items.length - 1; i >= 0; i--) {
								var item = items[i];
								if(item.triggerBehaviour){
									item.triggerBehaviour();
								}
							};
						}
					}
				};
				body.owner = entity;
				levelEntities.static.push(entity);
			}else if(levelEntity.type === "zone"){
				shape.collisionGroup = constants.ZONE;
				shape.collisionMask = constants.PLAYER;
				shape.sensor = true;
				levelEntities.static.push(new Zone(this.getEntityID, levelEntity, body, world));
			}
			world.addBody(body);
		};
		return levelEntities;
	}
}

function findByKey(source, key) {
  var items = [];
  for (var i = 0; i < source.length; i++) {
    if (source[i].key === key) {
      items.push(source[i]);
    }
  }
  return items;
}

module.exports = Level;
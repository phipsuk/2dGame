function Player(stage, Team, id, name){
	var graphics = new PIXI.Sprite.fromImage("/images/flag_" + Team + ".png");

	var playerColour = Team == "Red" ? COLOURS.RED : COLOURS.BLUE;

	var SCALE = 0.5;

	graphics.position.x = 0;
	graphics.position.y = 0;
	graphics.scale.x = SCALE;
	graphics.scale.y = SCALE;

	var nameText = new PIXI.Text(name, {font:"10px " + FONT, fill:playerColour});

	var player = {
		ID:ClientID,
		graphics:graphics,
		avatarLocation: "",
		pressed: {},
		mousePressed: {},
		LEFT:65,
		RIGHT:68,
		UP:87,
		DOWN:83,
		SPACE:32,
		JUMPING:false,
		JUMPCOUNT:0,
		FACELEFT: "LEFT",
		FACERIGHT: "RIGHT",
		team:Team,
		name: name,
		hasFlag:false,
		health: 100,
		o2: 100,
		nameText: nameText,
		lastExplosionValue: false,
		facing: Team == "Red" ? this.FACERIGHT : this.FACELEFT,
		lowHealth: function(){
			var low = this.health < 25 ? true : false;
			if(this.particles.lowHealthBlood === null && low){
				this.particles.lowHealthBlood = new BleedingParticles(stage, true);
			}else if(this.particles.lowHealthBlood !== null && !low){
				this.particles.lowHealthBlood.emitter.cleanup();
				this.particles.lowHealthBlood.emitter.destroy();
				var self = this;
				setTimeout(function(){
					self.particles.lowHealthBlood = null;
				}, 100);
			}
			return low;
		},
		particles: {
			gibs: null,
			blood: null,
			lowHealthBlood: null
		},
		powerupParticles: {

		},
		isDown: function(keyCode){
			return this.pressed[keyCode];
		},
		onKeyDown: function(event){
			this.pressed[event.keyCode] = true;
			if(this.isDown(this.LEFT)){
				this.facing = this.FACELEFT;
				this.graphics.scale.x = SCALE;
				this.graphics.anchor.x = 0;
			}else if(this.isDown(this.RIGHT)){
				this.facing = this.FACERIGHT;
				this.graphics.scale.x = -SCALE;
				this.graphics.anchor.x = 1;
			}
		},
		onKeyUp: function(event){
			delete this.pressed[event.keyCode];
		},
		getXPos: function(inX){
			return inX - (this.graphics.width * SCALE) + 15;
		},
		getYPos: function(inY){
			return (-inY - ((this.graphics.height * SCALE) - 10)) + SCREEN.HEIGHT;
		},
		getWidth: function(inWidth){
			return inWidth * SCALE;
		},
		getHeight: function(inHeight){
			return inHeight * SCALE;
		},
		update: function(player){
			self.name = player.Name;
			this.health = player.Data.health;
			this.o2 = player.Data.o2;
			if(player.Dead){
				if(this.particles.gibs === null){
					this.particles.gibs = new GibsParticles(stage);
					stage.removeChild(this.graphics);
					stage.removeChild(nameText);
				}
				if(this.particles.blood === null){
					this.particles.blood = new BloodParticles(stage);
				}
				if(this.particles.lowHealthBlood && this.particles.lowHealthBlood.emitter){
					this.particles.lowHealthBlood.cleanup();
				}
				nameText.text = "DEAD";
				this.graphics.scale.y = -SCALE;
				this.graphics.anchor.y = 1;
			}else{
				if(this.particles.gibs !== null){
					this.particles.gibs = null;
					stage.addChild(this.graphics);
					stage.addChild(nameText);
				}
				if(this.particles.blood !== null){
					this.particles.blood = null;
				}
				nameText.text = this.name;
				this.graphics.scale.y = SCALE;
				this.graphics.anchor.y = 0;
			}
			this.graphics.position.x = this.getXPos(player.Data.position.x);
			this.graphics.position.y = this.getYPos(player.Data.position.y);
			if(this.graphics.position.x + nameText.width > SCREEN.WIDTH - 80){
				nameText.position.x = player.Data.position.x - nameText.width - 5;
			}else{
				nameText.position.x = player.Data.position.x + 5;
			}
			nameText.position.y = -player.Data.position.y + SCREEN.HEIGHT - 35;
			if(this.particles.gibs){
				this.particles.gibs.update(this.graphics.position.x + (this.getWidth(this.graphics.width)/2), this.graphics.position.y);
			}
			if(this.particles.blood){
				this.particles.blood.update(this.graphics.position.x + (this.getWidth(this.graphics.width)/2), this.graphics.position.y + this.getHeight(this.graphics.height));
			}
			if(this.lowHealth()){
				this.particles.lowHealthBlood.update(this.graphics.position.x + (this.getWidth(this.graphics.width)/2), this.graphics.position.y + (this.getHeight(this.graphics.height)/2));
			}

			for (var i = 0; i < player.Data.powerups.length; i++) {
				var powerup = player.Data.powerups[i];
				if(powerup){
					if(!this.powerupParticles[powerup]){
						switch(powerup){
							case "speed":
								this.powerupParticles[powerup] = new DustParticles(stage, true);
							break;
						}
					}
				}
			}

			for (var key in this.powerupParticles) {
				if(this.powerupParticles.hasOwnProperty(key)){
					var particle = this.powerupParticles[key];
					if(player.Data.powerups.indexOf(key) === -1){
						particle.emitter.cleanup();
						var self2 = this;
						setTimeout(function(){
							particle.cleanup();
							delete self2.powerupParticles[key];
						}, 100);
					}
					if(particle instanceof DustParticles){
						particle.update(this.graphics.position.x + (this.getWidth(this.graphics.width)/2), this.graphics.position.y + this.getHeight(this.graphics.height), this.facing == this.FACELEFT ? 160 : 0);
					}
				}
			}
		},
		fireWeapon: function(event){
			this.mousePressed[0] = {
				x:this.graphics.position.x,
				y:this.graphics.position.y,
				angle: this.facing === this.FACELEFT ? -0.02102551443773825 : -3.1086918530174907
			};
		},
		onMouseDown: function(event){
			var angle = Math.atan2(this.graphics.position.y - event.layerY, this.graphics.position.x - event.layerX);
			this.mousePressed[event.button] = {
				x: event.x,
				y: event.y,
				angle: angle
			};
		},
		onMouseUp: function(event){
			delete this.mousePressed[event.button];
		},
		setAvatar: function(avatar, stage){
			if(this.avatarLocation != avatar){
				stage.removeChild(this.graphics)
				this.graphics = PIXI.Sprite.fromImage("/images/" + avatar);

				this.graphics.position.x = 0;
				this.graphics.position.y = 0;
				this.graphics.scale.x = SCALE;
				this.graphics.scale.y = SCALE;

				this.avatarLocation = avatar;
				stage.addChild(this.graphics);
			}
		}
	};

	stage.addChild(graphics);
	stage.addChild(nameText);

	return player;
}
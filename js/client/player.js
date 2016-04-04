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
				//this.particles.lowHealthBlood = new BloodParticles(stage, true);
			}else if(this.particles.lowHealthBlood !== null && !low){
				this.particles.lowHealthBlood = null;
			}
			return low;
		},
		particles: {
			gibs: null,
			blood: null,
			lowHealthBlood: null
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
		update: function(x, y, dead, name, o2, health){
			self.name = name;
			this.health = health;
			this.o2 = o2;
			if(dead){
				if(this.particles.gibs === null){
					this.particles.gibs = new GibsParticles(stage);
					stage.removeChild(this.graphics);
					stage.removeChild(nameText);
				}
				if(this.particles.blood === null){
					this.particles.blood = new BloodParticles(stage);
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
			this.graphics.position.x = x - (this.graphics.width/2) + 4.8;
			this.graphics.position.y = coordinateConverter(y, SCREEN.HEIGHT - (this.graphics.height/2) - 8.4);
			if(this.graphics.position.x + nameText.width > SCREEN.WIDTH - 80){
				nameText.position.x = x - nameText.width - 5;
			}else{
				nameText.position.x = x + 5;
			}
			nameText.position.y = y + SCREEN.HEIGHT - 35;
			if(this.particles.gibs){
				this.particles.gibs.update(this.graphics.position.x + (this.graphics.width/2), this.graphics.position.y);
			}
			if(this.particles.blood){
				this.particles.blood.update(this.graphics.position.x + (this.graphics.width/2), this.graphics.position.y + this.graphics.height);
			}
			if(this.lowHealth()){
				//this.particles.lowHealthBlood.update(this.graphics.position.x + (this.graphics.width/2), this.graphics.position.y);
			}
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
				this.graphics = new PIXI.Sprite.fromImage("/images/" + avatar);

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
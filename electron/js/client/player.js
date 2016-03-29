function Player(stage, Team, id, name){
	var graphics = new PIXI.Sprite.fromImage("/images/flag_" + Team + ".png");

	var playerColour = Team == "Red" ? 0xFF0000 : 0x0000FF;

	graphics.position.x = 0;
	graphics.position.y = 0;
	graphics.scale.x = 0.1;
	graphics.scale.y = 0.1;

	var nameText = new PIXI.Text(name, {font:"10px Arial", fill:playerColour});

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
		team:Team,
		name: name,
		hasFlag:false,
		nameText: nameText,
		isDown: function(keyCode){
			return this.pressed[keyCode];
		},
		onKeyDown: function(event){
			this.pressed[event.keyCode] = true;
		},
		onKeyUp: function(event){
			delete this.pressed[event.keyCode];
		},
		update: function(x, y, dead, name){
			self.name = name;
			if(dead){
				nameText.text = "DEAD";
			}else{
				nameText.text = this.name;
			}
			this.graphics.position.x = x;
			this.graphics.position.y = coordinateConverter(y, 600 - this.graphics.height);
			if(this.graphics.position.x + nameText.width > 750){
				nameText.position.x = x - nameText.width - 5;
			}else{
				nameText.position.x = x + 5;
			}
			nameText.position.y = y + 575;
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
				this.graphics.scale.x = 0.1;
				this.graphics.scale.y = 0.1;

				this.avatarLocation = avatar;
				stage.addChild(this.graphics);
			}
		}
	};

	stage.addChild(graphics);
	stage.addChild(nameText);

	return player;
}
function Player(Team, stage, name){
	var graphics = new PIXI.Graphics();

	var playerColour = Team == "Red" ? 0xFF0000 : 0x0000FF;

	graphics.lineStyle(2, playerColour, 1);
	graphics.beginFill(playerColour);
	graphics.drawRect(0, 590, 10, 10);
	graphics.endFill();

	var nameText = new PIXI.Text(name, {font:"10px Arial", fill:playerColour});

	var player = {
		ID:ClientID,
		graphics:graphics,
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
		isDown: function(keyCode){
			return this.pressed[keyCode];
		},
		onKeyDown: function(event){
			this.pressed[event.keyCode] = true;
		},
		onKeyUp: function(event){
			delete this.pressed[event.keyCode];
		},
		update: function(x, y, dead){
			if(dead){
				nameText.text = "DEAD";
			}else{
				nameText.text = this.name;
			}
			this.graphics.position.x = x;
			this.graphics.position.y = y;
			if(this.graphics.position.x + nameText.width > 750){
				nameText.position.x = x - nameText.width - 5;
			}else{
				nameText.position.x = x + 5;
			}
			nameText.position.y = y + 575;
		},
		onMouseDown: function(event){
			var angle = Math.atan2(this.graphics.position.y - (event.layerY - 600), this.graphics.position.x - event.layerX);
			this.mousePressed[event.button] = {
				x: event.x,
				y: event.y,
				angle: angle
			};
		},
		onMouseUp: function(event){
			delete this.mousePressed[event.button];
		}
	};

	stage.addChild(graphics);
	stage.addChild(nameText);

	return player;
}
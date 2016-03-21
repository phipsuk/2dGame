function RemotePlayer(stage, team, x, y, id, name){
	var self = this;
	var graphics = new PIXI.Graphics();

	var playerColour = team == "Red" ? 0xFF0000 : 0x0000FF;

	graphics.lineStyle(2, playerColour, 1);
	graphics.beginFill(playerColour);
	graphics.drawRect(0, coordinateConverter(10, 590), 10, 10);
	graphics.endFill();

	graphics.position.x = x;
	graphics.position.y = y;

	var nameText = new PIXI.Text(name, {font:"10px Arial", fill:playerColour});

	self.ID = id;
	self.name = name;

	self.graphics = graphics;
	self.team = team;
	self.nameText = nameText;
	self.update = function(x, y, dead, name){
		self.name = name;
		if(dead){
			nameText.text = "DEAD";
		}else{
			nameText.text = self.name;
		}
		graphics.position.x = x;
		graphics.position.y = y;
		if(graphics.position.x + nameText.width > 750){
			nameText.position.x = x - nameText.width - 5;
		}else{
			nameText.position.x = x + 5;
		}
		nameText.position.y = y + 575;
	};

	self.setAvatar = function(){

	};

	stage.addChild(graphics);
	stage.addChild(nameText);
}
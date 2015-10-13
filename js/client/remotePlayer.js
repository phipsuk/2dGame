function RemotePlayer(stage, team, x, y, id){
	var self = this;
	var graphics = new PIXI.Graphics();

	var playerColour = team == "Red" ? 0xFF0000 : 0x0000FF;

	graphics.lineStyle(2, playerColour, 1);
	graphics.beginFill(playerColour);
	graphics.drawRect(0, 590, 10, 10);
	graphics.endFill();

	graphics.position.x = x;
	graphics.position.y = y;

	this.ID = id;

	this.graphics = graphics;
	this.team = team;
	this.update = function(){

	};

	stage.addChild(graphics);
}
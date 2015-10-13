function CrossHair(stage){
	var self = this;
	var graphics = new PIXI.Graphics();
	graphics.lineStyle(2, 0x080808, 1);
	graphics.beginFill(0x080808);
	graphics.drawRect(-8, 0, 5, 0.3);
	graphics.drawRect(8, 0, 5, 0.3);
	graphics.drawRect(2, -8, 0.5, 5);
	graphics.drawRect(2, 4, 0.5, 5);
	graphics.endFill();
	stage.addChild(graphics);

	self.update = function(x, y){
		graphics.position.x = x;
		graphics.position.y = y;
		$("canvas").css("cursor", "none");
	};

	window.addEventListener('mousemove', function(event) {
		self.update(event.layerX, event.layerY);
	}, false);
}
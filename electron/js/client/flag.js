function Flag(colour, x, y){
	var sprite = new PIXI.Sprite.fromImage("/images/flag_" + colour + ".png");

	sprite.position.x = x;
	sprite.position.y = y;
	sprite.scale.x = 0.1;
	sprite.scale.y = 0.1;

	return {
		graphics:sprite,
		originalPosition:{x:x, y:y},
		captureInProgress: false,
		setPosition: function(x, y){
			sprite.position.x = x;
			sprite.position.y = y;
		},
		reset: function(){
			sprite.position.x = this.originalPosition.x;
			sprite.position.y = this.originalPosition.y;	
			this.captureInProgress = false;
		}
	};
};
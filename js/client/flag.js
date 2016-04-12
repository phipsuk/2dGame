function Flag(colour, x, y){
	var sprite = new PIXI.Sprite.fromImage("/images/flag_" + colour.toLowerCase() + ".png");

	var SCALE = 0.1;

	sprite.position.x = x;
	sprite.position.y = y;
	sprite.scale.x = SCALE;
	sprite.scale.y = SCALE;

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
		},
		getHeight: function(){
			return sprite.height * SCALE;
		},
		getWidth: function(){
			return sprite.width * SCALE;
		}
	};
};
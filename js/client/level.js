function Level(stage){
	var self = this;
	var Entities = {};

	//Create Sky
	var skyTexture = PIXI.Texture.fromImage("/images/sky2.png");
	var sky = new PIXI.Sprite(skyTexture);

	stage.addChild(sky);

	//Create Grass
	var texture = PIXI.Texture.fromImage("/images/grass.png");
	var grass = new PIXI.extras.TilingSprite(texture, 800, 50);
	grass.tileScale.x = 0.2;
	grass.tileScale.y = 0.2;
	grass.position.x = 0;
	grass.position.y = 570;

	stage.addChild(grass);

	self.update = function(data){
		for (var i = data.length - 1; i >= 0; i--) {
			var entity = data[i];
			if(Entities[entity.ID]){
				Entities[entity.ID].position.x = entity.position.x;
				Entities[entity.ID].position.y = -entity.position.y;
			}else{
				if(entity.shape == "Box"){
					if(entity.type){
						var entityGraphics = new PIXI.Graphics();
						entityGraphics.lineStyle(2, 0x080808, 1);
						entityGraphics.beginFill(0x080808);
						entityGraphics.drawRect((-entity.shapeOptions.width/2) + 5, (-entity.shapeOptions.height/2) + 595, entity.shapeOptions.width, entity.shapeOptions.height);
						entityGraphics.endFill();
						stage.addChild(entityGraphics);
						Entities[entity.ID] = entityGraphics;
						Entities[entity.ID].position.x = entity.position.x;
						Entities[entity.ID].position.y = -entity.position.y;
					}else{
						var texture = PIXI.Texture.fromImage("/images/" + entity.type + ".png");
						var entitySprite = new extras.TilingSprite(texture, entity.shapeOptions.width, entity.shapeOptions.height);
						entitySprite.position.x = entity.position.x;
						entitySprite.position.y = -entity.position.y;
						stage.addChild(entitySprite);
						Entities[entity.ID] = entitySprite;
					}
				}
			}
		};
	}
}
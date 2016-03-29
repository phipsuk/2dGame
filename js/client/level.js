function Level(stage){
	var self = this;
	var Entities = {};

	self.update = function(data){
		if(data && data.definition && data.definition.css){
			$("#levelcss").text(data.definition.css);
		}
		for (var i = data.entities.length - 1; i >= 0; i--) {
			var entity = data.entities[i];
			if(Entities[entity.ID]){
				Entities[entity.ID].position.x = entity.position.x + 5;
				Entities[entity.ID].position.y = -entity.position.y + SCREEN.HEIGHT - 5;
				Entities[entity.ID].rotation = -entity.rotation;
			}else{
				if(entity.shape == "Box"){
					if(!entity.type){
						var entityGraphics = new PIXI.Graphics();
						entityGraphics.lineStyle(2, 0x080808, 1);
						entityGraphics.beginFill(0x080808);
						entityGraphics.drawRect((-entity.shapeOptions.width/2) + 5, (-entity.shapeOptions.height/2) + SCREEN.HEIGHT - 5, entity.shapeOptions.width, entity.shapeOptions.height);
						entityGraphics.endFill();
						stage.addChild(entityGraphics);
						Entities[entity.ID] = entityGraphics;
						Entities[entity.ID].position.x = entity.position.x;
						Entities[entity.ID].position.y = -entity.position.y;
					}else{
						var texture = PIXI.Texture.fromImage("/images/" + entity.type + ".png");
						var entitySprite = new PIXI.extras.TilingSprite(texture, entity.shapeOptions.width, entity.shapeOptions.height);
						if(entity.nonTileable){
							entitySprite.tileScale.set(0.04, 0.04);
						}
						entitySprite.position.x = entity.position.x + 5;
						entitySprite.position.y = -entity.position.y + (SCREEN.HEIGHT - 5);
						entitySprite.pivot.set(entity.shapeOptions.width/2, entity.shapeOptions.height/2);
						stage.addChild(entitySprite);
						Entities[entity.ID] = entitySprite;
					}
				}
			}
		};
	}
}
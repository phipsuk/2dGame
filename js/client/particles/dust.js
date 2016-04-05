function DustParticles(stage, infinite){
	var self = this;
	self.emitter = new PIXI.particles.Emitter(stage, ["images/particle.png"], {
		"alpha": {
			"start": 0.5,
			"end": 0
		},
		"scale": {
			"start": 0.1,
			"end": 0.5,
			"minimumScaleMultiplier": 1
		},
		"color": {
			"start": "#74604f",
			"end": "#a98c6a"
		},
		"speed": {
			"start": 700,
			"end": 0
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"startRotation": {
			"min": 185,
			"max": 200
		},
		"rotationSpeed": {
			"min": 0,
			"max": 200
		},
		"lifetime": {
			"min": 0.1,
			"max": 0.5
		},
		"blendMode": "normal",
		"ease": [
			{
				"s": 0,
				"cp": 0.329,
				"e": 0.548
			},
			{
				"s": 0.548,
				"cp": 0.767,
				"e": 0.876
			},
			{
				"s": 0.876,
				"cp": 0.985,
				"e": 1
			}
		],
		"frequency": 0.001,
		"emitterLifetime": 1,
		"maxParticles": 1000,
		"pos": {
			"x": 0,
			"y": 0
		},
		"addAtBack": true,
		"spawnType": "point"
	});

	if(infinite){
		self.emitter.emitterLifetime = -1;
	}

	var elapsed = Date.now();
	var dead = false;

	self.cleanup = function(){
		dead = true;
		self.emitter.cleanup();
		self.emitter.destroy();
	}

	self.update = function(x,y, angle){
		if(dead === false){
			self.emitter.updateSpawnPos(x,y);
			self.emitter.rotate(angle);

			var now = Date.now();
			if(infinite){
				self.emitter.emit = true;
			}

			// The emitter requires the elapsed
			// number of seconds since the last update
			self.emitter.update((now - elapsed) * 0.001);
			elapsed = now;
		}
	};
}
function BloodParticles(stage, infinite){
	var self = this;
	self.emitter = new PIXI.particles.Emitter(stage, ["images/particle.png"], {
			"alpha": {
				"start": 0.8,
				"end": 0.1
			},
			"scale": {
				"start": 0.3,
				"end": 0.1,
				"minimumScaleMultiplier": 1
			},
			"color": {
				"start": "#590202",
				"end": "#d93030"
			},
			"speed": {
				"start": 7,
				"end": 0
			},
			"acceleration": {
				"x": 0,
				"y": 0
			},
			"startRotation": {
				"min": 180,
				"max": 0
			},
			"rotationSpeed": {
				"min": 0,
				"max": 0
			},
			"lifetime": {
				"min": 1,
				"max": 3
			},
			"blendMode": "normal",
			"frequency": 0.005,
			"emitterLifetime": 1,
			"maxParticles": 1000,
			"pos": {
				"x": 0,
				"y": 0
			},
			"addAtBack": false,
			"spawnType": "circle",
			"spawnCircle": {
				"x": 0,
				"y": 0,
				"r": 0.0001
			}
		});

	if(infinite){
		self.emitter.emitterLifetime = -1;
	}

	var elapsed = Date.now();

	self.update = function(x,y){

		self.emitter.updateSpawnPos(x,y);

		var now = Date.now();
		if(infinite){
			self.emitter.emit = true;
		}

		// The emitter requires the elapsed
		// number of seconds since the last update
		self.emitter.update((now - elapsed) * 0.001);
		elapsed = now;
	};
}
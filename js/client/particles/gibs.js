function GibsParticles(stage){
	var self = this;
	self.emitter = new PIXI.particles.Emitter(stage, ["images/particle.png"], {
		"alpha": {
			"start": 0.8,
			"end": 0.1
		},
		"scale": {
			"start": 1,
			"end": 0.3,
			"minimumScaleMultiplier": 1
		},
		"color": {
			"start": "#590202",
			"end": "#d93030"
		},
		"speed": {
			"start": 200,
			"end": 200
		},
		"acceleration": {
			"x": 0,
			"y": 0
		},
		"startRotation": {
			"min": 0,
			"max": 0
		},
		"rotationSpeed": {
			"min": 0,
			"max": 0
		},
		"lifetime": {
			"min": 0.5,
			"max": 0.5
		},
		"blendMode": "normal",
		"frequency": 0.1,
		"emitterLifetime": 0.31,
		"maxParticles": 1000,
		"pos": {
			"x": 0,
			"y": 0
		},
		"addAtBack": false,
		"spawnType": "burst",
		"particlesPerWave": 10,
		"particleSpacing": 0,
		"angleStart": 0
	});

	var elapsed = Date.now();

	self.update = function(x,y){

		self.emitter.updateSpawnPos(x,y);

		var now = Date.now();

		// The emitter requires the elapsed
		// number of seconds since the last update
		self.emitter.update((now - elapsed) * 0.001);
		elapsed = now;
	};
}
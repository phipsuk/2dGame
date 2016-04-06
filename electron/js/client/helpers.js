var coordinateConverter = function(position, base){
	return base + position;
}

var updateHealthBars = function(o2, health){
	var healthBar = document.getElementById("health");
	var o2Bar = document.getElementById("o2");

	healthBar.value = health;
	o2Bar.value = o2;
}

var updateTimeRemaining = function(time){
	var timer = document.getElementById("timer");
	timer.innerText = time;
}

var updateScores = function(blue, red){
	var redScore = document.getElementById("redScore");
	var blueScore = document.getElementById("blueScore");
	
	blueScore.innerText = blue;
	redScore.innerText = red;
}
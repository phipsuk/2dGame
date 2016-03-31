var coordinateConverter = function(position, base){
	return base + position;
}

var updateHealthBars = function(o2, health){
	var healthBar = document.getElementById("health");
	var o2Bar = document.getElementById("o2");

	healthBar.value = health;
	o2Bar.value = o2;
}
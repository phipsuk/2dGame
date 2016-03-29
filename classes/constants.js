"use strict";
if(typeof(module) === "undefined"){
	var module = {};
	module.exports = window;
}
module.exports.PLAYER = Math.pow(2,1);
module.exports.FLAG =  Math.pow(2,2);
module.exports.GROUND = Math.pow(2,3);
module.exports.OTHER = Math.pow(2,4);
module.exports.BULLET = Math.pow(2,5);
module.exports.TRIGGER = Math.pow(2,6);
module.exports.SCREEN = {
	WIDTH: 1920,
	HEIGHT: 1080
}
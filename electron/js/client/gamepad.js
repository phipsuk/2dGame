function GamePad(){
	var joystick	= new VirtualJoystick();

	this.getPressed = function(){
		return {
			"up": joystick.up(),
			"down": joystick.down(),
			"left": joystick.left(),
			"right": joystick.right()
		};
	};
}

function GamePadButton( x, y, image){
	
}


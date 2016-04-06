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

	this.fireButton = new GamePadButton(0, "", 0, 10, 50, 50, "/images/fire-button.png");
}

function GamePadButton( top, left, bottom, right, width, height, image){
	var self = this;
	var buttonEl = document.createElement('div');
	buttonEl.style.position	= "absolute";
	buttonEl.style.top = top + "pt";
	buttonEl.style.left = left + "pt";
	buttonEl.style.bottom = bottom + "pt";
	buttonEl.style.right = right + "pt";
	buttonEl.style.width = width + "pt";
	buttonEl.style.height = height + "pt";
	buttonEl.style.background = "url(" + image + ")";
	buttonEl.style.margin = "auto";
	buttonEl.style.backgroundSize = "contain";
	document.body.appendChild(buttonEl);

	;(function(destObj){
		destObj.addEventListener	= function(event, fct){
			if(this._events === undefined) 	this._events	= {};
			this._events[event] = this._events[event]	|| [];
			this._events[event].push(fct);
			return fct;
		};
		destObj.removeEventListener	= function(event, fct){
			if(this._events === undefined) 	this._events	= {};
			if( event in this._events === false  )	return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		};
		destObj.dispatchEvent		= function(event /* , args... */){
			if(this._events === undefined) 	this._events	= {};
			if( this._events[event] === undefined )	return;
			var tmpArray	= this._events[event].slice(); 
			for(var i = 0; i < tmpArray.length; i++){
				var result	= tmpArray[i].apply(this, Array.prototype.slice.call(arguments, 1))
				if( result !== undefined )	return result;
			}
			return undefined
		};
	})(self);

	buttonEl.addEventListener("touchstart", function(evt){
		evt.button = 0;
		self.dispatchEvent('pressstart', evt);
		evt.preventDefault();
		evt.stopPropagation();
	}, false);

	buttonEl.addEventListener("touchmove", function(evt){
		 evt.preventDefault();
		 evt.stopPropagation();
	}, false);

	buttonEl.addEventListener("touchend", function(evt){
		evt.button = 0;
		self.dispatchEvent('pressend', evt);
		evt.preventDefault();
		evt.stopPropagation();
	}, false);
}


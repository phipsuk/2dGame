var socket;
var ClientID = 0;
var Team;
var Name;

bootbox.prompt("What is your name?", function(result) {
	if (result === null) {
		window.location.reload();
	} else {
		socket = io();
		socket.on("connectionInfo", function(msg){
			if(result.match(/dead/i)){
				result = "NOT " + result;
			}
			if(result.length > 30){
				result = result.substr(0, 30);
			}
			ClientID = msg.ID;
			Team = msg.Team;
			Name = result;
			socket.emit("name", result);
			onConnected();
		});
	}
});

var connected = false;
function onConnected(){
	if(connected){
		window.location.reload();
	}
	connected = true;
	var FORWARD = 1.57079633;
	var BACKWARD = -FORWARD; 

	var players = {};
	var renderer = PIXI.autoDetectRenderer(SCREEN.WIDTH, SCREEN.HEIGHT,{transparent: true, antialias: true});
	document.getElementById("game").appendChild(renderer.view);

	var feed = new Feed(socket, $("#feed"));

	var blueTeamScoreCount = 0;
	var redTeamScoreCount = 0;

	// create the root of the scene graph
	var stage = new PIXI.Container();
	var level = new Level(stage);

	var RedFlag = Flag("Red", 10, 570);
	var BlueFlag = Flag("Blue", 765, 570);

	stage.addChild(RedFlag.graphics);
	stage.addChild(BlueFlag.graphics);

	socket.on("flagCaptured", function(team){
		if(team == "Red"){
			//Reset Blue Flag
			BlueFlag.reset();
		}else{
			//Reset Red Flag
			RedFlag.reset();
		}
	});

	var player = Player(stage, Team, ClientID, Name);

	if(VirtualJoystick.touchScreenAvailable()){
		var GPad = new GamePad();
	}

	socket.on("update", function(serverUpdate){
		var score = serverUpdate[0].Score;
		updateScores(score.blue, score.red);
		updateTimeRemaining(serverUpdate[0].TimeRemaining);
		for (var i = serverUpdate.length - 1; i >= 0; i--) {
			updateBulletPositions(serverUpdate[i].Bullets);
			if(serverUpdate[i].ID == ClientID){
				player.update(serverUpdate[i]);
				player.setAvatar(serverUpdate[i].Data.avatar, stage);
				if(serverUpdate[i].Data.hasFlag){
					if(player.team == "Blue"){
						RedFlag.setPosition(player.graphics.position.x, player.graphics.position.y - RedFlag.graphics.height/2);
					}else{
						BlueFlag.setPosition(player.graphics.position.x, player.graphics.position.y - BlueFlag.graphics.height/2);
					}
				}
				updateHealthBars(serverUpdate[i].Data.o2, serverUpdate[i].Data.health);
			}else{
				if(players[serverUpdate[i].ID]){
					players[serverUpdate[i].ID].update(serverUpdate[i]);
					players[serverUpdate[i].ID].setAvatar(serverUpdate[i].Data.avatar, stage);
					if(serverUpdate[i].Data.hasFlag){
						if(players[serverUpdate[i].ID].team == "Blue"){
							RedFlag.setPosition(players[serverUpdate[i].ID].graphics.position.x, players[serverUpdate[i].ID].graphics.position.y - RedFlag.graphics.height/2);
						}else{
							BlueFlag.setPosition(players[serverUpdate[i].ID].graphics.position.x, players[serverUpdate[i].ID].graphics.position.y - BlueFlag.graphics.height/2);
						}
					}
				}else{
					players[serverUpdate[i].ID] = new Player(stage, serverUpdate[i].Team, serverUpdate[i].ID, serverUpdate[i].Name);
				}
			}
		};		
	});

	socket.on("roundComplete", function(data){
		var winText = new PIXI.Text("", {font:"50px " + FONT, fill:COLOURS.WHITE});
		winText.position.x = (SCREEN.WIDTH/2) - 100;
		winText.position.y = 200;
		if(data == "Red"){
			winText.text = "Red Team Wins!";
		}else if(data == "Blue"){
			winText.text = "Blue Team Wins!";
		}else if(data == "Draw"){
			winText.text = "You all lose!";
		}
		stage.addChild(winText);
		setTimeout(function(){
			stage.removeChild(winText);
		}, 5000);
	})

	socket.on("levelUpdate", function(data){
		level.update(data);
		if(data && data.definition && data.definition.flags){
			stage.removeChild(RedFlag.graphics);
			stage.removeChild(BlueFlag.graphics);
			RedFlag = Flag("Red", data.definition.flags.red.x, SCREEN.HEIGHT - 30 - data.definition.flags.blue.y);
			BlueFlag = Flag("Blue", data.definition.flags.blue.x, SCREEN.HEIGHT - 30 - data.definition.flags.blue.y);

			stage.addChild(RedFlag.graphics);
			stage.addChild(BlueFlag.graphics);
		}
	});

	var bulletList = {};

	var updateBulletPositions = function(bullets){
		if(bullets.length > 0){
			for (var i = bullets.length - 1; i >= 0; i--) {
				if(bulletList[bullets[i].id]){
					bulletList[bullets[i].id].position.x = bullets[i].x;
					bulletList[bullets[i].id].position.y = -bullets[i].y;	
				}else{
					var bulletGraphics = new PIXI.Graphics();
					bulletGraphics.lineStyle(2, 0x080808, 1);
					bulletGraphics.beginFill(0x080808);
					bulletGraphics.drawCircle(5, SCREEN.HEIGHT - 5, 1);
					bulletGraphics.endFill();
					stage.addChild(bulletGraphics);
					bulletList[bullets[i].id] = bulletGraphics;
					bulletList[bullets[i].id].position.x = bullets[i].x;
					bulletList[bullets[i].id].position.y = -bullets[i].y;
				}
			};
		}
	};

	socket.on("clientDisconnected", function(clientid){
		stage.removeChild(players[clientid].graphics);
		stage.removeChild(players[clientid].nameText);
		if(players[clientid].hasFlag){
			if(players[clientid].team == "Blue"){
				BlueFlag.reset();
			}else{
				RedFlag.reset();
			}
		}
		delete players[clientid];
	});

	socket.on("bulletRemoved", function(id){
		stage.removeChild(bulletList[id]);
		delete bulletList[id];
	});

	CrossHair(stage);

	// start animating
	animate();

	function animate() {

		requestAnimationFrame(animate);

		if(GPad){
			updatePlayerFromGamePad();
		}

		var update = {
			pressed: player.pressed,
			mousePressed: player.mousePressed,
			position: player.graphics.position,
			hasFlag: player.hasFlag
		}

		socket.emit("update", update);

	    // render the root container
	    renderer.render(stage);
	}

	function updatePlayerFromGamePad(){
		var pressed = GPad.getPressed();
		player.onKeyUp({keyCode: player.UP});
		player.onKeyUp({keyCode: player.DOWN});
		player.onKeyUp({keyCode: player.LEFT});
		player.onKeyUp({keyCode: player.RIGHT});
		if(pressed.up){
			player.onKeyDown({keyCode: player.UP});
		}
		if(pressed.down){
			player.onKeyDown({keyCode: player.DOWN});
		}
		if(pressed.left){
			player.onKeyDown({keyCode: player.LEFT});
		}
		if(pressed.right){
			player.onKeyDown({keyCode: player.RIGHT});
		}
	}

	window.addEventListener('keydown', function(event) {
		player.onKeyDown(event);
	}, false);
	window.addEventListener('keyup', function(event) {
		player.onKeyUp(event);
	}, false);
	window.addEventListener('mousedown', function(event){
		player.onMouseDown(event);
	}, false);
	window.addEventListener('mouseup', function(event){
		player.onMouseUp(event);
	}, false);
}
"use strict";
class FeedServer{
	constructor(sockets){
		this.sockets = sockets;
		this.FEED_MESSAGE_EVENT = "feedMessage";
	}

	sendMessage(message){
		this.sockets.emit(this.FEED_MESSAGE_EVENT, {
			message: message,
			date: Date.now()
		});
	}

	playerJoined(player){
		this.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Joined the game.");
	}

	playerDisconnected(player){
		this.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> left the game");
	}

	playerKilled(player, bullet){
		this.sendMessage("<b style=\"color:" + bullet.owner.Team + "\">" + bullet.owner.name + "</b> Killed <b style=\"color:" + player.Team + "\">" + player.name + "</b>");
	}

	gotFlag(player, flag){
		this.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> has the " + (player.Team == "Red" ? "Blue" : "Red") + " Flag!");
	}

	captureFlag(player){
		this.sendMessage("<b style=\"color:" + player.Team + "\">" + player.name + "</b> Captured the Flag!");
	}

	serverMessage(message){
		this.sendMessage("<span style=\"color:green\">" + message + "</b>");
	}
}
module.exports = FeedServer;
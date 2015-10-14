module.exports = function(sockets){
	var FEED_MESSAGE_EVENT = "feedMessage";
	return {
		sendMessage: function(message){
			sockets.emit(FEED_MESSAGE_EVENT, {
				message: message,
				date: Date.now()
			});
		}
	};
};
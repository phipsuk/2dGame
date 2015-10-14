function Feed(socket, element){
	var self = this;
	var $elem = $(element);
	socket.on("feedMessage", function(message){
		$elem.append("<div class=\"message-row\">" + message + "</div>");
		$elem.scrollTop($elem[0].scrollHeight);
	});

	self.clear = function(){
		$elem.empty();
	}
}
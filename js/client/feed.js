function Feed(socket, element){
	var self = this;
	var $elem = $(element);
	socket.on("feedMessage", function(message){
		var item = document.createElement('DIV');
		item.className = "message-row";
		item.innerHTML = "<span class=\"time\" data-time=\"" + moment(message.date).toISOString() + "\">" + moment(message.date).format("HH:mm:ss") + "</span>" + message.message;
		$elem.scrollTop($elem[0].scrollHeight);
		var appended = $elem[0].appendChild(item);

		setTimeout(function(){
			appended.remove();
		}, 5000);
	});

	self.clear = function(){
		$elem.empty();
	}
}
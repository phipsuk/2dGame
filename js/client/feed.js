function Feed(socket, element){
	var self = this;
	var $elem = $(element);
	socket.on("feedMessage", function(message){
		$elem.append("<div class=\"message-row\"><span class=\"time\" data-time=\"" + moment(message.date).toISOString() + "\">" + moment(message.date).format("HH:mm:ss") + "</span>" + message.message + "</div>");
		$elem.scrollTop($elem[0].scrollHeight);
	});

	/*setInterval(function(){
		$(".time").each(function(index, el) {
			$el = $(el);
			$el.text(moment($el.attr("data-time")).fromNow());
		});
	}, 1000);*/

	self.clear = function(){
		$elem.empty();
	}
}
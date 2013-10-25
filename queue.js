var queue = [];
var oldpush = queue.push;
var push = function (){
	var args = Array.prototype.slice.call(arguments);
	args.forEach(function(val){
		if(queue.indexOf(val) == -1)
			oldpush.call(this, val);
	});
	return queue;
}

exports.queue = queue;
exports.push = push;
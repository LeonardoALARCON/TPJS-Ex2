var oldlog = console.log;
var log = function(){
	
	var tab =Array.prototype.slice.call(arguments);
   	tab.unshift(new Date().toString());
   	oldlog.apply(console, tab);
}

exports.log = log;
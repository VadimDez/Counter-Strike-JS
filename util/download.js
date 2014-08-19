define(function() {
	return function(path, type, callback) {
		var req = new XMLHttpRequest();
		req.open("GET", path, true);
		req.responseType = type;
		req.onreadystatechange = function () {
			if(req.readyState === 4) {
				if(req.status === 200 || req.status == 0) {
					if(type === "arraybuffer") {
						callback(new Uint8Array(req.response));
					}
					else {
						callback(req.response);
					}
				}
			}
		}
		req.send(null);
	}
});
var wrench = require('wrench');
var fs = require('fs');

var files = [];
wrench.readdirRecursive('../examples', function(error, curFiles) {
	if (curFiles) {
		for ( var i = 0; i < curFiles.length; i++) {
			var name = curFiles[i];
			if (name.indexOf('.html') !== -1 && name.indexOf('all_examples.html') === -1 && name.indexOf('all_examples_links.html') === -1) {
				files.push(name);
			}
		}
	} else {
		buildDoc('../examples/all_examples.html', function (stream) {
			for (var i = 0; i < files.length; i++) {
				 stream.write('		<iframe class="example" src="'+files[i]+'"></iframe>\n');
			}
		});
		buildDoc('../examples/all_examples_links.html', function (stream) {
			stream.write('	<ul>\n');
			for (var i = 0; i < files.length; i++) {
				stream.write('		<li><a href="' + files[i] + '">' + files[i] + '</a><br>\n');
			}
			stream.write('	</ul>\n');
		});
	}
});

function buildDoc(fileName, callback) {
	var stream = fs.createWriteStream(fileName, {
		flags : 'w'
	});

	stream.write(
		'<!DOCTYPE HTML>\n'+
		'<html lang="en">\n'+
		'<head>\n'+
		'<meta charset="utf-8">\n'+
		'<meta http-equiv="X-UA-Compatible" content="chrome=1">\n'+
		'<title>All examples</title>\n'+
		'<style>\n'+
		'body,html {\n'+
		'	height: 100%;\n'+
		'	margin: 0px;\n'+
		'}\n'+
		'.example {\n'+
		'	width: 300px;\n'+
		'	height: 300px;\n'+
		'}\n'+
		'</style>\n'+
		'</head>\n'+
		'<body>\n');

	callback(stream);

	stream.write(
		'</body>\n'+
		'</html>');
	stream.end();
}

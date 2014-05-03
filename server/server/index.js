'use strict';

var http = require('http');

var cb = function(request, response) {

  debugger;

  response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('Hello server!');
  response.end();
};

http.createServer(cb).listen(3000, 'localhost');

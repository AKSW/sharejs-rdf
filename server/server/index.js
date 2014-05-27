'use strict';

var EventEmitter = require('events').EventEmitter;

var connect = require('connect'),
    sharejs = require('share').server;

var server = connect(
  connect.logger(),
  connect.static(__dirname + '/public')
);

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(server, {
  db: {
    type: process.env.SHAREJS_DB
  }
});


exports.listen = function(port) {
  var emitter = new EventEmitter();    // to do: emit 'close' when done

  server.listen(port, function(){
      console.log('Server running at http://127.0.0.1:'+port+'/');
  });

  return emitter;
};

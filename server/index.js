'use strict';

var EventEmitter = require('events').EventEmitter,
    connect = require('connect'),
    sharejs = require('share'),
    shareServer = sharejs.server;

require('sharejs-rdf-ext')(sharejs);


var server, serverConfig, serverEventEmitter;


exports.setup = function (config) {

  serverConfig = config;
  serverEventEmitter = new EventEmitter();

  server = connect(
    connect.logger(),
    connect.static(__dirname + '/public')
  );

  // Attach the sharejs REST and Socket.io interfaces to the server
  shareServer.attach(server, {
    browserChannel: {
      cors: '*'
    },
    db: {
      type: config.sharejs.db
    }
  });

  this.on = serverEventEmitter.on;

  return this;

};


exports.listen = function (port) {

  server.listen(port, function () {
    console.log('Server running at http://127.0.0.1:' + port + '/');
  });

  return this;

};

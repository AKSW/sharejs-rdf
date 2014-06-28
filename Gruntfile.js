// Generated on 2014-05-06 using generator-nodeapp 0.0.1
'use strict';

var serverConfig = {
  host: 'localhost',
  ports: {
    client: '4000',
    debug: '5858',
    inspector: '8080'
  },
  sharejs: {
    db: 'none'
  }
};

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    nodemon: {
      debug: {
        options: {
          file: 'server/index.js',
          nodeArgs: ['--debug'],
          ignoredFiles: ['node_modules/**'],
          env: {
            PORT: serverConfig.ports.client
          }
        }
      }
    },
    'node-inspector': {
      debug: {
        options: {
          'web-port': serverConfig.ports.inspector,
          'web-host': serverConfig.host,
          'debug-port': serverConfig.ports.debug,
          'save-live-edit': true
        }
      }
    },
    open : {
      debug: {
        path: 'http://' + serverConfig.host + ':' + serverConfig.ports.inspector + '/debug?port=' + serverConfig.ports.debug,
        app: 'Google Chrome'
      },
      dev : {
        path: 'http://' + serverConfig.host + ':' + serverConfig.ports.client,
        app: 'Google Chrome'
      }
    },
    wait: {
      postDebug: {
        options: {
          delay: 100,
        }
      }
    },
    concurrent: {
      debug: {
        tasks: ['nodemon:debug', 'node-inspector:debug', 'open:debug', 'wait:postDebug', 'open:dev'],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  grunt.registerTask('sharejs-server', 'Start server', function () {
    var done = this.async();
    var port = serverConfig.ports.client;

    grunt.log.writeln('Starting server on port ' + port + '...');

    require('./server').setup(serverConfig).listen(port).on('close', done);
  });

  //grgrunt.registerTask('default', ['concurrent:debug']);
  grunt.registerTask('serve', ['sharejs-server']);

};

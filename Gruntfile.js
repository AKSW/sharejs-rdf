// Generated on 2014-05-09 using generator-webapp 0.4.9
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Configurable paths
    var config = {
        app: 'app',
        dist: 'dist',
        harp: {
            server: {
                server: true,
                source: 'public'
            },
            dist: {
                source: 'public',
                dest: 'build'
            }
        }
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        config: config,

        harp: config.harp,

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= config.app %>/scripts/{,*/}*.js',
                '!<%= config.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        }

    });


    grunt.registerTask('serve', function () {
        delete config.harp.dist;
        grunt.task.run('harp');
    });

    grunt.registerTask('compile', function () {
        delete config.harp.server;
        grunt.task.run('harp');
    });

    grunt.registerTask('default', ['serve']);
};

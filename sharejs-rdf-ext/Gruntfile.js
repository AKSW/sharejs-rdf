'use strict';

module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    watch: {
      coffeeLib: {
        files: ['src/lib/**/*.coffee'],
        tasks: ['coffee:lib']
      },
      coffeeSpec: {
        files: ['src/spec/**/*.coffee'],
        tasks: ['coffee:spec']
      },
      js: {
        files: ['lib/**/*.js', 'spec/**/*.spec.js'],
        tasks: ['test']
      }
    },
    shell: {
      test: {
        options: { stdout: true },
        command: 'jasmine-node spec/'
      }
    },
    coffee: {
      lib: {
        expand: true,
        cwd: 'src/lib',
        src: ['**/*.coffee'],
        dest: 'lib',
        ext: '.js'
      },
      spec: {
        expand: true,
        cwd: 'src/spec',
        src: ['**/*.coffee'],
        dest: 'spec',
        ext: '.spec.js'
      }
    }
  });

  grunt.registerTask('test', ['coffee', 'shell:test']);
};

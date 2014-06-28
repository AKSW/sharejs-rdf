module.exports = (grunt) ->
  (require 'load-grunt-tasks') (grunt)

  grunt.initConfig(
    watch:
      coffeeLib:
        files: ['src/lib/**/*.coffee']
        tasks: ['coffee:lib']
      coffeeSpec:
        files: ['src/spec/**/*.spec.coffee']
        tasks: ['coffee:spec']
      coffeeMatches:
        files: ['src/spec/matchers/*.coffee']
        tasks: ['coffee:matchers']
      js:
        files: ['lib/**/*.js', 'spec/**/*.spec.js']
        tasks: ['test']
    jasmine_node:
      options:
        includeStackTrace: false
      all: ['spec/']
    coffee:
      lib:
        expand: true,
        cwd: 'src/lib'
        src: ['**/*.coffee']
        dest: 'lib'
        ext: '.js'
      spec:
        expand: true
        cwd: 'src/spec'
        src: ['**/*.spec.coffee']
        dest: 'spec'
        ext: '.spec.js'
      matchers:
        expand: true
        cwd: 'src/spec/matchers'
        src: ['*.coffee']
        dest: 'spec/matchers'
        ext: '.js'
    concat:
      web:
        src: ['lib/types/sharejs*.js']
        dest: 'web/web.js'
    uglify:
      web:
        files: { 'web/web.min.js': 'web/web.js' }
  )

  grunt.registerTask 'test', ['coffee', 'jasmine_node']
  grunt.registerTask 'web', ['coffee', 'concat:web', 'uglify:web']
  grunt.registerTask 'default', ['test', 'web']

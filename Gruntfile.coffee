module.exports = (grunt) ->
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-jasmine-node'

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
  )

  grunt.registerTask 'test', ['coffee', 'jasmine_node']
  grunt.registerTask 'default', 'test'

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
      coffeeWebSpec:
        files: ['src/web-spec/**/*.spec.coffee']
        tasks: ['coffee:webspec']
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
        options:
          bare: true
        expand: true,
        cwd: 'src/lib'
        src: ['**/*.coffee']
        dest: 'lib'
        ext: '.js'
      spec:
        expand: true
        cwd: 'src/spec'
        src: ['*.spec.coffee']
        dest: 'spec'
        ext: '.spec.js'
      webspec:
        expand: true
        cwd: 'src/web-spec'
        src: ['**/*.spec.coffee']
        dest: 'web/spec'
        ext: '.spec.js'
      matchers:
        expand: true
        cwd: 'src/spec/matchers'
        src: ['*.coffee']
        dest: 'spec/matchers'
        ext: '.js'
    run:
      options:
        cwd: __dirname + '/node_modules/n3'
      'n3-browser':
        exec: 'npm install && npm run browser'

    concat:
      web:
        src: [
          'lib/web-prelude.js',
          'node_modules/spark-md5/spark-md5.js',
          'node_modules/node-rdf/web/web.js',
          'lib/types/rdf-json.js',
          'lib/types/rdf-json-api.js',
          'lib/types/hybrid.js'
        ]
        dest: 'web/web.js'
    uglify:
      web:
        files: { 'web/web.min.js': 'web/web.js' }
    jasmine:
      webtest:
        src: 'web/web.js'
        options:
          vendor: ['node_modules/share/webclient/share.js']
          specs: 'web/spec/*.spec.js'
  )

  grunt.registerTask 'server-test', ['coffee', 'jasmine_node']
  grunt.registerTask 'web-create', ['coffee', 'concat:web', 'uglify:web']
  grunt.registerTask 'web-test', ['web-create', 'jasmine']
  grunt.registerTask 'web', ['web-test']
  grunt.registerTask 'test', ['server-test', 'web-test']
  grunt.registerTask 'default', ['test', 'web']

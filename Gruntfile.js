'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        src: ['src/**/*.js'],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    copy: {
      dist: {
        src: 'src/**/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.css'
      },
      example: {
        expand: true,
        flatten: true,
        src: ['dist/*'],
        dest: 'example/node_modules/gnap-map/dist/'
      },
      examplenpm: {
        expand: true,
        flatten: true,
        src: ['node_modules/ui-select/dist/*'],
        dest: 'example/node_modules/gnap-map/node_modules/ui-select/dist/'
      }
    },
    cssmin: {
      dist: {
        src: 'dist/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  
  grunt.registerTask('dist', ['concat', 'uglify', 'copy:dist', 'cssmin', 'copy:example', 'copy:examplenpm']);
  
  grunt.registerTask('example', function() {
    grunt.task.run('dist');
    
    var cb = this.async();
    
    var childClient = grunt.util.spawn({
      grunt: true,
      args: ['serve'],
      opts: {
          cwd: 'example'
      }
    }, function(error, result, code) {
        cb();
    });
    
    var childServer = grunt.util.spawn({
      cmd: 'node',
      args: ['server'],
      opts: {
          cwd: 'example'
      }
    }, function(error, result, code) {
        cb();
    });

    setOutputToProcessOut(childClient);
    setOutputToProcessOut(childServer);
  });
  
  function setOutputToProcessOut(child) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }
};
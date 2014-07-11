module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      options: {
        separator: ";\n"
      },
      "javascript": {
        src: [
          "bower_components/jquery/dist/jquery.min.js",
          "bower_components/chartjs/Chart.min.js",
          "tmp/_minified_javascript/**/*.js"
        ],
        dest: "dist/static/<%= pkg.name %>.js"
      },
      "javascript_dev": {
        src: [
          "bower_components/jquery/dist/jquery.min.js",
          "bower_components/chartjs/Chart.min.js",
          "src/static/**/*.js"
        ],
        dest: "dist/static/<%= pkg.name %>.js"
      },
      "stylesheets": {
        src: [
          "bower_components/pure/*-min.css",
          "tmp/_minified_stylesheets/**/*.css"
        ],
        dest: "dist/static/<%= pkg.name %>.css"
      },
      "stylesheets_dev": {
        src: [
          "bower_components/pure/*-min.css",
          "src/static/**/*.css"
        ],
        dest: "dist/static/<%= pkg.name %>.css"
      }
    },

    uglify: {
      options: {
        banner: "/*! Compiled at <%= grunt.template.today(\"yyyy-mm-dd HH:MM:ss\") %> */\n",
      },
      "javascript": {
        files: [{
          expand: true,
          src: "src/static/**/*.js",
          dest: "tmp/_minified_javascript"
        }]
      }
    },

    cssmin: {
      minify: {
        expand: true,
        src: ["src/static/**/*.css"],
        dest: "tmp/_minified_stylesheets",
        ext: ".min.css"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-cssmin");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("assets:javascript:install", ["uglify:javascript", "concat:javascript"]);
  grunt.registerTask("assets:javascript:install_dev", ["concat:javascript_dev"]);

  grunt.registerTask("assets:stylesheets:install", ["cssmin:minify", "concat:stylesheets"]);
  grunt.registerTask("assets:stylesheets:install_dev", ["concat:stylesheets_dev"]);

  grunt.registerTask("assets:install", ["assets:javascript:install", "assets:stylesheets:install"]);
  grunt.registerTask("assets:install_dev", ["assets:javascript:install_dev", "assets:stylesheets:install_dev"]);
};

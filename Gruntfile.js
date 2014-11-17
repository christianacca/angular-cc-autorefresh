var markdown = require('node-markdown').Markdown;

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-conventional-changelog');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-ddescribe-iit');
  grunt.loadNpmTasks('grunt-i18n-template');

  // Project configuration.
  grunt.util.linefeed = '\n';
  grunt.template.addDelimiters('markdownSafeDelimiter', '{%', '%}');

  var pkg = grunt.file.readJSON('package.json');
  grunt.initConfig({
    ngversion: '1.2.23',
    bsversion: '3.1.1',
    uibsversion: '0.11.0',
    modules: [],//to be filled in by build task
    pkg: pkg,
    locales: {
      // controls which translations will be concatenated into the main js distributable file
      // change preference by calling preferredLocale
      preferred: 'en'
    },
    git: {
      account: 'christianacca',
      url: 'https://github.com/<%=git.account%>/<%=pkg.name%>',
      pagesurl: 'http://projects.codingmonster.co.uk/<%=pkg.name%>',
      rawurl: 'https://raw.githubusercontent.com/<%=git.account%>/<%=pkg.name%>/gh-pages'
    },
    filename: pkg.name.replace('angular-', ''),
    filenamecustom: '<%= filename %>-custom',
    ngdocrelpath: 'ref-docs',
    meta: {
      ns: pkg.name.replace('angular-', '').replace('-', '.'),
      brand: 'Angular Auto Refresh',
      modules: 'angular.module("<%=meta.ns%>", [<%= srcModules %>]);',
      tplmodules: 'angular.module("<%=meta.ns%>.tpls", [<%= tplModules %>]);',
      all: 'angular.module("<%=meta.ns%>", ["<%=meta.ns%>.tpls", <%= srcModules %>]);',
      banner: ['/*',
               ' * <%= pkg.name %>',
               ' * <%= pkg.homepage %>\n',
               ' * Version: <%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
               ' * License: <%= pkg.license %>',
               ' */\n'].join('\n')
    },
    delta: {
      docs: {
        files: ['misc/demo/index.html'],
        tasks: ['after-test']
      },
      html: {
        files: ['template/**/*.html'],
        tasks: ['html2js', 'karma:watch:run']
      },
      js: {
        files: ['src/**/*.js'],
        //we don't need to jshint here, it slows down everything else
        tasks: ['karma:watch:run']
      }
    },
    concat: {
      build: {
        options: {
          banner: '<%= meta.banner %><%= meta.modules %>\n'
        },
        src: [], //src filled in by build task
        dest: 'build/<%= filename %>-<%= pkg.version %>.js'
      },
      build_tpls: {
        options: {
          banner: '<%= meta.banner %><%= meta.all %>\n<%= meta.tplmodules %>\n'
        },
        src: [], //src filled in by build task
        dest: 'build/<%= filename %>-tpls-<%= pkg.version %>.js'
      }
    },
    copy: {
      democode: {
        options: {
          //process html files with gruntfile config
          processContent: grunt.template.process
        },
        files: [{
          expand: true,
          src: ['**/*.html', '**/*.js'],
          cwd: 'misc/demo/',
          dest: 'build/'
        }]
      },
      demoassets: {
        files: [{
          expand: true,
          //Don't re-copy code files, we process those
          src: ['**/**/*', '!**/*.html', '!**/*.js'],
          cwd: 'misc/demo',
          dest: 'build/'
        }]
      }
    },
    uglify: {
      options: {
        banner: '<%= meta.banner %>'
      },
      build:{
        src:['<%= concat.build.dest %>'],
        dest:'build/<%= filename %>-<%= pkg.version %>.min.js'
      },
      build_tpls:{
        src:['<%= concat.build_tpls.dest %>'],
        dest:'build/<%= filename %>-tpls-<%= pkg.version %>.min.js'
      }
    },
    html2js: {
      build: {
        options: {
          module: null, // no bundle module for all the html2js templates
          base: '.',
          rename: renameTemplateModule
        },
        files: [{
          expand: true,
          src: ['build/compiled-template/**/*.html'],
          ext: '.html.js'
        }]
      }
    },
    jshint: {
      files: ['Gruntfile.js','src/**/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    karma: {
      options: {
        configFile: 'karma.conf.js'
      },
      watch: {
        background: true
      },
      continuous: {
        singleRun: true
      },
      jenkins: {
        singleRun: true,
        colors: false,
        reporters: ['dots', 'junit'],
        browsers: ['Chrome', 'ChromeCanary', 'Firefox', 'Opera', '/Users/jenkins/bin/safari.sh']
      },
      travis: {
        singleRun: true,
        reporters: ['dots'],
        browsers: ['Firefox']
      },
      coverage: {
        preprocessors: {
          'src/*/*.js': 'coverage'
        },
        reporters: ['progress', 'coverage']
      }
    },
    changelog: {
      options: {
        dest: 'CHANGELOG.md',
        templateFile: 'misc/changelog.tpl.md',
        github: '<%=git.account%>/<%=pkg.name%>'
      }
    },
    shell: {
      //We use %version% and evluate it at run-time, because <%= pkg.version %>
      //is only evaluated once
      'release-prepare': [
        'grunt before-test after-test',
        'grunt version', //remove "-SNAPSHOT"
        'grunt changelog'
      ],
      'release-complete': [
        'git commit CHANGELOG.md package.json -m "chore(release): v%version%"',
        'git tag %version%'
      ],
      'release-start': [
        'grunt version:minor:"SNAPSHOT"',
        'git commit package.json -m "chore(release): Starting v%version%"'
      ],
      'release-start-fix': [
        'grunt version:patch:"SNAPSHOT"',
        'git commit package.json -m "chore(release): Starting v%version%"'
      ]
    },
    ngdocs: {
      options: {
        dest: 'build/<%= ngdocrelpath %>',
        scripts: [
          'angular.js',
          '<%= concat.build_tpls.dest %>'
        ],
        styles: [
          'docs/css/style.css'
        ],
        navTemplate: 'docs/nav.html',
        title: '<%=meta.ns%>',
        html5Mode: false,
        startPage: '/api/<%=meta.ns%>',
        imageLink: '<%=git.pagesurl%>/',
        image: 'http://www.gravatar.com/avatar/c1fc9a95deec0da0a3dc0fac34bddfec.png'
      },
      api: {
        src: ['src/**/*.js', 'src/**/*.ngdoc'],
        title: 'API Documentation'
      }
    },
    'ddescribe-iit': {
      files: [
        'src/**/*.spec.js'
      ]
    },
      i18n_template: {
          // note: the targets for this task are dynamically created by our il8n task
          options: {
              locales: ['en', 'zh-CN'], // extend these with your own translations by calling supportedLocales grunt task
              defaultLocale: 'en',
              forceRefresh: true
          }
      }
  });

  function renameTemplateModule(modulePath) {
    var _ = grunt.util._;
    var segments = modulePath.split('/');
    var fileName = _.last(segments);
    return 'app/vendor/angular-ccacca/autoRefresh/' + fileName;
  }

  //register before and after test tasks so we've don't have to change cli
  //options on the goole's CI server
  grunt.registerTask('before-test', ['clean', 'enforce', 'ddescribe-iit', 'jshint', 'i18n', 'html2js']);
  grunt.registerTask('after-test', ['build', 'copy', 'ngdocs']);

  //Rename our watch task to 'delta', then make actual 'watch'
  //task build things, then start test server
  grunt.renameTask('watch', 'delta');
  grunt.registerTask('watch', ['before-test', 'after-test', 'karma:watch', 'delta']);

  // Default task.
  grunt.registerTask('default', ['before-test', 'test', 'after-test']);

  grunt.registerTask('enforce', 'Install commit message enforce script if it doesn\'t exist', function() {
    if (!grunt.file.exists('.git/hooks/commit-msg')) {
      grunt.file.copy('misc/validate-commit-msg.js', '.git/hooks/commit-msg');
      require('fs').chmodSync('.git/hooks/commit-msg', '0755');
    }
  });

    function getDocDataContext(moduleName) {
        var _ = grunt.util._;
        var urlTmpl = '<%=ngdocrelpath%>/#/api/<%=meta.ns%>.<%=modName%>.<%=modType%>:<%=modName%>';
        var urlBuilderCtx = Object.create(grunt.config.data, { modName: { value: moduleName }});
        var urls = {
            directive: grunt.template.process(urlTmpl, { data: _.extend(urlBuilderCtx, { modType: 'directive'})}),
            service: grunt.template.process(urlTmpl, { data: _.extend(urlBuilderCtx, { modType: 'service'})})
        };
        return Object.create(grunt.config.data, { apiDocUrl: { value: urls }});
    }

  //Common module containing all modules for src and templates
  //findModule: Adds a given module to config
  var foundModules = {};

    function findModule(name) {
    if (foundModules[name]) { return; }
    foundModules[name] = true;

    function breakup(text, separator) {
      return text.replace(/[A-Z]/g, function (match) {
        return separator + match;
      });
    }
    function ucwords(text) {
      return text.replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    }
    function enquote(str) {
      return '"' + str + '"';
    }

      var docCtx = getDocDataContext(name);
      var preferredLocale = grunt.config('locales.preferred');
      var module = {
      name: name,
      moduleName: enquote(grunt.config('meta.ns') + '.' + name),
      displayName: ucwords(breakup(name, ' ')),
      srcFiles: grunt.file.expand('src/'+name+'/*.js'),
      tplFiles: grunt.file.expand('build/compiled-template/'+name+'/'+ preferredLocale + '/*.html'),
      tpljsFiles: grunt.file.expand('build/compiled-template/'+name+'/'+ preferredLocale + '/*.html.js'),
      tplModules: grunt.file.expand('build/compiled-template/'+name+'/'+ preferredLocale + '/*.html').map(renameTemplateModule).map(enquote),
      dependencies: dependenciesForModule(name),
      docs: {
        md: grunt.file.expand('src/'+name+'/docs/*.md')
          .map(grunt.file.read).map(markdown)
          .map(function(rawHtml){
                return grunt.template.process(rawHtml, { delimiters: 'markdownSafeDelimiter', data: docCtx });
          }).join('\n'),
        js: grunt.file.expand('src/'+name+'/docs/*.js')
          .map(grunt.file.read).join('\n'),
        html: grunt.file.expand('src/'+name+'/docs/*.html')
          .map(grunt.file.read).join('\n')
      }
    };
    module.dependencies.forEach(findModule);
    grunt.config('modules', grunt.config('modules').concat(module));
  }

  function dependenciesForModule(name) {
    var deps = [];
    grunt.file.expand('src/' + name + '/*.js')
    .map(grunt.file.read)
    .forEach(function(contents) {
      //Strategy: find where module is declared,
      //and from there get everything inside the [] and split them by comma
      var moduleDeclIndex = contents.indexOf('angular.module(');
      var depArrayStart = contents.indexOf('[', moduleDeclIndex);
      var depArrayEnd = contents.indexOf(']', depArrayStart);
      var dependencies = contents.substring(depArrayStart + 1, depArrayEnd);
      dependencies.split(',').forEach(function(dep) {
        if (dep.indexOf(grunt.config('meta.ns') + '.') > -1) {
          var depName = dep.trim().replace(grunt.config('meta.ns') + '.','').replace(/['"]/g,'');
          if (deps.indexOf(depName) < 0) {
            deps.push(depName);
            //Get dependencies for this new dependency
            deps = deps.concat(dependenciesForModule(depName));
          }
        }
      });
    });
    return deps;
  }

  // config overrides
  grunt.registerTask('preferredLocale', 'Override preferred locale', function(locale) {
    if (!locale) { return; }

    var _ = grunt.util._;
    var builtinLocales = grunt.config('i18n_template.options.locales');
    if (!_(builtinLocales).contains(locale)){
      grunt.fatal('Preferred locale not currently supported');
    }
    grunt.config('locales.preferred', locale);
  });
  grunt.registerTask('supportedLocales', 'Override supported locales', function() {
      var _ = grunt.util._;
      var defaultLocale = grunt.config('i18n_template.options.defaultLocale');
      var supportedLocales = _.uniq(this.args.concat(defaultLocale));
      grunt.config('i18n_template.options.locales', supportedLocales);
  });

  function getDirectiveTemplateNames(){
    return grunt.file.expand({
      filter: 'isDirectory', cwd: '.'
    }, 'template/*').map(function(dir) {
      return dir.split('/')[1];
    });
  }

  grunt.registerTask('i18n', 'Localises templates with language translations', function(){
      var templates = getDirectiveTemplateNames();
      templates.forEach(function(t){
          var il8ntask = {
              options: {
                  messagesPath: 'template/' + t + '/translation',
                  basePath: 'template/' + t
              }
          };
          il8ntask.files = {};
          il8ntask.files['build/compiled-template/' + t] = ['template/' + t + '/' + t + '.html'];
          grunt.config('i18n_template.' + t, il8ntask);
      });
      grunt.task.run(['i18n_template']);
  });

  grunt.registerTask('build', 'Create build files', function() {
    var _ = grunt.util._;

    //If arguments define what modules to build, build those. Else, everything
    if (this.args.length) {
      this.args.forEach(findModule);
      grunt.config('filename', grunt.config('filenamecustom'));
    } else {
      grunt.file.expand({
        filter: 'isDirectory', cwd: '.'
      }, 'src/*').forEach(function(dir) {
        findModule(dir.split('/')[1]);
      });
    }

    var modules = grunt.config('modules');
    grunt.config('srcModules', _.pluck(modules, 'moduleName'));
    grunt.config('tplModules', _.pluck(modules, 'tplModules').filter(function(tpls) { return tpls.length > 0;} ));

    var demoModules =  modules
      .filter(function(module) {
        return module.docs.md && module.docs.js && module.docs.html;
      })
      .sort(function(a, b) {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });
    demoModules.bootstrapjs = grunt.template.process(grunt.file.read('misc/demo/assets/demoBootstrap.js'));
    grunt.config('demoModules', demoModules);

    var srcFiles = _.pluck(modules, 'srcFiles');
    var tpljsFiles = _.pluck(modules, 'tpljsFiles');
    //Set the concat task to concatenate the given src modules
    grunt.config('concat.build.src', grunt.config('concat.build.src')
                 .concat(srcFiles));
    //Set the concat-with-templates task to concat the given src & tpl modules
    grunt.config('concat.build_tpls.src', grunt.config('concat.build_tpls.src')
                 .concat(srcFiles).concat(tpljsFiles));

      var preferredLocale = grunt.config('locales.preferred');
      var sataliteLocales = _(grunt.config('i18n_template.options.locales')).without(preferredLocale);
      var templates = getDirectiveTemplateNames();
      sataliteLocales.forEach(function(locale){
          var targetSuffix = locale.replace('-', '_');
          var concatTarget = {
              options: {
                  banner: '<%= meta.banner %>\n<%= meta.tplmodules %>\n'
              },
              src: _.chain(tpljsFiles).flatten().map(function(file){
                  return file.replace('/' + preferredLocale + '/', '/' + locale + '/');
              }).value(),
              dest: 'build/<%= filename %>-' + locale + '-tpls-<%= pkg.version %>.js'
          };
          grunt.config('concat.build_tpls_' + targetSuffix, concatTarget);
          var uglifyTarget = {
              src:['<%= concat.build_tpls_' + targetSuffix + '.dest %>'],
              dest:'build/<%= filename %>-' + locale + '-tpls-<%= pkg.version %>.min.js'
          };
          grunt.config('uglify.build_tpls_' + targetSuffix, uglifyTarget);
      });

    grunt.task.run(['concat', 'uglify']);
  });

  grunt.registerTask('test', 'Run tests on singleRun karma server', function () {
    //this task can be executed in 3 different environments: local, Travis-CI and Jenkins-CI
    //we need to take settings for each one into account
    if (process.env.TRAVIS) {
      grunt.task.run('karma:travis');
    } else {
      var isToRunJenkinsTask = !!this.args.length;
      if(grunt.option('coverage')) {
        var karmaOptions = grunt.config.get('karma.options'),
          coverageOpts = grunt.config.get('karma.coverage');
        grunt.util._.extend(karmaOptions, coverageOpts);
        grunt.config.set('karma.options', karmaOptions);
      }
      grunt.task.run(this.args.length ? 'karma:jenkins' : 'karma:continuous');
    }
  });

  function setVersion(type, suffix) {
    var file = 'package.json';
    var VERSION_REGEX = /([\'|\"]version[\'|\"][ ]*:[ ]*[\'|\"])([\d|.]*)(-\w+)*([\'|\"])/;
    var contents = grunt.file.read(file);
    var version;
    contents = contents.replace(VERSION_REGEX, function(match, left, center) {
      version = center;
      if (type) {
        version = require('semver').inc(version, type);
      }
      //semver.inc strips our suffix if it existed
      if (suffix) {
        version += '-' + suffix;
      }
      return left + version + '"';
    });
    grunt.log.ok('Version set to ' + version.cyan);
    grunt.file.write(file, contents);
    return version;
  }

  grunt.registerTask('version', 'Set version. If no arguments, it just takes off suffix', function() {
    setVersion(this.args[0], this.args[1]);
  });

  grunt.registerMultiTask('shell', 'run shell commands', function() {
    var self = this;
    var sh = require('shelljs');
    self.data.forEach(function(cmd) {
      cmd = cmd.replace('%version%', grunt.file.readJSON('package.json').version);
      grunt.log.ok(cmd);
      var result = sh.exec(cmd,{silent:true});
      if (result.code !== 0) {
        grunt.fatal(result.output);
      }
    });
  });


    //clean
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.config('clean', {
        build: ['build', 'dist']
    });

    //connect
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('server', 'Start webserver that will serve requests for the static document site', function(){
        var _ = grunt.util._;
        var defaults = {
            keepalive: true,
            hostname: 'localhost',
            port: 8000,
            base: this.flags.release ? 'dist/docs' :  'build'
        };
        grunt.config('connect.server', {
            options: _.extend(defaults, this.flags)
        });
        grunt.task.run(['connect:server']);
    });

    grunt.registerTask('server-release', [
        'connect:server:keepalive'
    ]);

    grunt.registerTask('release', 'Packages distributable files suitable for a release', function(){

        function stripVs(dest, src) {
            return dest + '/' + src.replace('-' + grunt.config('pkg.version'), '');
        }

        grunt.config('copy.release_lib', {
            options: {
                //process files with gruntfile config
                process: grunt.template.process,
                rootdir: 'dist/lib/'
            },
            files: [{
                expand: true,
                src: ['*.js'],
                cwd: 'build',
                dest: '<%=copy.release_lib.options.rootdir%>js',
                rename: stripVs
            }, {
                expand: true,
                src: ['*.css'],
                cwd: 'build',
                dest: '<%=copy.release_lib.options.rootdir%>css',
                rename: stripVs
            }, {
                expand: true,
                src: ['*.jpg', '*.jpeg', '*.png', '*.ico', '*.gif'],
                cwd: 'build',
                dest: '<%=copy.release_lib.options.rootdir%>image',
                rename: stripVs
            }, {
                src: 'misc/bower.tpl.json',
                dest: '<%=copy.release_lib.options.rootdir%>bower.json'
            }]
        });

        grunt.config('copy.release_docs', {
            files: [{
                expand: true,
                cwd: 'build',
                src: ['index.html', '*-tpls-*.js', 'assets/**/*', '<%= ngdocrelpath %>/**/*'],
                dest: 'dist/docs'
            }]
        });

        grunt.task.run(['copy:release_lib', 'copy:release_docs']);
    });

  return grunt;
};

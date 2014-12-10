/** Regular npm dependendencies */
var argv = require('minimist')(process.argv.slice(2));
var changelog = require('conventional-changelog');
var fs = require('fs');
var gulp = require('gulp');
var pkg = require('./package.json');

/** Arguments */
var VERSION = argv.version || pkg.version;

gulp.task('changelog', function() {
  changelog({
    repository: 'https://github.com/christianacca/angular-cc-autorefresh.git',
    version: VERSION,
    file: 'CHANGELOG.md'
  }, function(err, log) {
    fs.writeFileSync(__dirname + '/CHANGELOG.md', log);
  });
});

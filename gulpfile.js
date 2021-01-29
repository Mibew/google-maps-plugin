var bower = require('bower'),
    eventStream = require('event-stream'),
    gulp = require('gulp'),
    chmod = require('gulp-chmod'),
    zip = require('gulp-zip'),
    tar = require('gulp-tar'),
    gzip = require('gulp-gzip'),
    rename = require('gulp-rename');

// Installs bower dependencies
gulp.task('bower', function(callback) {
    bower.commands.install([], {}, {})
        .on('error', function(error) {
            callback(error);
        })
        .on('end', function() {
            callback();
        });
});

gulp.task('prepare-release', gulp.series('bower', function() {
    var version = require('./package.json').version;

    return eventStream.merge(
        getSources()
            .pipe(zip('google-maps-plugin-' + version + '.zip')),
        getSources()
            .pipe(tar('google-maps-plugin-' + version + '.tar'))
            .pipe(gzip())
    )
    .pipe(chmod(0644))
    .pipe(gulp.dest('release'));
}));

// Builds and packs plugins sources
gulp.task('default', gulp.series('prepare-release'));

/**
 * Returns files stream with the plugin sources.
 *
 * @returns {Object} Stream with VinylFS files.
 */
var getSources = function() {
    return gulp.src([
            'Plugin.php',
            'README.md',
            'LICENSE',
            'js/*',
            'css/*',
            'vendor/jquery-colorbox/README.md',
            'vendor/jquery-colorbox/jquery.colorbox-min.js',
            'vendor/jquery-colorbox/example3/**/*'
        ],
        {base: './'}
    )
    .pipe(rename(function(path) {
        path.dirname = 'Mibew/Mibew/Plugin/GoogleMaps/' + path.dirname;
    }));
}

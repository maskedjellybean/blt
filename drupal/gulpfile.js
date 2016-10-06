var gulp = require('gulp');
var watch = require('gulp-watch');
var imagemin = require('gulp-imagemin');

gulp.task('default', function() {
  gulp.watch('sites/default/files/*', function(event) {
    gulp.run('images');
  });
});

// Image files

gulp.task('images', function () {
  return gulp.src('sites/default/files/*')
    .pipe(imagemin())
    .pipe(gulp.dest('sites/default/files/*'));
});
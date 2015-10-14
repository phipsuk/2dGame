var gulp = require('gulp');
var nodemon = require("gulp-nodemon");
var mocha = require('gulp-mocha');

gulp.task('default', function() {
  nodemon({
	    script: 'index.js'
	  , ext: 'js html json'
	  , env: { 'NODE_ENV': 'development' }
  })
});

gulp.task("test", function(){
	return gulp.src('test/test.js', {read: false})
        .pipe(mocha());
});
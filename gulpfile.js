var gulp = require('gulp');
var nodemon = require("gulp-nodemon");

gulp.task('default', function() {
  nodemon({
	    script: 'index.js'
	  , ext: 'js html'
	  , env: { 'NODE_ENV': 'development' }
  })
});
"use strict";
var gulp = require('gulp');
var nodemon = require("gulp-nodemon");
var mocha = require('gulp-mocha');
const electron = require('gulp-electron');
const info = require('./electron/package.json');

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

gulp.task("build", function(){

});

gulp.task("electronhtml", () => {
	gulp.src("./html/**")
		.pipe(gulp.dest("./electron"));
});

gulp.task("electronjs", () => {
	gulp.src("./js/**")
		.pipe(gulp.dest("./electron/js"));
});

gulp.task("electronimages", () => {
	gulp.src("./images/**")
		.pipe(gulp.dest("./electron/images"));
});

gulp.task("electroncss", () => {
	gulp.src("./css/**")
		.pipe(gulp.dest("./electron/css"));
});

gulp.task("electronModules", () => {

});

gulp.task('electron', ["electronhtml", "electronimages", "electronjs"], function() {
    gulp.src("")
    .pipe(electron({
        src: './electron',
        packageJson: info,
        release: './dist',
        cache: './cache',
        version: 'v0.37.3',
        packaging: true,
        platforms: ['win32-ia32', 'darwin-x64'],
        platformResources: {
            darwin: {
                CFBundleDisplayName: info.name,
                CFBundleIdentifier: info.bundle,
                CFBundleName: info.name,
                CFBundleVersion: info.version,
                icon: './images/icons/1024.icns'
            },
            win: {
                "version-string": info.version,
                "file-version": info.version,
                "product-version": info.version
            }
        }
    }))
    .pipe(gulp.dest(""));
});
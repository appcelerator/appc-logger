var exec = require('child_process').exec,
	BIN = './node_modules/.bin/';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		mocha_istanbul: {
			coverage: {
				src: 'test',
				options: {
					ignoreLeaks: false,
					check: {
						statements: 80,
						branches: 80,
						functions: 80,
						lines: 80
					}
				}
			}
		},
		appcJs: {
			options: {
				force: false
			},
			src: ['lib/**/*.js', 'test/**/*.js']
		},
		clean: {
			pre: ['*.log'],
			post: ['tmp']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-appc-js');
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// set required env vars
	grunt.registerTask('env', function() {
		process.env.TEST = '1';
	});

	// register tasks
	grunt.registerTask('default', ['clean:pre', 'env', 'appcJs', 'mocha_istanbul:coverage', 'clean:post']);
};

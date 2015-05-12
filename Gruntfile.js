var exec = require('child_process').exec,
	BIN = './node_modules/.bin/';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		mochaTest: {
			options: {
				timeout: 40000,
				reporter: 'spec',
				bail: true
			},
			src: ['test/**/*.js']
		},
		appcJs: {
			options: {
				force: false
			},
			src: ['lib/**/*.js', 'test/**/*.js']
		},
		kahvesi: {
			src: ['test/**/*.js']
		},
		appcCoverage: {
			default_options: {
				src: 'coverage/lcov.info',
				force: true
			}
		},
		clean: {
			pre: ['*.log'],
			post: ['tmp']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-appc-js');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-kahvesi');
	grunt.loadNpmTasks('grunt-appc-coverage');

	// set required env vars
	grunt.registerTask('env', function() {
		process.env.TEST = '1';
	});

	// run test coverage
	grunt.registerMultiTask('coverage', 'generate test coverage report', function() {
		var done = this.async(),
			cmd = BIN + 'istanbul cover --report html ' + BIN + '_mocha -- -R min ' +
				this.filesSrc.reduce(function(p,c) { return (p || '') + ' "' + c + '" '; });

		grunt.log.debug(cmd);
		exec(cmd, function(err, stdout, stderr) {
			if (err) { grunt.fail.fatal(err); }
			if (/No coverage information was collected/.test(stderr)) {
				grunt.fail.warn('No coverage information was collected. Report not generated.');
			} else {
				grunt.log.ok('test coverage report generated to "./coverage/index.html"');
			}
			done();
		});
	});

	// register tasks
	grunt.registerTask('cover', ['clean:pre', 'env', 'kahvesi', 'appcCoverage', 'clean:post']);
	grunt.registerTask('default', ['clean:pre', 'env', 'appcJs', 'mochaTest', 'clean:post']);
};

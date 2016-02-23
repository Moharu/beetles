module.exports = function(grunt){
    var config = {
        mochaTest: {
            progress: {
                options: {
                    reporter: 'progress'
                },
                src: ['test/**/*.js']
            }
        },
        watch: {
            src: {
                files: ['src/**/*.js', 'test/**/*.js'],
                tasks: ['test']
            }
        },
        exec: {
            html_coverage: './node_modules/mocha/bin/mocha test -r blanket --reporter html-cov --recursive >> coverage.html',
            coverage: './node_modules/mocha/bin/mocha test -r blanket --reporter mocha-cov-reporter --recursive'
        }
    }
    grunt.initConfig(config)
    require('load-grunt-tasks')(grunt)
    grunt.registerTask('default', 'Watch', function(){
        grunt.task.run('watch')
    })
    grunt.registerTask('test', ['mochaTest:progress', 'exec:coverage', 'exec:html_coverage'])
}
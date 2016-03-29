var expect = require('expect.js')
var Module = require('../src/dontLetMeDown')

describe('The dontLetMeDown module', () => {
    describe('constructor', () => {
        var instance
        beforeEach(() => {})
        it('should throw an error if the constructor is undefined', () => {

            var params = {
                executor: null
            }

            expect(function(){
                return instance = new Module(params)
            })
            .to.throwException(function(e){
                expect(e).to.eql(new Error('Undefined executor'))
            })
        })
        it('should set default values if no timeout or period is provided', () => {
            var params = {
                executor: 'some-executor'
            }
            instance = new Module(params)
            expect(instance.timeout).to.be.ok()
            expect(instance.period).to.be.ok()
            expect(instance.fork).to.be.ok()
            expect(instance.moment).to.be.ok()
        })
    })
    describe('start', () => {
        it('should initialize a fork with the executor', () => {
            var params = {
                executor: 'some-executor'
            }
            var deps = {
                fork: function(executor){
                    expect(executor).to.eql('some-executor')
                    return {
                        on: function(){}
                    }
                }
            }
            instance = new Module(params, deps)
            instance.startObserver = function(){}
            instance.start()
        })
        describe('listeners', () => {
            it('on exit, should clear the interval and start over', (done) => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    fork: function(executor){
                        return {
                            on: function(what, definedFunction){
                                if(what === 'exit'){
                                    definedFunction()
                                }
                            }
                        }
                    }
                }
                instance = new Module(params, deps)
                instance.watcher = setInterval(function(){
                    expect().fail("Did not clear the previous watcher")
                }, 1000)
                instance.period = 50
                instance.startObserver = function(){
                    this.counter = this.counter + 1 || 0
                    if(this.counter > 1)
                        done()
                }
                instance.start()
            })
            it('on error, should do nothing', () => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    fork: function(executor){
                        return {
                            on: function(what, definedFunction){
                                if(what === 'error'){
                                    definedFunction()
                                }
                            }
                        }
                    }
                }
                instance = new Module(params, deps)
                instance.startObserver = function(){}
                instance.start()
            })
            it('on message, should update the lastVerification if the message is "alive"', () => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    fork: function(executor){
                        return {
                            on: function(what, definedFunction){
                                if(what === 'message'){
                                    definedFunction('alive')
                                }
                            }
                        }
                    },
                    moment: function(){
                        return 'new-date'
                    }
                }
                instance = new Module(params, deps)
                instance.startObserver = function(){}
                instance.lastVerification = 'old-date'
                instance.start()
                expect(instance.lastVerification).to.eql('new-date')
            })
            it('on message, should call stop if the message is "finish"', () => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    fork: function(executor){
                        return {
                            on: function(what, definedFunction){
                                if(what === 'message'){
                                    definedFunction('finish')
                                }
                            }
                        }
                    }
                }
                instance = new Module(params, deps)
                instance.startObserver = function(){}
                var stopCalled = false
                instance._stop = function(){
                    stopCalled = true
                }
                instance.start()
                expect(stopCalled).to.be.ok()
            })
        })
    })
    describe('the startObserver method', () => {
        it('should update the lastVerification', () => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    moment: function(){
                        return 'new-date'
                    }
                }
                instance = new Module(params, deps)
                instance.lastVerification = 'old-date'
                instance.startObserver()
                clearInterval(instance.watcher)
                expect(instance.lastVerification).to.eql('new-date')
        })
        it('should stop if the time between now and the last verification is greater than the defined timeout', (done) => {
                var params = {
                    executor: 'some-executor'
                }
                var deps = {
                    moment: function(){
                        return {
                            diff: function(){
                                return 10
                            }
                        }
                    }
                }
                instance = new Module(params, deps)
                instance.timeout = 5
                instance.observerTimeout = 10
                instance._stop = function(){
                    clearInterval(instance.watcher)
                    done()
                }
                instance.startObserver()
        })
        it('should do nothing if the time between now and the last verification is not greater than the defined timeout', (done) => {
                var params = {
                    executor: 'some-executor'
                }
                var counter = 0
                var deps = {
                    moment: function(){
                        return {
                            diff: function(){
                                counter = counter + 1
                                if(counter > 1){
                                    clearInterval(this.watcher)
                                    done()
                                }
                                return 4
                            }
                        }
                    }
                }
                instance = new Module(params, deps)
                instance.timeout = 5
                instance.observerTimeout = 10
                instance.startObserver()
        })
    })
    describe('stop', () => {
        it('should kill the task and clear the watcher', () => {
            var params = {
                executor: 'some-executor'
            }
            instance = new Module(params)
            var killCalled = false
            instance.currentTask = {
                kill: function(){
                    killCalled = true
                }
            }
            instance.watcher = setInterval(()=>{
                expect.fail("Did not kill the watcher")
            },500)
            instance._stop()
            expect(killCalled).to.be.ok()
        })
    })
})
var MasterWatcher, fork, log, moment;

MasterWatcher = (function() {
    function MasterWatcher(task, deps) {
        if (task.executor == null) {
          throw new Error('Undefined executor');
        }
        this.fork = (deps != null ? deps.fork : void 0) || require('child_process').fork;
        this.moment = (deps != null ? deps.moment : void 0) || require('moment');
        this.name = task.name;
        this.executor = task.executor;
        this.timeout = task.timeout || 15000;
        this.period = task.period || 15000;
        this.observerTimeout = task.observerTimeout || 5000;
        this.shutdownFn = task.shutdownFn;
        this.shouldFinish = false;
        this.taskIsRunning = false;
        this.env = task.env;
        this.args = task.args;
    }

    MasterWatcher.prototype.start = function() {
        this.log("Starting " + this.name);
        this.currentTask = this.fork(this.executor, [this.args], {env: this.env});
        this.startObserver();
        this.currentTask.on('exit', (function(_this) {
            this.taskIsRunning = false;
            return function(code, msg) {
                _this.log("Hey, exited! " + code + " " + msg);
                clearInterval(_this.watcher);
                _this.log("waiting to restart...");
                return setTimeout(function() {
                    if (_this.shouldFinish) {
                        _this.shutdownFn();
                    } else {
                        _this.taskIsRunning = true;
                        return _this.start();
                    }
                }, _this.period);
            };
        })(this));
        this.currentTask.on('error', (function(_this) {
            return function(error) {
                // return log(error);
            };
        })(this));
        return this.currentTask.on('message', (function(_this) {
            return function(data) {
                _this.log("received message " + data);
                if (data === 'alive') {
                    _this.lastVerification = _this.moment();
                }
                if (data === 'finish') {
                    return _this._stop();
                }
            };
        })(this));
    };

    MasterWatcher.prototype.startObserver = function() {
        this.log("Starting observer");
        this.lastVerification = this.moment();
        return this.watcher = setInterval((function(_this) {
            return function() {
                if (_this.moment().diff(_this.lastVerification, 'milliseconds') > _this.timeout) {
                    _this.log('Timeout!');
                    return _this._stop();
                } else {
                    // return log('its ok');
                }
            };
        })(this), this.observerTimeout);
    };

    MasterWatcher.prototype.shutdown = function() {
        this.log('Shutting down ' + this.name);
        this.shouldFinish = true;
        if (!this.taskIsRunning) {
            this.shutdownFn();
        }
    };

    MasterWatcher.prototype._stop = function() {
        this.log('forcing exit!');
        this.currentTask.kill();
        return clearInterval(this.watcher);
    };

    MasterWatcher.prototype.log = function(msg) {
        return console.log(require('moment')().format() + " - ", msg);
    };

    return MasterWatcher;

})();


module.exports = MasterWatcher;

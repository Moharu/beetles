var MasterWatcher, fork, log, moment;

MasterWatcher = (function() {
  function MasterWatcher(task, deps) {
    if (task.executor == null) {
      throw new Error('Undefined executor');
    }
    this.fork = (deps != null ? deps.fork : void 0) || require('child_process').fork;
    this.moment = (deps != null ? deps.moment : void 0) || require('moment');
    this.executor = task.executor;
    this.timeout = task.timeout || 15000;
    this.period = task.period || 15000;
    this.observerTimeout = task.observerTimeout || 5000;
  }

  MasterWatcher.prototype.start = function() {
    // log("Starting!");
    this.currentTask = this.fork(this.executor);
    this.startObserver();
    this.currentTask.on('exit', (function(_this) {
      return function(code, msg) {
        // log("Hey, exited! " + code + " " + msg);
        clearInterval(_this.watcher);
        // log("waiting to restart...");
        return setTimeout(function() {
          return _this.start();
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
        // log("received message " + data);
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
    // log("Starting observer");
    this.lastVerification = this.moment();
    return this.watcher = setInterval((function(_this) {
      return function() {
        if (_this.moment().diff(_this.lastVerification, 'milliseconds') > _this.timeout) {
          // log('Timeout!');
          return _this._stop();
        } else {
          // return log('its ok');
        }
      };
    })(this), this.observerTimeout);
  };

  MasterWatcher.prototype._stop = function() {
    // log('forcing exit!');
    this.currentTask.kill();
    return clearInterval(this.watcher);
  };

  return MasterWatcher;

})();

log = function(msg) {
  return console.log(require('moment')().format() + " - ", msg);
};

module.exports = MasterWatcher;
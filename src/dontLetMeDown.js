var tasker = function(config, deps){
    this.config = config
    this._onDuty = false
}

tasker.prototype.dontLetMeDown = function(){
    this._mainTimeout = setTimeout(function(){
        if(!this._onDuty){
            
        }
    }, this.interval)
}

module.exports = tasker
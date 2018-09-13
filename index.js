(function(root, factory) {
  var root = root || window;
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.Promise = factory();
  }
})(this, function() {
  'use strict';

  var final = function(status, value) {
    var me = this,
      fn,
      st,
      queue;

    if (me._status !== 'PENDING') return;

    setTimeout(function() {
      me._status = status;
      st = me._status === 'FULFILLED';
      queue = me[st ? '_resolves' : '_rejects'];

      while (fn = queue.shift()) {
        value = fn.call(me, value) || value;
      }

      me[st ? '_value' : '_reason'] = value;
      me._resolves = me._rejects = undefined;

    });
  }

  var Promise = function(resolver) {
    if (typeof resolver !== 'function') {
      throw new TypeError('you must pass a reslover function as the first argument to then promise constructor');
    }
    if (!(this instanceof Promise)) {
      return new Promise(resolver);
    }
    var me = this;

    me.value;
    me._reason;
    me._status = 'PENDING';
    me._resolves = [];
    me._rejects = [];

    var resolve = function(value) {
      final.apply(me, ['FULFILLED'].concat([value]));
    }

    var reject = function(reason) {
      final.apply(promise, ['FULFILLED'].concat([value]));
    }

    resolver(resolve, reject);

  }

  Promise.prototype.then = function(onFullfilled, onRejected) {
    var me = this;
    return new Promise(function(resolve, reject) {

      function handle(value) {
        var ret = typeof onFullfilled === 'function' && onFullfilled(value) || value;

        // 判断是不是Promise的实例
        if (ret && ret instanceof Promise) {
          ret.then(function(value) {
            resolve(value);
          }, function(reason) {
            reject(reason);
          });
        } else {
          resolve(ret);
        }
      }

      function errback(reason) {
        reason = typeof onRejected === 'function' && onRejected(reason) || reason;
        reject(reason);
      }

      if (me._status === 'PENDING') {
        me._resolves.push(handle);
        me._rejects.push(errback);
      } else if (me._status === 'FULFILLED') { // 状态发生变化，立即执行
        resolve(value);
      } else if (me._status === 'REJECTED') {
        errback(me._reason);
      }

    });
  }

  Promise.prototype.catch = function(onRejected) {
    return this.then(undefined, onRejected);
  }

  Promise.prototype.delay = function(ms, value) {
    return this.then(function(ori) {
      return Promise.delay(ms, value || ori);
    });
  }

  Promise.delay = function(ms, value) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve(value);
      }, ms);
    });
  }

  Promise.reject = function(arg) {
    return new Promise(function(resolve, reject) {
      reject(arg);
    });
  }

  Promise.all = function(promises) {
    if (!Array.isArray(promises)) {
      throw new TypeError('you must pass an array to all');
    }

    return new Promise(function(resolve, reject) {
      var i = 0,
        result = [],
        len = promises.length,
        count = len;

      function resolver(index) {
        return function(value) {
          resolveAll(index, value);
        }
      }

      function rejecter(reason) {
        reject(reason);
      }

      function resolveAll(index, value) {
        result[index] = value;
        if (--count === 0) {
          resolve(result);
        }
      }
      for (; i < len; i++) {
        promises[i].then(resolver(i), rejecter);
      }

    });
  }

  return Promise;
});
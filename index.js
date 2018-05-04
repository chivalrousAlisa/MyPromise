function MyPromise(executor){
  var self = this;
  self.status = 'pending';
  self.value = undefined;
  self.reason = undefined;
  self.onResolvedCallbacks = [];
  self.onRejectedCallbacks = [];
  function resolve(value){
    if(self.status === 'pending'){
      self.status = 'resolved';
      self.value = value;
      self.onResolvedCallbacks.forEach(function(fn){
        fn();
      });
    }
  }
  function reject(reason) {
    if(self.status === 'pending') {
      self.status = 'rejected';
      self.reason = reason;
      self.onRejectedCallbacks.forEach(function(fn){
        fn();
      });
    }
  }
  try{
    executor(resolve,reject);
  }catch(e){
    reject(e);
  }
}
MyPromise.prototype.then = function(onFullfilled, onRejected) {
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : function(value){return value;}
  onRejected = typeof onRejected === 'function' ? onRejected : function(err){throw err;}
  var self = this;
  var promise2; // 实现链式操作
  if(self.status === 'resolved'){
    // onFullfilled(self.value);
    promise2 = new MyPromise(function(resolve, reject) {
      // try{
      //   var x = onFullfilled(self.value);
      //   resolve(x);
      // }catch(e){
      //   reject(e);
      // }
      setTimeout(function(){
        try{
          var x = onFullfilled(self.value);
          resolvePromise(promise2,x,resolve,reject);
        }catch(e){
          reject(e);
        }
      });
    });
  }
  if(self.status === 'rejected') {
    // onRejected(self.reason);
    promise2 = new MyPromise(function(resolve, reject) {
      // try{
      //   var x = onRejected(self.reason);
      //   reject(x);
      // }catch(e){
      //   reject(e);
      // }
      setTimeout(function(){
        try{
          var x = onRejected(self.reason);
          resolvePromise(promise2,x,resolve,reject);
        }catch(e){
          reject(e);
        }
      });
    });
  }
  if (self.status === 'pending') {
    // 实现异步
    // self.onResolvedCallbacks.push(function(){
    //   onFullfilled(self.value);
    // });
    // self.onRejectedCallbacks.push(function(){
    //   onRejected(self.reason);
    // });
    promise2 = new MyPromise(function(resolve, reject){
      self.onResolvedCallbacks.push(function(){
        // try{
        //   var x = onFullfilled(self.value);
        //   resolve(x);
        // }catch(e){
        //   reject(e);
        // }
        setTimeout(function(){
          try{
            var x = onFullfilled(self.value);
            resolvePromise(promise2,x,resolve,reject);
          }catch(e){
            reject(e);
          }
        });
      });
      self.onRejectedCallbacks.push(function(){
        // try{
        //   var x = onRejected(self.reason);
        //   reject(x);
        // }catch(e){
        //   reject(e);
        // }
        setTimeout(function(){
          try{
            var x = onRejected(self.reason);
            resolvePromise(promise2,x,resolve,reject);
          }catch(e){
            reject(e);
          }
        });
      });
    });
  }
  return promise2;
}

function resolvePromise(p2,x,resolve,reject){
    //1.处理乱写
    //2.判断返回的是不是自己
    if(p2 === x){
        reject(new typeError('循环引用'));
    }
    //判断x是不是params(判断x是不是object)
    let called; //表示是否调用过成功或者失败
    if(x !== null || typeof x === 'object' || typeof x === 'function'){
        //判断promise只要判断对象中是否有then方法
        try{
            let then = x.then;
            if(typeof then === 'function'){ //then返回的可能是{then:xxx}，判断then是不是一个函数
                then.call(x,function(y){ //成功了以后可能会执行resolve(new Promise())用递归来解决
                    if(called) return;
                    called = true;
                    resolvePromise(p2,y,resolve,reject);
                },function(err){
                    if(called) return;
                    called = true;
                    reject(err);
                });
            }else{
                resolve(x);
            }
        }catch(e){
            if(called) return;
            called = true;
            reject(e);
        }
    }else{  //esle普通值
        resolve(x);
    }
}

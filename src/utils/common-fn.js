export function debounceFn(fn,delay){
  let timer = null;
  return function() {
    const args = arguments;
    if(timer){
      clearTimeout(timer)
    }
    timer = setTimeout(()=>{
      fn.apply(this,args)
    },delay)
  }
}

export function throttleFn(fn, delay){
  let timer = null;
  return function(){
    if (timer) {
      return;
    }
    const args = arguments;
    timer = setTimeout(() => {
      fn.apply(this,args)
      timer = null;
    }, delay);
  };
};

export function deepClone(originData){
  return JSON.parse(JSON.stringify(originData))
}

export const addEvent = function(target,eventType,handle) {
  if(document.addEventListener){
    target.addEventListener(eventType,handle,false);
  }else{
    target.attachEvent('on' + eventType,function(){
      handle.call(target,arguments);
    });
  }
};

export const removeEvent = function (target, eventType,handle) {
  if (document.removeEventListener) {
    target.removeEventListener(eventType, handle, false);
  } else {
    target.detachEvent('on' + eventType, handle);
  }
}

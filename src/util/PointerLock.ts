/**
  This class abstracts away the differences between Pointer Lock API
  implementations across browsers. (Currently Chrome 23+ and Firefox 14+)
**/

let mouseMoveCallbackWrapper = function(callback) {
  return function(e) {
    let a: any = {
      movementX: e.movementX || e.mozMovementX || e.webkitMovementX,
      movementY: e.movementY || e.mozMovementY || e.webkitMovementY
    };

    return callback(a);
  };
};

export class PointerLock {
  static requestPointerLock(elem) {
    let _requestPointerLock =
      elem.requestPointerLock ||
      elem.mozRequestPointerLock ||
      elem.webkitRequestPointerLock;
    if (!!_requestPointerLock) {
      _requestPointerLock.call(elem);
    }
  }

  static pointerLockElement() {
    return (
      (document as any).pointerLockElement ||
      (document as any).mozPointerLockElement ||
      (document as any).webkitPointerLockElement
    );
  }

  static addPointerLockExchangeEventListener(target, callback, useCapture) {
    target.addEventListener('pointerlockchange', callback, useCapture);
    target.addEventListener('mozpointerlockchange', callback, useCapture);
    target.addEventListener('webkitpointerlockchange', callback, useCapture);
  }

  static addMouseMoveEventListener(target, callback, useCapture) {
    // Every function used as an argument to addMouseMoveEventListener
    // gets an assoc array mapping DOM elements to the wrapped function
    // which is used for the mousemove event.
    callback.__MouseLockWrapper = [] || callback.__MouseLockWrapper;
    callback.__MouseLockWrapper[target] = mouseMoveCallbackWrapper(callback);

    return target.addEventListener(
      'mousemove',
      callback.__MouseLockWrapper[target],
      useCapture
    );
  }

  static removeMouseMoveEventListener(target, callback) {
    let result = target.removeEventListener(
      'mousemove',
      callback.__MouseLockWrapper[target]
    );

    // Delete the wrapper property element
    delete callback.__MouseLockWrapper[target];
    return result;
  }
}

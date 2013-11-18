document.addEventListener('mousemove', function (event) { Mouse.onMouseMove.call(this, event); }, false);
document.addEventListener('mousedown', function (event) { Mouse.onMouseDown.call(this, event); }, false);
document.addEventListener('mouseup', function (event) { Mouse.onMouseUp.call(this, event); }, false);

document.addEventListener('pointerlockchange', function (container) { Mouse.pointerLockChange.call(this, container) }, false);
document.addEventListener('mozpointerlockchange', function (container) { Mouse.pointerLockChange.call(this, container) }, false);
document.addEventListener('webkitpointerlockchange', function (container) { Mouse.pointerLockChange.call(this, container) }, false);

document.addEventListener('pointerlockerror', function () { Mouse.pointerLockError.call(this)}, false);
document.addEventListener('mozpointerlockerror', function () { Mouse.pointerLockError.call(this)}, false);
document.addEventListener('webkitpointerlockerror', function () { Mouse.pointerLockError.call(this)}, false);

document.addEventListener('fullscreenchange', function (container) { Mouse.fullscreenChange.call(this, container) }, false);
document.addEventListener('mozfullscreenchange', function (container) { Mouse.fullscreenChange.call(this, container) }, false);
document.addEventListener('webkitfullscreenchange', function (container) { Mouse.fullscreenChange.call(this, container) }, false);

document.oncontextmenu = disableContextMenu;

function disableContextMenu(event) { event.stopPropagation(); return false; };

var Mouse = {
    _pointerLock: false,
    _x: 0,
    _y: 0,
    _pressed: {},

    LEFT_MOUSE: 0,
    MIDDLE_MOUSE: 1,
    RIGHT_MOUSE: 2,

    onMouseMove: function (event) {
        if (Mouse._pointerLock) {
            Mouse._x = event.movementX ||
                       event.mozMovementX ||
                       event.webkitMovementX ||
                       0;

            Mouse._y = event.movementY ||
                       event.mozMovementY ||
                       event.webkitMovementY ||
                       0;
        }
        else {

            var vector = new THREE.Vector3(WIDTH_HALF / 2 * ((event.clientX / SCREEN_WIDTH) * 2 - 1),
                                            HEIGHT_HALF / 2 * (-(event.clientY / SCREEN_HEIGHT) * 2 + 1),
                                            1);

            projector.unprojectVector(vector, camera);
            var direction = vector.sub(camera.position).normalize();
            var distance = -camera.position.z / direction.z;
            var position = camera.position.clone().add(direction.multiplyScalar(distance));
            Mouse._x = position.x;
            Mouse._y = position.y;
        }
    },

    onMouseDown: function (event) {
        event.preventDefault();
        event.stopPropagation();
        Mouse._pressed[event.button] = true;
    },

    onMouseUp: function (event) {
        event.preventDefault();
        event.stopPropagation();
        Mouse._pressed[event.button] = false;
    },

    fullscreenChange: function (elem) {
        if (document.webkitFullscreenElement === elem ||
            document.mozFullscreenElement === elem ||
            document.mozFullScreenElement === elem) { // Older API upper case 'S'.
            // Element is fullscreen, now we can request pointer lock
            elem.requestPointerLock = elem.requestPointerLock ||
                                      elem.mozRequestPointerLock ||
                                      elem.webkitRequestPointerLock;
            elem.requestPointerLock();
        }
    },

    pointerLockChange: function (elem) {
        if (document.mozPointerLockElement === elem ||
        document.webkitPointerLockElement === elem) {
            console.log("Pointer Lock was successful.");
            Mouse._pointerLock = true;
        } else {
            console.log("Pointer Lock was lost.");
            Mouse._pointerLock = false;
        }
    },

    pointerLockError: function () {
        console.log("Error while locking pointer.");
    },

    lockPointer: function (elem) {
        // Start by going fullscreen with the element. Current implementations
        // require the element to be in fullscreen before requesting pointer
        // lock--something that will likely change in the future.
        elem.requestFullscreen = elem.requestFullscreen ||
                                 elem.mozRequestFullscreen ||
                                 elem.mozRequestFullScreen || // Older API upper case 'S'.
                                 elem.webkitRequestFullscreen;
        elem.requestFullscreen();

    },

    getX: function () { return this._x; },
    getY: function () { return this._y; },

    isDown: function (button) { return !!this._pressed[button]; }
};

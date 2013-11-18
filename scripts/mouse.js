document.addEventListener('mousemove', function (event) { Mouse.onMouseMove.call(this, event); }, false);
document.addEventListener('mousedown', function (event) { Mouse.onMouseDown.call(this, event); }, false);
document.addEventListener('mouseup', function (event) { Mouse.onMouseUp.call(this, event); }, false);
document.oncontextmenu = disableContextMenu;

function disableContextMenu(event) { event.stopPropagation(); return false; };

var Mouse = {
    _x: 0,
    _y: 0,
    _pressed: {},

    LEFT_MOUSE: 0,
    MIDDLE_MOUSE: 1,
    RIGHT_MOUSE: 2,

    onMouseMove: function (event) {
        var vector = new THREE.Vector3( WIDTH_HALF / 2 * ((event.clientX / SCREEN_WIDTH) * 2 - 1),
                                        HEIGHT_HALF / 2 * (-(event.clientY / SCREEN_HEIGHT) * 2 + 1),
                                        1);

        projector.unprojectVector( vector, camera );
        var direction = vector.sub(camera.position).normalize();
        var distance = -camera.position.z / direction.z;
        var position = camera.position.clone().add(direction.multiplyScalar(distance));
        Mouse._x = position.x;
        Mouse._y = position.y;
    },

    onMouseDown: function(event) {
        event.preventDefault();
        event.stopPropagation();
        Mouse._pressed[event.button] = true;
    },

    onMouseUp: function (event) {
        event.preventDefault();
        event.stopPropagation();
        Mouse._pressed[event.button] = false;
    },


    getX: function() { return this._x; },
    getY: function () { return this._y; },

    isDown: function(button) { return !!this._pressed[button]; }
};
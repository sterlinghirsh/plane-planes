var Mouse = {
    _x: 0,
    _y: 0,
    _pressed: {},

    LEFT_MOUSE: 1,
    RIGHT_MOUSE: 2,

    onMouseMove: function (event) {
        _x = WIDTH_HALF / 2 * ((event.clientX / SCREEN_WIDTH) * 2 - 1);
        _y = HEIGHT_HALF / 2 * (-(event.clientY / SCREEN_HEIGHT) * 2 + 1);
    },

    onMouseDown: function(event) {
        event.preventDefault();
        event.stopPropagation();
        this._pressed[event.which] = true;
    },

    onMouseUp: function (event) {
        event.preventDefault();
        event.stopPropagation();
        this._pressed[event.which] = false;
    },

    getX: function() { return _x; },
    getY: function() { return _y; }
};

document.addEventListener('mousemove', Mouse.onMouseMove, false);
document.addEventListener('mousedown', Mouse.onMouseDown, false);
document.addEventListener('mouseup', Mouse.onMouseUp, false);


/// <reference path="three.js" />

function GameObject() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.health = 0;
    this.material = null;
    this.mesh = null;
    this.layer = 0;
}

GameObject.prototype.update = function(delta) {
    this.mesh.position = this.position;
    this.mesh.scale.x = this.layer;
    this.mesh.scale.y = this.layer;
    this.mesh.needsUpdate = true;
}

GameObject.prototype.addToScene = function () {
    scene.add(this.mesh);
}

GameObject.prototype.draw = function () {
}

GameObject.prototype.destroy = function () {
    scene.remove(this.mesh);
}

GameObject.prototype.getMesh = function () {
    return this.mesh;
}

function Player() {
    GameObject.call(this);

    this.health = 100;
    var planeTexture = new THREE.ImageUtils.loadTexture('assets/airplane0.png');
    this.material = new THREE.MeshBasicMaterial({ map: planeTexture, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), this.material);

    this.maxLayerChangeSpeed = 100;
    this.lastLayerChange = Date.now();
    this.layer = Layers.MIDDLE;
    this.speed = 1000;

    this.moveUp = this.moveDown = this.moveLeft = this.moveRight = false;
}

Player.prototype = new GameObject();

Player.prototype.update = function (delta) {
    if (Date.now() > this.lastLayerChange + this.maxLayerChangeSpeed) {
        if (Key.isDown(Key.Q) && this.layer != Layers.TOP) {
            this.layer++;
        }
        if (Key.isDown(Key.E) && this.layer != Layers.BOTTOM) {
            this.layer--;
        }
        
        this.moveUp = Key.isDown(Key.W);
        this.moveDown = Key.isDown(Key.S);
        this.moveLeft = Key.isDown(Key.A);
        this.moveRight = Key.isDown(Key.D);

        this.lastLayerChange = Date.now();

        var direction = new THREE.Vector2((this.moveLeft ? 1 : 0 + this.moveRight ? -1 : 0), (this.moveUp ? 1 : 0 + this.moveDown ? -1 : 0)).normalize();
        this.position.x -= direction.x * this.speed * delta;
        this.position.y += direction.y * this.speed * delta;

    }

    this.position.z = this.layer;
    GameObject.prototype.update.call(this);
}


var bullets = [];
function Bullet() {
    GameObject.call(this);
    var bulletTexture = new THREE.ImageUtils.loadTexture('assets/bullet.png');

    this.material = new THREE.MeshBasicMaterial({ map: bulletTexture, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 6), this.material);
    this.speed = 100;
    bullets.push(this);
}

Bullet.prototype = new GameObject();

Bullet.prototype.update = function (delta) {
    if (this.position.y < -HEIGHT_HALF/2 || this.position.y > HEIGHT_HALF/2) {
        
        this.destroy();
        return false;
    }

    //// collide with enemies
    //for (var j = enemies.length - 1; j >= 0; j--) {
    //    var enemy = enemies[i];
    //    if (enemy.layer == bullet.layer && distance(enemy.position.x, enemy.position.y, bullet.position.x, bullet.position.y) < 10) {
    //        enemy.health -= 1;
    //    }
    //}

    //// collide with player
    //if (player.layer == bullet.layer && bullet.owner != player && distance(player.position.x, player.position.y, bullet.position.x, bullet.position.y) < 10) {
    //    player.health -= 1;
    //}

    this.position.y += this.speed * delta * this.ray.direction.y * this.layer;
    GameObject.prototype.update.call(this);
}
/// <reference path="three.js" />
var enemies = [];
var bullets = [];
var player;
var background;
var clouds = [];

function GameObject() {
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 0;
    this.health = 0;
    this.texture = null;
    this.material = null;
    this.mesh = null;
    this.layer = 0;
}

GameObject.prototype.update = function(delta) {
    this.mesh.position = this.position;
    this.mesh.scale.x = this.layer;
    this.mesh.scale.y = this.layer;
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
    this.texture = new THREE.ImageUtils.loadTexture('assets/airplane0.png');
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), this.material);

    this.layer = Layers.MIDDLE;
    this.speed = 100.0;

    this.weaponCooldown = 200;
    this.lastShotTime = 0;

    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.firing = false;

    this.spread = 0.1;

    this.changingLayers = false;
}

Player.prototype = new GameObject();

Player.prototype.update = function (delta) {
    
    if (!this.changingLayers && Key.isDown(Key.Q) && this.layer != Layers.TOP) {
        this.layer++;
        this.changingLayers = true;
    }
    if (!this.changingLayers && Key.isDown(Key.E) && this.layer != Layers.BOTTOM) {
        this.layer--;
        this.changingLayers = true;
    }

    if (!Key.isDown(Key.Q) && !Key.isDown(Key.E)) this.changingLayers = false;

    var distance = this.speed * delta;

    if (Key.isDown(Key.W)) this.mesh.translateY(distance);
    if (Key.isDown(Key.S)) this.mesh.translateY(-distance);
    if (Key.isDown(Key.A)) this.mesh.translateX(-distance);
    if (Key.isDown(Key.D)) this.mesh.translateX(distance);

    var now = Date.now();

    if (Key.isDown(Key.SPACE) && now - this.lastShotTime >= this.weaponCooldown) {
        var randX = -this.spread + 2 * Math.random() * this.spread;
        Bullet.spawn(this, new THREE.Vector3(randX, 1, 0));
        this.lastShotTime = now;
    }

    var maxX = WIDTH_HALF / 2 - 20;
    var maxY = HEIGHT_HALF / 2 - 20;
    if (this.position.x < -maxX) {
        this.position.x = -maxX;
    } else if (this.position.x > maxX) {
        this.position.x = maxX;
    }
    
    if (this.position.y < -maxY) {
        this.position.y = -maxY;
    } else if (this.position.y > maxY) {
        this.position.y = maxY;
    }

    this.position.z = this.layer;
    GameObject.prototype.update.call(this);
}

function Bullet() {
    GameObject.call(this);
    this.texture = renderer.cache.getSet('bullet',THREE.ImageUtils.loadTexture('assets/bullet.png'));
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 6), this.material);
    this.speed = 100 + Math.random() * 20;
    bullets.push(this);
}

Bullet.prototype = new GameObject();

Bullet.prototype.update = function (delta) {
    if (this.position.y < -HEIGHT_HALF/2 || this.position.y > HEIGHT_HALF/2) {
        
        this.destroy();
        return false;
    }

    // collide with enemies
    for (var j = enemies.length - 1; j >= 0; j--) {
        var enemy = enemies[j];
        if (enemy.layer == this.layer && distance(enemy.position.x, enemy.position.y, 
         this.position.x, this.position.y) < 10) {
            enemy.health -= 1;
            this.destroy();
            return false;
        }
    }

    // collide with player
    if (player.layer == this.layer && this.owner != player && 
     distance(player.position.x, player.position.y, this.position.x,
      this.position.y) < 10) {
        player.health -= 1;
    }

    this.position.y += this.speed * delta * this.ray.direction.y * this.layer;
    this.position.x += this.speed * delta * this.ray.direction.x * this.layer;
    GameObject.prototype.update.call(this);
}

Bullet.updateAll = function(delta) {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];

        if (false === bullet.update(delta)) {
            bullets.splice(i, 1);
        }
    }
}

Bullet.spawn = function (creator, direction, speed) {
    if (creator === undefined)
        return;
    
    var bullet = new Bullet();

    if (speed % 1 === speed) {
        bullet.speed = speed;
    }
    bullet.position.set(creator.position.x, creator.position.y, creator.position.z);

    bullet.ray = new THREE.Ray(creator.position, direction);

    bullet.layer = creator.layer;
    bullet.owner = creator;

    bullet.addToScene();
    GameObject.prototype.update.call(bullet);
}


function Background() {
    GameObject.call(this);

    this.texture = new THREE.ImageUtils.loadTexture('assets/tilebackground.png');
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.RepeatWrapping;
    this.texture.repeat.set(100, 100);

    this.material = new THREE.MeshBasicMaterial({ map: this.texture });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 128, 128), this.material);
    this.layer = -10;
    
    this.speed = 2.0;
}

Background.prototype = new GameObject();

Background.prototype.update = function (delta) {
    this.texture.offset.y += delta * this.speed;
}


function Cloud() {
    GameObject.call(this);

    this.texture = new THREE.ImageUtils.loadTexture('assets/cloud.png');
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true, opacity: 0.4 });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), this.material);
    this.layer = Math.ceil(Math.random() * 3);
    this.position = new THREE.Vector3(WIDTH_HALF / 2 - Math.round(Math.random() * WIDTH_HALF), HEIGHT_HALF / 2 - Math.round(Math.random() * HEIGHT_HALF), this.layer + Math.random());
    this.speed = 10;
}

Cloud.prototype = new GameObject();

Cloud.prototype.update = function (delta) {
    if (this.position.y < -((50 * this.layer) + HEIGHT_HALF / 2)) {
        this.layer = Math.ceil(Math.random() * 3);
        this.position.set(WIDTH_HALF / 2 - Math.round(Math.random() * WIDTH_HALF), HEIGHT_HALF / 2 + (50 * this.layer), this.layer + Math.random());
        return;
    }

    this.mesh.translateY(-delta * this.speed * this.layer);
    GameObject.prototype.update.call(this);
}

Cloud.generateClouds = function(numberToCreate) {
    while (clouds.length < numberToCreate) {
        var cloud = new Cloud();
        clouds.push(cloud);
        cloud.addToScene();
    }
}

Cloud.updateAll = function (delta) {
    for (var i = clouds.length - 1; i >= 0; i--) {
            clouds[i].update(delta)
        }
}

function Enemy() {
    GameObject.call(this);
    
    this.texture = new THREE.ImageUtils.loadTexture('assets/enemy1.png');
    this.material = new THREE.MeshBasicMaterial({ map: this.texture, transparent: true });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), this.material);
    this.layer = Layers.MIDDLE;
    this.position = new THREE.Vector3(0, 0, 0);
    this.speed = 100.0;
    this.health = 1;

    enemies.push(this);
}

Enemy.prototype = new GameObject();

Enemy.prototype.update = function (delta) {
    var toReturn = true;
    // should probably have different patterns of enemy behavior here
    this.position.y += delta * this.ray.direction.y * this.layer;
    this.position.x += delta * this.ray.direction.x * this.layer;

    // collide with player
    if (player.layer == this.layer &&  
     distance(player.position.x, player.position.y, this.position.x,
      this.position.y) < 8 * this.layer) {
        player.health -= 1;
        playerCrashed = true;
        toReturn = false;
    }

    GameObject.prototype.update.call(this);

    return toReturn;
}

Enemy.updateAll = function(delta) {
    for (var i = enemies.length - 1; i >= 0; i--) {
        var enemy = enemies[i];
        var destroy = false;
        if (enemy.health <= 0) {
            score += 10;
            destroy = true;
        } else if (false === enemy.update(delta)) {
            destroy = true;
        }

        if (destroy) {
            enemy.destroy();
            enemies.splice(i, 1);
        }
    }
}

Enemy.spawn = function (position, direction) {
    var enemy = new Enemy();

    enemy.position.copy(position);

    enemy.ray = new THREE.Ray(position, direction);
    enemy.layer = position.z;

    enemy.addToScene();
    GameObject.prototype.update.call(enemy);
}


function GlobalState() {
    this.paused = false;
    this.muted = localStorage.getItem('muted') || false;
    createjs.Sound.setMute(this.muted);
    this.muting = false;
    this.pausing = false;
}

GlobalState.prototype.update = function () {
    if (!this.pausing && Key.isDown(Key.P)) {
        this.togglePause();
    }
    if (!this.muting && Key.isDown(Key.M)) {
        this.toggleMute();
    }
    
    if (!Key.isDown(Key.P)) this.pausing = false;
    if (!Key.isDown(Key.M)) this.muting = false;
    
    
}

GlobalState.prototype.togglePause = function () {
    this.paused = !this.paused;
    createjs.Sound.setMute(this.muted || this.paused);
    this.pausing = true;
}

GlobalState.prototype.toggleMute = function () {
    this.muted = !this.muted
    createjs.Sound.setMute(this.muted);
    localStorage.setItem('muted', this.muted);
    if (bgMusic) {
        bgMusic.setMute(this.muted);
        this.muting = true;
    }
}

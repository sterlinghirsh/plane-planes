﻿/// <reference path="three.js" />

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
    this.mesh.scale.x = this.layer * 2;
    this.mesh.scale.y = this.layer * 2;
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
        this.lastLayerChange = Date.now();
    }

    this.position.z = this.layer;
    GameObject.prototype.update.call(this);
}

function Bullet() {
    GameObject.call(this);
    this.material = new THREE.MeshBasicMaterial({ color: 0x444444 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(2, 6, 6), this.material);
    this.speed = 10;
}

Bullet.prototype = new GameObject();

Bullet.prototype.update = function (delta) {
    this.position.y += this.speed * delta * this.ray.direction.y * this.layer;
    GameObject.prototype.update.call(this);
}
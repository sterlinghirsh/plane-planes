/// <reference path="three.js" />
var score = 0;

var scene, renderer, container, cube, camera, plane;

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight;

var WIDTH_HALF = SCREEN_WIDTH / 2,
    HEIGHT_HALF = SCREEN_HEIGHT / 2;

function setup() {

    createScene();
    
    draw();
}

function createScene() {
    scene = new THREE.Scene();


    const VIEW_ANGLE = 75,
        ASPECT_RATIO = window.innerWidth / window.innerHeight,
        NEAR_PLANE = 0.1,
        FAR_PLANE = 10000;


    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE);
    scene.add(camera);

    camera.position.z = 150;
    camera.position.y = -10;
    //camera.rotation.x = 45 * Math.PI / 180;
    camera.lookAt = new THREE.Vector3(0, 0, 0);

    // initialize WebGL and make it the size of the browser window
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    container = document.getElementById("canvas");
    container.appendChild(renderer.domElement);

    cube = new THREE.Mesh(
            new THREE.CubeGeometry(1, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0x00ff00 })
        );
    scene.add(cube);

    var pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 50;
    pointLight.position.y = 50;
    pointLight.position.z = 130;
    scene.add(pointLight);
    
    // create background
    var planeTexture = new THREE.ImageUtils.loadTexture('assets/airplane0.png');

    var planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture, transparent: true, side: THREE.DoubleSide  });
    planeTexture.needsUpdate = true;
    plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 10, 10), planeMaterial);
    plane.position.z = -3;
    scene.add(plane);
    document.addEventListener('mousemove', handleMouseMove, false);
}

function draw() {

    renderer.render(scene, camera);
    requestAnimationFrame(draw);

    update();
    updateScore();
};

function update() {

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.02;

    if (Key.isDown(Key.W))
    {
        plane.position.z += 10;
    }
    if (Key.isDown(Key.S)) {
        plane.position.z -= 10;
    }
}

function updateScore() {
    $("#score").text(score);
}

function handleMouseMove(event) {
    $("#clientx").text(event.clientX);
    $("#clienty").text(event.clientY);

    var vector = new THREE.Vector3(
        (event.clientX / SCREEN_WIDTH) * 2 - 1,
        -(event.clientY / SCREEN_HEIGHT) * 2 + 1,
        0.5);
    var projector = new THREE.Projector();

    projector.unprojectVector(vector, camera);

    var dir = vector.sub(camera.position).normalize();

    var distance = -camera.position.z / dir.z;

    var pos = camera.position.clone().add(dir.multiplyScalar(distance));


    plane.position.x = pos.x;
    plane.position.y = pos.y;

}
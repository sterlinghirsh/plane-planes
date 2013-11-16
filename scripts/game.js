var score = 0;

var scene, renderer, cube, camera;

function setup() {

    createScene();
    draw();

}

function createScene() {
    // initialize WebGL and make it the size of the browser window
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var canvas = document.getElementById("canvas");
    canvas.appendChild(renderer.domElement);

    const VIEW_ANGLE = 75,
        ASPECT_RATIO = window.innerWidth / window.innerHeight,
        NEAR_PLANE = 0.1,
        FAR_PLANE = 1000;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT_RATIO, NEAR_PLANE, FAR_PLANE);
    camera.position.z = 10;
    camera.position.y = -10;

    camera.rotation.x = 45 * Math.PI / 180;
    camera.lookAt = new THREE.Vector3(0, 100, 0);

    scene = new THREE.Scene();
    scene.add(camera);

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
    var planeMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), planeMaterial);
    plane.position.z = -3;
    plane.receiveShadow = true;
    scene.add(plane);
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
    score += 1;
}

function updateScore() {
    $("#score").val(score);
}
/// <reference path="three.js" />
/// <reference path="jquery-2.0.3.js" />

var score = 0;

var scene, renderer, container, cube, camera, plane, projector, clock, material_depth;

var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight;

var WIDTH_HALF = SCREEN_WIDTH / 2,
    HEIGHT_HALF = SCREEN_HEIGHT / 2;

const bulletSpeed = 100;

const maxLayerChangeSpeed = 100;
var lastLayerChange = Date.now();

// need a better DOF setup, but will work on mechanics first
var postprocessing = { enabled: false };

var Layers = function () {
    return {
        'BOTTOM': 1,
        'MIDDLE': 2,
        'TOP': 3
    }
}();

var currentLayer = Layers.MIDDLE;

function setup() {

    init();
    
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', handleMouseMove, false);

    // disable accidental right clicks triggering the context menu
    $(document).ready(function () {
        $(document).bind("contextmenu", function (e) {
            return false;
        });
    });

    mainGameLoop();
}

function init() {
    scene = new THREE.Scene();
    projector = new THREE.Projector();
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera = new THREE.OrthographicCamera(WIDTH_HALF / -2, WIDTH_HALF / 2, HEIGHT_HALF / 2, HEIGHT_HALF / -2, 1, 200);
    camera.position.z = 150;
    camera.position.y = -10;

    container = document.getElementById("canvas");
    container.appendChild(renderer.domElement);

    setupModels();

    $(document).click(function (button) {
        button.preventDefault;
        if (button.which === 1) {
            spawnBullet(plane);
        }
    });

    clock = new THREE.Clock();


    material_depth = new THREE.MeshDepthMaterial();

    initPostprocessing();
}

function initPostprocessing() {

    postprocessing.scene = new THREE.Scene();

    postprocessing.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
    postprocessing.camera.position.z = 100;

    postprocessing.scene.add(postprocessing.camera);

    var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
    postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);
    postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);

    var bokeh_shader = THREE.BokehShader;

    postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

    postprocessing.bokeh_uniforms["tColor"].value = postprocessing.rtTextureColor;
    postprocessing.bokeh_uniforms["tDepth"].value = postprocessing.rtTextureDepth;
    postprocessing.bokeh_uniforms["focus"].value = 1.1;
    postprocessing.bokeh_uniforms["aspect"].value = window.innerWidth / window.innerHeight;

    postprocessing.materialBokeh = new THREE.ShaderMaterial({

        uniforms: postprocessing.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader

    });

    postprocessing.quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), postprocessing.materialBokeh);
    postprocessing.quad.position.z = -500;
    postprocessing.scene.add(postprocessing.quad);

}

function setupModels() {

    cube = new THREE.Mesh(
            new THREE.CubeGeometry(10, 10, 10),
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
    scene.add(plane);
}

function mainGameLoop() {
    requestAnimationFrame(mainGameLoop, renderer.domElement);
    render();
    update();
};

function render() {

    if (postprocessing.enabled) {
        renderer.clear();
        scene.overrideMaterial = null;
        renderer.render(scene, camera, postprocessing.rtTextureColor, true);

        scene.overrideMaterial = material_depth;
        renderer.render(scene, camera, postprocessing.rtTextureDepth, true);
        renderer.render(postprocessing.scene, postprocessing.camera);
    }
    else {
        renderer.render(scene, camera);
    }
    

}

function update() {
    var delta = clock.getDelta();

    updateBullets(delta);
    updatePlayerShip(delta);
    updateScore();
}

function updateBullets(delta) {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        if (bullet.position.y < -HEIGHT_HALF || bullet.position.y > HEIGHT_HALF) {
            bullets.splice(i, 1);
            scene.remove(bullet);
            continue;
        }

        // collide with enemies

        // collide with player
        if (plane.layer == bullet.layer && distance(plane.position.x, plane.position.y, bullet.position.x, bullet.position.y) < 10  && bullet.owner != plane)
        {
            score -= 10;
        }
        bullet.ray.direction.y

        bullet.translateY(bulletSpeed * delta * bullet.ray.direction.y * bullet.layer);
    }
}

function distance(x1,y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

var bullets = [];

var bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
var bulletGeometry = new THREE.SphereGeometry(2, 6, 6);

function spawnBullet(creator, layer) {
    if (creator === undefined)
        return;
    
    var bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.set(creator.position.x, creator.position.y, creator.position.z);
   

    var bulletDirection;
    
    bullet.ray = new THREE.Ray(creator.position, new THREE.Vector3(0, 1, 0));

    bullet.layer = currentLayer;
    bullet.scale.x = currentLayer;
    bullet.scale.y = currentLayer;

    bullet.owner = creator;
    bullets.push(bullet);
    scene.add(bullet);

    return bullet;

}

function updatePlayerShip(delta) {
    if (Date.now() > lastLayerChange + maxLayerChangeSpeed) {
        if (Key.isDown(Key.Q) && currentLayer != Layers.TOP) {
            currentLayer++;
        }
        if (Key.isDown(Key.E) && currentLayer != Layers.BOTTOM) {
            currentLayer--;
        }
        lastLayerChange = Date.now();
    }

    if (Key.isDown(Key.A)) {
        cube.rotation.x += 0.1;
    }

    if (Key.isDown(Key.D)) {
        cube.rotation.y += 0.1;
    }



    plane.position.z = currentLayer;
    plane.scale.x = currentLayer * 2;
    plane.scale.y = currentLayer * 2;

}

function updateScore() {
    $("#score").text(score);
}

function handleMouseMove(event) {
    $("#clientx").text(event.clientX);
    $("#clienty").text(event.clientY);

    //plane.position.x = event.clientX - WIDTH_HALF;
    //plane.position.y = -event.clientY + HEIGHT_HALF;
    var vector = new THREE.Vector3(
    (event.clientX / SCREEN_WIDTH) * 2 - 1,
    -(event.clientY / SCREEN_HEIGHT) * 2 + 1,
    0.5);

    projector.unprojectVector(vector, camera);

    var dir = vector.sub(camera.position).normalize();

    var distance = -camera.position.z / dir.z;

    var pos = camera.position.clone().add(dir.multiplyScalar(distance));
    plane.position.x = pos.x;
    plane.position.y = pos.y;

}

function onWindowResize(event) {

    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    WIDTH_HALF = SCREEN_WIDTH / 2;
    HEIGHT_HALF = SCREEN_HEIGHT / 2;
    
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    camera.updateProjectionMatrix();
}
/// <reference path="three.js" />
/// <reference path="jquery-2.0.3.js" />

const windowMargin = 10;

var score = 0;

var scene, renderer, container, cube, camera, projector, clock, material_depth;

var player;

var background;

var SCREEN_WIDTH,
    SCREEN_HEIGHT,
    WIDTH_HALF,
    HEIGHT_HALF;

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
var stats;
function init() {
    stats = new Stats();
    stats.setMode(0); // 0: fps, 1: ms

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild(stats.domElement);

    setWindowSize();

    scene = new THREE.Scene();
    projector = new THREE.Projector();
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    camera = new THREE.OrthographicCamera(WIDTH_HALF / -2, WIDTH_HALF / 2, HEIGHT_HALF / 2, HEIGHT_HALF / -2, -500, 2000);
    camera.position.z = 10;
    camera.position.y = 0;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    container = document.getElementById("canvas");
    container.appendChild(renderer.domElement);

    setupModels();

    $(document).click(function (button) {
        button.preventDefault;
        if (button.which === 1) {
            spawnBullet(player);
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

    player = new Player();
    player.addToScene();

    var backgroundTexture = new THREE.ImageUtils.loadTexture('assets/tilebackground.png');
    backgroundTexture.wrapS = THREE.RepeatWrapping;
    backgroundTexture.wrapT = THREE.RepeatWrapping;
    backgroundTexture.repeat.set(100, 100);

    var backgroundMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
    background = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 128, 128), backgroundMaterial);
    background.position.z = -10;
    background.texture = backgroundTexture;
    scene.add(background);

    while (clouds.length < 30) {
        var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);

        cloud.layer = Math.ceil(Math.random() * 3);
        cloud.position.set(WIDTH_HALF / 2 - Math.round(Math.random() * WIDTH_HALF), HEIGHT_HALF / 2 - Math.round(Math.random() * HEIGHT_HALF), cloud.layer +  Math.random());
        cloud.scale.x = cloud.layer;
        cloud.scale.y = cloud.layer;

        clouds.push(cloud);
        scene.add(cloud);
    }
}

function mainGameLoop() {
    requestAnimationFrame(mainGameLoop, renderer.domElement);
    update();
    render();
    stats.update();
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

    updateBackground(delta);
    updateBullets(delta);
    player.update(delta);
    updateScore();
}

var clouds = [];
var cloudMaterial = new THREE.MeshBasicMaterial({ map: new THREE.ImageUtils.loadTexture('assets/cloud.png'), transparent: true, opacity: 0.4});
var cloudGeometry = new THREE.PlaneGeometry(50,50);
function updateBackground(delta) {
    background.texture.offset.y += delta * 5;


    for (var i = clouds.length - 1; i >= 0; i--) {
        var cloud = clouds[i];
        if (cloud.position.y < -((50 * cloud.layer) + HEIGHT_HALF / 2)) {
            cloud.layer = Math.ceil(Math.random() * 3);
            cloud.position.set(WIDTH_HALF / 2 - Math.round(Math.random() * WIDTH_HALF), HEIGHT_HALF / 2 + (50 * cloud.layer), cloud.layer + Math.random());
            cloud.scale.x = cloud.layer;
            cloud.scale.y = cloud.layer;

            continue;
        }
        cloud.translateY(-delta * 10 * cloud.layer);
    }

    

}

var enemies = [];

function updateBullets(delta) {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        
        if (false === bullet.update(delta)) {
            bullets.splice(i, 1);
        }
    }
}

function distance(x1,y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}


function spawnBullet(creator) {
    if (creator === undefined)
        return;
    
    var bullet = new Bullet();
    bullet.position.set(creator.position.x, creator.position.y, creator.position.z);

    bullet.ray = new THREE.Ray(creator.position, new THREE.Vector3(0, 1, 0));

    bullet.layer = creator.layer;

    bullet.owner = creator;

    bullet.addToScene();

    return bullet;

}

function updateScore() {
    $("#score").text(score);
}

function handleMouseMove(event) {
    //$("#clientx").text(event.clientX);
    //$("#clienty").text(event.clientY);

    //var vector = new THREE.Vector3( (event.clientX / SCREEN_WIDTH) * 2 - 1,
    //                                -(event.clientY / SCREEN_HEIGHT) * 2 + 1,
    //                                0.5);

    //player.position.x = vector.x * WIDTH_HALF/2;
    //player.position.y = vector.y * HEIGHT_HALF/2;

}

function onWindowResize(event) {
    setWindowSize();
    
    camera.left = WIDTH_HALF / -2;
    camera.right = WIDTH_HALF / 2;
    camera.top = HEIGHT_HALF / 2;
    camera.bottom = HEIGHT_HALF / -2;

    camera.updateProjectionMatrix();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

}

function setWindowSize() {
    SCREEN_WIDTH = $(window).width() - windowMargin;
    SCREEN_HEIGHT = $(window).height() - windowMargin;

    WIDTH_HALF = SCREEN_WIDTH / 2;
    HEIGHT_HALF = SCREEN_HEIGHT / 2;
}
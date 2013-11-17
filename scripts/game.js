/// <reference path="three.js" />
/// <reference path="jquery-2.0.3.js" />

const windowMargin = 10;

var score = 0;
var playerCrashed = false;

var scene, renderer, container, cube, camera, projector, clock, material_depth;

var SCREEN_WIDTH,
    SCREEN_HEIGHT,
    WIDTH_HALF,
    HEIGHT_HALF;

const bulletSpeed = 100;

// need a better DOF setup, but will work on mechanics first
var postprocessing = { enabled: false };

var Layers = function () {
    return {
        'BOTTOM': 1,
        'MIDDLE': 2,
        'TOP': 3
    }
}();

var bgMusic;
var globalState;


function setup() {

    globalState = new GlobalState();
    init();
    
    window.addEventListener('resize', onWindowResize, false);

    if (!createjs.Sound.initializeDefaultPlugins()) {
       alert("Sound is unavailable.");
    } else {
        var manifest = [
            {id: "Music1", src: "music/plane-planes1.mp3|music/plane-planes1.ogg"}, 
            {id: "Music2", src: "music/plane-planes2.mp3|music/plane-planes2.ogg"}, 
            {id: "Music3", src: "music/plane-planes3.mp3|music/plane-planes3.ogg"}
        ];

        createjs.Sound.addEventListener("fileload", function(ev) {
            // Initialize Music
            if (ev.id == 'Music2')
                bgMusic = createjs.Sound.play(ev.src, {
                    interrupt: createjs.Sound.INTERRUPT_ANY,
                    loop: -1,
                    volume: 0.2
                });
        });

        createjs.Sound.registerManifest(manifest);
    }

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
    renderer.cache = new MicroCache();

    camera = new THREE.OrthographicCamera(WIDTH_HALF / -2, WIDTH_HALF / 2, HEIGHT_HALF / 2, HEIGHT_HALF / -2, -500, 2000);
    camera.position.z = 10;
    camera.position.y = 0;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    container = document.getElementById("canvas");
    container.appendChild(renderer.domElement);

    setupModels();

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

    /*
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
    */

    player = new Player();
    player.addToScene();

    background = new Background();
    background.addToScene();

    Cloud.generateClouds(30);
}

function mainGameLoop() {
    render();
    update();
    requestAnimationFrame(mainGameLoop, renderer.domElement);
};

function render() {
    if (postprocessing.enabled) {
        renderer.clear();
        scene.overrideMaterial = null;
        renderer.render(scene, camera, postprocessing.rtTextureColor, true);

        scene.overrideMaterial = material_depth;
        renderer.render(scene, camera, postprocessing.rtTextureDepth, true);
        renderer.render(postprocessing.scene, postprocessing.camera);
    } else {
        renderer.render(scene, camera);
    }
}

function update() {
    if (playerCrashed) {
        document.getElementById('gameOver').style.display = "block";
    } else {
        var delta = clock.getDelta();
        globalState.update();
        
        if (!globalState.paused) {
            // Change this for increased difficulty.
        if (Math.random() <  0.01) {
            if (Math.random() < enemySpawnChance) {
                var maxX = WIDTH_HALF / 2 - 20;
                var randX = maxX - 2 * maxX * Math.random();
            var layer = Math.round(Math.random() * 3);            
                Enemy.spawn(new THREE.Vector3(randX, HEIGHT_HALF / 1.5, layer), new THREE.Vector3(0, -10, 0));
            }

            Cloud.updateAll(delta);
            background.update(delta);
            Bullet.updateAll(delta);
            Enemy.updateAll(delta);
            player.update(delta);
            updateScore();
        }
    }
    stats.update();
}



function distance(x1,y1, x2, y2) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function updateScore() {
    $("#score").text(score);
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

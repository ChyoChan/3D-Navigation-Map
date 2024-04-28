import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

var clock = new THREE.Clock();

const threeDContainer = document.getElementById('threedmodel');

let threeDPath = [];
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveUp = false;
var moveDown = false;
let direction = new THREE.Vector3();
var canJump = false;

// var canJump = false;
// var spaceUp = true;
// var moveUpSpeed = 100;

var velocity = new THREE.Vector3(); // moving speed
// var direction = new THREE.Vector3(); // moving direction
// var rotation = new THREE.Vector3(); // camera direction

// Set up Scene, Camera, and renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // Scene size
renderer.setClearColor(0xeeeeee); //set default color when no model in the scene
renderer.setPixelRatio(window.devicePixelRatio); //set ratio to different device

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
var controls = new PointerLockControls(camera, threeDContainer);
const controllerCamera = controls.getObject();




// add reference line
var group = new THREE.Group();
var xAxis = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 10, 0xff0000);
var yAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 10, 0x0000ff);
var zAxis = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 10, 0x00ff00);
group.add(xAxis);
group.add(yAxis);
group.add(zAxis);
scene.add(group);


// set a shpere in the origin
const Triangle = new THREE.ConeGeometry(0.3, 0.9, 3);
const circle = new THREE.SphereGeometry(0.2, 64, 32);
const Rmaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const Gmaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const Bmaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });


// Load 3D model
function init() {

    const loader = new GLTFLoader().setPath('map/');

    loader.load('56_16.0.gltf', function (gltf) { // load the 3D map to the scene
        const mesh = gltf.scene; // the object of the map
        mesh.position.set(0, -0.5, 0); // set position of the map
        scene.add(mesh); // add the map to the scene 

        const ambientLight = new THREE.AmbientLight(0x707070, 1);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(0, 50, 0);
        scene.add(pointLight);
    }, function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
        // called when loading has errors
        function (error) {
            console.log('An error happened');
        });
    document.getElementById("threedmodel").appendChild(renderer.domElement);
    PLControls();
}
// Controller 
function PLControls() {
    controllerCamera.position.set(30, 15, 36); // set position of the camera 
    controls.getObject().lookAt(27, -0.4, 56); // look at the maps
    scene.add(controllerCamera);

    threeDContainer.addEventListener('click', () => { controls.lock(); }, false); // click to lick the mouse in the scene

    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'ControlLeft':
                moveUp = true;
                break;
            case 'ShiftLeft':
                moveDown = true;
                break;
        }
    };

    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
            case 'ControlLeft':
                moveUp = false;
                break;
            case 'ShiftLeft':
                moveDown = false;
                break;
        }
    };
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}
var i = 0;
function check() {
    if (controls.isLocked === true) {
        var delta = clock.getDelta(); // refresh time
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        //velocity.y -= velocity.y * 10.0 * delta;

        velocity.y -= velocity.y * 100.0 * delta; // 100.0 = mass (down speed)
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // Ensures consistent movements in all directions

        // if (i === 284) {
        //     console.log(direction.z);
        //     i = 0;
        // }
        // i ++;
        // rotation.copy(controllerCamera.getWorldDirection().multiply(new THREE.Vector3(-1, 0 ,-1)));
        // rotation.applyMatrix4(new THREE.Matrix4());

        if (moveForward) velocity.z -= 100.0 * delta;
        if (moveBackward) velocity.z -= -100.0 * delta;
        if (moveLeft) velocity.x -= 100.0 * delta;
        if (moveRight) velocity.x -= -100.0 * delta;
        if (moveUp) velocity.y -= -100.0 * delta;
        if (moveDown) velocity.y -= 100.0 * delta;

        controls.getObject().translateX(velocity.x * delta); // update the x-axis of camera
        controls.getObject().translateY(velocity.y * delta); // update the y-axis of camera
        controls.getObject().translateZ(velocity.z * delta); // update the z-axis of camera


        if (controls.getObject().position.y < -9) {
            velocity.y = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
        if (controls.getObject().position.x < 1) {
            velocity.x = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
        if (controls.getObject().position.z < 1) {
            velocity.z = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
        if (controls.getObject().position.x > 55.8) {
            velocity.x = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
        if (controls.getObject().position.z > 89) {
            velocity.z = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
        if (controls.getObject().position.y > 18) {
            velocity.y = 0;
            controls.getObject().position.set(30, 15, 36);
            controls.getObject().lookAt(27, -0.4, 56); // look at the maps
            canJump = true;
        }
    }
}

// Render the scene
function render() {
    requestAnimationFrame(render);
    check();
    renderer.render(scene, camera);
};



document.addEventListener("DOMContentLoaded", function () {
    function switchmap() {
        document.getElementById("switchmap").addEventListener("click", function () {
            document.getElementById("threedcontainer").style.visibility = 'visible';
            document.getElementById("twodmapcontainer").style.visibility = 'hidden';
            init();
            render();
            threeDActive = true;
        });
    }
    function switchtwod() {
        document.getElementById("switch2d").addEventListener("click", function () {
            document.getElementById("twodmapcontainer").style.visibility = 'visible';
            document.getElementById("threedcontainer").style.visibility = 'hidden';
            threeDActive = false;
        });
    }
    switchmap();
    switchtwod();
})

// Resize window
window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

displaythreeDpath = function () {
    var PYcod;
    var Xcod;
    var Zcod;
    var obj;
    var Ycod;
    var material;
    var EY = 5.4;
    var EX = 23;
    var Eshpere;
    console.log(done)
    if (done) {
        for (var i = 0; i < threeDPath.length; i++) {
            scene.remove(threeDPath[i]);
        }
        done = false
        threeDPath = []
        console.log("removed 3dpath")
        
    }
    console.log(current_floor)
    console.log(roomIndex_start)
    console.log(roomIndex_end)
    if (!sameFloor) {
        for (var Z = 38; Z < 53; Z++) {

            if (Z == 41) {
                EY -= 0.2;
            }
            else if (Z >= 50) {
                if (Z <= 53) {
                    EY -= 0.2;
                }
            }
            else if (Z > 40) {
                EY -= 0.6;
            }
            if (Z >= 41) {
                EX += 0.2;
            }
            if (Z == 52) {
                EX += 0.7;
            }
            Eshpere = new THREE.Mesh(circle, Bmaterial);
            scene.add(Eshpere);
            Eshpere.position.set(EX, EY, Z);
            threeDPath.push(Eshpere);
        }
    }

    if (roomNum_Start[0] == '5') {
        PYcod = -0.4;
        Ycod = -0.4;
    }
    else if (roomNum_Start[0] == '6') {
        PYcod = 5.2;
        Ycod = 5.2;
    }
    else if (current_floor[0] == "5"){
        PYcod = -0.4;
        Ycod = -0.4;
    }
    else if (current_floor[0] == "6"){
        PYcod = 5.2;
        Ycod = 5.2;
    }
    if (roomIndex_start == roomSet["5Escalator"] || roomIndex_end == roomSet["5Escalator"]) {
        Ycod = -0.4;
    }
    else if (roomIndex_start == roomSet["6Escalator"] || roomIndex_end == roomSet["6Escalator"]) {
        Ycod = 5.2;
    }
    if (reset1) {
        camera.position.set(roomSet[roomNum_Start][0], PYcod + 1, roomSet[roomNum_Start][1]);
        if (roomNum_Start[0] == "5"){
            if (roomNum_End[0] == "5"){
                controls.getObject().lookAt(30, Ycod + 1, 36);
            }
            else if (roomNum_End[0] == "6"){
                controls.getObject().lookAt(roomSet["6Escalator"][0], Ycod-5, roomSet["6Escalator"][1]);
            }
        }
        else if (roomNum_Start[0] == "6"){
            if (roomNum_End[0] == "6"){
                controls.getObject().lookAt(30, Ycod + 1, 36);
            }
            else if (roomNum_End[0] == "5"){
                controls.getObject().lookAt(roomSet["6Escalator"][0], Ycod-5, roomSet["6Escalator"][1]);
            }
        }

        reset1 = false;
    }

    for (var i = test.length - 1; i >= 0; i--) {
        Xcod = test[i].x;
        Zcod = test[i].y;

        if (i == 0 && (sameFloor || roomIndex_start == roomSet["5Escalator"] || roomIndex_start == roomSet["6Escalator"])) { // end point 

            material = Rmaterial;
            obj = new THREE.Mesh(Triangle, material);
            scene.add(obj);
            obj.rotateX(Math.PI);
            obj.position.set(Xcod, Ycod + 2.5, Zcod);
            threeDPath.push(obj);
            
            done = true;
            
        }
        else if (i == test.length - 1 && (sameFloor || roomIndex_end == roomSet["5Escalator"] || roomIndex_end == roomSet["6Escalator"])) { // start point

            material = Gmaterial;
            obj = new THREE.Mesh(Triangle, material);
            scene.add(obj);
            obj.rotateX(Math.PI);
            obj.position.set(Xcod, Ycod + 2.5, Zcod);
            threeDPath.push(obj);

        }
        else {
            material = Bmaterial;
        }
        obj = new THREE.Mesh(circle, material);
        scene.add(obj);
        obj.position.set(Xcod, Ycod, Zcod);
        threeDPath.push(obj);

    }
    return 0;
}

var ptArray = [];

switch56();

function rmPt(a) {
    ptArray.splice(a, 1);
}

function switch56() {
    var cameraX = camera.position.x;
    var cameraZ = camera.position.z;
    var cameraY = camera.position.y;
    var mini_current_image = current_image;
    if (isMinimap == true) {
        redraw();
        if (wrongFloor){
            test = []
            testb = false;
        }
        noFill();
        stroke('blue');
        strokeWeight(w / 4);
        beginShape();
        for (var i = 0; i < test.length; i++) {
            vertex(test[i].x * w + w / 2, test[i].y * h + h / 2);
        }
        endShape();

        stroke('black');
        fill('orange')
        strokeWeight(1);
        ellipse(cameraX * o * (275 / 1000), cameraZ * k * (495 / 1800), 5, 5);


        if(testb){

            start.show_node('green', 0, 0);
            end.show_node('red', 0, 0);
        }
        
        if (cameraY >= 5.2) {
            current_image = img6f;
            current_floor = "6f"
        } else if (cameraY < 5.2) {
            current_image = img5f;
            current_floor = "5f"
        }
    }

    if (mini_current_image != current_image) {
        reset();
        loop();
        mini_current_image = current_image;

    }
    setTimeout(switch56, 100);
}

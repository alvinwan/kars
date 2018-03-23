/**
 *
 * KARS
 * ----
 * Survival driving game, created by Alvin Wan (alvinwan.com)
 */

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
    green:0x669900,
    greenDark:0x496d01,
    golden:0xff9900
};

/**
 *
 * STEP 0
 * ------
 * Copy car customization.
 */

var bodyColor = Colors.brown;
var roofColor = Colors.brown;
var bumperColor = Colors.brownDark;
var grateColor = Colors.brownDark;
var doorColor = Colors.brown;
var handleColor = Colors.brownDark;

/********** End step 0 **********/

function init() {

	// set up the scene, the camera and the renderer
	createScene();

	// add the lights
	createLights();

	/**
     *
     * STEP 1
     * ------
     * Create objects, namely ground and car.
     */

    createGround();
    createCar();

    /********** End step 1 **********/

    // add controls
    createControls();

	// start a loop that will update the objects' positions
	// and render the scene on each frame
	loop();
}

/**
 *
 * RENDER
 * ------
 * Initial setup for camera, renderer, fog
 *
 * Boilerplate for scene, camera, renderer, lights taken from
 * https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
 */
var scene,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer, container;

function createScene() {
	// Get the width and the height of the screen,
	// use them to set up the aspect ratio of the camera
	// and the size of the renderer.
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;

	// Create the scene
	scene = new THREE.Scene();

	// Add a fog effect to the scene; same color as the
	// background color used in the style sheet
	scene.fog = new THREE.Fog(0xbadbe4, 500, 900);

	// Create the camera
	aspectRatio = WIDTH / HEIGHT;
	fieldOfView = 60;
	nearPlane = 1;
	farPlane = 10000;
	camera = new THREE.PerspectiveCamera(
		fieldOfView,
		aspectRatio,
		nearPlane,
		farPlane
		);

	// Set the position of the camera
	camera.position.set( 0, 400, 400 );
    camera.lookAt( 0, 0, 0 );

	// Create the renderer
	renderer = new THREE.WebGLRenderer({
		// Allow transparency to show the gradient background
		// we defined in the CSS
		alpha: true,

		// Activate the anti-aliasing; this is less performant,
		// but, as our project is low-poly based, it should be fine :)
		antialias: true
	});

	// Define the size of the renderer; in this case,
	// it will fill the entire screen
	renderer.setSize(WIDTH, HEIGHT);

	// Enable shadow rendering
	renderer.shadowMap.enabled = true;

	// Add the DOM element of the renderer to the
	// container we created in the HTML
	container = document.getElementById('world');
	container.appendChild(renderer.domElement);

	// Listen to the screen: if the user resizes it
	// we have to update the camera and the renderer size
	window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
	// update height and width of the renderer and the camera
	HEIGHT = window.innerHeight;
	WIDTH = window.innerWidth;
	renderer.setSize(WIDTH, HEIGHT);
	camera.aspect = WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
}


/**
 *
 * LIGHTS
 * ------
 * Utilities for applying lights in scene
 */
var hemisphereLight, shadowLight;

function createLights() {
	// A hemisphere light is a gradient colored light;
	// the first parameter is the sky color, the second parameter is the ground color,
	// the third parameter is the intensity of the light
	hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

	// A directional light shines from a specific direction.
	// It acts like the sun, that means that all the rays produced are parallel.
	shadowLight = new THREE.DirectionalLight(0xffffff, .9);

	// Set the direction of the light
	shadowLight.position.set(150, 350, 350);

	// Allow shadow casting
	shadowLight.castShadow = true;

	// define the visible area of the projected shadow
	shadowLight.shadow.camera.left = -400;
	shadowLight.shadow.camera.right = 400;
	shadowLight.shadow.camera.top = 400;
	shadowLight.shadow.camera.bottom = -400;
	shadowLight.shadow.camera.near = 1;
	shadowLight.shadow.camera.far = 1000;

	// define the resolution of the shadow; the higher the better,
	// but also the more expensive and less performant
	shadowLight.shadow.mapSize.width = 2048;
	shadowLight.shadow.mapSize.height = 2048;

	// to activate the lights, just add them to the scene
	scene.add(hemisphereLight);
	scene.add(shadowLight);
}

/**
 *
 * OBJECTS
 * -------
 * Definitions and constructors for car, fuel, tree, ground
 */
var car, fuel, ground, trees = [], collidableTrees = [], numTrees = 10,
    collidableFuels = [];

/**
 * Generic box that casts and receives shadows
 */
function createBox(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geom = new THREE.BoxGeometry(dx, dy, dz);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: notFlatShading != true});
    var box = new THREE.Mesh(geom, mat);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set( x, y, z );
    return box;
}

/**
 * Generic cylinder that casts and receives shadows
 */
function createCylinder(radiusTop, radiusBottom, height, radialSegments, color,
                        x, y, z) {
    var geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
    var mat = new THREE.MeshPhongMaterial({color:color, flatShading: true});
    var cylinder = new THREE.Mesh(geom, mat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set( x, y, z );
    return cylinder;
}

/**
 * Cylinder with rotation specific to car
 */
function createTire(radiusTop, radiusBottom, height, radialSegments, color, x, y, z) {
    var cylinder = createCylinder(radiusTop, radiusBottom, height, radialSegments, color, x, y, z);
    cylinder.rotation.x = Math.PI / 2;  // hardcoded for tires in the car below
    return cylinder;
}

/**
 * Template for Car with "advanced motion" (i.e., acceleration and deceleration,
 * rotation speed as a function of speed)
 */
function Car() {

    var direction = new THREE.Vector3(1., 0., 0.);
    var maxSpeed = 10.;
    var acceleration = 0.25;
    var currentSpeed = 0;
    var steeringAngle = Math.PI / 24;

    var movement = {
        'forward': false,
        'left': false,
        'right': false,
        'backward': false
    }

	this.mesh = new THREE.Object3D();
    this.berth = 100; // berth for new collidables (e.g., if berth is 100, no
                      // tree will be initialized with 100 units)

    var body = createBox( 80, 30, 50, bodyColor, 0, 0, 0 );
	var roof = createBox( 60, 30, 45, roofColor, 0, 30, 0);
	var bumper = createBox( 90, 10, 45, bumperColor, 0, -10, 0 );
	var headLightLeft = createBox( 5, 5, 5, Colors.white, 40, 5, 15 );
	var headLightRight = createBox( 5, 5, 5, Colors.white, 40, 5, -15 );
	var tailLightLeft = createBox( 5, 5, 10, Colors.red, -40, 5, 21)
	var tailLightRight = createBox( 5, 5, 10, Colors.red, -40, 5, -21)
	var grate = createBox( 5, 5, 15, grateColor, 40, 5, 0 );
	var windshield = createBox( 3, 20, 35, Colors.blue, 30, 25, 0, true );
    var rearshield = createBox( 3, 20, 35, Colors.blue, -30, 25, 0, true );
    var leftWindow = createBox( 40, 20, 3, Colors.blue, 0, 25, 22, true );
    var rightWindow = createBox( 40, 20, 3, Colors.blue, 0, 25, -22, true );
    var leftDoor = createBox( 30, 30, 3, doorColor, 10, 0, 25 );
    var rightDoor = createBox( 30, 30, 3, doorColor, 10, 0, -25 );
    var leftHandle = createBox( 10, 3, 3, handleColor, 5, 8, 27 );
    var rightHandle = createBox( 10, 3, 3, handleColor, 5, 8, -27 );
    var frontLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, 20, -12, 15 );
    var frontRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, 20, -12, -15 );
    var backLeftTire = createTire( 10, 10, 10, 32, Colors.brownDark, -20, -12, 15 );
    var backRightTire = createTire( 10, 10, 10, 32, Colors.brownDark, -20, -12, -15 );

	this.mesh.add(body);
	this.mesh.add(roof);
	this.mesh.add(bumper);
	this.mesh.add(headLightLeft);
	this.mesh.add(headLightRight);
	this.mesh.add(tailLightLeft);
	this.mesh.add(tailLightRight);
    this.mesh.add(grate);
    this.mesh.add(windshield);
    this.mesh.add(rearshield);
    this.mesh.add(leftWindow);
    this.mesh.add(rightWindow);
    this.mesh.add(leftDoor);
    this.mesh.add(rightDoor);
    this.mesh.add(leftHandle);
    this.mesh.add(rightHandle);
    this.mesh.add(frontLeftTire);
    this.mesh.add(frontRightTire);
    this.mesh.add(backLeftTire);
    this.mesh.add(backRightTire);

	var headLightLeftLight = new THREE.PointLight( 0xffcc00, 1, 100 );
    headLightLeftLight.position.set( 50, 5, 15 );
    this.mesh.add( headLightLeftLight );

    var headLightRightLight = new THREE.PointLight( 0xffcc00, 1, 100 );
    headLightRightLight.position.set( 50, 5, -15 );
    this.mesh.add( headLightRightLight );

    function computeR(radians) {
        var M = new THREE.Matrix3();
        M.set(Math.cos(radians), 0, -Math.sin(radians),
              0,                 1,                  0,
              Math.sin(radians), 0,  Math.cos(radians));
        return M;
    }

    this.update = function() {
        var sign, R, currentAngle;
        var is_moving = currentSpeed != 0;
        var is_turning = movement.left || movement.right;
        this.mesh.position.addScaledVector(direction, currentSpeed);

        // update speed according to acceleration
        if (movement.forward) {
            currentSpeed = Math.min(maxSpeed, currentSpeed + acceleration);
        } else if (movement.backward) {
            currentSpeed = Math.max(-maxSpeed, currentSpeed - acceleration);
        }

        // update current position based on speed
        if (is_moving) {
            sign = currentSpeed / Math.abs(currentSpeed);
            currentSpeed = Math.abs(currentSpeed) - acceleration / 1.5;
            currentSpeed *= sign;

            // update and apply rotation based on speed
            if (is_turning) {
                currentAngle = movement.left ? -steeringAngle : steeringAngle;
                currentAngle *= currentSpeed / maxSpeed;
                R = computeR(currentAngle);
                direction = direction.applyMatrix3(R);
                this.mesh.rotation.y -= currentAngle;
            }
        }
    }

    this.moveForward = function() { movement.forward = true; }
    this.stopForward = function() { movement.forward = false; }

    this.turnLeft = function() { movement.left = true; }
    this.stopLeft = function() { movement.left = false; }

    this.turnRight = function() { movement.right = true; }
    this.stopRight = function() { movement.right = false; }

    this.moveBackward = function() { movement.backward = true; }
    this.stopBackward = function() { movement.backward = false; }

    this.collidable = body;
}

/**
 * Create car with hard-coded start location
 */
function createCar() {
    car = new Car();
    car.mesh.position.set( -300, 25, -150);
    scene.add(car.mesh);
}

/**
 * Create simple green, rectangular ground
 */
function createGround() {
    ground = createBox( 800, 20, 500, Colors.greenDark, 0, -10, 0 );
    scene.add(ground);
}

/**
 *
 * MECHANICS
 * ---------
 * Handles controls, game loop, and object collisions
 */

function loop() {
    // handle car movement and collisions
    car.update();

    // handle all growth animations
    animateGrow();
    animateShrink();

	// render the scene
	renderer.render(scene, camera);

	// call the loop function again
	requestAnimationFrame(loop);
}

var left = 37;
var right = 39;
var up = 38;
var down = 40;

function createControls() {
    document.addEventListener(
        'keydown',
        function( ev ) {
            key = ev.keyCode;
            /**
             *
             * STEP 2
             * ------
             * Create objects, namely ground and car.
             */

            // First version
//            if (key == up) {
//                car.mesh.position.y += 5;
//            }
//            if (key == down) {
//                car.mesh.position.y -= 5;
//            }

            // Second version
            if (key == left) {
                car.turnLeft();
            }
            if (key == right) {
                car.turnRight();
            }
            if (key == up) {
                car.moveForward();
            }
            if (key == down) {
                car.moveBackward();
            }

            /********** End step 2 **********/
        }
    );

    document.addEventListener(
        'keyup',
        function( ev ) {
            key = ev.keyCode;

            if (key == left) {
                car.stopLeft();
            }
            if (key == right) {
                car.stopRight();
            }
            if (key == up) {
                car.stopForward();
            }
            if (key == down) {
                car.stopBackward();
            }
        }
    );
}

/**
 *
 * ANIMATION
 * ---------
 * Allows growth and shrinkage for any object in the game
 *
 * Call `startGrowth(...)` or `startShrink(...)` accordingly, on any object, to
 * start growing or shrinking the object. Main game loop invoke `animateGrow`
 * and `animateShrink` which handle incremental grow and shrink updates.
 */

function startGrowth(object, duration, dy, scale) { // TODO: annotate all of these functions
    object.animateGrow_isGrowing = true;
    object.animateGrow_end_time = duration;
    object.animateGrow_end_dy = dy;
    object.animateGrow_end_scale = scale;
    object.animateGrow_start_y = object.position.y - dy;
    object.animateGrow_time = 0;
}

function startShrink(object, duration, dy, scale) {
    object.animateShrink_isShrinking = true;
    object.animateShrink_start_time = duration;
    object.animateShrink_time = duration;
    object.animateShrink_start_scale = scale;
    object.animateShrink_end_dy = dy;
    object.animateShrink_start_y = object.position.y;
}

function animateGrow() {
    var progress, x, y, z, scale;
    for (let child of scene.children) {
        if (child.animateGrow_isGrowing) {
            child.animateGrow_time++;

            progress = child.animateGrow_time / child.animateGrow_end_time;

            x = child.position.x;
            z = child.position.z;
            y = child.animateGrow_start_y + (progress * child.animateGrow_end_dy);
            child.position.set( x, y, z );

            scale = child.animateGrow_end_scale * progress;
            child.scale.set( scale, scale, scale );

            if (child.animateGrow_time >= child.animateGrow_end_time) {
                child.animateGrow_isGrowing = false;
            }
        }
    }
}

function animateShrink() {
    var scale, progress;
    for (let child of scene.children) {
        if (child.animateShrink_isShrinking) {
            child.animateShrink_time--;

            progress = child.animateShrink_time / child.animateShrink_start_time;

            x = child.position.x;
            z = child.position.z;
            y = child.animateShrink_start_y + (progress * child.animateShrink_end_dy);
            child.position.set( x, y, z );

            scale = progress * child.animateShrink_start_scale;
            child.scale.set( scale, scale, scale );

            if (child.animateShrink_time <= 0) {
                scene.remove(child);
                child.animateShrink_isShrinking = false;
            }
        }
    }
}

// TODO: add times of day
// TODO: fix object collision weirdness (possible due to rotated objects)

//init();  // uncomment for JSFiddle, wraps code in onLoad eventListener
window.addEventListener('load', init, false);
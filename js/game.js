/*
 * Boilerplate for scene, camera, renderer, lights taken from
 * https://tympanus.net/codrops/2016/04/26/the-aviator-animating-basic-3d-scene-threejs/
 *
 */

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

window.addEventListener('load', init, false);

function init() {
	// set up the scene, the camera and the renderer
	createScene();

	// add the lights
	createLights();

	// add the objects
    createGround();
    createCar();

    // add controls
    createControls();

	// start a loop that will update the objects' positions
	// and render the scene on each frame
	loop();
}

var scene,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer, container, car;

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
	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

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
	camera.position.x = 0;
	camera.position.z = 200;
	camera.position.y = 100;
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

var Car = function() {

    var direction = new THREE.Vector3(1., 0., 0.);
    var speed = 5.;
    var steeringAngle = Math.PI / 6;
    var steeringM;
	this.mesh = new THREE.Object3D();

    // Create the body
	var geomBody = new THREE.BoxGeometry(80,30,50,1,1,1);
	var matBody = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	var body = new THREE.Mesh(geomBody, matBody);
	body.castShadow = true;
	body.receiveShadow = true;
	this.mesh.add(body);

	// Create the top
	var geomRoof = new THREE.BoxGeometry(60,30,45,1,1,1);
	var matRoof = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
	var roof = new THREE.Mesh(geomRoof, matRoof);
	roof.position.y = 30;
	roof.castShadow = true;
	roof.receiveShadow = true;
	this.mesh.add(roof);

	// Create the bumper
	var geomBumper = new THREE.BoxGeometry(90,10,45,1,1,1);
	var matBumper = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
	var bumper = new THREE.Mesh(geomBumper, matBumper);
	bumper.position.y = -10;
	bumper.castShadow = true;
	bumper.receiveShadow = true;
	this.mesh.add(bumper);

	// Create the headlights
	var geomHeadLight = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matHeadLight = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});

	var headLightLeft = new THREE.Mesh(geomHeadLight, matHeadLight);
	headLightLeft.position.y = 5;
	headLightLeft.position.z = 15;
	headLightLeft.position.x = 40;
	headLightLeft.castShadow = true;
	headLightLeft.receiveShadow = true;
	this.mesh.add(headLightLeft);

	var headLightRight = new THREE.Mesh(geomHeadLight, matHeadLight);
	headLightRight.position.y = 5;
	headLightRight.position.z = -15;
	headLightRight.position.x = 40;
	headLightRight.castShadow = true;
	headLightRight.receiveShadow = true;
	this.mesh.add(headLightRight);

	// Create the taillights
	var geomTailLight = new THREE.BoxGeometry(5,5,10,1,1,1);
	var matTailLight = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});

	var tailLightLeft = new THREE.Mesh(geomTailLight, matTailLight);
	tailLightLeft.position.y = 5;
	tailLightLeft.position.z = 21;
	tailLightLeft.position.x = -40;
	tailLightLeft.castShadow = true;
	tailLightLeft.receiveShadow = true;
	this.mesh.add(tailLightLeft);

	var tailLightRight = new THREE.Mesh(geomTailLight, matTailLight);
	tailLightRight.position.y = 5;
	tailLightRight.position.z = -21;
	tailLightRight.position.x = -40;
	tailLightRight.castShadow = true;
	tailLightRight.receiveShadow = true;
	this.mesh.add(tailLightRight);

	// Create the grate
	var geomGrate = new THREE.BoxGeometry(5,5,15,1,1,1);
	var matGrate = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
    var grate = new THREE.Mesh(geomGrate, matGrate);
    grate.position.y = 5;
    grate.position.z = 0;
    grate.position.x = 40;
    grate.castShadow = true;
    grate.receiveShadow = true;
    this.mesh.add(grate);

    // Create windshield
    var geomWindshield = new THREE.BoxGeometry(3,20,35,1,1,1);
	var matWindshield = new THREE.MeshPhongMaterial({color:Colors.blue, shading:THREE.FlatShading});

    var windshield = new THREE.Mesh(geomWindshield, matWindshield);
    windshield.position.y = 25;
    windshield.position.z = 0;
    windshield.position.x = 30;
    windshield.castShadow = true;
    windshield.receiveShadow = true;
    this.mesh.add(windshield);

    var rearshield = new THREE.Mesh(geomWindshield, matWindshield);
    rearshield.position.y = 25;
    rearshield.position.z = 0;
    rearshield.position.x = -30;
    rearshield.castShadow = true;
    rearshield.receiveShadow = true;
    this.mesh.add(rearshield);

    // Create windows
    var geomWindow = new THREE.BoxGeometry(40,20,3,1,1,1);
	var matWindow = new THREE.MeshPhongMaterial({color:Colors.blue, shading:THREE.FlatShading});

	var leftWindow = new THREE.Mesh(geomWindow, matWindow);
	leftWindow.position.y = 25;
    leftWindow.position.z = 22;
    leftWindow.position.x = 0;
    leftWindow.castShadow = true;
    leftWindow.receiveShadow = true;
    this.mesh.add(leftWindow);

    var rightWindow = new THREE.Mesh(geomWindow, matWindow);
	rightWindow.position.y = 25;
    rightWindow.position.z = -22;
    rightWindow.position.x = 0;
    rightWindow.castShadow = true;
    rightWindow.receiveShadow = true;
    this.mesh.add(rightWindow);

    // Create doors
    var geomDoor = new THREE.BoxGeometry(30,30,3,1,1,1);
	var matDoor = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});

	var leftDoor = new THREE.Mesh(geomDoor, matDoor);
	leftDoor.position.y = 0;
    leftDoor.position.z = 25;
    leftDoor.position.x = 10;
    leftDoor.castShadow = true;
    leftDoor.receiveShadow = true;
    this.mesh.add(leftDoor);

    var rightDoor = new THREE.Mesh(geomDoor, matDoor);
	rightDoor.position.y = 0;
    rightDoor.position.z = -25;
    rightDoor.position.x = 10;
    rightDoor.castShadow = true;
    rightDoor.receiveShadow = true;
    this.mesh.add(rightDoor);

    // Create door handle
    var geomHandle = new THREE.BoxGeometry(10,3,3,1,1,1);
	var matHandle = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});

	var leftHandle = new THREE.Mesh(geomHandle, matHandle);
	leftHandle.position.y = 8;
    leftHandle.position.z = 27;
    leftHandle.position.x = 5;
    leftHandle.castShadow = true;
    leftHandle.receiveShadow = true;
    this.mesh.add(leftHandle);

    var rightHandle = new THREE.Mesh(geomHandle, matHandle);
	rightHandle.position.y = 8;
    rightHandle.position.z = -27;
    rightHandle.position.x = 5;
    rightHandle.castShadow = true;
    rightHandle.receiveShadow = true;
    this.mesh.add(rightHandle);

    // Create tires
    var geomTire = new THREE.CylinderGeometry(10, 10, 10, 32);
    var matTire = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});

    var frontLeftTire = new THREE.Mesh(geomTire, matTire);
    frontLeftTire.rotation.z = 1.57;
    frontLeftTire.rotation.y = 1.57;
    frontLeftTire.position.y = -12;
    frontLeftTire.position.z = 15;
    frontLeftTire.position.x = 20;
    frontLeftTire.castShadow = true;
    frontLeftTire.receiveShadow = true;
    this.mesh.add(frontLeftTire);

    var frontRightTire = new THREE.Mesh(geomTire, matTire);
    frontRightTire.rotation.z = 1.57;
    frontRightTire.rotation.y = 1.57;
    frontRightTire.position.y = -12;
    frontRightTire.position.z = -15;
    frontRightTire.position.x = 20;
    frontRightTire.castShadow = true;
    frontRightTire.receiveShadow = true;
    this.mesh.add(frontRightTire);

    var backLeftTire = new THREE.Mesh(geomTire, matTire);
    backLeftTire.rotation.z = 1.57;
    backLeftTire.rotation.y = 1.57;
    backLeftTire.position.y = -12;
    backLeftTire.position.z = 15;
    backLeftTire.position.x = -20;
    backLeftTire.castShadow = true;
    backLeftTire.receiveShadow = true;
    this.mesh.add(backLeftTire);

    var backRightTire = new THREE.Mesh(geomTire, matTire);
    backRightTire.rotation.z = 1.57;
    backRightTire.rotation.y = 1.57;
    backRightTire.position.y = -12;
    backRightTire.position.z = -15;
    backRightTire.position.x = -20;
    backRightTire.castShadow = true;
    backRightTire.receiveShadow = true;
    this.mesh.add(backRightTire);

    this.computeR = function(radians) {
        var M = new THREE.Matrix3();
        M.set(Math.cos(radians), 0, -Math.sin(radians),
              0,                 1,                  0,
              Math.sin(radians), 0,  Math.cos(radians));
        return M;
    }

    this.moveForward = function() {
        this.mesh.position.addScaledVector(direction, speed);
    }

    this.turnLeft = function() {
        direction = direction.applyMatrix3(steeringLeft);
        this.mesh.rotation.y += steeringAngle;
    }

    this.turnRight = function() {
        direction = direction.applyMatrix3(steeringRight);
        this.mesh.rotation.y -= steeringAngle;
    }

    this.moveBackward = function() {
        this.mesh.position.addScaledVector(direction, -speed);
    }

    steeringLeft = this.computeR(-steeringAngle);
    steeringRight = this.computeR(steeringAngle);
}

function createCar() {
    car = new Car();
    car.mesh.position.y = 25;
    scene.add(car.mesh);
}

var Ground = function() {

    this.mesh = new THREE.Object3D();

    var matGround = new THREE.MeshPhongMaterial({color:Colors.red});
    var geomGround = new THREE.BoxGeometry(300, 1, 300);
    var ground = new THREE.Mesh(geomGround, matGround);
    ground.position.set( 0, 0, 0 );
    ground.receiveShadow = true;
    this.mesh.add(ground);
}

function createGround() {
    ground = new Ground();
    scene.add(ground.mesh);
}

function loop(){

	// render the scene
	renderer.render(scene, camera);

	// call the loop function again
	requestAnimationFrame(loop);
}

function createControls() {
    document.addEventListener(
        'keydown',
        function( ev ) {
            switch( ev.keyCode ) {
                case 37:
                    // Left
                    car.turnLeft();
                    break;

                case 39:
                    // Right
                    car.turnRight();
                    break;

                case 38:
                    // Up
                    car.moveForward();
                    break;

                case 40:
                    // Down
                    car.moveBackward();
                    break;
            }
        }
    );

    document.addEventListener(
        'keyup',
        function( ev ) {
            switch( ev.keyCode ) {
                case 37:
                    // Left

                    break;

                case 39:
                    // Right

                    break;

                case 38:
                    // Up

                    break;

                case 40:
                    // Down

                    break;
            }
        }
    );
}

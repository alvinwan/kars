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
    green:0x669900
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
    createFuel(300, 100);
    createTrees();

    // add controls
    createControls();

	// start a loop that will update the objects' positions
	// and render the scene on each frame
	loop();
}

var scene,
		camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
		renderer, container, car, fuel, trees = [], collidableTreeMeshes = [],
		numTrees = 10;

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
    var maxSpeed = 10.;
    var acceleration = 0.25;
    var currentSpeed = 0;
    var steeringAngle = Math.PI / 24;
    var steeringM;

    var movement = {
        'forward': false,
        'left': false,
        'right': false,
        'backward': false
    }
	this.mesh = new THREE.Object3D();

    // Create the body
	var geomBody = new THREE.BoxGeometry(80,30,50,1,1,1);
	var matBody = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true});
	var body = new THREE.Mesh(geomBody, matBody);
	body.castShadow = true;
	body.receiveShadow = true;
	this.mesh.add(body);

	// Create the top
	var geomRoof = new THREE.BoxGeometry(60,30,45,1,1,1);
	var matRoof = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true});
	var roof = new THREE.Mesh(geomRoof, matRoof);
	roof.position.y = 30;
	roof.castShadow = true;
	roof.receiveShadow = true;
	this.mesh.add(roof);

	// Create the bumper
	var geomBumper = new THREE.BoxGeometry(90,10,45,1,1,1);
	var matBumper = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true});
	var bumper = new THREE.Mesh(geomBumper, matBumper);
	bumper.position.y = -10;
	bumper.castShadow = true;
	bumper.receiveShadow = true;
	this.mesh.add(bumper);

	// Create the headlights
	var geomHeadLight = new THREE.BoxGeometry(5,5,5,1,1,1);
	var matHeadLight = new THREE.MeshPhongMaterial({color:Colors.white});

	var headLightLeft = new THREE.Mesh(geomHeadLight, matHeadLight);
	headLightLeft.position.set( 40, 5, 15 );
	headLightLeft.castShadow = true;
	headLightLeft.receiveShadow = true;
	this.mesh.add(headLightLeft);

	var headLightRight = new THREE.Mesh(geomHeadLight, matHeadLight);
	headLightRight.position.set( 40, 5, -15 );
	headLightRight.castShadow = true;
	headLightRight.receiveShadow = true;
	this.mesh.add(headLightRight);

	var headLightLeftLight = new THREE.PointLight( 0xffcc00, 1, 100 );
    headLightLeftLight.position.set( 50, 5, 15 );
    this.mesh.add( headLightLeftLight );

    var headLightRightLight = new THREE.PointLight( 0xffcc00, 1, 100 );
    headLightRightLight.position.set( 50, 5, -15 );
    this.mesh.add( headLightRightLight );

	// Create the taillights
	var geomTailLight = new THREE.BoxGeometry(5,5,10,1,1,1);
	var matTailLight = new THREE.MeshPhongMaterial({color:Colors.red});

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
	var matGrate = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true});
    var grate = new THREE.Mesh(geomGrate, matGrate);
    grate.position.y = 5;
    grate.position.z = 0;
    grate.position.x = 40;
    grate.castShadow = true;
    grate.receiveShadow = true;
    this.mesh.add(grate);

    // Create windshield
    var geomWindshield = new THREE.BoxGeometry(3,20,35,1,1,1);
	var matWindshield = new THREE.MeshPhongMaterial({color:Colors.blue});

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
	var matWindow = new THREE.MeshPhongMaterial({color:Colors.blue});

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
	var matDoor = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true});

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
	var matHandle = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true});

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
    var matTire = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true});

    var frontLeftTire = new THREE.Mesh(geomTire, matTire);
    frontLeftTire.rotation.x = Math.PI / 2;
    frontLeftTire.position.y = -12;
    frontLeftTire.position.z = 15;
    frontLeftTire.position.x = 20;
    frontLeftTire.castShadow = true;
    frontLeftTire.receiveShadow = true;
    this.mesh.add(frontLeftTire);

    var frontRightTire = new THREE.Mesh(geomTire, matTire);
    frontRightTire.rotation.x = Math.PI / 2;
    frontRightTire.position.y = -12;
    frontRightTire.position.z = -15;
    frontRightTire.position.x = 20;
    frontRightTire.castShadow = true;
    frontRightTire.receiveShadow = true;
    this.mesh.add(frontRightTire);

    var backLeftTire = new THREE.Mesh(geomTire, matTire);
    backLeftTire.rotation.x = Math.PI / 2;
    backLeftTire.position.y = -12;
    backLeftTire.position.z = 15;
    backLeftTire.position.x = -20;
    backLeftTire.castShadow = true;
    backLeftTire.receiveShadow = true;
    this.mesh.add(backLeftTire);

    var backRightTire = new THREE.Mesh(geomTire, matTire);
    backRightTire.rotation.x = Math.PI / 2;
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

    this.update = function() {
        var sign, R, currentAngle;
        var is_moving = currentSpeed != 0;
        this.mesh.position.addScaledVector(direction, currentSpeed);

        // disallow travel through trees
        if (objectInBound(body, collidableTreeMeshes) && currentSpeed != 0) {
            this.mesh.position.addScaledVector(direction, -3 * currentSpeed);
            currentSpeed = 0;
            is_moving = false;
        }

        if (objectInBound(body, [fuel.fuel])) {
            console.log('You win')
        }

        if (movement.forward) {
            currentSpeed = Math.min(maxSpeed, currentSpeed + acceleration);
        } else if (movement.backward) {
            currentSpeed = Math.max(-maxSpeed, currentSpeed - acceleration);
        }
        if (is_moving) {
            sign = currentSpeed / Math.abs(currentSpeed);
            currentSpeed = Math.abs(currentSpeed) - acceleration / 1.5;
            currentSpeed *= sign;
        }
        if (is_moving && movement.left) {
            currentAngle = -steeringAngle * (currentSpeed / maxSpeed);
            R = this.computeR(currentAngle);
            direction = direction.applyMatrix3(R);
            this.mesh.rotation.y -= currentAngle;
        }
        if (is_moving && movement.right) {
            currentAngle = steeringAngle * (currentSpeed / maxSpeed);
            R = this.computeR(currentAngle);
            direction = direction.applyMatrix3(R);
            this.mesh.rotation.y -= currentAngle;
        }
    }

    this.moveForward = function() {
        movement.forward = true;
        movement.backward = false;
    }

    this.stopForward = function() {
        movement.forward = false;
    }

    this.turnLeft = function() {
        movement.left = true;
        movement.right = false;
    }

    this.stopLeft = function() {
        movement.left = false;
    }

    this.turnRight = function() {
        movement.right = true;
        movement.left = false;
    }

    this.stopRight = function() {
        movement.right = false;
    }

    this.moveBackward = function() {
        movement.backward = true;
        movement.forward = false;
    }

    this.stopBackward = function() {
        movement.backward = false;
    }
}

function createCar() {
    car = new Car();
    car.mesh.position.set( -300, 25, -150);
    scene.add(car.mesh);
}

var Ground = function() {

    this.mesh = new THREE.Object3D();

    var matGround = new THREE.MeshPhongMaterial({color:Colors.green});
    var geomGround = new THREE.BoxGeometry(800, 20, 500);
    var ground = new THREE.Mesh(geomGround, matGround);
    ground.position.set( 0, -10, 0 );
    ground.receiveShadow = true;
    this.mesh.add(ground);
}

function createGround() {
    ground = new Ground();
    scene.add(ground.mesh);
}

var Tree = function() {

    this.mesh = new THREE.Object3D();
    var matTree = new THREE.MeshPhongMaterial({color:Colors.green, flatShading:true});

    var geomTop = new THREE.CylinderGeometry( 1, 30, 30, 4 );
    var top = new THREE.Mesh( geomTop, matTree );
    top.position.y = 90;
    top.castShadow = true;
    top.receiveShadow = true;
    this.mesh.add( top );

    var geomMid = new THREE.CylinderGeometry( 1, 40, 40, 4 );
    var mid = new THREE.Mesh( geomMid, matTree );
    mid.position.y = 70;
    mid.castShadow = true;
    mid.receiveShadow = true;
    this.mesh.add( mid );

    var geomBottom = new THREE.CylinderGeometry( 1, 50, 50, 4 );
    var bottom = this.bottom = new THREE.Mesh( geomBottom, matTree );
    bottom.position.y = 40;
    bottom.castShadow = true;
    bottom.receiveShadow = true;
    this.mesh.add( bottom );

    var geomTrunk = new THREE.CylinderGeometry( 10, 10, 30, 32);
    var matTrunk = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true});
    var trunk = new THREE.Mesh( geomTrunk, matTrunk );
    this.mesh.add( trunk );
}

function createTree(x, z, scale, rotation) {
    var tree = new Tree();
    scene.add(tree.mesh);
    tree.mesh.position.set( x, 0, z );
    tree.mesh.scale.set( scale, scale, scale );
    tree.mesh.rotation.y = rotation;
    return tree;
}

var Fuel = function() {
    this.mesh = new THREE.Object3D();

    var geomFuel = new THREE.BoxGeometry(50, 5, 50);
    var matFuel = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true});
    var fuel = new THREE.Mesh( geomFuel, matFuel );
    this.fuel = fuel;
    this.mesh.add( fuel );
}

function createFuel(x, z) {
    fuel = new Fuel();
    fuel.mesh.position.set( x, 0, z );
    scene.add(fuel.mesh);
}

function loop() {
    car.update();

    // handle all growth animations
    animateGrow();
    animateShrink();

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
                    car.stopLeft();
                    break;

                case 39:
                    // Right
                    car.stopRight();
                    break;

                case 38:
                    // Up
                    car.stopForward();
                    break;

                case 40:
                    // Down
                    car.stopBackward();
                    break;
            }
        }
    );
}

// https://stackoverflow.com/a/11480717/4855984 (doesn't work)
function objectCollidedWith(object, collidableMeshList) {
    for (let child of object.children) {
        var childPosition = child.position.clone();
        for (var vertexIndex = 0; vertexIndex < child.geometry.vertices.length; vertexIndex++) {
            var localVertex = child.geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4(child.matrix);
            var directionVector = child.position.sub( globalVertex );

            var ray = new THREE.Raycaster( childPosition, directionVector.clone().normalize() );
            var collisionResults = ray.intersectObjects( collidableMeshList );
            if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) {
                return true;
            }
        }
    }
    return false;
}


function objectInBound(object, objectList) {
    o = get_xywh(object);
    for (let target of objectList) {
        t = get_xywh(target);
        if ( (Math.abs(o.x - t.x) * 2 < t.w + o.w) && (Math.abs(o.y - t.y) * 2 < t.h + o.h)) {
            return true;
        }
    }
    return false;
}

function get_xywh(object) {
    var p = object.geometry.parameters;
    var globalPosition = new THREE.Vector3( 0., 0., 0. );
    object.getWorldPosition(globalPosition);
    var x = globalPosition.x;
    var y = globalPosition.z;
    var w = p.width;
    if (p.hasOwnProperty('radiusBottom')) {
        w = Math.max(p.radiusTop, p.radiusBottom); // should be multiplied by 2?
    }
    var h = p.height;
    return {'x': x, 'y': y, 'w': w, 'h': h};
}

/* TREES */

function createTrees() {
    var x, y, scale, rotate, delay;
    for (var i = 0; i < numTrees; i++) {
        x = Math.random() * 600 - 300;
        y = Math.random() * 400 - 200;
        scale = Math.random() * 1 + 0.5;
        rotate = Math.random() * Math.PI * 2;
        delay = 2000 * Math.random()

        var tree = createTree(x, y, scale, rotate);

        setTimeout(function(object, scale) {
            startGrowth(object, 50, 10, scale);
        }.bind(this, tree.mesh, scale), delay);
        tree.mesh.scale.set( 0.01, 0.01, 0.01 );
        collidableTreeMeshes.push(tree.bottom);
    }
}

/* ANIMATION */

function startGrowth(object, duration, dy, scale) {
    object.animateGrow_isGrowing = true;
    object.animateGrow_end_time = duration;
    object.animateGrow_end_y = dy;
    object.animateGrow_end_scale = scale;
    object.animateGrow_start_y = object.position.y - dy;
    object.animateGrow_time = 0;
}

function startShrink(object, duration) {
    object.animateShrink_isShrinking = true;
    object.animateShrink_end = duration;
    object.animateShrink_time = 0;
}

function animateGrow() {
    var progress, x, y, z, scale;
    for (let child of scene.children) {
        if (child.animateGrow_isGrowing) {
            child.animateGrow_time++;

            progress = child.animateGrow_time / child.animateGrow_end_time;
            x = child.position.x;
            z = child.position.z;
            y = child.animateGrow_start_y + (progress * child.animateGrow_end_y);
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
    var scale;
    for (let child of scene.children) {
        if (child.animateShrink_isShrinking) {
            child.animateShrink_time++;

            scale = 1 - (child.animateShrink_time / child.animateShrink_end);
            child.scale.set( scale, scale, scale );

            if (child.animateShrink_time >= child.animateShrink_end) {
                child.animateShrink_isShrinking = false;
            }
        }
    }
}

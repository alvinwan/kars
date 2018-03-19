'use strict';

var Colors = {
	red:0xf25346,
	white:0xd8d0d1,
	brown:0x59332e,
	pink:0xF5986E,
	brownDark:0x23190f,
	blue:0x68c3c0,
};

Physijs.scripts.worker = 'js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var initScene, render,
    ground_material, car_material, wheel_material, wheel_geometry,
    loader, renderer, render_stats, physics_stats, scene, ground_geometry, ground, hemisphereLight, shadowLight, camera,
    car = {};

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

//	this.mesh = new THREE.Object3D();

    // Create the body
	var geomBody = new THREE.BoxGeometry(80,30,50,1,1,1);
	var matBody = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true});
	var body = new Physijs.BoxMesh(geomBody, matBody, 1000);
    body.position.y = 10;
    body.rotation.y = Math.PI;
    body.scale.set( .15, .15, .15 );
	body.castShadow = true;
	body.receiveShadow = true;
    this.mesh = this.body = body;
//	this.mesh.add(body);

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
	var matHeadLight = new THREE.MeshPhongMaterial({color:Colors.white, flatShading:true});

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
	var matTailLight = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true});

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
	var matWindshield = new THREE.MeshPhongMaterial({color:Colors.blue, flatShading:true});

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
	var matWindow = new THREE.MeshPhongMaterial({color:Colors.blue, flatShading:true});

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
}

initScene = function() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    document.getElementById( 'world' ).appendChild( renderer.domElement );

    render_stats = new Stats();
    render_stats.domElement.style.position = 'absolute';
    render_stats.domElement.style.top = '0px';
    render_stats.domElement.style.zIndex = 100;
    document.getElementById( 'world' ).appendChild( render_stats.domElement );

    physics_stats = new Stats();
    physics_stats.domElement.style.position = 'absolute';
    physics_stats.domElement.style.top = '50px';
    physics_stats.domElement.style.zIndex = 100;
    document.getElementById( 'world' ).appendChild( physics_stats.domElement );

    scene = new Physijs.Scene;
    scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
    scene.addEventListener(
        'update',
        function() {
            scene.simulate( undefined, 2 );
            physics_stats.update();
        }
    );

    camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.set( 60, 50, 60 );
    camera.lookAt( scene.position );
    scene.add( camera );

    // Light
    createLights();

    // Loader
    loader = new THREE.TextureLoader();

    // Materials
    ground_material = Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ color: Colors.red }),
        1., // high friction
        .4 // low restitution
    );

    // Ground
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(100, 1, 100),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;
    scene.add( ground );


    // Car
    // car_material = Physijs.createMaterial(
    //     new THREE.MeshLambertMaterial({ color: 0xff6666 }),
    //     .8, // high friction
    //     .2 // low restitution
    // );

    wheel_material = Physijs.createMaterial(
        new THREE.MeshLambertMaterial({ color: 0x444444 }),
        .8, // high friction
        .5 // medium restitution
    );
    wheel_geometry = new THREE.CylinderGeometry( 2, 2, 1, 8 );

    // car.body = new Physijs.BoxMesh(
    //     new THREE.BoxGeometry( 10, 5, 7 ),
    //     car_material,
    //     1000
    // );
    // car.body.position.y = 10;
    // car.body.receiveShadow = car.body.castShadow = true;
    car = new Car();
    scene.add( car.body );

    car.wheel_fl = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        500
    );
    car.wheel_fl.rotation.x = Math.PI / 2;
    car.wheel_fl.position.set( -3.5, 6.5, 5 );
    car.wheel_fl.receiveShadow = car.wheel_fl.castShadow = true;
    scene.add( car.wheel_fl );
    car.wheel_fl_constraint = new Physijs.DOFConstraint(
        car.wheel_fl, car.body, new THREE.Vector3( -3.5, 6.5, 5 )
    );
    scene.addConstraint( car.wheel_fl_constraint );
    car.wheel_fl_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
    car.wheel_fl_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });

    car.wheel_fr = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        500
    );
    car.wheel_fr.rotation.x = Math.PI / 2;
    car.wheel_fr.position.set( -3.5, 6.5, -5 );
    car.wheel_fr.receiveShadow = car.wheel_fr.castShadow = true;
    scene.add( car.wheel_fr );
    car.wheel_fr_constraint = new Physijs.DOFConstraint(
        car.wheel_fr, car.body, new THREE.Vector3( -3.5, 6.5, -5 )
    );
    scene.addConstraint( car.wheel_fr_constraint );
    car.wheel_fr_constraint.setAngularLowerLimit({ x: 0, y: -Math.PI / 8, z: 1 });
    car.wheel_fr_constraint.setAngularUpperLimit({ x: 0, y: Math.PI / 8, z: 0 });

    car.wheel_bl = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        500
    );
    car.wheel_bl.rotation.x = Math.PI / 2;
    car.wheel_bl.position.set( 3.5, 6.5, 5 );
    car.wheel_bl.receiveShadow = car.wheel_bl.castShadow = true;
    scene.add( car.wheel_bl );
    car.wheel_bl_constraint = new Physijs.DOFConstraint(
        car.wheel_bl, car.body, new THREE.Vector3( 3.5, 6.5, 5 )
    );
    scene.addConstraint( car.wheel_bl_constraint );
    car.wheel_bl_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
    car.wheel_bl_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });

    car.wheel_br = new Physijs.CylinderMesh(
        wheel_geometry,
        wheel_material,
        500
    );
    car.wheel_br.rotation.x = Math.PI / 2;
    car.wheel_br.position.set( 3.5, 6.5, -5 );
    car.wheel_br.receiveShadow = car.wheel_br.castShadow = true;
    scene.add( car.wheel_br );
    car.wheel_br_constraint = new Physijs.DOFConstraint(
        car.wheel_br, car.body, new THREE.Vector3( 3.5, 6.5, -5 )
    );
    scene.addConstraint( car.wheel_br_constraint );
    car.wheel_br_constraint.setAngularLowerLimit({ x: 0, y: 0, z: 0 });
    car.wheel_br_constraint.setAngularUpperLimit({ x: 0, y: 0, z: 0 });

    var tireTargetVel = 10;
    var tireMaxForce = 5000;
    document.addEventListener(
        'keydown',
        function( ev ) {
            switch( ev.keyCode ) {
                case 37:
                    // Left
                    car.wheel_fl_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, 1, 200 );
                    car.wheel_fr_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, 1, 200 );
                    car.wheel_fl_constraint.enableAngularMotor( 1 );
                    car.wheel_fr_constraint.enableAngularMotor( 1 );
                    break;

                case 39:
                    // Right
                    car.wheel_fl_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, -1, 200 );
                    car.wheel_fr_constraint.configureAngularMotor( 1, -Math.PI / 2, Math.PI / 2, -1, 200 );
                    car.wheel_fl_constraint.enableAngularMotor( 1 );
                    car.wheel_fr_constraint.enableAngularMotor( 1 );
                    break;

                case 38:
                    // Up
                    car.wheel_bl_constraint.configureAngularMotor( 2, 1, 0, tireTargetVel, tireMaxForce );
                    car.wheel_br_constraint.configureAngularMotor( 2, 1, 0, tireTargetVel, tireMaxForce );
                    car.wheel_bl_constraint.enableAngularMotor( 2 );
                    car.wheel_br_constraint.enableAngularMotor( 2 );
                    break;

                case 40:
                    // Down
                    car.wheel_bl_constraint.configureAngularMotor( 2, 1, 0, -tireTargetVel, tireMaxForce );
                    car.wheel_br_constraint.configureAngularMotor( 2, 1, 0, -tireTargetVel, tireMaxForce );
                    car.wheel_bl_constraint.enableAngularMotor( 2 );
                    // car.wheel_br_constraint.enableAngularMotor( 2 );
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
                    car.wheel_fl_constraint.disableAngularMotor( 1 );
                    car.wheel_fr_constraint.disableAngularMotor( 1 );
                    break;

                case 39:
                    // Right
                    car.wheel_fl_constraint.disableAngularMotor( 1 );
                    car.wheel_fr_constraint.disableAngularMotor( 1 );
                    break;

                case 38:
                    // Up
                    car.wheel_bl_constraint.disableAngularMotor( 2 );
                    car.wheel_br_constraint.disableAngularMotor( 2 );
                    break;

                case 40:
                    // Down
                    car.wheel_bl_constraint.disableAngularMotor( 2 );
                    car.wheel_br_constraint.disableAngularMotor( 2 );
                    break;
            }
        }
    );


    requestAnimationFrame( render );
    scene.simulate();
};

render = function() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
    render_stats.update();
};

window.onload = initScene;

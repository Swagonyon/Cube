var newSides = [2,5,8,1,4,7,0,3,6];
var alg = [];
var undoAlg = [];
var inverse = false;

// Find the color of the pixel where the user clicks
function getColor(e, prime, autoColor) {
    if (autoColor === undefined) {
        var xy = canvas.relMouseCoords(e);
        gl.readPixels(xy.x, xy.y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
        var result = [];
        result = buf;
        var color = rgbToHex(buf[0], buf[1], buf[2]);
        result = null;
    } else {
        var color = autoColor;
    }
	if (prime == "'") {
		inverse = true;
	}
	console.log(color);
    switch (color) {
        case "561e": // Green
            centerClicked = 3;
            alg.push("B" + prime);
        break;
        case "157b": // Blue
            centerClicked = 2;
            alg.push("F" + prime);        
        break;
        case "faa900": // Yellow
        case "faaa00": // Yellow (firefox)
            centerClicked = 1;
            alg.push("D" + prime);
        break;
        case "8b030b": // Red
            centerClicked = 4;
            alg.push("L" + prime);
        break;
        case "faffff": // White
            centerClicked = 0;
            alg.push("U" + prime);
        break;
        case "fc1900": // Orange
            centerClicked = 5;
            alg.push("R" + prime);
        break;
        default:
            inverse = false;
        break;
    }
}

function doMove(move) {
    switch(move) {
        case "U":
            getColor(null, "", "faffff");
        break;
        case "U'":
            getColor(null, "'", "faffff");
        break;
        case "D":
            getColor(null, "", "faa900");
        break;
        case "D'":
            getColor(null, "'", "faa900");
        break;
        case "R":
            getColor(null, "", "fc1900");
        break;
        case "R'":
            getColor(null, "'", "fc1900");
        break;
        case "L":
            getColor(null, "", "8b030b");
        break;
        case "L'":
            getColor(null, "'", "8b030b");
        break;
        case "F":
            getColor(null, "", "157b");
        break;
        case "F'":
            getColor(null, "'", "157b");
        break;
        case "B":
            getColor(null, "", "561e");
        break;
        case "B'":
            getColor(null, "'", "561e");
        break;   
    }
}

function drawScene(cubes, positions) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	mat4.perspective(pMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

	// Draw cubes
	var test = true;
	for (var i = 0; i < num_of_cubes; ++i) {
		drawCubes(cubes[i], positions[i]);
	}
}

// Keep track of cube's current rotation
var cube_rotation_matrix = mat4.create();
var identity = mat4.create();
// Set initial rotation
mat4.rotate(cube_rotation_matrix, cube_rotation_matrix, degToRad(0), [0.0, 0.0, 0.0]);
mat4.rotate(identity, cube_rotation_matrix, degToRad(0), [0.0, 0.0, 0.0]);
/************************************/
/* Draw cubes at specified position */
/************************************/
function drawCubes(cube, position_xyz) {
    // Start with identity matrix
	mat4.identity(mvMatrix);

	// Translate cube to "origin" (center point of where the Rubik's cube will be)
	mat4.translate(mvMatrix, mvMatrix, center_cube);

    // Rotate cube
    mat4.multiply(mvMatrix, mvMatrix, cube_rotation_matrix);
    mat4.multiply(mvMatrix, mvMatrix, cube.rotationer);
    for (var i = cube.rotations.length - 1; i > -1; i--) {
       mat4.multiply(mvMatrix, mvMatrix, cube.rotations[i]);
    }
    
	// Translate cube from "origin" to its intended position
	mat4.translate(mvMatrix, mvMatrix, position_xyz);
    
	// Set up buffers and draw cube
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cube.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cube.vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cube.vertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, rubikTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cube.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

/******************************************/
/* Set the initial position for each cube */
/******************************************/

var colorIndices = [];
// White, Center: 4 // Up
colorIndices[0] = [ 6, 7, 8, 3, 4, 5, 0, 1, 2];
var up = colorIndices[0];
// Yellow, Center 22 // Down
colorIndices[1] = [18,19,20,21,22,23,24,25,26];
var down = colorIndices[1];
// Blue, Center 10 // Front
colorIndices[2] = [ 0, 1, 2, 9,10,11,18,19,20];
var front = colorIndices[2];
// Green, Center 16 // Back
colorIndices[3] = [24,25,26,15,16,17, 6, 7, 8];
var back = colorIndices[3];
// Red, Center 12 // Left
colorIndices[4] = [ 6, 3, 0,15,12, 9,24,21,18];
var left = colorIndices[4];
// Orange, Center 14 // Right
colorIndices[5] = [ 2, 5, 8,11,14,17,20,23,26];
var right = colorIndices[5];

function setInitialXYZ(positions) {
	// NOTE: All coordinates are relative off of the center cube's position.
	vec3.set(positions[0],  -2.05,  2.05,  2.05); // White - Red - Blue
	vec3.set(positions[1],   0.00,  2.05,  2.05); // White - Blue 
	vec3.set(positions[2],   2.05,  2.05,  2.05); // White - Orange - Blue
	vec3.set(positions[3],  -2.05,  2.05,  0.00); // White - Red
	vec3.set(positions[4],   0.00,  2.05,  0.00); // White Center
	vec3.set(positions[5],   2.05,  2.05,  0.00); // White - Orange
	vec3.set(positions[6],  -2.05,  2.05, -2.05); // White - Red - Green
	vec3.set(positions[7],   0.00,  2.05, -2.05); // White - Green
	vec3.set(positions[8],   2.05,  2.05, -2.05); // White - Orange - Green
	vec3.set(positions[9],  -2.05,  0.00,  2.05); // Blue - Red
	vec3.set(positions[10],  0.00,  0.00,  2.05); // Blue Center
	vec3.set(positions[11],  2.05,  0.00,  2.05); // Blue - Orange
	vec3.set(positions[12], -2.05,  0.00,  0.00); // Red Center
	vec3.set(positions[13],  0.00,  0.00,  0.00); // Center of Cube
	vec3.set(positions[14],  2.05,  0.00,  0.00); // Orange Center
	vec3.set(positions[15], -2.05,  0.00, -2.05); // Green - Red
	vec3.set(positions[16],  0.00,  0.00, -2.05); // Green Center
	vec3.set(positions[17],  2.05,  0.00, -2.05); // Green - Orange
	vec3.set(positions[18], -2.05, -2.05,  2.05); // Blue - Red - Yellow
	vec3.set(positions[19],  0.00, -2.05,  2.05); // Blue - Yellow
	vec3.set(positions[20],  2.05, -2.05,  2.05); // Blue - Orange - Yellow
	vec3.set(positions[21], -2.05, -2.05,  0.00); // Yellow - Red
	vec3.set(positions[22],  0.00, -2.05,  0.00); // Yellow Center
	vec3.set(positions[23],  2.05, -2.05,  0.00); // Yellow - Orange
	vec3.set(positions[24], -2.05, -2.05, -2.05); // Green - Red - Yellow
	vec3.set(positions[25],  0.00, -2.05, -2.05); // Green - Yellow
	vec3.set(positions[26],  2.05, -2.05, -2.05); // Green - Orange - Yellow
      
}

var cubes, positions;
var centerClicked = null;
var deg = 90;

function tick() {
    
	switch(centerClicked) {
        case 0: 
            whiteRotation();
        break;
        case 1:
            yellowRotation();
        break;
        case 2:
            blueRotation();
        break;
        case 3:
            greenRotation();
        break;
        case 4:
            redRotation();
        break;
        case 5:
            orangeRotation();
        break;
        default:
        break;
	}
	drawScene(cubes, positions, centerClicked);
	requestAnimFrame(tick);	
}

function upMove() {
    var upCopy = up.slice(0);
    for (var i = 0; i < newSides.length; i++){
        up[newSides[i]] = upCopy[i];
    }
    
    leftCopy = left.slice(0);
    rightCopy = right.slice(0);
    backCopy = back.slice(0);
    frontCopy = front.slice(0);
    
    front[0] = rightCopy[0];
    front[1] = rightCopy[1];
    front[2] = rightCopy[2];
    left[0] = frontCopy[0];
    left[1] = frontCopy[1];
    left[2] = frontCopy[2];
    right[0] = backCopy[8];
    right[1] = backCopy[7];
    right[2] = backCopy[6];
    back[8] = leftCopy[0];
    back[7] = leftCopy[1];
    back[6] = leftCopy[2];
    
}

function leftMove() {
    var leftCopy = left.slice(0);
    for (var i = 0; i < newSides.length; i++){
        left[newSides[i]] = leftCopy[i];
    }
    
    upCopy = up.slice(0);
    downCopy = down.slice(0);
    backCopy = back.slice(0);
    frontCopy = front.slice(0);
    
    up[0] = backCopy[0];
    up[3] = backCopy[3];
    up[6] = backCopy[6];
    front[0] = upCopy[0];
    front[3] = upCopy[3];
    front[6] = upCopy[6];
    down[0] = frontCopy[0];
    down[3] = frontCopy[3];
    down[6] = frontCopy[6];
    back[0] = downCopy[0];
    back[3] = downCopy[3];
    back[6] = downCopy[6];
}

function downMove() {
    var downCopy = down.slice(0);
    for (var i = 0; i < newSides.length; i++){
        down[newSides[i]] = downCopy[i];
    }
    
    backCopy = back.slice(0);
    frontCopy = front.slice(0);
    leftCopy = left.slice(0);
    rightCopy = right.slice(0);
    
    back[0] = rightCopy[8];
    back[1] = rightCopy[7];
    back[2] = rightCopy[6];
    front[6] = leftCopy[6];
    front[7] = leftCopy[7];
    front[8] = leftCopy[8];
    left[6] = backCopy[2];
    left[7] = backCopy[1];
    left[8] = backCopy[0];
    right[6] = frontCopy[6];
    right[7] = frontCopy[7];
    right[8] = frontCopy[8];
}

function rightMove() {
    var rightCopy = right.slice(0);
    for (var i = 0; i < newSides.length; i++){
        right[newSides[i]] = rightCopy[i];
    }
    
    backCopy = back.slice(0);
    frontCopy = front.slice(0);
    upCopy = up.slice(0);
    downCopy = down.slice(0);
    
    back[2] = upCopy[2];
    back[5] = upCopy[5];
    back[8] = upCopy[8];
    front[2] = downCopy[2];
    front[5] = downCopy[5];
    front[8] = downCopy[8];
    up[2] = frontCopy[2];
    up[5] = frontCopy[5];
    up[8] = frontCopy[8];
    down[2] = backCopy[2];
    down[5] = backCopy[5];
    down[8] = backCopy[8];
}

function frontMove() {
    var frontCopy = front.slice(0);
    for (var i = 0; i < newSides.length; i++){
        front[newSides[i]] = frontCopy[i];
    }
    
    leftCopy = left.slice(0);
    rightCopy = right.slice(0);
    upCopy = up.slice(0);
    downCopy = down.slice(0);
    
    left[2] = downCopy[0];
    left[5] = downCopy[1];
    left[8] = downCopy[2];
    right[0] = upCopy[6];
    right[3] = upCopy[7];
    right[6] = upCopy[8];
    up[6] = leftCopy[8];
    up[7] = leftCopy[5];
    up[8] = leftCopy[2];
    down[0] = rightCopy[6];
    down[1] = rightCopy[3];
    down[2] = rightCopy[0];
}

function backMove() {
    var backCopy = back.slice(0);
    for (var i = 0; i < newSides.length; i++){
        back[newSides[i]] = backCopy[i];
    }
    
    leftCopy = left.slice(0);
    rightCopy = right.slice(0);
    upCopy = up.slice(0);
    downCopy = down.slice(0);
    
    left[0] = upCopy[2];
    left[3] = upCopy[1];
    left[6] = upCopy[0];
    right[2] = downCopy[8];
    right[5] = downCopy[7];
    right[8] = downCopy[6];
    up[0] = rightCopy[2];
    up[1] = rightCopy[5];
    up[2] = rightCopy[8];
    down[6] = leftCopy[0];
    down[7] = leftCopy[3];
    down[8] = leftCopy[6];
}

function whiteRotation() {
    var inc = -1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
		deg -= 1;
        for (var j = 0; j < up.length; j++) {
            mat4.rotate(cubes[up[j]].rotationer, cubes[up[j]].rotationer, degToRad(inc), [0.0, 1.0, 0.0]);
        }
	} else {
		centerClicked = null;
        upMove();
        if (inverse) {
            upMove();
            upMove();
            inverse = false;
        }
        for (var j = 0; j < up.length; j++) {
            cubes[up[j]].rotations.push(cubes[up[j]].rotationer);
            cubes[up[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function redRotation() {
    var inc = 1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
		deg -= 1;
        for (var j = 0; j < left.length; j++) {
            mat4.rotate(cubes[left[j]].rotationer, cubes[left[j]].rotationer, degToRad(inc), [1.0, 0.0, 0.0]);
        }
	} else {
        centerClicked = null;
        leftMove();
        if (inverse){
            leftMove();
            leftMove();
            inverse = false;
        }
        for (var j = 0; j < left.length; j++) {
            cubes[left[j]].rotations.push(cubes[left[j]].rotationer);
            cubes[left[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function orangeRotation() {
    var inc = -1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
		deg -= 1;
        for (var j = 0; j < right.length; j++) {
            mat4.rotate(cubes[right[j]].rotationer, cubes[right[j]].rotationer, degToRad(inc), [1.0, 0.0, 0.0]);
        }
	} else {
        centerClicked = null;
        rightMove();
        if (inverse) {
            rightMove();
            rightMove();
            inverse = false;
        }
        for (var j = 0; j < right.length; j++) {
            cubes[right[j]].rotations.push(cubes[right[j]].rotationer);
            cubes[right[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function yellowRotation() {
    var inc = 1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
        deg -= 1;
        for (var j = 0; j < down.length; j++) {
            mat4.rotate(cubes[down[j]].rotationer, cubes[down[j]].rotationer, degToRad(inc), [0.0, 1.0, 0.0]);	
        }
	} else {
		centerClicked = null;
        downMove();
        if (inverse) {
            downMove();
            downMove();
            inverse = false;
        }
        for (var j = 0; j < down.length; j++) {
            cubes[down[j]].rotations.push(cubes[down[j]].rotationer);
            cubes[down[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function blueRotation() {
    var inc = -1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
        deg -= 1;
        for (var j = 0; j < front.length; j++) {
            mat4.rotate(cubes[front[j]].rotationer, cubes[front[j]].rotationer, degToRad(inc), [0.0, 0.0, 1.0]);	
        }
	} else {
		centerClicked = null;
        frontMove();
        if (inverse) {
            frontMove();
            frontMove();
            inverse = false;
        }
        for (var j = 0; j < front.length; j++) {
            cubes[front[j]].rotations.push(cubes[front[j]].rotationer);
            cubes[front[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function greenRotation() {
    var inc = 1;
    if (inverse) {
        inc *= -1;
    }
	if (deg > 0){
        deg -= 1;
        for (var j = 0; j < back.length; j++) {
            mat4.rotate(cubes[back[j]].rotationer, cubes[back[j]].rotationer, degToRad(inc), [0.0, 0.0, 1.0]);	
        }
	} else {
		centerClicked = null;
        backMove();
        if (inverse) {
            backMove();
            backMove();
            inverse = false;
        }
        for (var j = 0; j < back.length; j++) {
            cubes[back[j]].rotations.push(cubes[back[j]].rotationer);
            cubes[back[j]].rotationer = mat4.create();
        }
		deg = 90;
	}
}

function click(e) {
    if (centerClicked == null) {
        var prime = "";
        if (e.shiftKey) {
            var prime = "'"; 
        }
        getColor(e, prime);
    }
}

/**********************/
/* Scramble Algorithm */
/**********************/
var spin, counter;

// Function is attached to button on the bottom of "main_original.html"
function scramble() {
    spin = true; 
	counter = 1; 
	random();
}

var invert_move = function (move) {
    if (move.length > 1) {
        return move.charAt(0);
    } else {
        return (move + "'");
    }
}

var reverse_alg = function() {
    var newAlg = [];
    for (var i = alg.length - 1; i > -1; i--) {
        undoAlg.push(invert_move(alg[i]));
    }
    alg = [];
}

function solve() {
	reverse_alg();
	spin = true;  
	runSolve();
}

function runSolve() {
    doMove(undoAlg.shift());
    
    // wait for animation to finish for next spin
    if(spin) {
		setTimeout(runSolve, 1800);
	}
	
	if (undoAlg.length == 0) {
		spin = false;
		alg = [];
	}

}


function random() {
    // legal movements          movePrime FALSE or TRUE
    var movement = "UDRLFB",    movePrime = "FT";
    
    // single random generated movement from string
    single = movement.charAt(Math.floor(Math.random() * movement.length)); 
    
    //doMove ( is it primed ? if primed, "'" is appended to single character )
    doMove
     ((movePrime.charAt(Math.floor(Math.random() * movePrime.length)) == "T" ?
       inverse=true : inverse = false) == true ? single+"'" : single );
    
    // wait for animation to finish for next spin
    if(spin) setTimeout(random, 1800);
    
    // setTimeout is infinite, need a helper "stopper" function
    stop(counter++);
}
function stop() {
    //10 spins is a shuffle
    if(counter==10) spin=false;
}

/*****************/
/* Main function */
/*****************/
function startRubik() {
	canvas = document.getElementById("project-canvas");
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
	
	var ctx = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	
	buf = new Uint8Array(canvas.width * canvas.height * 4);
	
	// Initialize GL, shaders, and texture.
	initGL();
	initShaders();
	initTexture();
    
	// Populate colors array with appropriate face colors for each cube
	var colors_arr = [];
	for (var i = 0; i < num_of_cubes; ++i) {
		colors_arr[i] = [];
		for (var j = 0; j < 6; ++j) {
			colors_arr[i][j] = [0.0, 0.0, 0.0, 1.0];
		}
	}

	// Apply color to cubes' faces
	paintCubes(colors_arr);

	// Create all 27 cubes that makes up a single Rubik's Cube
	cubes = [];
	for (var i = 0; i < num_of_cubes; ++i) {
		cubes[i] = [];
        cubes[i].rotationer = mat4.create();
        cubes[i].rotations = [];
        cubes[i].rotations.push(mat4.create());
		createCubes(cubes[i], colors_arr[i]);
	}

	// Set initial positions for the cubes
	positions = [];
	for (var i = 0; i < num_of_cubes; ++i) {
		positions[i] = vec3.create();
	}
	setInitialXYZ(positions);

	gl.clearColor(0.94, 0.94, 0.94, 1.0);
	gl.enable(gl.DEPTH_TEST);

	// Register mouse events
	canvas.onmousedown = handleMouseDown;
	canvas.onmouseup   = handleMouseUp;
	canvas.onmousemove = handleMouseMove;
	canvas.addEventListener("click", click, false);
	tick(1);
}
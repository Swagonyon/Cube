
/***************************************/
/* Initialize WebGL context for canvas */
/***************************************/
var gl;
var canvas;
var buf;
function initGL() {
	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	} catch (e) {}
	if (!gl) {
		alert("Unable to initialize WebGL.");
	}
}

/*****************************************/
/* Retrieve shader using given shader ID */
/*****************************************/
function getShader(id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		return null;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while (k) {
		if (k.nodeType == 3) {
			str += k.textContent;
		}
		k = k.nextSibling;
	}

	var shader;
	if (shaderScript.type == "x-shader/x-fragment") {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == "x-shader/x-vertex") {
		shader = gl.createShader(gl.VERTEX_SHADER);	
	} else {
		return null;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		alert(gl.getShaderInfoLog(shader));
		return null;
	}
	
	return shader;
}

/**********************/
/* Initialize shaders */
/**********************/
var shaderProgram;

function initShaders() {
	var fragmentShader = getShader("shader-fs");
	var vertexShader = getShader("shader-vs");
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Unable to initialize shaders.");
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
	gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

/***************************************/
/* Initialize WebGL context for canvas */
/***************************************/
function handleLoadedTexture(texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
}


/********************************************/
/* Initialize texture object and load image */
/********************************************/
var rubikTexture;
function initTexture() {
	rubikTexture = gl.createTexture();
	rubikTexture.image = new Image();
	rubikTexture.image.onload = function() {
		handleLoadedTexture(rubikTexture);
	}
	rubikTexture.image.src = "img/rubik-cube-outline.png";
}

var mvMatrix = mat4.create();
var pMatrix = mat4.create();

var mvMatrixStack = [];

/*******************************************************/
/* Push/pop function allows for storing matrix's state */
/*******************************************************/
function mvPushMatrix() {
	var copy = mat4.clone(mvMatrix);
	mvMatrixStack.push(copy);
}
function mvPopMatrix() {
	if (mvMatrixStack.length == 0) {
		throw "Invalid popMatrix!";
	}
	mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/*****************************************/
/* Create one cube with specified colors */
/*****************************************/
function createCubes(cube, colors) {
	cube.vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexPositionBuffer);
	var vertices = [
		// Front face
		-1.0, -1.0,  1.0,
		1.0, -1.0,  1.0,
		1.0,  1.0,  1.0,
		-1.0,  1.0,  1.0,
		
		// Back face
		-1.0, -1.0, -1.0,
		-1.0,  1.0, -1.0,
		1.0,  1.0, -1.0,
		1.0, -1.0, -1.0,
		
		// Top face
		-1.0,  1.0, -1.0,
		-1.0,  1.0,  1.0,
		1.0,  1.0,  1.0,
		1.0,  1.0, -1.0,
		
		// Bottom face
		-1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0,  1.0,
		-1.0, -1.0,  1.0,
		
		// Right face
		1.0, -1.0, -1.0,
		1.0,  1.0, -1.0,
		1.0,  1.0,  1.0,
		1.0, -1.0,  1.0,
		
		// Left face
		-1.0, -1.0, -1.0,
		-1.0, -1.0,  1.0,
		-1.0,  1.0,  1.0,
		-1.0,  1.0, -1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	cube.vertexPositionBuffer.itemSize = 3;
	cube.vertexPositionBuffer.numItems = 24;

	cube.vertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexColorBuffer);
	var unpackedColors = [];

	for (var i in colors) {
		var color = colors[i];
		for (var j = 0; j < 4; ++j) {
			unpackedColors = unpackedColors.concat(color);	
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
	cube.vertexColorBuffer.itemSize = 4;
	cube.vertexColorBuffer.numItems = 24;
	
	cube.vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cube.vertexIndexBuffer);
	var cubeVertexIndices = [
		0,  1,  2,    0,  2,  3,   // Front face
		4,  5,  6,    4,  6,  7,   // Back face
		8,  9,  10,   8,  10, 11,  // Top face
		12, 13, 14,   12, 14, 15,  // Bottom face
		16, 17, 18,   16, 18, 19,  // Right face
		20, 21, 22,   20, 22, 23   // Left face
	];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
	cube.vertexIndexBuffer.itemSize = 1;
	cube.vertexIndexBuffer.numItems = 36;

	cube.vertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cube.vertexTextureCoordBuffer);
	var textureCoords = [
		// Front face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,

		// Back face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Top face
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,

		// Bottom face
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,
		1.0, 0.0,

		// Right face
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
		0.0, 0.0,

		// Left face
		0.0, 0.0,
		1.0, 0.0,
		1.0, 1.0,
		0.0, 1.0,
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
	cube.vertexTextureCoordBuffer.itemSize = 2;
	cube.vertexTextureCoordBuffer.numItems = 24;
}

var num_of_cubes = 27;
var center_cube = vec3.fromValues(0.0, 0.0, -16.0);

/********************************************************/
/* Six populate color functions for each face of a cube */
/********************************************************/

// Blue
function populateFront(colors) {
	colors[0][1] = 0.082;
	colors[0][2] = 0.491;
}

// Green
function populateBack(colors) {
	colors[1][1] = 0.342;
	colors[1][2] = 0.117;
}

// White
function populateTop(colors) {
	colors[2][0] = 1.0;
	colors[2][1] = 1.0;
	colors[2][2] = 1.0;
}

// Yellow
function populateBottom(colors) {
	colors[3][0] = 1.0;
	colors[3][1] = 0.665;
}

// Orange
function populateRight(colors) {
	colors[4][0] = 1.0;
	colors[4][1] = 0.098;
}

// Red
function populateLeft(colors) {
	colors[5][0] = 0.552;
	colors[5][1] = 0.013;
	colors[5][2] = 0.042;
}

/*************************************************************/
/* Function to populate faces of cubes with specified colors */
/*************************************************************/
function paintCubes(colors_arr) {
	// Cube 1 (front blue, top white, left red)
	populateFront(colors_arr[0]);
	populateTop(colors_arr[0]);
	populateLeft(colors_arr[0]);

	// Cube 2 (front blue, top white)
	populateFront(colors_arr[1]);
	populateTop(colors_arr[1]);

	// Cube 3 (front blue, top white, right orange)
	populateFront(colors_arr[2]);
	populateTop(colors_arr[2]);
	populateRight(colors_arr[2]);

	// Cube 4 (top white, left red)
	populateTop(colors_arr[3]);
	populateLeft(colors_arr[3]);

	// Cube 5 (top white)
	colors_arr[4][2][0] = 0.98;
	colors_arr[4][2][1] = 1.0;
	colors_arr[4][2][2] = 1.0;

	// Cube 6 (top white, right orange)
	populateTop(colors_arr[5]);
	populateRight(colors_arr[5]);

	// Cube 7 (back green, top white, left red)
	populateBack(colors_arr[6]);
	populateTop(colors_arr[6]);
	populateLeft(colors_arr[6]);

	// Cube 8 (back green, top white)
	populateBack(colors_arr[7]);
	populateTop(colors_arr[7]);

	// Cube 9 (back green, top white, right orange)
	populateBack(colors_arr[8]);
	populateTop(colors_arr[8]);
	populateRight(colors_arr[8]);

	// Cube 10 (front blue, left red)
	populateFront(colors_arr[9]);
	populateLeft(colors_arr[9]);

	// Cube 11 (front blue)
	colors_arr[10][0][1] = 0.081;
	colors_arr[10][0][2] = 0.482;

	// Cube 12 (front blue, right orange)
	populateFront(colors_arr[11]);
	populateRight(colors_arr[11]);

	// Cube 13 (left red)
	colors_arr[12][5][0] = 0.545;
	colors_arr[12][5][1] = 0.013;
	colors_arr[12][5][2] = 0.042;

	// Cube 14 (all black)

	// Cube 15 (right orange)
	colors_arr[14][4][0] = 0.990;
	colors_arr[14][4][1] = 0.098;

	// Cube 16 (back green, left red)
	populateBack(colors_arr[15]);
	populateLeft(colors_arr[15]);

	// Cube 17 (back green)
	colors_arr[16][1][1] = 0.337;
	colors_arr[16][1][2] = 0.117;

	// Cube 18 (back green, right orange)
	populateBack(colors_arr[17]);
	populateRight(colors_arr[17]);

	// Cube 19 (front blue, bottom yellow, left red)
	populateFront(colors_arr[18]);
	populateBottom(colors_arr[18]);
	populateLeft(colors_arr[18]);-

	// Cube 20 (front blue, bottom yellow)
	populateFront(colors_arr[19]);
	populateBottom(colors_arr[19]);

	// Cube 21 (front blue, bottom yellow, right orange)
	populateFront(colors_arr[20]);
	populateBottom(colors_arr[20]);
	populateRight(colors_arr[20]);

	// Cube 22 (bottom yellow, left red)
	populateBottom(colors_arr[21]);
	populateLeft(colors_arr[21]);

	// Cube 23 (bottom yellow)
	colors_arr[22][3][0] = 0.98;
	colors_arr[22][3][1] = 0.665;

	// Cube 24 (bottom yellow, right orange)
	populateBottom(colors_arr[23]);
	populateRight(colors_arr[23]);

	// Cube 25 (back green, bottom yellow, left red)
	populateBack(colors_arr[24])
	populateBottom(colors_arr[24]);
	populateLeft(colors_arr[24]);

	// Cube 26 (back green, bottom yellow)
	populateBack(colors_arr[25])
	populateBottom(colors_arr[25]);

	// Cube 27 (back green, bottom yellow, right orange)
	populateBack(colors_arr[26])
	populateBottom(colors_arr[26]);
	populateRight(colors_arr[26]);
}

// Get the mouse coordinates relative to a click
function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;
    do {
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;
    if (event.offsetX !== undefined && event.offsetY !== undefined) { 
        return {x:event.offsetX, y: canvas.height - event.offsetY}; 
    } else {
        return {x:canvasX, y: canvas.height - canvasY}
    }
}
// Assign this function to the canvas
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

/******************************/
/* Convert degrees to radians */
/******************************/
function degToRad(degrees) {
	return degrees * Math.PI / 180;
}

// Convert RGB values to hexadecimal ones
function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}


function findPosition(canvas_obj) {
	var current_left = 0;
	var current_top  = 0;

	if (canvas_obj.offsetParent) {
		do {
			current_left += canvas_obj.offsetLeft;
			current_top  += canvas_obj.offsetTop;
		} while (canvas_obj = canvas_obj.offsetParent);
		return vec2.fromValues(current_left, current_top);
	}
}

var mouse_down = false;
var last_x = 0;
var last_y = 0;

/*******************************************************************/
/* The following three functions together handle mouse drag events */
/*******************************************************************/
function handleMouseDown(event) {
	mouse_down = true;
	last_x = event.clientX;
	last_y = event.clientY;
}

function handleMouseUp(event) {
	mouse_down = false;
}

function handleMouseMove(event) {
	if (!mouse_down) {
		return;
	}

	//var position = findPosition(gl.canvas);
	//var x = event.pageX - position.x;
	//var y = event.pageY - position.y;
	//ctx.fillStyle = "rgb(255,0,0)";
	//ctx.fillRect(0, 0, 50, 50);
	//ctx.fillStyle = "rgb(0,0,255)";
	//ctx.fillRect(55, 0, 50, 50);
	//var hex_data = ctx.getImageData(x, y, 1, 1).data;

	//if (hex_data[0] == 0.25 && hex_data[1] == 0.25 && hex_data[2] == 0.25 && hex_data[3] == 1) {
	var current_x = event.clientX;
	var current_y = event.clientY;
	var delta_x   = current_x - last_x;
	var delta_y   = current_y - last_y;

	// By creating a new rotation matrix, the additional rotation won't be based off of the cube's current rotation.
	// After getting the new rotation matrix, add it onto the cube's current rotation.
	// Basically, we are rotating around a fixed axis rather than the object's varying axis.
	var new_rotation_matrix = mat4.create();
	mat4.rotate(new_rotation_matrix, new_rotation_matrix, degToRad(delta_x / 4), [0, 1, 0]);
	mat4.rotate(new_rotation_matrix, new_rotation_matrix, degToRad(delta_y / 4), [1, 0, 0]);
	mat4.multiply(cube_rotation_matrix, new_rotation_matrix, cube_rotation_matrix);

	// Save the current mouse's location to use in next iteration
	last_x = current_x;
	last_y = current_y;
	//}
}
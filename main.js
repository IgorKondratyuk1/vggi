'use strict';
let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

// Init data for calculation figure coordinates
const tStep = Math.PI / 180 * 40;
const aStep = Math.PI / 180 * 13;
const size = Math.PI / 2;
const generalColor = [0.5,0.9,0.2,1];
let figureCoordinates = [];

let r = 1;
let c = 2;
let d = 1;
let teta = Math.PI/2;
let a0 = 0;

// Functions for calculation X,Y,Z coordinates for surface
function getX (t,a, param = 15) {
    return (r * Math.cos(a) - (r * (a0 - a) + t * Math.cos(teta) - c * Math.sin(d * t) * Math.sin(teta)) * Math.sin(a)) / param;
}
function getY (t,a, param = 15) {
    return (r * Math.sin(a) + (r * (a0 - a) + t * Math.cos(teta) - c * Math.sin(d * t) * Math.sin(teta)) * Math.cos(a)) / param;
}
function getZ (t, height = 15) {
    return (t * Math.sin(teta) + c * Math.sin(d * t) * Math.cos(teta)) / (-height);
}

function drawElement(type, color, vertices) {
    gl.uniform4fv(shProgram.iColor, color);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);
    gl.bindBuffer(gl.ARRAY_BUFFER, shProgram.iVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(type, 0, vertices.length / 3);
}


function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.count = 0;
    this.

    this.BufferData = function(verticesArr) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        verticesArr.forEach(vertices => {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
            this.count = vertices.length/3;
        })
    }

    this.Draw = function() {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.drawArrays(gl.LINE_STRIP, 0, this.count);
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above draw function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI/8, 1, 8, 12);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707,0.707,0], 0.7);
    let translateToPointZero = m4.translation(0,0,-10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView );
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0 );

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1,1,0,1] );

    //surface.Draw();
    //let c1 = CreateSurface1Data();
    //console.log(c1);
    //c1.forEach( c => drawElement(gl.LINE_STRIP, generalColor, c));

    CreateHPofSurface();
    CreateVPofSurface();
    DrawAxis();
}

// Draw horizontal part of figure
function CreateHPofSurface()
{
    let m = 0;
    for (let t = -15; t <= 15; t += tStep) {
        let coords = [];

        for (let a = 6; a <= 10 * size; a += aStep) {
            const generatedCoords = [getX(t, a, 15), getY(t, a, 15), getZ(t, 30)];
            coords = [...coords, ...generatedCoords];
        }

        drawElement(gl.LINE_STRIP, generalColor, coords);

        figureCoordinates[m++] = [...coords];
        coords = [];
    }
}

// Draw vertical part of figure
function CreateVPofSurface()
{
    for (let j = 0; j < figureCoordinates[0].length; j += 3) {
        let coords = [];

        for (let k = 0; k < figureCoordinates.length; k++) {
            coords = [...coords, figureCoordinates[k][j], figureCoordinates[k][j + 1], figureCoordinates[k][j + 2]];
        }

        drawElement(gl.LINE_STRIP, generalColor, coords);
        coords = [];
    }
}

// function CreateSurface1Data()
// {
//     let m = 0;
//     for (let t = -15; t <= 15; t += tStep) {
//         let coords = [];
//
//         for (let a = 6; a <= 10 * size; a += aStep) {
//             const generatedCoords = [getX(t, a, 15), getY(t, a, 15), getZ(t, 30)];
//
//             coords = [...coords, ...generatedCoords];
//         }
//         figureCoordinates[m++] = [...coords];
//         coords = [];
//     }
//
//     return figureCoordinates;
// }

function DrawAxis() {
    gl.lineWidth(5);
    drawElement(gl.LINES, [1, 0, 0, 1], [-9, 0, 0, 9, 0, 0]);
    drawElement(gl.LINES, [0, 1, 0, 1], [0, -9, 0, 0, 9, 0]);
    drawElement(gl.LINES, [0, 0, 1, 1], [0, 0, -9, 0, 0, 9]);
    gl.lineWidth(1);
}



/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");

    shProgram.iVertexBuffer = gl.createBuffer();

    // surface = new Model('Surface');
    // surface.BufferData(CreateSurface1Data());

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vShader);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}
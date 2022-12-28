'use strict';
let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let parabolaValue = 0.0;

let point = { x: 0, y: 0 };

const scale = 8;

const calcParabola = () => {
  let TParam = Math.sin(parabolaValue) * 3.6;
  return [TParam * scale, 9 * scale, (-10 + (TParam * TParam)) * scale];
}

// Init data for calculation figure coordinates
const generalColor = [0.5,0.9,0.2,1];

let r = 1;
let c = 2;
let d = 1;
let teta = Math.PI/2;
let a0 = 0;


// Functions for calculation X,Y,Z coordinates for surface
function getX (t,a, param = 15) {
    return ((r * Math.cos(a) - (r * (a0 - a) + t * Math.cos(teta) - c * Math.sin(d * t) * Math.sin(teta)) * Math.sin(a)) / param) * scale;
}
function getY (t,a, param = 15) {
    return ((r * Math.sin(a) + (r * (a0 - a) + t * Math.cos(teta) - c * Math.sin(d * t) * Math.sin(teta)) * Math.cos(a)) / param) * scale;
}
function getZ (t, height = 15) {
    return ((t * Math.sin(teta) + c * Math.sin(d * t) * Math.cos(teta)) / (-height)) * scale;
}

function deg2rad(angle) {
    return angle * Math.PI / 180;
}


// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function({ vertexList, normalsList, textureList }) {

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexList), gl.STREAM_DRAW);
     
      gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalsList), gl.STREAM_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureList), gl.STREAM_DRAW);

      this.count = vertexList.length/3;
    }

    this.Draw = function() {

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
      gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shProgram.iAttribVertex);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
      gl.vertexAttribPointer(shProgram.iNormalVertex, 3, gl.FLOAT, true, 0, 0);
      gl.enableVertexAttribArray(shProgram.iNormalVertex);

      gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
      gl.vertexAttribPointer(shProgram.iTextureCoords, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(shProgram.iTextureCoords);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
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

    this.iNormalVertex = -1;

    this.iWorldMatrix = -1;
    this.iWorldInverseTranspose = -1;

    this.iLightWorldPosition = -1;
    this.iLightDirection = -1;

    this.iViewWorldPosition = -1;

    this.iLimit = -1;

    // textCoords
    this.iTextureCoords = -1;
    this.iTMU = -1;

    this.iFAngleRad = -1;
    this.iFPoint = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above draw function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    const angle = document.getElementById('rotAngle').value;
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    /* Set the values of the projection transformation */
    let projection = m4.orthographic(-25, 25, -25, 25, -25, 25);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let WorldMatrix = m4.translation(0, 0, -15);

    let matAccum1 = m4.multiply(WorldMatrix, modelView );
    let modelViewProjection = m4.multiply(projection, matAccum1 );

    var worldInverseMatrix = m4.inverse(matAccum1);
    var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    gl.uniform3fv(shProgram.iViewWorldPosition, [0, 0, 0]);

    gl.uniform1f(shProgram.iLimit, Math.cos(deg2rad(45)));
    gl.uniform3fv(shProgram.iLightWorldPosition, calcParabola());
    gl.uniform3fv(shProgram.iLightDirection, [0, -1, 0]);

    gl.uniformMatrix4fv(shProgram.iWorldInverseTranspose, false, worldInverseTransposeMatrix);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection );
    gl.uniformMatrix4fv(shProgram.iWorldMatrix, false, matAccum1 );
    
    gl.uniform4fv(shProgram.iColor, generalColor );

    gl.uniform1f(shProgram.iFAngleRad, deg2rad(+angle));
  
    gl.uniform2fv(shProgram.iFPoint, [getX(point.x, point.y), getY(point.x, point.y)]);
  
    gl.uniform1i(shProgram.iTMU, 0);

    surface.Draw();
}

function CreateSurfaceData() {
  let vertexList = [];
  let normalsList = [];
  let textureList = [];

  let deltaT = 0.0005;
  let deltaA = 0.0005;

  const step = 0.1

  for (let t = -15; t <= 15; t += step) {
    for (let a = 0; a <= 15; a += step) {
        const tNext = t + step; 
        vertexList.push(getX(t, a, 10), getY(t, a, 10), getZ(t, 20));
        vertexList.push(getX(tNext, a, 10), getY(tNext, a, 10), getZ(tNext, 20));

        // Normals
        let result = m4.cross(calcDerT(t, a, deltaT), calcDerA(t, a, deltaA));
        normalsList.push(result[0], result[1], result[2])

        result = m4.cross(calcDerT(tNext, a, deltaT), calcDerA(tNext, a, deltaA));
        normalsList.push(result[0], result[1], result[2]);

        textureList.push(...calcTextureTA(t, a));
        textureList.push(...calcTextureTA(tNext, a + step));
    }
  }

  return { vertexList, normalsList, textureList };
}

const calcDerT = (t, a, tDelta) => ([
  (getX(t + tDelta, a, 10) - getX(t, a, 10)) / deg2rad(tDelta),
  (getY(t + tDelta, a, 10) - getY(t, a, 10)) / deg2rad(tDelta),
  (getZ(t + tDelta, a) - getZ(t, a)) / deg2rad(tDelta),
])

const calcDerA = (t, a, aDelta) => ([
  (getX(t, a + aDelta, 10) - getX(t, a, 10)) / deg2rad(aDelta),
  (getY(t, a + aDelta, 10) - getY(t, a, 10)) / deg2rad(aDelta),
  (getZ(t, a + aDelta) - getZ(t, a)) / deg2rad(aDelta),
])

const calcTextureTA = (t, a) => ([(t + 15) / 30, a / 15]);

/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram( gl, vertexShaderSource, fragmentShaderSource );

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex              = gl.getAttribLocation(prog, "vertex");
    shProgram.iNormalVertex              = gl.getAttribLocation(prog, "normal");
    shProgram.iColor                     = gl.getUniformLocation(prog, "color");
    shProgram.iLimit                     = gl.getUniformLocation(prog, "limit");

    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iWorldInverseTranspose     = gl.getUniformLocation(prog, "WorldInverseTranspose");
    shProgram.iWorldMatrix               = gl.getUniformLocation(prog, "WorldMatrix");

    shProgram.iLightWorldPosition        = gl.getUniformLocation(prog, "LightWorldPosition");
    shProgram.iLightDirection            = gl.getUniformLocation(prog, "LightDirection");

    shProgram.iViewWorldPosition         = gl.getUniformLocation(prog, "ViewWorldPosition");

    shProgram.iTextureCoords             = gl.getAttribLocation(prog, 'textureCoords');
    shProgram.iTMU                       = gl.getUniformLocation(prog, 'uTexture');

    shProgram.iFAngleRad                 = gl.getUniformLocation(prog, 'fAngleRad');
    shProgram.iFPoint                    = gl.getUniformLocation(prog, 'fPoint');

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData());

    LoadTexture();

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

const onArrowLeftKey = () => {
  parabolaValue -= 0.1;
  draw();
}

const onArrowRightKey = () => {
  parabolaValue += 0.1;
  draw();
}

window.addEventListener("keydown", (event) => { 
  const step = 0.1
  switch (event.key) {
    case 'ArrowLeft':
      onArrowLeftKey()
      break;
    case 'ArrowRight':
      onArrowRightKey()
      break;
    case 'w':
      point.y = point.y + step;
      draw();
      break;
    case 's':
      point.y = point.y - step;
      draw();
      break;
    case 'd':
      point.x = point.x + step;
      draw();
      break;
    case 'a':
      point.x = point.x - step;
      draw();
      break;
    default:
      break;
  }
});

function LoadTexture() {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = 'https://www.the3rdsequence.com/texturedb/download/165/texture/jpg/1024/plastic+stripes-1024x1024.jpg';
  image.onload = () => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    draw();
  };
}
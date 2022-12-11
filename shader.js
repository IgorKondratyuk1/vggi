// Vertex shader
const vertexShaderSource = `
attribute vec3 vertex;
attribute vec3 normal;

uniform mat4 ModelViewProjectionMatrix;
uniform mat4 WorldInverseTranspose;
uniform mat4 WorldMatrix;
uniform vec3 LightWorldPosition;
uniform vec3 ViewWorldPosition;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
    gl_Position = ModelViewProjectionMatrix * vec4(vertex,1.0);

    v_normal = mat3(WorldInverseTranspose) * normal;

    vec3 surfaceWorldPosition = (WorldMatrix * vec4(vertex, 1.0)).xyz;
    v_surfaceToLight = LightWorldPosition - surfaceWorldPosition;
    v_surfaceToView = ViewWorldPosition - surfaceWorldPosition;
}`;


// Fragment shader
const fragmentShaderSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
   precision highp float;
#else
   precision mediump float;
#endif

uniform vec4 color;
uniform vec3 LightDirection;
uniform float limit;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
    vec3 normal = normalize(v_normal);

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    
    float shininess = 8.0;

    float light = 0.0;
    float specular = 0.0;
    float dotFromDirection = dot(surfaceToLightDirection, -LightDirection);
    if (dotFromDirection >= limit) {
      light = dot(normal, surfaceToLightDirection);
      if (light > 0.0) {
        specular = pow(dot(normal, halfVector), shininess);
      }
    }
    
    gl_FragColor = color;
    gl_FragColor.rgb *= light;
    gl_FragColor.rgb += specular;
}`;
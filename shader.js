// Vertex shader
const vertexShaderSource = `
attribute vec3 vertex;
attribute vec3 normal;
attribute vec2 textureCoords;

uniform mat4 ModelViewProjectionMatrix;
uniform mat4 WorldInverseTranspose;
uniform mat4 WorldMatrix;
uniform vec3 LightWorldPosition;
uniform vec3 ViewWorldPosition;
uniform vec2 fPoint;
uniform float fAngleRad;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec2 v_textureCoords;

mat4 getRotate(float angleRad) {
  float c = cos(angleRad);
  float s = sin(angleRad);

  return mat4(
    vec4(c, s, 0.0, 0.0),
    vec4(-s, c, 0.0, 0.0),
    vec4(0.0, 0.0, 1.0, 0.0),
    vec4(0.0, 0.0, 0.0, 1.0)
  );
}

mat4 getTranslate(vec2 t) {
  return mat4(
    1.0, 0.0, 0.0, t.x,
    0.0, 1.0, 0.0, t.y,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

vec2 getTextureCo0rds(vec2 textureCoords, float fAngleRad, vec2 fPoint) {
    mat4 rotateMat = getRotate(fAngleRad);
    mat4 translate = getTranslate(-fPoint);
    mat4 translateBack = getTranslate(fPoint);

    vec4 textCoordTr = translate * vec4(textureCoords, 0, 0);
    vec4 textCoordRotate = textCoordTr * rotateMat;
    vec4 textCoordTrBack = textCoordRotate * translateBack;

    return vec2(textCoordTrBack);
}

void main() {
    gl_Position = ModelViewProjectionMatrix * vec4(vertex,1.0);

    v_normal = mat3(WorldInverseTranspose) * normal;

    vec3 surfaceWorldPosition = (WorldMatrix * vec4(vertex, 1.0)).xyz;
    v_surfaceToLight = LightWorldPosition - surfaceWorldPosition;
    v_surfaceToView = ViewWorldPosition - surfaceWorldPosition;

    v_textureCoords = getTextureCo0rds(textureCoords, fAngleRad, fPoint);
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
uniform sampler2D uTexture;

varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;
varying vec2 v_textureCoords;

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

    vec4 texture = texture2D(uTexture, v_textureCoords);
    
    gl_FragColor = texture * color;
    gl_FragColor.rgb *= light;
    gl_FragColor.rgb += specular;
}`;
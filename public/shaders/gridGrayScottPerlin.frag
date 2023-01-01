#ifdef GL_ES
    precision mediump float;
#endif

const float resetWeight = -1.0; //reset weight for cell self
const float orthoWeight = 0.2; //base weight for cell ortho neighbors
const float diagonalWeight = 0.05; //base weight for cell diagonal neighbors
const vec2 dirLftUp = vec2(-1.0, 1.0); //left up vector
const vec2 dirLftCr = vec2(-1.0, 0.0); //left center vector
const vec2 dirLftDn = vec2(-1.0, -1.0); //left down vector
const vec2 dirCtrUp = vec2(0.0, 1.0); //center up vector
const vec2 dirCtrCr = vec2(0.0, 0.0); //zero vector
const vec2 dirCtrDn = vec2(0.0, -1.0); //center down vector
const vec2 dirRgtUp = vec2(1.0, 1.0); //right up vector
const vec2 dirRgtCr = vec2(1.0, 0.0); //right center vector
const vec2 dirRgtDn = vec2(1.0, -1.0); //right down vector


uniform float uWidth; //canvas width
uniform float uHeight; //canvas height
uniform float uXStep; //canvas 1 pixel step in the x direction
uniform float uYStep; //canvas 1 pixel step in the y direction
uniform float uFeedRate; //feed rate for A
uniform float uKillRate; //kill rate for B
uniform float uDeltaA; //base speed for A
uniform float uDeltaB; //base speed for B
uniform float uTimeScalar; //speed dampener
uniform float uVecScalar; //perlin noise scalar
uniform sampler2D uGrid; //main texture for reaction diffusion
uniform sampler2D uGridNoise; //perlin noise texture

varying vec2 vTexCoord; //current texture position, passed from grid vertex shader

//reaction between chemical A and chemical B
float reaction(vec4 cell)
{
    return cell.r * cell.g * cell.g;
}

//feeds chemical A
float feed(vec4 cell)
{
    return uFeedRate * (1.0 - cell.r);
}

//kills chemical B
float kill(vec4 cell)
{
    return (uKillRate + uFeedRate) * cell.g;
}

//returns external bias from perlin noise texture at position
vec2 getLocalBias(vec2 pos)
{
    vec4 biasData = texture2D(uGridNoise, pos);

    float x = biasData.r;
    float y = biasData.g;
    float xDir = biasData.b;
    float yDir = biasData.a;

    if(xDir < 0.5) x *= -1.0;
    if(yDir < 0.5) y *= -1.0;

    //vec2 bias = vec2(-1.0, 1.0);
    vec2 bias = vec2(x, y);

    //return bias;
    return bias / (length(bias) + 0.0001);
}

//returns directional baseWeight with external bias applied
float getBiasedWeight(vec2 dir, vec2 bias, float baseWeight, float scalar)
{
    float sumX = dir.x + bias.x;
    float sumY = dir.y + bias.y;

    return baseWeight + (sqrt((sumX * sumX) + (sumY * sumY)) * baseWeight * scalar);
}

//returns 3x3 matrix of weights for convolutional methods
mat3 getBiasedWeightsAtPosition(vec2 pos, float scalar)
{
    vec2 nBias = getLocalBias(pos);
    //vec2 nBias = bias / sqrt((bias.x * bias.x) + (bias.y * bias.y));
    //vec2 nBias = bias / (length(bias) + 0.01);
    //vec2 nBias = normalize(bias);

    vec3 col0 = vec3(
        getBiasedWeight(dirLftUp, nBias, diagonalWeight, scalar),
        getBiasedWeight(dirLftCr, nBias, orthoWeight, scalar),
        getBiasedWeight(dirLftDn, nBias, diagonalWeight, scalar));

    vec3 col1 = vec3(
        getBiasedWeight(dirCtrUp, nBias, orthoWeight, scalar),
        0.0,
        getBiasedWeight(dirCtrDn, nBias, orthoWeight, scalar));

    vec3 col2 = vec3(
        getBiasedWeight(dirRgtUp, nBias, diagonalWeight, scalar),
        getBiasedWeight(dirRgtCr, nBias, orthoWeight, scalar),
        getBiasedWeight(dirRgtDn, nBias, diagonalWeight, scalar));

    float total = 
        col0.x + col0.y + col0.z +
        col1.x + col1.y + col1.z +
        col2.x + col2.y + col2.z;

    col0 /= total;
    col1 /= total;
    col2 /= total;

    return mat3(col0, col1, col2);
}

//convolutional method for chemical A
float laplaceA(vec2 pos, mat3 weights)
{
    float x = pos.x;
    float y = pos.y;
    float xStep = 1.0 / uWidth;
    float yStep = 1.0 / uHeight;

    float left = x - xStep;
    if(left < 0.0) left = 1.0 - xStep;

    float right = x + xStep;
    if(right > 1.0 - xStep) right = 0.0;

    float up = y + yStep;
    if(up > 1.0 - yStep) up = 0.0;

    float down = y - yStep;
    if(down < 0.0) down = 1.0 - yStep;

    vec3 wLft = weights[0];
    vec3 wCtr = weights[1];
    vec3 wRgt = weights[2];

    float v = 0.0;
    v += texture2D(uGrid, pos).r * resetWeight;

    v += texture2D(uGrid, vec2(left, up)).r * wLft.x;
    v += texture2D(uGrid, vec2(left, y)).r * wLft.y;
    v += texture2D(uGrid, vec2(left, down)).r * wLft.z;

    v += texture2D(uGrid, vec2(x, up)).r * wCtr.x;
    v += texture2D(uGrid, vec2(x, down)).r * wCtr.z;

    v += texture2D(uGrid, vec2(right, up)).r * wRgt.x;
    v += texture2D(uGrid, vec2(right, y)).r * wRgt.y;
    v += texture2D(uGrid, vec2(right, down)).r * wRgt.z;

    return v;
}

//convolutional method for chemical B - note that weight application here is mirrored to that of laplaceA
float laplaceB(vec2 pos, mat3 weights)
{
    float x = pos.x;
    float y = pos.y;
    float xStep = 1.0 / uWidth;
    float yStep = 1.0 / uHeight;

    float left = x - xStep;
    if(left < 0.0) left = 1.0 - xStep;

    float right = x + xStep;
    if(right > 1.0 - xStep) right = 0.0;
    //if(right > uWidth - xStep) right = 0.0;

    float up = y + yStep;
    if(up > 1.0 - yStep) up = 0.0;

    float down = y - yStep;
    if(down < 0.0) down = 1.0 - yStep;

    vec3 wLft = weights[0];
    vec3 wCtr = weights[1];
    vec3 wRgt = weights[2];

    //weight application is reversed!

    float v = 0.0;
    v += texture2D(uGrid, pos).g * resetWeight;

    v += texture2D(uGrid, vec2(left, up)).g * wRgt.z;
    v += texture2D(uGrid, vec2(left, y)).g * wRgt.y;
    v += texture2D(uGrid, vec2(left, down)).g * wRgt.x;

    v += texture2D(uGrid, vec2(x, up)).g * wCtr.z;
    v += texture2D(uGrid, vec2(x, down)).g * wCtr.x;

    v += texture2D(uGrid, vec2(right, up)).g * wLft.z;
    v += texture2D(uGrid, vec2(right, y)).g * wLft.y;
    v += texture2D(uGrid, vec2(right, down)).g * wLft.x;

    return v;
}

//gray scott method for chemical A with external weights applied
float grayScottA(vec2 pos, vec4 cell, mat3 weights)
{
    float lA = laplaceA(pos, weights);
    
    float stepOne = (lA * uDeltaA) -
        reaction(cell) +
        feed(cell);

    float stepScale = stepOne * uTimeScalar;

    float a = cell.r + stepScale;

    if(a < 0.0) a = 0.0;
    else if(a > 1.0) a = 1.0; 
    //else if(a < 0.00001) a = 0.0;

    return a;
}

//gray scott method for chemical B with external weights applied
float grayScottB(vec2 pos, vec4 cell, mat3 weights)
{
    float lB = laplaceB(pos, weights);
    
    float stepOne = (lB * uDeltaB) +
        reaction(cell) -
        kill(cell);

    float stepScale = stepOne * uTimeScalar;

    float b = cell.g + stepScale;

    if(b < 0.0) b  = 0.0;
    else if(b > 1.0) b = 1.0;
    //else if(b < 0.00001) b = 0.0;

    return b;
}

//gray scott method with external weights applied
vec4 grayScott(vec2 pos, vec4 cell, mat3 weights)
{    
    float a = grayScottA(pos, cell, weights);
    float b = grayScottB(pos, cell, weights);

    return vec4(a, b, 0.0, 1.0);
}

//main, called on application of shader
void main() {
    vec2 pos = vTexCoord; //position of the pixel divided by resolution, to get normalized positions on the canvas
    vec4 cell = texture2D(uGrid, pos); //cell value from main texture at position - cell.r = chemical A and cell.g = chemical B
    mat3 weights = getBiasedWeightsAtPosition(pos, uVecScalar); //gets 3x3 matrix of directional weights with external perline noise bias applied

    gl_FragColor = grayScott(pos, cell, weights); //updates cell value - cell.r = chemical A and cell.g = chemical B
}
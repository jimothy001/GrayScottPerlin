#ifdef GL_ES
    precision mediump float;
#endif

uniform float uWidth; //canvas width
uniform float uHeight; //canvas height
uniform float uPaintX; //paint center position X
uniform float uPaintY; //paint center position Y
uniform float uRadius; //paint radius - everything in radius is painted

varying vec2 vTexCoord; //current texture position, passed from grid vertex shader

uniform sampler2D uGrid; //main texture for painting and copying

uniform bool uPaint; //paint flag
uniform bool uReset; //reset flag

//remaps input value from source range to target range
float remap(float value, float from0, float to0, float from1, float to1)
{
    float offNeg = value - from0;
    float offPos = from1;
    float range0 = to0 - from0;
    float range1 = to1 - from1;
    float ratio = range0 * range1;

    return offNeg / ratio + offPos;
}

//paints chemical B at position - paint strength is based on distance to paint center position
vec4 paint(vec4 cell, vec2 pos)
{
    float mX = uPaintX / uWidth;
    float mY = uPaintY / uHeight;
    mY = 1.0 - mY;

    float d = distance(pos, vec2(mX, mY));

    if(d < uRadius)
    {
        float bExp = exp((uRadius - d) / uRadius);
        float b = remap(bExp, 0.0, 10.0, 0.0, 1.0);

        if(b < 0.0) b = 0.0;
        else if(b > 1.0) b = 1.0;

        if(b > cell.g) return vec4(cell.r, b, cell.b, cell.a);
        else return cell;
    }
    else return cell;
}

//main, called on application of shader
void main() {
   
    vec2 pos = vTexCoord;  //position of the pixel divided by resolution, to get normalized positions on the canvas
    vec4 cell = texture2D(uGrid, pos); //cell value of main texture at position: cell.r = chemical A and cell.g = chemical B

    if(uReset == true)
    {
        gl_FragColor = paint(vec4(255, 0, 0, 0), pos); //clears and drops a large portion of chemical B in center of canvas
    }
    else if(uPaint == true) 
    {
        gl_FragColor = paint(cell, pos); //paints checmical B at mouse position if uPaint is true
    }
    else gl_FragColor = cell; //copies cell value to current output texture position. This is what happens most of the time ;)
}
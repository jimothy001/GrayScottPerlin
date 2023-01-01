#ifdef GL_ES
    precision mediump float;
#endif

varying vec2 vTexCoord; //current texture position, passed from grid vertex shader

uniform sampler2D uGrid; //main texture - contains reaction diffusion data. cell.r = chemical A and cell.g = chemical B
uniform float uRed; //TO-DO - color mixing
uniform float uGreen; //TO-DO - color mixing
uniform float uBlue; //TO-DO - color mixing

//main, called on application of shader
void main() {

    vec4 cell = texture2D(uGrid, vTexCoord);   //cell value of main texture at position

    float value = cell.r - cell.g;
    //float value = cell.g - cell.r;

    //if(value <= 0.0) gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    if(value >= 0.999) gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    else
    {
        // value = 0.1 + value;
        // value /= 1.1;
        
        // value = (1.0 + value) * (1.0 + value);
        // value /= 5.0;

        if(value < 0.0) value = 0.0;
        else if (value > 1.0) value = 1.0;

        gl_FragColor = vec4(
            value, 
            value,
            value, 
            1.0);

        // gl_FragColor = vec4(
        //     1.0 - value * (1.0 - uRed), 
        //     1.0 - value * (1.0 - uGreen), 
        //     1.0 - value * (1.0 - uBlue), 
        //     1.0);
    }
}
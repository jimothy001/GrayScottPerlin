#ifdef GL_ES
    precision mediump float;
#endif

    // Always include this to get the position of the pixel and map the shader correctly onto the shape
    attribute vec3 aPosition; //this stores the location of a given vertex. It is read-only and cannot be renamed and still work.
    attribute vec2 aTexCoord; //ditto for texture pixels;

    //this will be shared with the fragment shader on a pixel-by-pixel basis
    varying vec2 vTexCoord;

    void main() {

        // Copy the position data into a vec4, adding 1.0 as the w parameter
        vec4 positionVec4 = vec4(aPosition, 1.0);

        // Scale to make the output fit the canvas
        //positionVec4.xy = positionVec4.xy - 1.0; 
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0; 

        //Assign tex coord attr to tex coord varying
        vTexCoord = aTexCoord;

        // Send the vertex information on to the fragment shader
        gl_Position = positionVec4;
    }
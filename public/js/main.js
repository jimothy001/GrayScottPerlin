const uiWidth = 256.0; //width of the ui bar
const w = 640.0; //totalWidth - uiWidth; //grid width. TODO: make this resolution adjustable and interpolate while drawing
// const totalWidth = w + uiWidth;//innerWidth; //total width of the p5 canvas. TODO: make this responsive to resizing 
const h = 640.0; //grid height. TODO: make this resolution scalable and interpolate while drawing
const vecStep = 16.0;
const vecShade = 200;

let GL;
let E;
let canvas = null; //canvas

let gridBufferNow = null;
let gridBufferNext = null;
let gridBufferDraw = null;
let noiseBuffer = null;
let noiseTexture = null;
let gridVec = []; //grid vector state

let shaderEditStep = null; //EditStep shader
let shaderGrayScottPerlin = null; //GrayScott+Perlin shader
let shaderDraw = null; //Draw shader!

const weightReset = -1.0; //reset weight for cell self
const weightOrtho = 0.2; //base weight for cell ortho neighbors
const weightDiagonal = 0.05; //base weight for cell diagonal neighbors
const deltaA = 1.0; //base speed for A
const deltaB = 0.5; //base speed for B
let feedRate = 0.029;//0.025; //0.01;//0.018; //0.025; //0.0w55;
let killRate = 0.057;//0.055;//0.01;//0.051; //0.06; //0.062; 
let timeScalar = 1.0; //1.0; //speed dampener
let paintRangeScalar = 0.1; //paint brush radius
let noiseScalar = 0.008;
let vecScalar = 0.5;//0.04;

/**presets from https://github.com/pmneila/jsexp*/
const feedKillPresets = {
    "mazes": {feed: 0.029, kill: 0.057},
    "solitions": {feed: 0.03, kill: 0.062},
    "pulsating solitions": {feed: 0.025, kill: 0.062},
    "worms": {feed: 0.078, kill: 0.061},
    "holes": {feed: 0.039, kill: 0.058},
    "chaos": {feed: 0.026, kill: 0.051},
    "chaos and holes (by clem)": {feed: 0.034, kill: 0.056},
    "moving spots": {feed: 0.014, kill: 0.054},
    "spots and loops": {feed: 0.018, kill: 0.051},
    "waves": {feed: 0.014, kill: 0.045},
    "the u-skate world": {feed: 0.062, kill: 0.06093}
};


/**p5 preload. This is where shaders are loaded*/
preload = () => {
    shaderEditStep = loadShader('shaders/grid.vert', 'shaders/gridEditStep.frag');
    shaderGrayScottPerlin = loadShader('shaders/grid.vert', 'shaders/gridGrayScottPerlin.frag');
    shaderDraw = loadShader('shaders/grid.vert', 'shaders/gridDraw.frag');
}

/**p5 setup. This is called once at the beginning of runtime*/
setup = () => {

    pixelDensity(1);
    canvas = createCanvas(w, h, WEBGL).elt;

    // let gl = _renderer.GL;
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    // gl.enable(gl.BLEND);
    // gl.disable(gl.DEPTH_TEST);

    ortho(0, width, -height, 0, -100, 2000);

    ellipseMode(RADIUS);

    gridBufferNow = createGraphics(w, h, WEBGL);
    gridBufferNow.noStroke();
    gridBufferNow.ellipseMode(RADIUS);

    gridBufferNext = createGraphics(w, h, WEBGL);
    gridBufferNext.noStroke();

    gridBufferDraw = createGraphics(w, h, WEBGL);
    gridBufferDraw.noStroke();

    noiseBuffer = createGraphics(w, h, P2D);
    noiseBuffer.noFill();
    noiseBuffer.stroke(vecShade);
    noiseBuffer.strokeWeight(1);

    noiseTexture = createImage(w, h);
    setPerlinNoise(noiseTexture, w, h);
    initVecGrid(noiseTexture, w, h);
    resetGrid();
}

/**p5 draw loop. This is called every frame*/
draw = () => {

    background(255);

    gridBufferDraw.background(255,0,0,0);
    gridBufferNext = Buffer_GrayScottPerlin(gridBufferNext, shaderGrayScottPerlin, gridBufferNow, noiseTexture);
    gridBufferNow = Buffer_EditStep(gridBufferNow, shaderEditStep, gridBufferNext, mouseX, mouseY, paintRangeScalar, false);
    gridBufferDraw = Buffer_Draw(gridBufferDraw, shaderDraw, gridBufferNext);
   
    noStroke();
    texture(gridBufferDraw);
    rect(0, 0, width, height);

    //noiseBuffer.background(0,0,0,0);
    drawVecGrid(noiseBuffer);
    texture(noiseBuffer);
    rect(0,0, width, height);

    drawPaintRadius();
}

/**Applies GrayScottPerlin shader to buffer */
const Buffer_GrayScottPerlin = (buffer, texShader, grid, gridNoise) =>
{
    buffer.shader(texShader);

    texShader.setUniform('uWidth', w);
    texShader.setUniform('uHeight', h);
    texShader.setUniform('uXStep', 1.0/w);
    texShader.setUniform('uYStep', 1.0/h);
    texShader.setUniform('uFeedRate', feedRate);
    texShader.setUniform('uKillRate', killRate);
    texShader.setUniform('uDeltaA', deltaA);
    texShader.setUniform('uDeltaB', deltaB);
    texShader.setUniform('uTimeScalar', timeScalar);
    texShader.setUniform('uVecScalar', vecScalar);
    texShader.setUniform('uGrid',  grid);
    texShader.setUniform('uGridNoise', gridNoise);

    buffer.rect(0.0, 0.0, width, height);

    return buffer;
}

/**Applies EditStep shader to buffer*/
const Buffer_EditStep = (buffer, texShader, grid, paintX, paintY, range, reset) =>
{
    buffer.shader(texShader);

    texShader.setUniform('uWidth', w);
    texShader.setUniform('uHeight', h);
    texShader.setUniform('uPaintX', paintX);
    texShader.setUniform('uPaintY', paintY);
    texShader.setUniform('uRadius', range);
    texShader.setUniform('uGrid',  grid);
    texShader.setUniform('uPaint', mouseIsPressed);
    texShader.setUniform('uReset', reset);

    buffer.rect(0.0, 0.0, width, height);

    return buffer;
}

/**Applies Draw shader to buffer*/
const Buffer_Draw = (buffer, texShader, grid) =>
{
    buffer.shader(texShader);

    texShader.setUniform('uGrid', grid);
    texShader.setUniform('uRed', 0.01);
    texShader.setUniform('uGreen', 0.01);
    texShader.setUniform('uBlue', 0.01);

    buffer.rect(0.0, 0.0, width, height);

    return buffer;
}

/**Initializes perlin noise vector grid.
*Noise is generated and cached at the level of the RD grid square to regularize resolution of information.
*Noise is averaged and drawn at a larger scale for readability*/
const initVecGrid = (image, w, h) => {
    
    gridVec = [];
    
    for(let x = 0; x < w; x += vecStep)
    {
        const vecX = x / vecStep;
        gridVec[vecX] = [];
        
        for(let y = 0; y < h; y += vecStep)
        {
            const vecY = y / vecStep;
            gridVec[vecX][vecY] = getCellAvgNoise(image, x, x + vecStep, y, y + vecStep);
        }
    }
}

/**Returns average noise vector for a given region of the RD grid.
*Noise is generated and cached at the level of the RD grid square to regularize resolution of information
*Noise is averaged and drawn at a larger scale for readability*/
getCellAvgNoise = (image, startX, endX, startY, endY) => 
{
    let avgX = 0;
    let avgY = 0
    const divX = endX - startX;
    const divY = endY - startY;

    for(let x = startX; x < endX && x < w; x++)
    {
        for(let y = startY; y < endY && y < h; y++)
        {
            const index = (x + y * w) * 4;
            
            let xN = image.pixels[index + 0];
            let yN = image.pixels[index + 1];
            let xDir = image.pixels[index + 2];
            let yDir = image.pixels[index + 3];

            if(xDir < 125) xN *= -1.0;
            if(yDir < 125) yN *= -1.0;

            avgX += xN;
            avgY += yN;
        }
    }
    
    avgX /= divX;
    avgY /= divY;

    const vec = createVector(avgX , avgY);
    vec.normalize();

    return vec;
}

/**returns average of value array*/
const getAvg = (arr, start, end) => 
{
    let avg = 0;
    const divisor = end - start;

    for(let i = start; i < end && i < arr.length; i++)
    {
        avg += arr[i];
    }
    
    return avg / divisor;
}

/**returns single 2d noise value based on x and y position*/
const gen2dUnitNoise = (x, y) => {
    return map(noise(x, y), 0, 1, -1, 1);
}

/**ui => updates noise field scale (higher scale = more detail)*/
const sliderUpdate_noiseScalar = () => {
    noiseScalar = document.getElementById("noiseScalar").value;
    document.getElementById("noiseScalarText").innerHTML = 'Noise Detail Scalar: ' + round(noiseScalar, 4);
    setPerlinNoise(noiseTexture, w, h);
    initVecGrid(noiseTexture, w, h);
}

/**ui => udpates noise vector scalar*/
const sliderUpdate_vecScalar = () => {
    vecScalar = document.getElementById("vecScalar").value;
    document.getElementById("vecScalarText").innerHTML = 'Noise Magnitude Scalar: ' + round(vecScalar, 2);
}

/**ui => updates feed rate scalar*/
const sliderUpdate_feedScalar = () => {
    feedRate = document.getElementById("feedScalar").value;
    document.getElementById("feedScalarText").innerHTML = 'Feed Rate Scalar: ' + round(feedRate, 3);
}

/**ui => updates kill rate scalar*/
const sliderUpdate_killScalar = () => {
    killRate = document.getElementById("killScalar").value;
    document.getElementById("killScalarText").innerHTML = 'Kill Rate Scalar: ' + round(killRate, 3);
}

/**ui => updates time step scalar*/
const sliderUpdate_timeScalar = () => {
    timeScalar = document.getElementById("timeScalar").value;
    document.getElementById("timeScalarText").innerHTML = 'Time Scalar: ' + round(timeScalar, 2);
}

/**ui => updates paint radius*/
const sliderUpdate_paintRangeScalar = () => {
    paintRangeScalar = document.getElementById("paintRangeScalar").value;
    document.getElementById("paintRangeScalarText").innerHTML = 'Paint Radius: ' + round(paintRangeScalar, 2);
}

/**ui => updates feed and kill rates*/
const dropDownUpdate_feedKillPreset = () => {
    const preset = feedKillPresets[document.getElementById("feedKillPreset").value];
    document.getElementById("feedScalar").value = feedRate = preset.feed;
    document.getElementById("killScalar").value = killRate = preset.kill;
    document.getElementById("feedScalarText").innerHTML = 'Feed Rate Scalar: ' + round(feedRate, 3);
    document.getElementById("killScalarText").innerHTML = 'Kill Rate Scalar: ' + round(killRate, 3);
}

/**ui => resetGrid*/
const buttonUpdate_reset = () => {
    resetGrid();
}

/**resets RD grid to its original state*/
const resetGrid = () => {
    gridBufferNow = Buffer_EditStep(gridBufferNow, shaderEditStep, gridBufferNext, w * 0.5, h * 0.5, 0.25, true);
}

/**sets perlin noise texture*/
const setPerlinNoise = (image, w, h) => {
    
    image.loadPixels();

    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            const index = (x + y * w) * 4;
            
            let mNX = gen2dUnitNoise((w + x) * noiseScalar, y * noiseScalar);
            let mNY = gen2dUnitNoise(x * noiseScalar, (h + y) * noiseScalar);

            let dirX = 255;
            let dirY = 255;
            
            if(mNX < 0) 
            {
                dirX = 0;
                mNX = abs(mNX);
            }

            if(mNY < 0) 
            {
                dirY = 0;
                mNY = abs(mNY);
            }


            image.pixels[index + 0] = round(mNX * 255);
            image.pixels[index + 1] = round(mNY * 255); //g
            image.pixels[index + 2] = dirX; //b
            image.pixels[index + 3] = dirY; //a
        }
    }

    image.updatePixels();
}

/**draws vector grid*/
const drawVecGrid = (buffer) => {

    buffer.clear();

    for(let xStep = 0; xStep < gridVec.length; xStep++)
    {
        const xCtr = (xStep * vecStep) + (vecStep * 0.5);
        //const xCtr = uiWidth + (xStep * vecStep) + (vecStep * 0.5);

        for(let yStep = 0; yStep < gridVec[xStep].length; yStep++)
        {
            const yCtr = (yStep * vecStep) + (vecStep * 0.5);
            const vec = gridVec[xStep][yStep];
            const dX = vec.x * vecStep * vecScalar; // * 0.5;
            const dY = vec.y * vecStep * vecScalar; // * 0.5;
            // const dX = vec.x * vecStep * vecScalar * 10;
            // const dY = vec.y * vecStep * vecScalar * 10;

            buffer.line(xCtr, yCtr, xCtr + dX, yCtr + dY);
            //buffer.line(xCtr - dX, yCtr - dY, xCtr + dX, yCtr + dY);
        }
    }
}

/**draws paint radius UI element at mouse cursor position*/
const drawPaintRadius = () =>{

    if(mouseX > 0 && mouseX < w && mouseY > 0 && mouseY < h) //if(mouseX > uiWidth && mouseX < totalWidth && mouseY > 0 && mouseY < h) 
    {
        noFill();
        stroke(0);

        let dim = w;
        if(dim > h) dim = h;

        circle(mouseX, mouseY, paintRangeScalar * dim);
    }
}
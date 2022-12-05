const sliderWidth = uiWidth * 0.8; //ui element width
const sliderOffsetX = uiWidth * 0.1; //ui position x offset
const titleOffsetY = h * 0.17; //ui title y offset
const sliderStepY = h * 0.1;//ui element position y step 
const sliderStep = 0.001;//ui slider value step

let canvas = null; //canvas
let sliderFeedRate = null;
let sliderKillRate = null;
let sliderTimeScalar = null;
let sliderPaintRangeScalar = null;
let sliderNoiseScalar = null;
let sliderVecScalar = null;
let dropDownFeedKill = null;
let buttonReset = null;

//p5 setup. This is called once at the beginning of runtime
setup = () => {

    const e = createCanvas(totalWidth, h);
    canvas = e.canvas;

    //for some reason neither of these seem to affect related console warning.
    drawingContext.willReadFrequently = true;
    setAttributes('2d', 'willReadFrequently', true);

    pixelDensity(1);
    initDir();
    initGrids(w, h);
    initUI();
    setGridCircle(0.5);
}

//p5 draw loop. This is called every frame
draw = () => {

    background(255);

    paintCheck();    
    updateGrid();    
    drawPixels();
    step();

    drawUILabels();
    drawVecGrid();
    //drawVecGridEnds();
    drawPaintRadius();
}

//initialize local cell neighbor directions
initDir = () => {
    dirLftUp = createVector(-1, -1);
    dirCtrUp = createVector(0, -1);
    dirRgtUp = createVector(1, -1);
    dirLftCr = createVector(-1, 0);
    dirCtrCr = createVector(0, 0);
    dirRgtCr = createVector(1, 0);
    dirLftDn = createVector(-1, 1);
    dirCtrDn = createVector(0, 1);
    dirRgtDn = createVector(1, 1);
}

//initialize cell and perlin noise (graphic) grids
initGrids = (w, h) => {
    initCellGrids(w, h);
    initVecGrid(w, h);
}

//initializes cell grid
initCellGrids = (w, h) => {
    for(let x = 0; x < w; x++)
    {
        gridNow[x] = [];
        gridNext[x] = [];
    
        for(let y = 0; y < h; y++)
        {
            const mNX = gen2dUnitNoise((w + x) * noiseScalar, y * noiseScalar);
            const mNY = gen2dUnitNoise(x * noiseScalar, (h + y) * noiseScalar);
    
            gridNow[x][y] = new Cell(x, y, 1.0, 0.0, mNX, mNY, vecScalar);
            gridNext[x][y] = new Cell(x, y, 1.0, 0.0, mNX, mNY, vecScalar);
        }
    }
}

//initializes perlin noise vector grid.
//noise is generated and cached at the level of the RD grid square to regularize resolution of information
//noise is averaged and drawn at a larger scale for readability
initVecGrid = (w, h) => {
    for(let x = 0; x < w; x += vecStep)
    {
        const vecX = x / vecStep;
        gridVec[vecX] = [];
        
        for(let y = 0; y < h; y += vecStep)
        {
            const vecY = y / vecStep;
            gridVec[vecX][vecY] = getCellAvgNoise(x, x + vecStep, y, y + vecStep);
        }
    }
}

//returns average noise vector for a given region of the RD grid.
//noise is generated and cached at the level of the RD grid square to regularize resolution of information
//noise is averaged and drawn at a larger scale for readability
getCellAvgNoise = (startX, endX, startY, endY) => 
{
    let avgX = 0;
    let avgY = 0
    const divX = endX - startX;
    const divY = endY - startY;

    for(let x = startX; x < endX && x < gridNow.length; x++)
    {
        for(let y = startY; y < endY && y < gridNow[x].length; y++)
        {
            const cell = gridNow[x][y];
            avgX += cell.noiseX;
            avgY += cell.noiseY;
        }
    }
    
    avgX /= divX;
    avgY /= divY;

    const vec = createVector(avgX , avgY);
    vec.normalize();

    return vec;
}

//returns average of value array
getAvg = (arr, start, end) => 
{
    let avg = 0;
    const divisor = end - start;

    for(let i = start; i < end && i < arr.length; i++)
    {
        avg += arr[i];
    }
    
    return avg / divisor;
}

//returns single 2d noise value based on x and y position
gen2dUnitNoise = (x, y) => {
    return map(noise(x, y), 0, 1, -1, 1);
}

//(temp) initializes P5 UI elements
initUI = () => {

    sliderNoiseScalar = createSlider(0.001, 0.01, noiseScalar, sliderStep);
    sliderVecScalar = createSlider(0, 0.05, vecScalar, sliderStep);
    sliderFeedRate = createSlider(0.01, 0.08, feedRate, sliderStep);
    sliderKillRate = createSlider(0.01, 0.08, killRate, sliderStep);
    sliderTimeScalar = createSlider(0.1, 1.1, timeScalar, sliderStep);
    sliderPaintRangeScalar = createSlider(0.01, 0.25, paintRangeScalar, sliderStep);
    dropDownFeedKill = createSelect();
    dropDownFeedKill.option("mazes");
    dropDownFeedKill.option("solitions");
    dropDownFeedKill.option("pulsating solitions");
    dropDownFeedKill.option("worms");
    dropDownFeedKill.option("holes");
    dropDownFeedKill.option("chaos");
    dropDownFeedKill.option("chaos and holes (by clem)");
    dropDownFeedKill.option("moving spots");
    dropDownFeedKill.option("spots and loops");
    dropDownFeedKill.option("waves");
    dropDownFeedKill.option("the u-skate world");
    buttonReset = createButton('reset');

    sliderNoiseScalar.mouseReleased(() => {
        noiseScalar = sliderNoiseScalar.value();
        updateCellNoise(w, h);
    });
    sliderVecScalar.mouseReleased(() => {
        vecScalar = sliderVecScalar.value();
        updateCellNoiseVecScalar(vecScalar);
    });
    sliderFeedRate.mouseReleased(() => {feedRate = sliderFeedRate.value();});
    sliderKillRate.mouseReleased(() => {killRate = sliderKillRate.value();});
    sliderTimeScalar.mouseReleased(() => {timeScalar = sliderTimeScalar.value();});  
    sliderPaintRangeScalar.mouseReleased(() => {paintRangeScalar = sliderPaintRangeScalar.value();});
    dropDownFeedKill.changed(() => {
        const presetName = dropDownFeedKill.value();
        const preset = feedKillPresets[presetName];
        feedRate = preset.feed;
        killRate = preset.kill;
        sliderFeedRate.value(feedRate);
        sliderKillRate.value(killRate);
    });
    buttonReset.mouseReleased(() => {resetGrid();});

    sliderNoiseScalar.position(sliderOffsetX, titleOffsetY + sliderStepY);
    sliderVecScalar.position(sliderOffsetX, titleOffsetY + sliderStepY * 2);
    sliderFeedRate.position(sliderOffsetX, titleOffsetY + sliderStepY * 3);
    sliderKillRate.position(sliderOffsetX, titleOffsetY + sliderStepY * 4);
    sliderTimeScalar.position(sliderOffsetX, titleOffsetY + sliderStepY * 5);
    sliderPaintRangeScalar.position(sliderOffsetX, titleOffsetY + sliderStepY * 6);
    dropDownFeedKill.position(sliderOffsetX, titleOffsetY + sliderStepY * 7.15);
    buttonReset.position(sliderOffsetX, titleOffsetY + sliderStepY * 8);

    sliderNoiseScalar.size(sliderWidth);
    sliderVecScalar.size(sliderWidth);
    sliderFeedRate.size(sliderWidth);
    sliderKillRate.size(sliderWidth);
    sliderTimeScalar.size(sliderWidth);
    sliderPaintRangeScalar.size(sliderWidth);
    dropDownFeedKill.size(sliderWidth);
    buttonReset.size(sliderWidth);

    dropDownFeedKill.value("spots and loops");
}

//updates cell perlin noise vector directions.
//this occurs at the level of the RD grid square.
updateCellNoise = (w, h) => {

    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            const mNX = gen2dUnitNoise((w + x) * noiseScalar, y * noiseScalar);
            const mNY = gen2dUnitNoise(x * noiseScalar, (h + y) * noiseScalar);
            gridNow[x][y].setWeights(mNX, mNY, vecScalar);
            gridNext[x][y].setWeights(mNX, mNY, vecScalar);
        }
    }

    initVecGrid(w, h);
}

//updates perlin vector magnitudes.
//this occurs at the level of the RD grid square.
updateCellNoiseVecScalar = (w, h) => {

    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            gridNow[x][y].setWeightScalar(vecScalar);
            gridNext[x][y].setWeightScalar(vecScalar);
        }
    }
}

//resets RD grid to its original state
resetGrid = () => {
    clearGrid();
    setGridCircle(0.5);
}

//clears RD grid of chemical B
clearGrid = () => {
    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            gridNow[x][y].setAB(1, 0);
            gridNext[x][y].setAB(1, 0);
        }
    }
}

//sets circle of chemical b in RD grid
setGridCircle = (sizeRatio) => {

    const xStart = round((w * 0.5) - (w * sizeRatio * 0.5));
    const xEnd = w - xStart;
    const xCenter = round(w * 0.5);
    const yCenter = round(h * 0.5);
    const pi = Math.PI;

    for(let x = xStart; x < xEnd; x++)
    {
        const xUnit = (x - xStart) / (xEnd - xStart);
        const xOffset = round(Math.cos(xUnit * pi) * w * sizeRatio * 0.5);
        const yOffset = round(Math.sin(xUnit * pi) * h * sizeRatio * 0.5);
        const xPos = xCenter + xOffset;

        for(let y = yCenter - yOffset; y < yCenter + yOffset; y++)
        {
            const yPos = y;
            
            gridNow[xPos][yPos].b = 1;
        }
    }

}

//update future grid
updateGrid = () => {

    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            const cellNow = gridNow[x][y];
            const cellNext = gridNext[x][y];
            let aNext = grayScott(cellNow, cellNow.a, deltaA, laplaceA, reactionA, feed);
            let bNext = grayScott(cellNow, cellNow.b, deltaB, laplaceB, reactionB, kill);

            cellNext.setAB(aNext, bNext);
        }
    }
}

//ye olde gray scott model
grayScott = (cell, value, delta, laplace, reaction, feedKill) => {

    const stepOne = (delta * laplace(cell)) + 
        reaction(cell.a, cell.b) + 
        feedKill(value);

    const stepScale = stepOne * timeScalar;

    return value + stepScale;
}

//laplace function for feed values
laplaceA = (cell) => {
    
    const x = cell.x;
    const y = cell.y;
    const left = (x + w - 1) % w;
    const right = (x + 1) % w;
    const up = (y + h - 1) % h;
    const down = (y + 1) % h;
    
    let v = 0;
    v += gridNow[x][y].a * weightReset;
    v += gridNow[left][y].a * cell.weightLftCr;
    v += gridNow[right][y].a * cell.weightRgtCr;
    v += gridNow[x][down].a * cell.weightCtrDn;
    v += gridNow[x][up].a * cell.weightCtrUp;
    v += gridNow[left][up].a * cell.weightLftUp;
    v += gridNow[right][up].a * cell.weightRgtUp;
    v += gridNow[right][down].a * cell.weightRgtDn;
    v += gridNow[left][down].a * cell.weightLftDn;

    return v;
}

//laplace function for kill values
//laplaceB weights should be mirrored to laplaceA because they are based on the difference between the local bias vector and the local neighbor direction vector
laplaceB = (cell) => {
    
    const x = cell.x;
    const y = cell.y;
    const left = (x + w - 1) % w;
    const right = (x + 1) % w;
    const up = (y + h - 1) % h;
    const down = (y + 1) % h;
    
    let v = 0;
    v += gridNow[x][y].b * weightReset;
    v += gridNow[left][y].b * cell.weightRgtCr;
    v += gridNow[right][y].b * cell.weightLftCr;
    v += gridNow[x][down].b * cell.weightCtrUp;
    v += gridNow[x][up].b * cell.weightCtrDn;
    v += gridNow[left][up].b * cell.weightRgtDn;
    v += gridNow[right][up].b * cell.weightLftDn;
    v += gridNow[right][down].b * cell.weightLftUp;
    v += gridNow[left][down].b * cell.weightRgtUp;

    return v;
}

//I had to break these parts of the RD equations down to understand them better
reactionA = (a, b) => { return a * b * b * -1;} //reaction function for cell a value
reactionB = (a, b) => { return a * b * b;}  //reaction function for cell b value
feed = (a) => { return feedRate * (1.0 - a); } //feed function
kill = (b) => { return (killRate + feedRate) * b * -1.0;} //kill function

//draw reaction diffusion grid
drawPixels = () => {
    loadPixels();

    for(x = 0; x < w; x++)
    {
        for(y = 0; y < h; y++)
        {
            const index = (uiWidth + x + y * totalWidth) * 4;
            const cell = gridNext[x][y];
            const value = constrain(floor((cell.a - cell.b) * 255.0), 0, 255);

            pixels[index + 0] = value; //r
            pixels[index + 1] = value; //g
            pixels[index + 2] = value; //b
            pixels[index + 3] = 255; //a
        }
    }

    updatePixels();
}

//draws UI labels
drawUILabels = () => {
    
    const textYOffset = sliderStepY * 0.25;
    
    noStroke();
    fill(0);
    textSize(12);
    textFont('consolas');

    textWrap(WORD);
    text("Gray Scott vs. Perlin Noise \n\n What happens when reaction diffusion is subjected to external forces?", sliderOffsetX, sliderOffsetX, sliderWidth);

    text("noise scale: " + noiseScalar, sliderOffsetX, titleOffsetY + sliderStepY - textYOffset);
    text("noise magnitude: " + vecScalar, sliderOffsetX, titleOffsetY + sliderStepY * 2 - textYOffset);
    text("feed rate: " + feedRate, sliderOffsetX, titleOffsetY + sliderStepY * 3 - textYOffset);
    text("kill rate: " + killRate, sliderOffsetX, titleOffsetY + sliderStepY * 4 - textYOffset);
    text("speed: " + timeScalar, sliderOffsetX, titleOffsetY + sliderStepY * 5 - textYOffset);
    text("brush diameter: " + paintRangeScalar, sliderOffsetX, titleOffsetY + sliderStepY * 6 - textYOffset);
    text("feed/kill presets", sliderOffsetX, titleOffsetY + sliderStepY * 7 - textYOffset);
}

//draws vector grid
drawVecGrid = () => {

    stroke(100);

    for(let xStep = 0; xStep < gridVec.length; xStep++)
    {
        const xCtr = uiWidth + (xStep * vecStep) + (vecStep * 0.5);

        for(let yStep = 0; yStep < gridVec[xStep].length; yStep++)
        {
            const yCtr = (yStep * vecStep) + (vecStep * 0.5);
            const vec = gridVec[xStep][yStep];
            const dX = vec.x * vecStep * vecScalar * 10;
            const dY = vec.y * vecStep * vecScalar * 10;

            line(xCtr - dX, yCtr - dY, xCtr + dX, yCtr + dY); 
        }
    }
}

//draws vector grid ends to indicate directionality
drawVecGridEnds = () => {

    stroke(0);

    for(let xStep = 0; xStep < gridVec.length; xStep++)
    {
        const xCtr = uiWidth + (xStep * vecStep) + (vecStep * 0.5);

        for(let yStep = 0; yStep < gridVec[xStep].length; yStep++)
        {
            const yCtr = (yStep * vecStep) + (vecStep * 0.5);
            const vec = gridVec[xStep][yStep];
            const dX = vec.x * vecStep * vecScalar * 10;
            const dY = vec.y * vecStep * vecScalar * 10;

            line(xCtr + dX * 0.8, yCtr + dY * 0.8, xCtr + dX, yCtr + dY); 
        }
    }
}

//draws paint radius UI element at mouse cursor position
drawPaintRadius = () =>{

    if(mouseX > uiWidth && mouseX < totalWidth && mouseY > 0 && mouseY < h) 
    {
        noFill();
        stroke(0);

        let dim = w;
        if(dim > h) dim = h;

        circle(mouseX, mouseY, paintRangeScalar * dim);
    }
}

//replace current grid with future grid
step = () => {
    const toDrawOver = gridNow;
    gridNow = gridNext;
    gridNext = toDrawOver;
}

//checks for paint input
paintCheck = () => {
    if(mouseIsPressed) paint(mouseX, mouseY, paintRangeScalar, 1); //TODO: erase functionality
}

//applies paint input
paint = (mX, mY, rangeScalar, paintOrErase) => {

    let dim = w;
    if(dim > h) dim = h;

    mX -= uiWidth;

    //check if the mouse is completely off the canvas in terms of radius
    if(mX < 0 || mX > w || mY < 0 || mY > h) return;

    const radius = floor(dim * rangeScalar * 0.5);
    let x0 = floor(mX - radius);
    let x1 = floor(mX + radius);
    let y0 = floor(mY - radius);
    let y1 = floor(mY + radius);

    if(x0 < 0) x0 = 0;
    if(x1 > w) x1 = w;
    if(y0 < 0) y0 = 0;
    if(y1 > h) y1 = h;

    for(x = x0; x < x1; x++)
    {
        for(y = y0; y < y1; y++)
        {
            const d = dist(x, y, mX, mY);

            if(d > radius) continue;
            else
            {
                const vLinear = (radius - d) / radius;
                const vExp = map(exp(vLinear), 0, 10, 0, 1);
                const v = vExp;
    
                if( v > gridNow[x][y].b) gridNow[x][y].b =  v * paintOrErase;
            }  
        }
    }

}

// let debug = false;
// function keyPressed(){
//     if(key == 'd') debug = true;
//     else debug = false;
// }
//const { text } = require("express");

const sliderWidth = uiWidth * 0.8;
const sliderOffsetX = uiWidth * 0.1;
const titleOffsetY = h * 0.17;
const sliderStepY = h * 0.1;
const sliderStep = 0.001;

let canvas = null;
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
    //console.log("setup!");
    //setAttributes('willReadFrequently', true);

    const e = createCanvas(totalWidth, h);
    canvas = e.canvas;

    drawingContext.willReadFrequently = true;
    setAttributes('2d', 'willReadFrequently', true);

    // e.canvas.willReadFrequently = true;
    // e.drawingContext.willReadFrequently = true;
    // //e.drawingContext.getContext('2d', { willReadFrequently: true });
    // e.canvas.getContext('2d', { willReadFrequently: true });
    //console.log(drawingContext);
    // setAttributes('willReadFrequently', true);

    pixelDensity(1);
    
    //bias = createVector(biasStep, biasStep);
    initDir();

    initGrids(w, h);

    initUI();

    setGridCircle(0.5);

    // const halfW = round(w * 0.5);
    // const halfH = round(h * 0.5);
    // const offset = round(w * 0.1);

    // //temp - make this interactive!
    // for(let x = halfW - offset; x < halfW + offset; x++)
    // {
    //     for(let y = halfH - offset; y < halfH + offset; y++)
    //     {
    //         gridNow[x][y].b = 1;
    //     }
    // }
}

//p5 draw loop. This is called every frame
draw = () => {

    background(255);
    //background(0,0,0,0);

    paintCheck();
    
    updateGrid();    
    drawPixels();
    step();

    drawUILabels();
    drawVecGrid();
    drawPaintRadius();
}

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

//initialize grids
initGrids = (w, h) => {
    
    initCellGrids(w, h);
    initVecGrid(w, h);
}

initCellGrids = (w, h) => {

    //const gridWidth = w - uiWidth;
    for(let x = 0; x < w; x++)
    {
        //gridNoise[x] = [];
        gridNow[x] = [];
        gridNext[x] = [];
    
        for(let y = 0; y < h; y++)
        {
            //const noiseY = noise(map(y, 0, h, 0, noiseScalar));
            
            const mNX = gen2dUnitNoise((w + x) * noiseScalar, y * noiseScalar);
            const mNY = gen2dUnitNoise(x * noiseScalar, (h + y) * noiseScalar);
    
            gridNow[x][y] = new Cell(x, y, 1.0, 0.0, mNX, mNY, vecScalar);
            gridNext[x][y] = new Cell(x, y, 1.0, 0.0, mNX, mNY, vecScalar);
        }
    }
}

initVecGrid = (w, h) => {
// const vecGridDimX = w / vecStep;
    // const vecGridDimY = h / vecStep;
    for(let x = 0; x < w; x += vecStep)
    {
        const vecX = x / vecStep;
        //const avgX = getAvg(noiseX, vecX, vecX + vecStep);
        gridVec[vecX] = [];
        
        for(let y = 0; y < h; y += vecStep)
        {
            const vecY = y / vecStep;
            gridVec[vecX][vecY] = getCellAvg(x, x + vecStep, y, y + vecStep);
        }
    }
}

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


    // sliderNoiseScalar.parent(document.getElementsByTagName('main')[0]);
    // sliderNoiseScalar.addClass('mySlider');
    // console.log(sliderNoiseScalar);

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

        //TODO: clear and reset grid
    });
    buttonReset.mouseReleased(() => {resetGrid();});

    // sliderNoiseScalar.parent(canvas);
    // sliderNoiseScalar.position(sliderOffsetX, sliderStepY, 'relative');

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
}

getCellAvg = (startX, endX, startY, endY) => 
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

gen2dUnitNoise = (x, y) => {
    return map(noise(x, y), 0, 1, -1, 1);
}

updateCellNoise = (w, h) => {

    for(let x = 0; x < w; x++)
    {
        for(let y = 0; y < h; y++)
        {
            //const noiseY = noise(map(y, 0, h, 0, noiseScalar));
            
            const mNX = gen2dUnitNoise((w + x) * noiseScalar, y * noiseScalar);
            const mNY = gen2dUnitNoise(x * noiseScalar, (h + y) * noiseScalar);
    
            gridNow[x][y].setWeights(mNX, mNY, vecScalar);
            gridNext[x][y].setWeights(mNX, mNY, vecScalar);
        }
    }

    initVecGrid(w, h);
}

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

resetGrid = () => {
    clearGrid();
    setGridCircle(0.5);
}

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
            const aNext = grayScott(cellNow, cellNow.a, deltaA, laplaceA, reactionA, feed);
            const bNext = grayScott(cellNow, cellNow.b, deltaB, laplaceB, reactionB, kill);

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
//laplaceB weights should be mirrored to laplaceA
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

// getA = (c) => { return c.a; } //return cell a value
// getB = (c) => { return c.b; } //return cell b value
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
            //const index = (uiWidth + x + y * w) * 4;
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

drawVecGrid = () => {

    stroke(0);
    //line(0, 0, mouseX, mouseY);

    for(let xStep = 0; xStep < gridVec.length; xStep++)
    {
        const xCtr = uiWidth + (xStep * vecStep) + (vecStep * 0.5);

        //console.log(xCtr);

        for(let yStep = 0; yStep < gridVec[xStep].length; yStep++)
        {
            const yCtr = (yStep * vecStep) + (vecStep * 0.5);
            
            //if(xStep == 0) console.log(xCtr + ", " + yCtr);
            
            const vec = gridVec[xStep][yStep];
            const dX = vec.x * vecStep * vecScalar * 10;
            const dY = vec.y * vecStep * vecScalar * 10;

            line(xCtr - dX, yCtr - dY, xCtr + dX, yCtr + dY); 
        }
    }
}

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

    //console.log(mX + ", " + mY);

    mX -= uiWidth;

    //check if the mouse is completely off the canvas in terms of radius
    if(mX < 0 || mX > w || mY < 0 || mY > h) return;

    const radius = floor(dim * rangeScalar * 0.5);
    let x0 = floor(mX - radius);
    let x1 = floor(mX + radius);
    let y0 = floor(mY - radius);
    let y1 = floor(mY + radius);

    // //check if the mouse is completely off the canvas in terms of radius
    // if(x1 < 0 || x0 > w || y1 < 0 || y0 > h) return;

    if(x0 < 0) x0 = 0;
    if(x1 > w) x1 = w;
    if(y0 < 0) y0 = 0;
    if(y1 > h) y1 = h;

    //console.log(y0 + ", " + y1);

    for(x = x0; x < x1; x++)
    {
        for(y = y0; y < y1; y++)
        {
            const d = dist(x, y, mX, mY);

            if(d > radius) continue;
            //else if(d < radius * 0.1) gridNow[x][y].b = 1 * paintOrErase;
            else
            {
                const vLinear = (radius - d) / radius;
                //const vPow = vLinear * vLinear * vLinear * 0.25;
                //const vGaussian = exp(vLinear * vLinear * -1);
                const vExp = map(exp(vLinear), 0, 10, 0, 1);
                const v = vExp;
    
                if( v > gridNow[x][y].b) gridNow[x][y].b =  v * paintOrErase;
            }  
        }
    }

}

// //pick up here! Build out bias vector UI

// //TEMP: keyboard bias input for testing
// const biasStep = 0.1;
// function keyPressed() {
//     if(key == 'w') updateBias(createVector(0, -biasStep));
//     if(key == 'a') updateBias(createVector(-biasStep, 0));
//     if(key == 's') updateBias(createVector(0, biasStep));
//     if(key == 'd') updateBias(createVector(biasStep, 0));
// }
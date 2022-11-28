const uiWidth = 256; //width of the ui bar
const totalWidth = innerWidth; //total width of the p5 canvas. TODO: make this responsive to resizing 
const w = totalWidth - uiWidth; //grid width. TODO: make this resolution adjustable and interpolate while drawing
const h = 512; //grid height. TODO: make this resolution scalable and interpolate while drawing

let gridNow = []; //grid current state
let gridNext = []; //grid future state

const weightReset = -1; //reset weight for cell self
const weightOrtho = 0.2; //base weight for cell ortho neighbors
const weightDiagonal = 0.05; //base weight for cell diagonal neighbors
const deltaA = 1.0; //base speed for A
const deltaB = 0.5; //base speed for B
let feedRate = 0.025; //0.0w55;
let killRate = 0.06; //0.062; 
let timeScalar = 1.0; //speed dampener
let paintRangeScalar = 0.1; //paint brush radius

let dirLftUp = null; //left up vector
let dirCtrUp = null; //center up vector
let dirRgtUp = null; //right up vector
let dirLftCr = null; //left center vector
let dirCtrCr = null; //center vector (0, 0)
let dirRgtCr = null; //right center vector
let dirLftDn = null; //left down vector
let dirCtrDn = null; //center down vector
let dirRgtDn = null; //right down vector

let biasVec = null; //bias vector
let weightLftUp = weightDiagonal; //left up result weight
let weightCtrUp = weightOrtho; //center up result weight
let weightRgtUp = weightDiagonal; //right up result weight
let weightLftCr = weightOrtho; //left center result weight
let weightCtrCr = weightReset; //center reset weight (-1)
let weightRgtCr = weightOrtho; //right center result weight
let weightLftDn = weightDiagonal; //left down result weight
let weightCtrDn = weightOrtho; //center down result weight
let weightRgtDn = weightDiagonal; //right down result weight

//p5 setup. This is called once at the beginning of runtime
setup = () => {
    //console.log("setup!");

    createCanvas(innerWidth, h);
    pixelDensity(1);
    initGrids(w, h);

    bias = createVector(biasStep, biasStep);
    dirLftUp = createVector(-1, -1);
    dirCtrUp = createVector(0, -1);
    dirRgtUp = createVector(1, -1);
    dirLftCr = createVector(-1, 0);
    dirCtrCr = createVector(0, 0);
    dirRgtCr = createVector(1, 0);
    dirLftDn = createVector(-1, 1);
    dirCtrDn = createVector(0, 1);
    dirRgtDn = createVector(1, 1);

    resetBias();
    updateBias(bias);

    const halfW = round(w * 0.5);
    const halfH = round(h * 0.5);
    const offset = round(w * 0.1);

    //temp - make this interactive!
    for(let x = halfW - offset; x < halfW + offset; x++)
    {
        for(let y = halfH - offset; y < halfH + offset; y++)
        {
            gridNow[x][y].b = 1;
        }
    }
}

//p5 draw loop. This is called every frame
draw = () => {

    background(200);

    paintCheck();

    updateGrid();
    drawPixels();
    step();
}

//initialize grids
initGrids = (w, h) => {
    
    //const gridWidth = w - uiWidth;
    for(let x = 0; x < w; x++)
    {
        gridNow[x] = [];
        gridNext[x] = [];

        for(let y = 0; y < h; y++)
        {
            gridNow[x][y] = new Cell(x, y, 1.0, 0.0);
            gridNext[x][y] = new Cell(x, y, 1.0, 0.0);
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
            const aNext = grayScott(cellNow, deltaA, laplaceA, getA, reactionA, feed);
            const bNext = grayScott(cellNow, deltaB, laplaceB, getB, reactionB, kill);

            cellNext.set(aNext, bNext);
        }
    }
}

//ye olde gray scot model
grayScott = (cell, delta, laplace, getAB, reaction, feedKill) => {
    
    const v = getAB(cell);

    const stepOne = (delta * laplace(cell.x, cell.y, getAB)) + 
        reaction(cell.a, cell.b) + 
        feedKill(v);

    const stepScale = stepOne * timeScalar;

    return v + stepScale;
}

//laplace function for feed values
laplaceA = (x, y, f) => {
    
    left = (x + w - 1) % w;
    right = (x + 1) % w;
    up = (y + h - 1) % h;
    down = (y + 1) % h;
    
    let v = 0;
    v += f(gridNow[x][y]) * weightReset;
    v += f(gridNow[left][y]) * weightLftCr;
    v += f(gridNow[right][y]) * weightRgtCr;
    v += f(gridNow[x][down]) * weightCtrDn;
    v += f(gridNow[x][up]) * weightCtrUp;
    v += f(gridNow[left][up]) * weightLftUp;
    v += f(gridNow[right][up]) * weightRgtUp;
    v += f(gridNow[right][down]) * weightRgtDn;
    v += f(gridNow[left][down]) * weightLftDn;

    return v;
}

//laplace function for kill values
//laplaceB weights should be mirrored to laplaceA
laplaceB = (x, y, f) => {
    
    left = (x + w - 1) % w;
    right = (x + 1) % w;
    up = (y + h - 1) % h;
    down = (y + 1) % h;
    
    let v = 0;
    v += f(gridNow[x][y]) * weightReset;
    v += f(gridNow[left][y]) * weightRgtCr;
    v += f(gridNow[right][y]) * weightLftCr;
    v += f(gridNow[x][down]) * weightCtrUp;
    v += f(gridNow[x][up]) * weightCtrDn;
    v += f(gridNow[left][up]) * weightRgtDn;
    v += f(gridNow[right][up]) * weightLftDn;
    v += f(gridNow[right][down]) * weightLftUp;
    v += f(gridNow[left][down]) * weightRgtUp;

    return v;
}

//update bias vector and calculate new bias weights
updateBias = (delta) => {

    bias = p5.Vector.add(bias, delta);
    
    calcBias(bias);
}

//reset bias weights
resetBias = () => {
    weightLftUp = weightDiagonal;
    weightCtrUp = weightOrtho;
    weightRgtUp = weightDiagonal;
    weightLftCr = weightOrtho;
    weightCtrCr = weightReset;
    weightRgtCr = weightOrtho;
    weightLftDn = weightDiagonal;
    weightCtrDn = weightOrtho;
    weightRgtDn = weightDiagonal;
}

//calculate new bias weights
calcBias = (bias) => {

    resetBias();

    let total = 0;
    total += weightLftUp = weightDiagonal + calcBiasIndiv(dirLftUp, bias, weightDiagonal);
    total += weightCtrUp = weightOrtho + calcBiasIndiv(dirCtrUp, bias, weightOrtho);
    total += weightRgtUp = weightDiagonal + calcBiasIndiv(dirRgtUp, bias, weightDiagonal);
    total += weightLftCr = weightOrtho + calcBiasIndiv(dirLftCr, bias, weightOrtho);
    //total += weightCtrCr = weightReset;
    total += weightRgtCr = weightOrtho + calcBiasIndiv(dirRgtCr, bias, weightOrtho);
    total += weightLftDn = weightDiagonal + calcBiasIndiv(dirLftDn, bias, weightDiagonal);
    total += weightCtrDn = weightOrtho + calcBiasIndiv(dirCtrDn, bias, weightOrtho);
    total += weightRgtDn = weightDiagonal + calcBiasIndiv(dirRgtDn, bias, weightDiagonal);

    weightLftUp /= total;
    weightCtrUp /= total;
    weightRgtUp /= total;
    weightLftCr /= total;

    weightRgtCr /= total;
    weightLftDn /= total;
    weightCtrDn /= total;
    weightRgtDn /= total;
}

//calculate individual bias weight
calcBiasIndiv = (dir, bias, baseWeight) => 
{
    const sumX = dir.x + bias.x;
    const sumY = dir.y + bias.y;

    return sqrt((sumX * sumX) + (sumY * sumY)) * baseWeight * 0.25;
}

getA = (c) => { return c.a; } //return cell a value
getB = (c) => { return c.b; } //return cell b value
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
            const value = constrain(floor((cell.a - cell.b) * 255.0), 0, 200);

            pixels[index + 0] = value; //r
            pixels[index + 1] = value; //g
            pixels[index + 2] = value; //b
            pixels[index + 3] = 255; //a
        }
    }

    updatePixels();
}

//replace current grid with future grid
step = () => {
    const toDrawOver = gridNow;
    gridNow = gridNext;
    gridNext = toDrawOver;
}

//checks for paint input
paintCheck = () => {
    if(mouseIsPressed) paint(mouseX, mouseY, paintRangeScalar);
}

//applies paint input
paint = (mX, mY, rangeScalar) => {

    let dim = w;
    if(dim > h) dim = h;
    
    mX -= uiWidth;

    const radius = floor(dim * rangeScalar * 0.5);
    let x0 = floor(mX - radius);
    let x1 = floor(mX + radius);
    let y0 = floor(mY - radius);
    let y1 = floor(mY + radius);

    //check if the mouse is completely off the canvas in terms of radius
    if(x1 < 0 || x0 > w || y1 < 0 || y0 > h) return;

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

            const vLinear = (radius - d) / radius;
            //const vPow = vLinear * vLinear * vLinear * 0.25;
            //const vGaussian = exp(vLinear * vLinear * -1);
            const vExp = map(exp(vLinear), 0, 15, 0, 1);
            const v = vExp;

            if( v > gridNow[x][y].b) gridNow[x][y].b =  v;
        }
    }

}

//cell class
class Cell {
    constructor(x, y, a, b)
    {
        this.x = x;
        this.y = y;
        this.a = a;
        this.b = b;

        this.set = (a, b) =>
        {
            this.a = constrain(a, 0, 1);
            this.b = constrain(b, 0, 1);
        }
    } 
}

//pick up here! Build out bias vector UI

//TEMP: keyboard bias input for testing
const biasStep = 0.1;
function keyPressed() {
    if(key == 'w') updateBias(createVector(0, -biasStep));
    if(key == 'a') updateBias(createVector(-biasStep, 0));
    if(key == 's') updateBias(createVector(0, biasStep));
    if(key == 'd') updateBias(createVector(biasStep, 0));
}
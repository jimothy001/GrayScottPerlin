const w = 512;
const h = 512;
const weightReset = -1;
const weightOrtho = 0.2;
const weightDiagonal = 0.05;
const deltaA = 1.0;
const deltaB = 0.5;
const feedRate = 0.055;
const killRate = 0.062; //0.08; //
const timeScalar = 1.0;
let gridNow = [];
let gridNext = [];
const paintRangeScalar = 0.1;

let dirLftUp = null;
let dirCtrUp = null;
let dirRgtUp = null;
let dirLftCr = null;
let dirCtrCr = null;
let dirRgtCr = null;
let dirLftDn = null;
let dirCtrDn = null;
let dirRgtDn = null;

let biasVec = null;
let weightLftUp = weightDiagonal;
let weightCtrUp = weightOrtho;
let weightRgtUp = weightDiagonal;
let weightLftCr = weightOrtho;
let weightCtrCr = weightReset;
let weightRgtCr = weightOrtho;
let weightLftDn = weightDiagonal;
let weightCtrDn = weightOrtho;
let weightRgtDn = weightDiagonal;

setup = () => {
    console.log("setup!");

    createCanvas(w, h);
    pixelDensity(1);
    initGrids(w, h);

    bias = createVector(1.0, 1.0);
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

draw = () => {

    background(50);

    paintCheck();

    updateGrid();
    drawPixels();
    step();

}

initGrids = (w, h) => {
    
    console.log('initGrids');
    
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

grayScott = (cell, delta, laplace, getAB, reaction, feedKill) => {
    
    const v = getAB(cell);

    const stepOne = (delta * laplace(cell.x, cell.y, getAB)) + 
        reaction(cell.a, cell.b) + 
        feedKill(v);

    const stepScale = stepOne * timeScalar;

    return v + stepScale;
}

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

updateBias = (delta) => {

    bias = p5.Vector.add(bias, delta);
    
    calcBias(bias);
}

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

calcBiasIndiv = (dir, bias, baseWeight) => 
{
    const sumX = dir.x + bias.x;
    const sumY = dir.y + bias.y;

    return sqrt((sumX * sumX) + (sumY * sumY)) * baseWeight * 0.25;
}

getA = (c) => { return c.a; }
getB = (c) => { return c.b; }
reactionA = (a, b) => { return a * b * b * -1;}
reactionB = (a, b) => { return a * b * b;}
feed = (a) => { return feedRate * (1.0 - a); }
kill = (b) => { return (killRate + feedRate) * b * -1.0;}

drawPixels = () => {
    loadPixels();

    for(x = 0; x < w; x++)
    {
        for(y = 0; y < h; y++)
        {
            const index = (x + y * w) * 4;
            const cell = gridNext[x][y];
            const value = constrain(floor((cell.a - cell.b) * 255.0), 0, 255.0);

            pixels[index + 0] = value; //r
            pixels[index + 1] = value; //g
            pixels[index + 2] = value; //b
            pixels[index + 3] = 255; //a
        }
    }

    updatePixels();
}

step = () => {
    const toDrawOver = gridNow;
    gridNow = gridNext;
    gridNext = toDrawOver;
}

paintCheck = () => {

    if(!mouseIsPressed) return;

    //console.log('paint!');

    paint(mouseX, mouseY, paintRangeScalar);
}

paint = (mX, mY, rangeScalar) => {

    const dim = w;
    if(dim > h) dim = h;
    
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

const biasStep = 1;
function keyPressed() {
    if(key == 'w') updateBias(createVector(0, -biasStep));
    if(key == 'a') updateBias(createVector(-biasStep, 0));
    if(key == 's') updateBias(createVector(0, biasStep));
    if(key == 'd') updateBias(createVector(biasStep, 0));
}
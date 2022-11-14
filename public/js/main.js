const w = 256;
const h = 256;
const weightReset = -1;
const weightOrtho = 0.2;
const weightDiagonal = 0.05;
const deltaA = 1.0;
const deltaB = 0.5;
const feedRate = 0.055;
const killRate = 0.062;
let gridNow = [];
let gridNext = [];


setup = () => {
    console.log("setup!");

    
    createCanvas(w, h);
    pixelDensity(1);
    initGrids(w, h);

    //temp - make this interactive!
    for(let x = 100; x < 110; x++)
    {
        for(let y = 100; y < 110; y++)
        {
            gridNow[x][y].b = 1;
            //gridNext[x][y].b = 1;
        }
    }
}

draw = () => {

    background(50);
    //updateGrid();
    drawPixels();
    // step();

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
    
    for(let x = 1; x < w - 1; x++)
    {
        for(let y = 1; y < h - 1; y++)
        {
            const cellNow = gridNow[x][y];
            const cellNext = gridNext[x][y];




            //PICK UP HERE AND FIGURE OUT WHY THIS ISN'T UPGRADING CORRECTLY





            cellNext.set(
                grayScott(cellNow, deltaA, getA, reactionA, feed),
                grayScott(cellNow, deltaB, getB, reactionB, kill)
            );
        }
    }
}

grayScott = (cell, delta, getAB, reaction, feedKill) => {
    
    const v = getAB(cell);
    
    return v + 
        (delta * laplace(cell.x, cell.y, getAB)) + 
        reaction(cell.a, cell.b) + 
        feedKill(v);
}

laplace = (x, y, f) => {
    let v = 0;
    v += f(gridNow[x][y]) * weightReset;
    v += f(gridNow[x - 1][y]) * weightOrtho;
    v += f(gridNow[x + 1][y]) * weightOrtho;
    v += f(gridNow[x][y + 1]) * weightOrtho;
    v += f(gridNow[x][y - 1]) * weightOrtho;
    v += f(gridNow[x - 1][y - 1]) * weightDiagonal;
    v += f(gridNow[x + 1][y - 1]) * weightDiagonal;
    v += f(gridNow[x + 1][y + 1]) * weightDiagonal;
    v += f(gridNow[x - 1][y + 1]) * weightDiagonal;

    return v;
}

getA = (c) => { return c.a; }
getB = (c) => { return c.b; }
reactionA = (a, b) => { return a * b * b;}
reactionB = (a, b) => {return -reactionA(a, b);}
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

// laplaceA = (c) => {
//     let a = 0;
//     a += gridNow[c.x][c.y] * weightReset;
//     a += gridNow[c.x - 1][c.y] * weightOrtho;
//     a += gridNow[c.x + 1][c.y] * weightOrtho;
//     a += gridNow[c.x][c.y + 1] * weightOrtho;
//     a += gridNow[c.x][c.y - 1] * weightOrtho;
//     a += gridNow[c.x - 1][c.y - 1] * weightDiagonal;
//     a += gridNow[c.x + 1][c.y - 1] * weightDiagonal;
//     a += gridNow[c.x + 1][c.y + 1] * weightDiagonal;
//     a += gridNow[c.x - 1][c.y + 1] * weightDiagonal;

//     return a;
// }

// laplaceB = (c) => {
//     let b = 0;
//     b += gridNow[c.x][c.y].b * weightReset;
//     b += gridNow[c.x - 1][c.y].b * weightOrtho;
//     b += gridNow[c.x + 1][c.y].b * weightOrtho;
//     b += gridNow[c.x][c.y + 1].b * weightOrtho;
//     b += gridNow[c.x][c.y - 1].b * weightOrtho;
//     b += gridNow[c.x - 1][c.y - 1].b * weightDiagonal;
//     b += gridNow[c.x + 1][c.y - 1].b * weightDiagonal;
//     b += gridNow[c.x + 1][c.y + 1].b * weightDiagonal;
//     b += gridNow[c.x - 1][c.y + 1].b * weightDiagonal;

//     return b;
// }

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
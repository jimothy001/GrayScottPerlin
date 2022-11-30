const uiWidth = 256; //width of the ui bar
const w = 512; //totalWidth - uiWidth; //grid width. TODO: make this resolution adjustable and interpolate while drawing
const totalWidth = w + uiWidth;//innerWidth; //total width of the p5 canvas. TODO: make this responsive to resizing 
const h = 512; //grid height. TODO: make this resolution scalable and interpolate while drawing
const vecStep = 8;

//let gridNoise = []; //grid current state noise
let gridNow = []; //grid current state
let gridNext = []; //grid future state
let gridVec = []; //grid vector state

const weightReset = -1; //reset weight for cell self
const weightOrtho = 0.2; //base weight for cell ortho neighbors
const weightDiagonal = 0.05; //base weight for cell diagonal neighbors
const deltaA = 1.0; //base speed for A
const deltaB = 0.5; //base speed for B
let feedRate = 0.029; //0.025; //0.0w55;
let killRate = 0.057; //0.06; //0.062; 
let timeScalar = 1.0; //speed dampener
let paintRangeScalar = 0.1; //paint brush radius
let noiseScalar = 0.005;
let vecScalar = 0.03;

feedKillPresets = {
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

let dirLftUp = null; //left up vector
let dirCtrUp = null; //center up vector
let dirRgtUp = null; //right up vector
let dirLftCr = null; //left center vector
let dirCtrCr = null; //center vector (0, 0)
let dirRgtCr = null; //right center vector
let dirLftDn = null; //left down vector
let dirCtrDn = null; //center down vector
let dirRgtDn = null; //right down vector

//let biasVec = null; //bias vector
let weightLftUp = weightDiagonal; //left up result weight
let weightCtrUp = weightOrtho; //center up result weight
let weightRgtUp = weightDiagonal; //right up result weight
let weightLftCr = weightOrtho; //left center result weight
let weightCtrCr = weightReset; //center reset weight (-1)
let weightRgtCr = weightOrtho; //right center result weight
let weightLftDn = weightDiagonal; //left down result weight
let weightCtrDn = weightOrtho; //center down result weight
let weightRgtDn = weightDiagonal; //right down result weight
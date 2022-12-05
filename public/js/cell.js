//cell class
class Cell {
    constructor(x, y, a, b, noiseX, noiseY, noiseScalar)
    {
        this.x = x;
        this.y = y;
        
        //sets chemical A and B values, constrains values to bounds of 0 and 1
        this.setAB = (a, b) =>
        {
            this.a = constrain(a, 0, 1);
            this.b = constrain(b, 0, 1);
        }
        this.setAB(a, b);

        //resets weights to base ortho (0.2) and diagonal (0.05) values
        this.zeroWeights = () =>
        {
            this.weightLftUp = weightDiagonal;
            this.weightCtrUp = weightOrtho;
            this.weightRgtUp = weightDiagonal;
            this.weightLftCr = weightOrtho;
            this.weightCtrCr = weightReset;
            this.weightRgtCr = weightOrtho;
            this.weightLftDn = weightDiagonal;
            this.weightCtrDn = weightOrtho;
            this.weightRgtDn = weightDiagonal;
        }
        this.zeroWeights();

        //calculate individual bias weight
        this.calcBiasIndiv = (dir, biasX, biasY, baseWeight, scalar) => 
        {
            const sumX = dir.x + biasX;
            const sumY = dir.y + biasY;
        
            return sqrt((sumX * sumX) + (sumY * sumY)) * baseWeight * scalar;
        }

        //calculate new bias weights. Weights are for Laplacian function for chemical A. 
        //They can be mirrored when applied to the Laplacian function for chemical B. This reduces the amount of memory required for each cell.
        //The weights must be normalized to a sum total of 1, or else everything gets crazy.
        this.calcWeights = (biasX, biasY, scalar) => 
        {
            let total = 0;
            total += this.weightLftUp = weightDiagonal + this.calcBiasIndiv(dirLftUp, biasX, biasY, weightDiagonal, scalar);
            total += this.weightCtrUp = weightOrtho + this.calcBiasIndiv(dirCtrUp, biasX, biasY, weightOrtho, scalar);
            total += this.weightRgtUp = weightDiagonal + this.calcBiasIndiv(dirRgtUp, biasX, biasY, weightDiagonal, scalar);
            total += this.weightLftCr = weightOrtho + this.calcBiasIndiv(dirLftCr, biasX, biasY, weightOrtho, scalar);
            //skip center weight because it is only used to reset cell A and B values
            total += this.weightRgtCr = weightOrtho + this.calcBiasIndiv(dirRgtCr, biasX, biasY, weightOrtho, scalar);
            total += this.weightLftDn = weightDiagonal + this.calcBiasIndiv(dirLftDn, biasX, biasY, weightDiagonal, scalar);
            total += this.weightCtrDn = weightOrtho + this.calcBiasIndiv(dirCtrDn, biasX, biasY, weightOrtho, scalar);
            total += this.weightRgtDn = weightDiagonal + this.calcBiasIndiv(dirRgtDn, biasX, biasY, weightDiagonal, scalar);

            this.weightLftUp /= total;
            this.weightCtrUp /= total;
            this.weightRgtUp /= total;
            this.weightLftCr /= total;

            this.weightRgtCr /= total;
            this.weightLftDn /= total;
            this.weightCtrDn /= total;
            this.weightRgtDn /= total;
        }

        //sets noise X and Y weights
        this.setWeights = (noiseX, noiseY, scalar) => 
        {
            this.noiseX = noiseX;
            this.noiseY = noiseY;
            
            //set bias as unitized noise values
            const mag = sqrt((noiseX * noiseX) + (noiseY * noiseY));
            const biasX = noiseX / mag;
            const biasY = noiseY / mag;

            this.calcWeights(biasX, biasY, scalar);
        }
        this.setWeights(noiseX, noiseY, noiseScalar);

        //scales noise weights
        this.setWeightScalar = (scalar) =>
        {
            this.setWeights(this.noiseX, this.noiseY, scalar);
        }

        return this;
    } 
}
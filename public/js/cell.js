//cell class
class Cell {
    constructor(x, y, a, b, noiseX, noiseY, noiseScalar)
    {
        this.x = x;
        this.y = y;
        

        this.setAB = (a, b) =>
        {
            this.a = constrain(a, 0, 1);
            this.b = constrain(b, 0, 1);
        }
        this.setAB(a, b);

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

        //calculate new bias weights
        this.calcWeights = (biasX, biasY, scalar) => 
        {
            let total = 0;
            total += this.weightLftUp = weightDiagonal + this.calcBiasIndiv(dirLftUp, biasX, biasY, weightDiagonal, scalar);
            total += this.weightCtrUp = weightOrtho + this.calcBiasIndiv(dirCtrUp, biasX, biasY, weightOrtho, scalar);
            total += this.weightRgtUp = weightDiagonal + this.calcBiasIndiv(dirRgtUp, biasX, biasY, weightDiagonal, scalar);
            total += this.weightLftCr = weightOrtho + this.calcBiasIndiv(dirLftCr, biasX, biasY, weightOrtho, scalar);
            //total += weightCtrCr = weightReset;
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

            //console.log(weightLftUp);
        }

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

        this.setWeightScalar = (scalar) =>
        {
            this.setWeights(this.noiseX, this.noiseY, scalar);
        }

        return this;
    } 
}
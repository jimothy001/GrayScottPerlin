# GrayScott + Perlin Noise

This is an experiment to see what happens when reaction diffusion is subjected to directional biases (currents), as produced by a vector field.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/singularity.gif)

The effect of the vector field is most apparent at vector singularities.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/singularityZoom.gif)

### Reaction Diffusion With Local Biases

[2-3 sentence explanation for RD and its applications]

An explainer for reaction diffusion can be found here: http://karlsims.com/rd.html

The reaction diffusion equations use 2D Laplacian functions that describe diffusion behaviors for chemicals A and B across a 2D array. They are convotional operations, insofar as they influence the state of a cell based on its neighbors. Weights are symmetrical and add up to 1.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/pngs/convolutionBasic.png)

A local bias can be applied to diffusion functions by modifying the base weights with:

For chemical A, the magnitude of a vector that is the sum of the bias vector and neighbor direction vector, multiplied by the base weight and an arbitrary scalar.

For chemical B, the magnitude of a vector that is the difference between the bias vector and neighbor direction vector, multiplied by the base weight and an arbitrary scalar. This is effectively a mirrored version of the chemical A weights.

The resulting modified weights for chemicals A and B must be normalized so that they add up to 1.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/pngs/convolutionBiased.png)

### Interaction

In addition to 'painting' more solution B into solution A, you are able to experiment with different parameters for perlin vectors, reaction diffusion, and paint brush size.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/paint.gif)

### Acknowledgements

Karl Sims, Reaction Diffusion Tutorial: http://karlsims.com/rd.html

Daniel Shiffman, the Coding Train: https://youtu.be/BV9ny785UNc

Pmneila, jsexp: https://github.com/pmneila/jsexp

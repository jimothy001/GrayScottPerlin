# Reaction Diffusion Gray Scott Model with Perlin Noise

### A running instance of this experiment can be found here: https://gray-scott-perlin.herokuapp.com/

This is an experiment to see what happens when the Gray Scott model of reaction diffusion is subjected to directional biases (currents), as produced by a perlin noise vector field.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/singularity.gif)

The effect of the noise is most apparent at tight vector circulation points.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/singularityZoom.gif)

### Reaction Diffusion With Local Biases

Reaction diffusion is a simulation of how two chemicals react to each other and diffuse when combined. 

An outstanding explainer for reaction diffusion can be found here: http://karlsims.com/rd.html

The reaction diffusion equations use 2D Laplacian functions that describe diffusion behaviors for chemicals A and B across a 2D array. They are convolutional  operations, insofar as the state of each cell is based on its neighbors. Weights are symmetrical and add up to 1.

*Image below illustrates basic 2d Laplacian operations for reaction diffusion, where:*

*∇<sup>2</sup>A = cell value of chemical A*

*∇<sup>2</sup>B = cell value of chemical B*

*C<sub>A</sub> = weighted influence of neighbor cell value A*

*C<sub>B</sub> = weighted influence of neighbor cell value B*

*w = weight of neighbor cell value A or B influence. Orthogonal neighbors are weighted at 0.2 and diagonal neighbors are weighted at 0.05.*

![](https://github.com/jimothy001/GrayScottPlus/blob/main/pngs/convolutionBasic.png)

A local bias (Perlin noise) can be applied to diffusion functions by modifying the base weights with:

For chemical A: the magnitude of a vector that is the sum of the bias vector and neighbor direction vector, multiplied by the base weight and an arbitrary scalar.

For chemical B: the magnitude of a vector that is the difference between the bias vector and neighbor direction vector, multiplied by the base weight and an arbitrary scalar. This is effectively a mirrored version of the chemical A weights.

The resulting modified weights for chemicals A and B must be normalized so that they add up to 1.

NOTE: Vector Y positive direction is reversed relative to row positive direction in column/row notation.

NOTE: Perlin noise bias is generated and applied at the level of the reaction diffusion cell, but the linework that visually represents it in the app is averaged within a bin and drawn at a larger scale for human readability.

*Image below illustrates 2d biased Laplacian operations for reaction diffusion, where:*

*∇<sup>2</sup>A = cell value of chemical A*

*∇<sup>2</sup>B = cell value of chemical B*

*C<sub>A</sub> = weighted influence of neighbor cell value A*

*C<sub>B</sub> = weighted influence of neighbor cell value B*

*W<sub>A</sub> = biased weight of neighbor cell value A influence*

*W<sub>B</sub> = biased weight of neighbor cell value B influence*

*w = base weight of neighbor cell value A or B influence. Orthogonal neighbors are weighted at 0.2 and diagonal neighbors are weighted at 0.05.*

$\vec{d}$ = *direction to neighbor cell from center cell where Laplacian result is being calculated*

$\vec{k}$ = *local bias vector*

*s = global arbitrary bias scalar, which can be thought of as current strength*

![](https://github.com/jimothy001/GrayScottPlus/blob/main/pngs/convolutionBiased.png)

### Interaction

In addition to 'painting' more solution B into solution A, you are able to experiment with different parameters for perlin vectors, reaction diffusion, and paint brush size.

![](https://github.com/jimothy001/GrayScottPlus/blob/main/gifs/paint.gif)

### Acknowledgements

Karl Sims, Reaction Diffusion Tutorial: http://karlsims.com/rd.html

Daniel Shiffman, the Coding Train: https://youtu.be/BV9ny785UNc

Pmneila, jsexp: https://github.com/pmneila/jsexp

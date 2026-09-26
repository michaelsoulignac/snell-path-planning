# Snell Path Planning

A path-planning demo for a drone flying through contiguous wind regions.

The key idea of our planner is to apply the same variational principle that leads to Snell's law in optics to the planning of drone paths across different wind regions.

This project has two main objectives:

1. **Bridge physics and computer science** by turning a physical principle into a practical path-planning algorithm.
2. **Build a lightweight and fast planner**: only one scalar parameter needs to be found, the initial heading. The Snell-like invariant then determines the heading in every subsequent region.

> The path-planning problem remains one-dimensional, regardless of the number of regions.


## Mathematical proofs

For the full derivation, see **[The maths under the hood](https://michaelsoulignac.github.io/snell-path-planning/math/)**.
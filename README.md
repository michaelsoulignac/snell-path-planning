# Snell Path Planning

A path-planning demo for a drone flying through contiguous wind regions.

The key idea of our planner is to apply the same variational principle that leads to Snell's law in optics to the planning of drone paths across different wind regions.

This project has two main objectives:

1. **Bridge physics and computer science** by turning a physical principle into a practical path-planning algorithm.
2. **Build a lightweight and fast planner**: only one scalar parameter needs to be found, the initial heading. The Snell-like invariant then determines the heading in every subsequent region.

> The path-planning problem remains one-dimensional, regardless of the number of regions.

## Demonstration app

TODO

## The maths under the hood

The documentation derives the planner step by step, starting from [Fermat's principle](https://en.wikipedia.org/wiki/Fermat%27s_principle) :

https://michaelsoulignac.github.io/snell-path-planning/math/


The documentation combines [Markdown](https://www.markdownguide.org/) for the text and structure with [LaTeX](https://www.latex-project.org/) for mathematical notation. It is generated with [MkDocs](https://www.mkdocs.org/).

The public documentation is automatically rebuilt and deployed with [GitHub Actions](https://docs.github.com/en/actions) on pushs to the `main` branch.

### Run the documentation locally

First, make sure [Python](https://www.python.org/) is installed.

Install MkDocs Material:

```
pip install mkdocs-material
```

Then start the local development server:

```
mkdocs serve
```

The documentation is then available at:

http://127.0.0.1:8000/

To generate the static site without starting the development server:

```
mkdocs build
```
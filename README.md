# Snell Path Planning

A path-planning demo for a drone flying through contiguous wind regions.

The key idea of our planner is to apply the same variational principle that leads to Snell's law in optics to the planning of drone paths across different wind regions.

This project has two main objectives:

1. **Bridge physics and computer science** by turning a physical principle into a practical path-planning algorithm.
2. **Build a lightweight and fast planner**: only one scalar parameter needs to be found, the initial heading. The Snell-like invariant then determines the heading in every subsequent region.

> The path-planning problem remains one-dimensional, regardless of the number of regions.

## Demonstration app

**Work in progress:** the application is still under development and not yet complete.

- **Technologies:** vanilla JavaScript (no framework), SVG for the drawings
- **Live demo:** [michaelsoulignac.github.io/snell-path-planning](https://michaelsoulignac.github.io/snell-path-planning/)

## The maths under the hood

**Read the full derivation [here](https://michaelsoulignac.github.io/snell-path-planning/math/)**

This article derives the planner step by step, starting from [Fermat's principle](https://en.wikipedia.org/wiki/Fermat%27s_principle).

The underlying source code combines [Markdown](https://www.markdownguide.org/) for the text and structure with [LaTeX](https://www.latex-project.org/) for mathematical notation. It is generated with [MkDocs](https://www.mkdocs.org/).

The public documentation is automatically rebuilt and deployed with [GitHub Actions](https://docs.github.com/en/actions) on pushs to the `main` branch.

## Local execution

First, make sure [Python](https://www.python.org/) is installed.

Each of the two servers below defaults to port 8000. Once running, browse to [http://127.0.0.1:8000/](http://127.0.0.1:8000/) to see the result.

### Demonstration app

From the project root, launch a web server:

```bash
python -m http.server
```

### Documentation

Install MkDocs Material:

```bash
pip install mkdocs-material
```

From the project root, start the local development server:

```bash
python -m mkdocs serve
```

To generate the static site without starting the development server:

```bash
python -m mkdocs build
```
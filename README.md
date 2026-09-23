## The maths under the hood

### A drone that moves like light

We consider a drone that crosses regions with different wind conditions.
In this section, we show that the time-optimal trajectory satisfies a Snell-like refraction law.

For pedagogical purposes, we consider rectangular and contiguous wind regions.
This choice simplifies the demonstration, while the same argument extends to more general geometries.

In each wind region, the wind is assumed to be uniform, and the drone flies at the same airspeed in all regions. We denote:

* $v$ the drone's airspeed
* $\mathbf{c}$ the wind vector
* $\mathbf{e}$ the drone's heading unit vector
* $\mathbf{g}=v\mathbf{e}+\mathbf{c}$ the ground velocity
* $w=\mathbf{g}\cdot\mathbf{e}=v+\mathbf{c}\cdot\mathbf{e}$ the component of the ground velocity along the heading
A feasible motion always satisfies $w>0$.


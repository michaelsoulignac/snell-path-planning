# snell-path-planning
A path planner inspired by Snell's law of refraction

## The maths under the hood

We consider a drone that crosses regions with different wind conditions.
In this section, we show that the time-optimal trajectory satisfies a Snell-like refraction law.

For pedagogical purposes, we consider rectangular and contiguous wind regions.
This choice simplifies the demonstration while remaining readily generalizable to more general geometries.

In each wind region, the wind is assumed to be constant and homogeneous, and we denote:

* $v$ the drone's airspeed
* $\mathbf{c}$ the wind vector
* $\mathbf{e}$ the drone's heading unit vector
* $\mathbf{g}=v\mathbf{e}+\mathbf{c}$ the ground velocity
* $w=v+\mathbf{c}\cdot\mathbf{e}$ the ground speed in the heading direction

A feasible motion always satisfies $w>0$.


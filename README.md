# Snell Path Planning

A trajectory-planning demo for a drone flying through contiguous wind regions.

The project applies the same variational principle that leads to Snell's law in optics to the planning of drone trajectories across different wind regions.

## From Snell's law to trajectory planning

How can we build a trajectory planner for a drone flying through regions with different wind conditions?

A useful starting point is the classical problem of light crossing different media. Fermat's principle states that the travel time of a light ray is stationary with respect to small variations of the path. Applying this principle to the crossing point between two media leads to the Snell-Descartes law.

We can use the same idea for a drone flying through regions with different uniform winds. The drone does not propagate at a fixed ground speed, so the classical optical formula must be adapted to the drone's kinematics.

The result is a Snell-like refraction law that allows us to propagate a trajectory from one wind region to the next.

For pedagogical purposes, we consider rectangular and contiguous wind regions. This choice simplifies the demonstration while remaining readily generalizable to more general geometries.

Throughout this section:

- $v$ is the drone's airspeed
- $\mathbf{c}$ is the wind vector
- $\mathbf{e}$ is the drone's heading unit vector
- $\mathbf{g}=v\mathbf{e}+\mathbf{c}$ is the ground velocity
- $w=\mathbf{g}\cdot\mathbf{e}=v+\mathbf{c}\cdot\mathbf{e}$ is the component of the ground velocity along the heading

The drone moves forward along its heading when $w>0$.

---

### 1. The classical Snell-Descartes law

Consider a light ray travelling through two homogeneous media with propagation speeds $c_1$ and $c_2$.

Let $S$ be the starting point, $E$ the endpoint, and $X$ the point where the ray crosses the boundary between the two media.

The total travel time is:

$$
T(X) = \frac{|SX|}{c_1} + \frac{|XE|}{c_2}.
$$

Now move the crossing point $X$ by a small signed distance $\delta l$ along the boundary.

If $\theta_1$ and $\theta_2$ are measured from the normal to the boundary, the two segment lengths change by:

$$
\delta |SX| = \sin\theta_1\,\delta l
$$

and

$$
\delta |XE| = -\sin\theta_2\,\delta l.
$$

Therefore,

$$
\delta T = \left( 
\frac{\sin\theta_1}{c_1} - \frac{\sin\theta_2}{c_2}
\right)\delta l.
$$

Fermat's principle requires the travel time to be stationary with respect to this displacement:

$$
\delta T=0
$$

Hence:

$$
\boxed{
\frac{\sin\theta_1}{c_1} = \frac{\sin\theta_2}{c_2}
}
$$

Using the refractive index $n_i=c_0/c_i$, we obtain the well-known Snell-Descartes law:

$$
n_1\sin\theta_1 = n_2\sin\theta_2
$$

The important idea for our planner is not the optical index itself, but the way the law is obtained:

> A small displacement of the crossing point changes the two travel times in opposite directions, and stationarity requires these two first-order changes to compensate exactly.

Let's apply the same reasoning to the drone !


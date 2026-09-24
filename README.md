# Snell Path Planning

A trajectory-planning demo for a drone flying through contiguous wind regions.

The key idea of our planner is to apply the same variational principle that leads to Snell's law in optics to the planning of drone trajectories across different wind regions.

This project has two main objectives:

1. **Bridge physics and computer science** by turning a physical principle into a practical trajectory-planning algorithm.
2. **Build a lightweight and fast planner**: regardless of the number of wind regions, only one scalar parameter needs to be optimized: the initial heading. The Snell-like invariant then determines the heading in every subsequent region.


## From Snell's law to trajectory planning

How can we build a trajectory planner for a drone flying through regions with different wind conditions?

Our starting point is the classical problem of light crossing different media. Fermat's principle states that the travel time of a light ray is stationary with respect to small variations of the path. Applying this principle to the crossing point between two media leads to Snell's law.

We can use the same idea for a drone flying through regions with different uniform winds. The drone does not have a fixed ground speed, so the classical optical formula must be adapted to the drone's kinematics.

The goal is to derive a Snell-like refraction law that allows us to propagate a trajectory from one wind region to the next.

---

### 1. Classical Snell's law

[Fermat's principle](https://en.wikipedia.org/wiki/Fermat%27s_principle) states that light follows a path for which the travel time is stationary.

Consider two optical media with propagation speeds $v_1$ and $v_2$, separated by a boundary.
A ray travels from a point $S$ in medium 1 to a point $E$ in medium 2, crossing the boundary at $X$.

For a given crossing point $X$, the total travel time is:

$$
T(X) = \frac{|SX|}{v_1} + \frac{|XE|}{v_2}
$$

Let the crossing point move by a small distance $dl$ along the boundary.
A small displacement of the crossing point changes the two path lengths in opposite directions.

If $\theta_1$ and $\theta_2$ are the angles measured from the normal to the boundary, the first-order variation of the travel time is:

$$
dT = \frac{\sin\theta_1}{v_1} dl - \frac{\sin\theta_2}{v_2} dl
$$

At a stationary crossing point, $dT=0$. Therefore:

$$
\boxed{
\frac{\sin\theta_1}{v_1} = \frac{\sin\theta_2}{v_2}
}
$$

This result is known as [Snell's law](https://en.wikipedia.org/wiki/Snell%27s_law).
It is usually written in terms of the refractive indices $n_i$:

$$
n_1\sin\theta_1 = n_2\sin\theta_2
$$

where:

$$
n_i = \frac{c}{v_i}
$$

and $c$ is the speed of light in vacuum.

> The important idea for our planner is not the optical index itself, but the principle behind the derivation: Fermat's principle of stationarity

Let's apply the same reasoning to the drone!
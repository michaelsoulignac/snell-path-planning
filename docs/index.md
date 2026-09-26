# The maths under the hood

Our starting point is the classical problem of light crossing different media. [Fermat's principle](https://en.wikipedia.org/wiki/Fermat%27s_principle) states that the travel time of a light ray is stationary with respect to small variations of the path. Applying this principle to the crossing point between two media leads to Snell's law.

We can use the same idea for a drone flying through regions with different uniform winds. The drone does not have a fixed ground speed, so the classical optical formula must be adapted to the drone's kinematics.

Our goal is to derive a Snell-like refraction law that allows us to propagate a path from one wind region to the next.

---

## 1. Snell's law

Consider two optical media in which light propagates at speeds $v_1$ and $v_2$, separated by a boundary.
A ray travels from a point $S$ in medium 1 to a point $E$ in medium 2, crossing the boundary at $X$.
Let $\vec{u}$ be the unit tangent vector of the boundary.

For a given crossing point $X$, the total travel time is:

$$
T(X) = \frac{SX}{v_1} + \frac{XE}{v_2}
$$

where $SX$ and $XE$ denote the distances from $S$ to $X$ and from $X$ to $E$.

Let the crossing point move by a small displacement $dl$ along the boundary, in the direction of $\vec{u}$.
The vector $\overrightarrow{SX}$ then changes by $+\vec{u} dl$, while the vector $\overrightarrow{XE}$ changes by $-\vec{u} dl$.

If $\theta_1$ and $\theta_2$ are the angles between the rays and the normal to the boundary (pointing from medium 1 to medium 2), measured in the same rotational sense, then projecting these displacements onto the rays shows that, for a small $dl$, the lengths $SX$ and $XE$ change by $\sin\theta_1 dl$ and $-\sin\theta_2 dl$.
The travel time therefore changes by:

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

!!! note
The important idea for our planner is not the optical index itself, but the principle behind the derivation: Fermat's principle of stationarity.

Let's apply the same reasoning to the drone!

## 2. The drone model

For pedagogical purposes, we consider rectangular and contiguous wind regions, placed side by side along a line, so that all boundaries are parallel.
This choice simplifies the demonstration, while the local refraction law extends to more general geometries.

In each wind region, the wind is assumed to be uniform, and the drone flies at the same airspeed in all regions.

Throughout this section:

- $v$ is the drone's airspeed
- $\vec{c}$ is the wind vector
- $\vec{e}$ is the drone's heading unit vector
- $\vec{g}=v\vec{e}+\vec{c}$ is the ground velocity
- $w=\vec{g}\cdot\vec{e}=v+\vec{c}\cdot\vec{e}$ is the component of the ground velocity along the heading

The drone moves forward, along its heading, if and only if $w>0$.

Consider a drone crossing a boundary between two such wind regions, 1 and 2.
In region $i$, the wind is $\vec{c}_i$, the drone's heading is $\vec{e}_i$, and $w_i=v+\vec{c}_i\cdot\vec{e}_i$.

As in Section 1, let $S$ be the starting point in region 1, $E$ the end point in region 2, $X$ the crossing point on the boundary, and $\vec{u}$ the unit tangent vector of the boundary.

Let the crossing point move by a small displacement $dl$ along the boundary, in the direction of $\vec{u}$.
The vector $\overrightarrow{SX}$ then changes by $+\vec{u} dl$, while the vector $\overrightarrow{XE}$ changes by $-\vec{u} dl$.

As noted above, a small change $\delta\vec{d}$ of a segment's displacement changes its travel time by $\vec{e}\cdot\delta\vec{d}/w$.
Applying this to the two segments, the travel time changes by

$$
dT = \frac{\vec{u}\cdot\vec{e}_1}{w_1} dl - \frac{\vec{u}\cdot\vec{e}_2}{w_2} dl
$$

At a stationary crossing point, $dT=0$. Therefore:

$$
\frac{\vec{u}\cdot\vec{e}_1}{w_1} = \frac{\vec{u}\cdot\vec{e}_2}{w_2}
$$

As in Section 1, let $\theta_i$ be the angle between the heading $\vec{e}_i$ and the normal to the boundary, so that $\vec{u}\cdot\vec{e}_i=\sin\theta_i$. The law then reads:

$$
\boxed{
\frac{\sin\theta_1}{w_1} = \frac{\sin\theta_2}{w_2}
}
$$

This is the drone's analogue of Snell's law. Nice result, isn't it?

## 3. Several wind regions: the conserved quantity

Consider now a chain of wind regions separated by parallel boundaries, as in Section 2, but with more than two regions.

Since the boundaries are parallel, $\vec{u}$ is the same at every crossing. The law derived in Section 2 therefore holds at each boundary in turn, and the quantity

$$
\frac{\vec{u}\cdot\vec{e}}{w}
$$

has the same value in every region crossed by the path. We call this common value $\lambda$:

$$
\boxed{
\lambda = \frac{\vec{u}\cdot\vec{e}}{w}
}
$$

For boundaries orthogonal to the $x$-axis, $\vec{u}=(0,1)$, and $\lambda$ takes the explicit form:

$$
\lambda = \frac{\sin\theta}{v+c_x\cos\theta+c_y\sin\theta}
$$

where $\theta$ is the heading in the region, and $(c_x,c_y)$ the wind there.

The launch heading fixes $\lambda$ in the first region. The same $\lambda$ then fixes the heading in every subsequent region, without solving a new stationarity condition at each boundary.

## 4. Recovering the heading from $\lambda$

Given a wind $(c_x,c_y)$ and the invariant $\lambda$, the heading $\theta$ in that region satisfies

$$
\lambda\big(v+c_x\cos\theta+c_y\sin\theta\big) = \sin\theta.
$$

Rearranging,

$$
-\lambda c_x\cos\theta + (1-\lambda c_y)\sin\theta = \lambda v.
$$

Writing the left-hand side as $R\sin(\theta-\phi)$, with

$$
A = 1-\lambda c_y, \qquad B = \lambda c_x, \qquad R = \sqrt{A^2+B^2}, \qquad \phi = \operatorname{atan2}(B,A),
$$

gives

$$
\sin(\theta-\phi) = \frac{\lambda v}{R}.
$$

This has two solutions:

$$
\boxed{
\theta = \phi + \arcsin\!\left(\frac{\lambda v}{R}\right)
\qquad\text{or}\qquad
\theta = \phi + \pi - \arcsin\!\left(\frac{\lambda v}{R}\right)
}
$$

Only the heading belonging to the admissible sector, defined below, is retained.

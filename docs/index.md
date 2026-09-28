# From Snell's Law to Path Planning
*by Michaël Soulignac - Last change: 2026-09-28*

* [Try the interactive demo](https://michaelsoulignac.github.io/snell-path-planning)
* Explore the code on [GitHub](https://github.com/michaelsoulignac/snell-path-planning), all contributions are welcome!

## Abstract

How can we build a path planner for a drone flying through regions with different wind conditions?

Our starting point is the classical problem of light crossing different media. [Fermat's principle](https://en.wikipedia.org/wiki/Fermat%27s_principle) states that the travel time of a light ray is stationary with respect to small variations of its path. Applying this principle to the crossing point between two media leads to Snell's law.

We can use the same idea for a drone flying through regions with different uniform winds. The drone does not have a fixed ground speed, so the classical optical formula must be adapted to the drone's kinematics.

Our goal is to derive a Snell-like refraction law that allows us to propagate a path from one wind region to the next.


## 1. Snell's law

Consider two optical media in which light propagates at speeds $v_1$ and $v_2$, separated by a boundary.
Let $\vec{u}$ be the unit tangent vector of this boundary.

A ray travels from a point $S$ in medium 1 to a point $E$ in medium 2, crossing the boundary at $X$.
For a given crossing point $X$, the total travel time is:

$$
T(X) = \frac{SX}{v_1} + \frac{XE}{v_2}
$$

where $SX$ and $XE$ denote the distances from $S$ to $X$ and from $X$ to $E$.

Let the crossing point move by a small displacement $dl$ along the boundary, in the direction of $\vec{u}$.
The vector $\overrightarrow{SX}$ then changes by $+\vec{u}\,dl$, while the vector $\overrightarrow{XE}$ changes by $-\vec{u}\,dl$.

If $\theta_1$ and $\theta_2$ are the angles between the rays and the normal to the boundary (pointing from medium 1 to medium 2), measured in the same rotational sense, then projecting these displacements onto the rays shows that, for a small $dl$, the lengths $SX$ and $XE$ change by $\sin\theta_1\,dl$ and $-\sin\theta_2\,dl$.

![Snell's law](images/snell_law.svg)

The travel time therefore changes by:

$$
dT = \frac{\sin\theta_1}{v_1}\,dl - \frac{\sin\theta_2}{v_2}\,dl
$$

At a stationary crossing point, $dT=0$. Therefore:

$$
\boxed{
\frac{\sin\theta_1}{v_1} = \frac{\sin\theta_2}{v_2}
}
$$

This result is known as [Snell's law](https://en.wikipedia.org/wiki/Snell%27s_law).

??? note "What about refractive indices?"
    Snell's law is usually written in terms of the refractive indices $n_i$:

    $$
    n_1\sin\theta_1 = n_2\sin\theta_2
    $$

    where $n_i = c/v_i$ and $c$ is the speed of light in vacuum.

    The optical index itself plays no role in what follows.

What matters for our planner is the principle behind the derivation: Fermat's principle of stationarity.

Let's apply the same reasoning to the drone!


## 2. The drone model

For pedagogical purposes, we consider rectangular and contiguous wind regions, placed side by side along a line, so that all boundaries are parallel.
This choice simplifies the demonstration, while the local refraction law extends to more general geometries.

In each wind region, the wind is assumed to be uniform, and the drone flies at the same airspeed in all regions.
Within a region, the fastest way to go from one point to another is to keep a constant heading: each segment of the path is straight.

??? note "Why fly straight inside a region?"
    Over any flight of duration $\tau$, the ground displacement is:

    $$
    \vec d = \int_0^\tau \big(v\vec e(t)+\vec c\big)\,dt = v\int_0^\tau \vec e(t)\,dt + \vec c\,\tau
    $$

    Since $\vec e$ is a unit vector, $\left|\int_0^\tau \vec e(t)\,dt\right| \le \tau$, with equality if and only if the heading is constant.
    Reaching $\vec d$ in a time $\tau$ therefore requires:

    $$
    |\vec d-\vec c\,\tau| \le v\tau
    $$

    This fails at $\tau=0$ (since $\vec d\neq\vec 0$), so at the shortest feasible $\tau$ it holds with equality, which forces a constant heading.
    In a uniform wind, a constant heading gives a constant ground velocity, hence a straight ground track.


Throughout this section:

* $v$ is the drone's airspeed
* $\vec{c}$ is the wind vector
* $\vec{e}$ is the drone's heading unit vector
* $\vec{g}=v\vec{e}+\vec{c}$ is the ground velocity
* $w=\vec{g}\cdot\vec{e}=v+\vec{c}\cdot\vec{e}$ is the component of the ground velocity along the heading

We require $w>0$: the drone must move forward along its heading.

??? note "Why must $w$ be positive?"
    For a constant heading, the travel time $\tau$ of a segment with displacement $\vec d$ satisfies $|\vec d-\vec c\,\tau| = v\tau$, i.e. $f(\tau)=0$ with:

    $$
    f(\tau)=|\vec d-\vec c\,\tau|^2-v^2\tau^2
    $$

    When the wind is stronger than the drone ($|\vec c|>v$), this equation can have two positive roots: two different headings reach the same point, in two different times. 
    Differentiating, and using $\vec d-\vec c\,\tau = v\tau\,\vec e$:

    $$
    f'(\tau) = -2v\tau\,w
    $$

    Since $f(0)=|\vec d|^2>0$, $f$ decreases through its first root, where $w>0$ (except in the limiting case of a double root).
    The second root has $w<0$: the drone is carried by the wind while its ground velocity points backwards relative to its heading. It is the slower option.

    The condition $w>0$ therefore selects the fastest way. It also guarantees $f'(\tau)\neq 0$, so that $\tau$ varies smoothly with $\vec d$.

    If the wind is weaker than the drone ($|\vec c|<v$), then $w \ge v-|\vec c|>0$ automatically.


Consider a drone crossing a boundary between two such wind regions, 1 and 2.
In region $i$, the wind is $\vec{c}_i$, the drone's heading is $\vec{e}_i$, and $w_i=v+\vec{c}_i\cdot\vec{e}_i$.

As in Section 1, let $S$ be the starting point in region 1, $E$ the end point in region 2, $X$ the crossing point on the boundary, and $\vec{u}$ the unit tangent vector of the boundary.

For a segment flown at constant heading $\vec e$, let $\tau$ denote its travel time. A small change $d\vec d$ of its displacement changes its travel time by:

$$
d\tau=\frac{\vec{e}\cdot d\vec{d}}{w}
$$

??? note "Where does this relation come from?"
    For a segment flown at constant heading $\vec{e}$, the displacement satisfies:

    $$
    \vec{d}=(v\vec{e}+\vec{c})\tau
    \qquad\text{i.e.}\qquad
    \vec{d}-\vec{c}\tau=v\tau\,\vec{e}
    $$

    Although the heading is constant along each segment, it may vary when the segment displacement is varied.
    Taking the differential therefore gives:

    $$
    d\vec{d}-\vec{c}\,d\tau =
    v\vec{e}\,d\tau+v\tau\,d\vec{e}
    $$

    Taking the dot product with $\vec{e}$, and using $\vec{e}\cdot d\vec{e}=0$ since $\vec{e}$ is a unit vector:

    $$
    \vec{e}\cdot d\vec{d} =
    \left(v+\vec{c}\cdot\vec{e}\right)d\tau = w\,d\tau
    $$

    In vector form, $\nabla_{\vec d}\tau = \vec e/w$: this is the gradient mentioned in the acknowledgements.


Moving $X$ by $\vec u\,dl$ changes $\overrightarrow{SX}$ by $+\vec{u}\,dl$ and $\overrightarrow{XE}$ by $-\vec{u}\,dl$. Applying the relation above to the two segments gives:

$$
d\tau_1 = \frac{\vec{e}_1\cdot\vec{u}}{w_1}\,dl,
\qquad
d\tau_2 = -\frac{\vec{e}_2\cdot\vec{u}}{w_2}\,dl
$$

Let $T=\tau_1+\tau_2$ be the total travel time.

Therefore, the total travel time changes by:

$$
dT =
\left(
\frac{\vec{u}\cdot\vec{e}_1}{w_1} -
\frac{\vec{u}\cdot\vec{e}_2}{w_2}
\right)
dl
$$

At a stationary crossing point, $dT=0$, thus:

$$
\frac{\vec{u}\cdot\vec{e}_1}{w_1} =
\frac{\vec{u}\cdot\vec{e}_2}{w_2}
$$

As in Section 1, let $\theta_i$ be the angle between the heading $\vec{e}_i$ and the normal to the boundary, measured in the same rotational sense.
Then $\vec{u}\cdot\vec{e}_i=\sin\theta_i$, and the law therefore reads:

$$
\boxed{
\frac{\sin\theta_1}{w_1} =
\frac{\sin\theta_2}{w_2}
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

For the $x$-$y$ coordinate system used here, $\vec{e}=(\cos\theta,\sin\theta)$.
For boundaries orthogonal to the $x$-axis, $\vec{u}=(0,1)$, and $\lambda$ takes the explicit form:

$$
\lambda = \frac{\sin\theta}{v+c_x\cos\theta+c_y\sin\theta}
$$

where $\theta$ is the heading in the region, and $(c_x,c_y)$ the wind there.

The launch heading fixes $\lambda$ in the first region. The same $\lambda$ then fixes the heading in every subsequent region (Section 6), without solving a new stationarity condition at each boundary.

??? note "What does $\lambda$ mean physically?"
    Move the target by a small distance $dy$ along the boundaries, and let the optimal path adjust.
    At first order, moving the crossing points costs nothing, since the path is stationary with respect to them.
    Only the last segment changes, by $\vec u\,dy$, so the optimal travel time $T^*$ changes by:

    $$
    dT^* = \frac{\vec u\cdot\vec e_{\text{last}}}{w_{\text{last}}}\,dy = \lambda\,dy
    \qquad\text{i.e.}\qquad
    \lambda = \frac{\partial T^*}{\partial y_{\text{target}}}
    $$

    $\lambda$ is the extra flight time per metre of target shift along the boundaries.

    In optics, the same quantity is the component of the ray's momentum along the interface. It is conserved because nothing changes when sliding along the interface.
    The same holds here: the wind depends only on $x$, so the problem is invariant under translations along $y$, and the associated quantity is conserved ([Noether's theorem](https://en.wikipedia.org/wiki/Noether%27s_theorem)).

    This also explains why the result extends to a wind varying continuously with $x$: $\lambda$ remains constant along the whole path.


## 4. Admissible headings

Not every heading gives a usable path. The drone must progress across the region, and fly the fastest way (Section 2):

$$
g_x = v\cos\theta+c_x > 0
\qquad\text{and}\qquad
w = v+c_x\cos\theta+c_y\sin\theta > 0
$$

These admissible headings form a single angular sector, determined by the wind and the orientation of the boundaries.

??? note "Could the admissible headings split into two separate sectors?"
    No. Consider the two forbidden sets, on the circle of headings:

    * $g_x\le 0$, i.e. $\cos\theta\le -c_x/v$: an arc centred on $\theta=\pi$, of half-width $a=\arccos(c_x/v)$. It is empty if $c_x\ge v$, and covers the whole circle if $c_x\le -v$ (no heading is admissible).
    * $w\le 0$, i.e. $\cos(\theta-\alpha)\le -v/|\vec c|$, where $\alpha\in(-\pi,\pi]$ is the wind direction: an arc centred on $\alpha+\pi$, of half-width $b=\arccos(v/|\vec c|)$. It is empty if $|\vec c|\le v$.

    The admissible set is the complement of their union. It is a single sector as soon as the two forbidden arcs overlap, i.e. as soon as the distance between their centres, $|\alpha|$, is less than $a+b$.

    Since $\cos\alpha = c_x/|\vec c| = \cos a\cos b$, and, when $a+b<\pi$:

    $$
    \cos(a+b)=\cos a\cos b-\sin a\sin b<\cos a\cos b = \cos\alpha
    $$

    We get $|\alpha|<a+b$. When $a+b\ge\pi$, this holds trivially.


## 5. Monotonicity of $\lambda$

Differentiating $\lambda(\theta)=\sin\theta/w$ with respect to $\theta$ gives:

$$
\frac{d\lambda}{d\theta} = \frac{v\cos\theta+c_x}{w^2} = \frac{g_x}{w^2}
$$

??? note "Why does the derivative simplify so nicely?"
    By the quotient rule:

    $$
    \frac{d\lambda}{d\theta} =
    \frac{\cos\theta\cdot w-\sin\theta\cdot w'}{w^2}
    \qquad\text{with}\qquad
    w'=-c_x\sin\theta+c_y\cos\theta
    $$

    The $c_y$ terms cancel in the numerator, and the $c_x$ terms combine through $\cos^2\theta+\sin^2\theta=1$:

    $$
    \cos\theta\left(v+c_x\cos\theta+c_y\sin\theta\right) -
    \sin\theta\left(-c_x\sin\theta+c_y\cos\theta\right) =
    v\cos\theta+c_x
    $$

On the admissible sector, $g_x>0$ and $w>0$, so:

$$
\boxed{
\frac{d\lambda}{d\theta} > 0
}
$$

Thus $\lambda$ increases strictly with the heading on the admissible sector: to each value of $\lambda$ corresponds at most one admissible heading.
As the heading sweeps the admissible sector, $\lambda$ sweeps an open interval $(\lambda_{\min},\lambda_{\max})$, set by the ends of the sector.


## 6. Recovering the heading from $\lambda$

Given a wind $\vec{c}=(c_x,c_y)$ and the invariant $\lambda$, the heading $\theta$ in that region satisfies:

$$
\lambda\big(v+c_x\cos\theta+c_y\sin\theta\big) = \sin\theta
$$

which can be rewritten as:

$$
\sin(\theta-\phi) = \frac{\lambda v}{R}
\qquad\text{with}\qquad
A = 1-\lambda c_y, \quad B = \lambda c_x, \quad R = \sqrt{A^2+B^2}, \quad \phi = \operatorname{atan2}(B,A)
$$

??? note "How do we get there?"
    Rearranging the equation gives:

    $$
    -\lambda c_x\cos\theta + (1-\lambda c_y)\sin\theta = \lambda v
    \qquad\text{i.e.}\qquad
    A\sin\theta - B\cos\theta = \lambda v
    $$

    Since $R\sin(\theta-\phi) = R\cos\phi\,\sin\theta - R\sin\phi\,\cos\theta$, the left-hand side equals $R\sin(\theta-\phi)$ with $R\cos\phi=A$ and $R\sin\phi=B$.


This equation has two mathematical solutions, but only one can be admissible:

$$
\boxed{
\theta = \phi + \arcsin\!\left(\frac{\lambda v}{R}\right)
}
$$

It exists only if $|\lambda v|<R$, and is admissible only if $w>0$.
Otherwise, no admissible heading realizes $\lambda$ in this region, and the path cannot cross it.
Equivalently, $\lambda$ must lie in the interval $(\lambda_{\min},\lambda_{\max})$ of Section 5.

??? note "Why is the other solution never valid?"
    Let $F(\theta) = \sin\theta-\lambda w = A\sin\theta - B\cos\theta - \lambda v$. The solutions are the zeros of $F$.

    On the one hand:

    $$
    F'(\theta) = A\cos\theta + B\sin\theta = R\cos(\theta-\phi)
    $$

    On the other hand, at a zero of $F$, $\lambda=\sin\theta/w$, so:

    $$
    F'(\theta) = \cos\theta-\lambda w' = \frac{w\cos\theta - w'\sin\theta}{w} = \frac{g_x}{w}
    $$

    using the same numerator as in Section 5.

    An admissible heading has $g_x>0$ and $w>0$, so $\cos(\theta-\phi)>0$: $\theta-\phi$ lies in $(-\pi/2,\pi/2)$, which is exactly the $\arcsin$ branch.
    The other solution has $\cos(\theta-\phi)<0$, so $g_x$ and $w$ have opposite signs: it is never admissible.


??? note "Does light do this too?"
    Yes. When light goes from a slow medium to a fast one, Snell's law asks for $\sin\theta_2 = (n_1/n_2)\sin\theta_1$, which exceeds 1 beyond a critical angle.
    There is then no refracted ray: the light is totally reflected.

    Here, $|\lambda v|\ge R$ (or $w\le 0$) plays the same role: the value of $\lambda$ imposed by the previous regions cannot be realized in this one.


## 7. Reaching a target

Suppose the drone has to reach a target, with abscissa $x_{\text{target}}$, possibly inside a wind region rather than exactly on a boundary:

![Reaching a target](images/target_point.svg)

The vertical line $x = x_{\text{target}}$ is treated as a *virtual* boundary.

??? note "Why a virtual boundary?"
    The wind is the same on both sides of this line, so the same $\lambda$ gives the same heading: crossing it changes nothing.
    It simply lets us stop the propagation exactly at $x_{\text{target}}$ and read off the drone's position there.

For a given launch heading $\theta_0$, the invariant $\lambda$ is fixed in the first region. It then determines the heading in every subsequent region, so the path can be propagated up to $x_{\text{target}}$, reaching some ordinate $y_{\text{end}}(\theta_0)$.

Since $x_{\text{target}}$ is fixed, this leaves a single scalar equation for a single unknown, $\theta_0$:

$$
y_{\text{end}}(\theta_0) = y_{\text{target}}
$$

The original, two-dimensional path-planning problem is thus reduced to a one-dimensional root-finding problem in the launch heading.


## 8. Solving by bisection

Increasing the launch heading $\theta_0$ increases $\lambda$ (Section 5), hence the heading in every region, hence the vertical displacement across each region.
Therefore, $y_{\text{end}}$ is strictly increasing with $\theta_0$.

??? note "Why does turning left always end higher?"
    Consider a region of horizontal width $\Delta x$.
    The vertical displacement across that region is:

    $$
    \Delta y =
    \Delta x\,\frac{g_y}{g_x} =
    \Delta x\,\frac{v\sin\theta+c_y}{v\cos\theta+c_x}
    $$

    Differentiating with respect to $\theta$ gives:

    $$
    \frac{d(\Delta y)}{d\theta} =
    \Delta x\, \frac{v\,w}{g_x^2}
    $$

    On the admissible sector, $w>0$. Since $\Delta x>0$ and $v>0$, the vertical displacement across a region is strictly increasing with the heading.


The launch headings to consider are those whose $\lambda$ is admissible in every region, i.e. lies in the intersection of the intervals $(\lambda_{\min},\lambda_{\max})$ of all regions.
Mapped back to the first region (Section 6), this intersection directly gives the initial interval $[\theta_{\min},\theta_{\max}]$ for bisection.

If every wind is weaker than the drone, every target is reachable. With stronger winds, some targets may be out of reach.

??? note "Is every target reachable?"
    At an end of the admissible sector of a region, either $g_x\to 0$ or $w\to 0$:

    * if $g_x\to 0$, the drone barely progresses across the region: $\lambda$ stays finite, and $\Delta y\to\pm\infty$;
    * if $w\to 0$, then $\lambda=\sin\theta/w\to\pm\infty$, while $\Delta y$ stays finite.

    Consider the upper end of the intersection of intervals. If it is finite, it is the finite end of some region, of type $g_x\to 0$. Approaching it, $\Delta y\to+\infty$ in that region while the others stay finite, so $y_{\text{end}}\to+\infty$. The same reasoning applies at the lower end.
    Therefore, if both ends of the intersection are finite, $y_{\text{end}}$ takes every real value, and every target is reachable.

    This is always the case when every wind is weaker than the drone: $w>0$ everywhere, so every end is of type $g_x\to 0$. Moreover, $\theta=0$ is then admissible in every region, with $\lambda=0$, so the intersection is never empty.

    With stronger winds, an end may be infinite: $y_{\text{end}}$ then tends to a finite limit, and targets beyond it are out of reach.
    The intersection may even be empty, for instance if a headwind $c_x\le -v$ blocks a region.


Bisection proceeds as follows:

* Starting from an interval $[\theta_{\min}, \theta_{\max}]$ of admissible launch headings, on which $y_{\text{end}}$ changes sign relative to $y_{\text{target}}$, the interval is repeatedly halved, keeping the half on which the sign change still occurs.
* Each iteration propagates one candidate path through every region (using the closed-form inversion of Section 6) and compares the resulting $y_{\text{end}}$ to $y_{\text{target}}$.

??? note "Why is bisection guaranteed to work?"
    Because $y_{\text{end}}$ is strictly increasing on the admissible interval, the equation

    $$
    y_{\text{end}}(\theta_0)=y_{\text{target}}
    $$

    has at most one solution.

    As long as all headings remain admissible, $y_{\text{end}}(\theta_0)$ depends continuously on $\theta_0$.

    Therefore, if an interval $[\theta_{\min},\theta_{\max}]$ satisfies:

    $$
    \big(y_{\text{end}}(\theta_{\min})-y_{\text{target}}\big)
    \big(y_{\text{end}}(\theta_{\max})-y_{\text{target}}\big)<0
    $$

    then the intermediate value theorem guarantees a solution inside the interval, and bisection can be used to locate it.

The curve below shows the target error $y_{\text{end}}(\theta_0)-y_{\text{target}}$ as a function of the launch heading. The solution corresponds to its zero crossing.
Each iteration is represented by a numbered dot.

![Bisection process](images/bisection.svg)

Since the fastest path exists and must be stationary, and the stationary path is unique, the path found is the fastest one.

??? note "Why is the stationary path the fastest?"
    A path is described by its crossing points on the boundaries. Its travel time depends continuously on them, and grows without bound when any of them goes to infinity, since each segment satisfies $\tau\ge|\vec d|/(v+|\vec c|)$. The travel time therefore reaches a minimum.

    **It is stationary.** If every wind is weaker than the drone, every choice of crossing points is feasible and the travel time is differentiable everywhere, so its minimum is a stationary point.
    With stronger winds, some crossing points are out of reach. At the edge of the reachable set, $w\to 0$, and $d\tau=\vec e\cdot d\vec d/w$ blows up: moving the crossing point back inside saves time at an unbounded rate, so the fastest path cannot lie on that edge.

    **It is unique.** Any stationary path has the same $\lambda$ in every region (Section 3), hence corresponds to a launch heading solving $y_{\text{end}}(\theta_0)=y_{\text{target}}$. This solution is unique, since $y_{\text{end}}$ is strictly increasing.


## Conclusion

A path-planning problem that may involve many wind regions and different wind conditions can thus be reduced to a one-dimensional problem: finding the initial heading.

Once this single parameter is found, the Snell-like invariant determines the heading in every subsequent region, and therefore the complete path.


## Acknowledgements

I would like to warmly thank two people whose ideas and insights clearly contributed to this work, and without whom it would not have been possible:

**Sofiane Tafat**, a former professor of physics at EISTI (now CY Tech), who first put me on the right track. He suggested the idea of looking for a solution based on "*the equivalent of Fermat's principle for light*".
I gladly credit him with this original idea. Our correspondence at the time, however, ended with: "*It remains to solve this equation.*" :)

**Benjamin Parent**, a former professor of mathematics at ISEN Lille (now part of Junia), for his vector formulation of the problem, in particular the expression of the gradient of the travel time with respect to the displacement:

$$
\nabla_{\vec d}\tau =
\frac{\vec v}{\vec v\cdot(\vec v+\vec c)}
$$

where $\vec v=v\vec e$ is the air-velocity vector. It simplifies to $\vec e/w$, the relation used in Section 2.

This was clearly the missing piece that made it possible to apply Fermat's principle to the drone in practice, turning Sofiane's intuition into a concrete derivation of the Snell law analogue.
"""
Regenerates every figure used in docs/index.md ("From Snell's Law to Path Planning").

Usage:
    python scripts/generate_figures.py

Output:
    docs/images/snell_law.svg
    docs/images/target_point.svg
    docs/images/bisection.svg
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "docs" / "images"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------

PANEL = "#f8fafc"
INK = "#12203a"
MUTED = "#5a6a80"
LINE = "#c9d5e0"
GRID = "#d9e2ea"
WIND = "#0d8a8c"
PATH = "#14612f"
HEADING = "#3549d1"
SOLUTION = "#b3261e"

plt.rcParams.update({
    "font.family": "sans-serif",
    "font.size": 13,
    "text.color": INK,
    "axes.edgecolor": INK,
})


def new_axes(figsize, aspect_equal=True):
    fig, ax = plt.subplots(figsize=figsize)
    if aspect_equal:
        ax.set_aspect("equal")
    ax.axis("off")

    return fig, ax


def draw_arc(ax, vertex, angle_from_deg, angle_to_deg, radius, color, label=None,
             label_radius_factor=1.35, lw=2.0):
    """Draw an angle arc from `angle_from_deg` to `angle_to_deg`, both measured
    in the standard sense (0 = +x/horizontal, counter-clockwise), in degrees.
    The label, if given, is placed automatically at the arc's mid-angle.
    """

    a0, a1 = np.radians(angle_from_deg), np.radians(angle_to_deg)
    t = np.linspace(a0, a1, 40)
    x = vertex[0] + radius * np.cos(t)
    y = vertex[1] + radius * np.sin(t)
    ax.plot(x, y, color=color, lw=lw, solid_capstyle="round")

    if label is not None:
        amid = (a0 + a1) / 2
        lx = vertex[0] + radius * label_radius_factor * np.cos(amid)
        ly = vertex[1] + radius * label_radius_factor * np.sin(amid)
        ax.text(lx, ly, label, color=color, fontsize=13, ha="center", va="center")


def draw_vector(ax, origin, vec, color, label=None, label_offset=(0.08, 0.08), lw=2.2, zorder=None):

    ax.annotate(
        "", xy=(origin[0] + vec[0], origin[1] + vec[1]), xytext=origin,
        arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=16),
        zorder=zorder,
    )

    if label is not None:
        tip = (origin[0] + vec[0], origin[1] + vec[1])
        ax.text(tip[0] + label_offset[0], tip[1] + label_offset[1], label, color=color, fontsize=13, ha="left", va="bottom")


def heading_dir(theta_deg):
    """Unit vector at angle theta from the horizontal (+x), counter-clockwise."""
    t = np.radians(theta_deg)
    return np.array([np.cos(t), np.sin(t)])


def save(fig, name, pad=0.15):
    path = OUT_DIR / f"{name}.svg"
    fig.savefig(path, format="svg", bbox_inches="tight", pad_inches=pad)
    plt.close(fig)
    print(f"wrote {path}")


# ---------------------------------------------------------------------------
# Figure: Snell's Law
# ---------------------------------------------------------------------------

def generate_snell_law_figure():
    fig, ax = new_axes((10.5, 3.9))

    xlim, ylim = (-6.4, 6.4), (-2.0, 2.1)
    ax.axvspan(xlim[0], 0, color=PANEL, zorder=0)
    ax.axvspan(0, xlim[1], color=PANEL, zorder=0)
    ax.set_xlim(xlim)
    ax.set_ylim(ylim)
    ax.add_patch(plt.Rectangle((xlim[0], ylim[0]), xlim[1] - xlim[0], ylim[1] - ylim[0], fill=False, edgecolor=INK, lw=1.3))
    ax.axvline(0, color=INK, lw=1.4)  # the boundary itself

    theta1, theta2 = 26.0, 16.0
    X = np.array([0.06, 0.0])
    L1, L2 = 4.0, 4.4
    S = X - L1 * heading_dir(theta1)
    E = X + L2 * heading_dir(theta2)

    ax.plot([S[0], X[0]], [S[1], X[1]], color=HEADING, lw=3.0, solid_capstyle="round", zorder=2)
    ax.plot([X[0], E[0]], [X[1], E[1]], color=PATH, lw=3.0, solid_capstyle="round", zorder=2)

    # normal: horizontal dashed reference line through X, long enough that
    # the angle arcs visibly start from it.
    normal_half_len = 1.9
    ax.plot([X[0] - normal_half_len, X[0] + normal_half_len], [X[1], X[1]],
             color=MUTED, lw=1.4, ls=(0, (6, 5)), zorder=1)
    ax.text(X[0] + normal_half_len + 0.1, X[1], "normal", color=MUTED, fontsize=11,
             ha="left", va="center")

    for p in (S, X, E):
        ax.plot(*p, "o", color=INK, ms=5, zorder=5)

    ax.text(S[0], S[1] + 0.32, "S", ha="center", va="bottom", fontsize=14)
    ax.text(X[0] - 0.28, X[1] + 0.30, "X", ha="right", va="bottom", fontsize=14)
    ax.text(E[0], E[1] + 0.30, "E", ha="center", va="bottom", fontsize=14)

    # theta1: angle at X between the normal (pointing back towards S, i.e.
    # angle 180, along the dashed line) and the direction towards S.
    draw_arc(ax, X, 180, 180 + theta1, 1.2, HEADING, r"$\theta_1$", label_radius_factor=1.45)

    # theta2: angle at X between the normal (pointing forward, angle 0, along
    # the dashed line) and the direction towards E.
    draw_arc(ax, X, 0, theta2, 1.2, PATH, r"$\theta_2$", label_radius_factor=1.45)

    ax.text(xlim[0] + 0.3, ylim[1] - 0.35, "Medium 1", fontsize=13, weight="bold")
    ax.text(xlim[0] + 0.3, ylim[1] - 0.62, "speed $v_1$", fontsize=11, color=MUTED)
    ax.text(0.3, ylim[1] - 0.35, "Medium 2", fontsize=13, weight="bold")
    ax.text(0.3, ylim[1] - 0.62, "speed $v_2 < v_1$", fontsize=11, color=MUTED)

    save(fig, "snell_law")



# ---------------------------------------------------------------------------
# Shared path-planning model, used by target_point() and bisection()
# ---------------------------------------------------------------------------

V = 70.0

ZONES = [
    {"dx": 6.0, "c": (8.0, 16.0)},
    {"dx": 6.0, "c": (-8.0, 5.0)},
    {"dx": 6.0, "c": (4.0, -12.0)},
    {"dx": 6.0, "c": (10.0, 8.0)},
]

Y_TARGET = 6.0
X_TARGET = sum(z["dx"] for z in ZONES[:-1]) + 3.5  # inside the last zone
THETA0_RANGE = (np.radians(-40), np.radians(45))   # safely clear of any zone's singularity


def heading_from_lambda(lam, cx, cy, v=V):
    A = 1 - lam * cy
    B = lam * cx
    R = np.hypot(A, B)
    phi = np.arctan2(B, A)
    s = np.clip(lam * v / R, -1, 1)

    for theta in [phi + np.arcsin(s), phi + np.pi - np.arcsin(s)]:
        gx = v * np.cos(theta) + cx
        w = v + cx * np.cos(theta) + cy * np.sin(theta)

        if gx > 1e-6 and w > 1e-6:
            return theta

    return None


def propagate(theta0, up_to_x=None):
    """Propagate a launch heading through the zone chain.
    Returns the list of (x, y) breakpoints, stopping at up_to_x if given.
    """

    cx0, cy0 = ZONES[0]["c"]
    w0 = V + cx0 * np.cos(theta0) + cy0 * np.sin(theta0)
    lam = np.sin(theta0) / w0

    points = [(0.0, 0.0)]
    x, y = 0.0, 0.0

    for z in ZONES:
        cx, cy = z["c"]
        theta = heading_from_lambda(lam, cx, cy)

        if theta is None:
            return points, lam

        dx = z["dx"]
        target_here = up_to_x is not None and up_to_x < x + dx
        remaining = up_to_x - x if target_here else dx
        gx = V * np.cos(theta) + cx
        dy = remaining * (V * np.sin(theta) + cy) / gx
        x, y = x + remaining, y + dy
        points.append((x, y))

        if up_to_x is not None and x >= up_to_x - 1e-9:
            break

    return points, lam


def y_end(theta0, up_to_x):
    pts, _ = propagate(theta0, up_to_x=up_to_x)
    return pts[-1][1]


def find_solution():
    a, b = THETA0_RANGE
    fa = y_end(a, X_TARGET) - Y_TARGET

    for _ in range(60):
        m = (a + b) / 2
        fm = y_end(m, X_TARGET) - Y_TARGET

        if np.sign(fm) == np.sign(fa):
            a, fa = m, fm
        else:
            b = m

    return (a + b) / 2


# ---------------------------------------------------------------------------
# Figure: Path to target point
# ---------------------------------------------------------------------------

TRAJ_V = 150.0
TRAJ_WINDS = [(50, 60), (75, 15), (70, -30), (55, -75)] # (km/h, direction in degrees, 0 = east)
TRAJ_XS = [5.0, 10.0, 20.0, 30.0, 35.0]                 # start, frontiers, target abscissa (km)
TRAJ_ZONE_W = 10.0
TRAJ_Y_TARGET = 2.0


def traj_legs():
    legs = []
    for k, (speed, direction) in enumerate(TRAJ_WINDS):
        d = np.radians(direction)
        legs.append((TRAJ_XS[k + 1] - TRAJ_XS[k], speed * np.cos(d), speed * np.sin(d)))
    return legs


def traj_shoot(theta0):
    """Waypoint ordinates [start, ..., end] and the heading in each leg, for a
    launch heading theta0 (radians), using the Snell-like invariant.
    """

    legs = traj_legs()
    cx0, cy0 = legs[0][1], legs[0][2]
    lam = np.sin(theta0) / (TRAJ_V + cx0 * np.cos(theta0) + cy0 * np.sin(theta0))
    ys, thetas = [0.0], []

    for k, (dx, cx, cy) in enumerate(legs):
        th = theta0 if k == 0 else heading_from_lambda(lam, cx, cy, TRAJ_V)
        gx = TRAJ_V * np.cos(th) + cx
        gy = TRAJ_V * np.sin(th) + cy
        ys.append(ys[-1] + dx * gy / gx)
        thetas.append(th)

    return ys, thetas


def traj_solve(y_target):
    a, b = np.radians(-30), np.radians(40)
    fa = traj_shoot(a)[0][-1] - y_target

    for _ in range(60):
        m = (a + b) / 2
        fm = traj_shoot(m)[0][-1] - y_target
        if np.sign(fm) == np.sign(fa):
            a, fa = m, fm
        else:
            b = m

    return (a + b) / 2


def generate_target_point_figure():
    fig, ax = new_axes((10.5, 3.9), aspect_equal=False)
    ax.set_aspect("equal")

    theta0 = traj_solve(TRAJ_Y_TARGET)
    ys, thetas = traj_shoot(theta0)
    xs = TRAJ_XS
    plot_w = 4 * TRAJ_ZONE_W
    target_gap = 1.2
    band = 3.4
    y_max = max(ys) + target_gap + 0.5 + band
    y_min = min(0, min(ys)) - 1.5

    ZONE_BG = "#e6f3e9"
    ax.add_patch(plt.Rectangle((0, y_min), plot_w, y_max - y_min, facecolor=ZONE_BG, edgecolor=INK, lw=1.4, zorder=0))

    # dashed y=0 reference (the horizontal from which theta0 is measured)
    ax.plot([0, plot_w], [0, 0], color=LINE, lw=1.2, ls=(0, (2, 5)), zorder=1)

    # wind zones
    arrow_center_y = y_max - band / 2 - 0.1
    for i, (speed, direction) in enumerate(TRAJ_WINDS):
        zx0 = i * TRAJ_ZONE_W

        if i > 0:
            ax.plot([zx0, zx0], [y_min, y_max], color=INK, lw=1.4, zorder=2)

        zc = zx0 + TRAJ_ZONE_W / 2
        ax.text(zc, y_max + 0.4, f"Zone {i + 1}", ha="center", va="bottom", fontsize=12.5, weight="bold")
        d = np.radians(direction)
        vec = np.array([np.cos(d), np.sin(d)]) * speed * 0.0524  # same scale as the demo
        draw_vector(ax, (zc - vec[0] / 2, arrow_center_y - vec[1] / 2), vec, WIND, lw=2.8)

    # virtual boundary at the target's abscissa
    line_top = y_max - band
    ax.plot([xs[4], xs[4]], [y_min, line_top], color=MUTED, lw=1.6, ls=(0, (5, 4)), zorder=2)
    ax.text(xs[4] - 0.4, y_min + 0.35, "virtual boundary", color=MUTED, fontsize=10, ha="right", va="center")

    # x_target, read on the abscissa under the box
    ax.plot([xs[4], xs[4]], [y_min, y_min - 0.4], color=MUTED, lw=1.6)
    ax.text(xs[4], y_min - 0.55, r"$x_{\mathrm{target}}$", color=INK, fontsize=13, ha="center", va="top")

    ax.plot(xs, ys, color=PATH, lw=3.2, solid_capstyle="round", zorder=3)

    # launch heading and its angle theta0, measured from the horizontal
    h = heading_dir(np.degrees(theta0))
    tip = np.array([xs[0], ys[0]]) + 3.4 * h
    draw_vector(ax, (xs[0], ys[0]), 3.4 * h, HEADING, lw=2.4, zorder=3.5)
    draw_arc(ax, (xs[0], ys[0]), 0, np.degrees(theta0), 2.4, HEADING, lw=1.8)
    ax.text(tip[0] + 0.35, tip[1] - 0.05, r"$\theta_0$", color=HEADING, fontsize=13, ha="left", va="center")

    for k in range(1, 4):
        ax.plot(xs[k], ys[k], "o", mfc=PANEL, mec=INK, mew=1.8, ms=6.5, zorder=4)

    ax.plot(xs[0], ys[0], "o", color=INK, ms=7, zorder=4)
    ax.text(xs[0] - 0.4, ys[0] - 0.35, "start", ha="right", va="top", fontsize=12)
    ax.plot(xs[4], ys[4], "o", color=PATH, mec=PATH, ms=7, zorder=4)
    ax.text(xs[4] + 0.9, ys[4], r"$y_{\mathrm{end}}$", color=PATH, fontsize=13, ha="left", va="center")

    # target marker: a small ring with a center dot, above the path's end
    tx, ty = xs[4], ys[4] + target_gap
    ax.plot(tx, ty, "o", mfc="none", mec=INK, mew=2, ms=13, zorder=5)
    ax.plot(tx, ty, "o", color=INK, ms=3, zorder=5)
    ax.text(tx - 0.9, ty, "target", fontsize=12, ha="right", va="center")
    ax.text(tx + 0.9, ty, r"$y_{\mathrm{target}}$", color=INK, fontsize=13, ha="left", va="center")

    ax.set_xlim(-1.0, plot_w + 1.0)
    ax.set_ylim(y_min - 1.7, y_max + 1.4)
    ax.axis("off")

    save(fig, "target_point")


# ---------------------------------------------------------------------------
# Figure: Bisection
# ---------------------------------------------------------------------------

def generate_bisection_figure():
    fig, ax = new_axes((9.6, 4.0), aspect_equal=False)
    ax.axis("on")

    lo, hi = THETA0_RANGE
    thetas = np.linspace(lo, hi, 400)
    residual = np.array([y_end(t, X_TARGET) - Y_TARGET for t in thetas])

    ax.axhline(0, color=INK, lw=1.2)
    ax.plot(np.degrees(thetas), residual, color="#16a34a", lw=2.6)

    a, b = lo, hi
    fa = y_end(a, X_TARGET) - Y_TARGET
    steps = []

    for _ in range(7):
        m = (a + b) / 2
        fm = y_end(m, X_TARGET) - Y_TARGET
        steps.append(m)

        if np.sign(fm) == np.sign(fa):
            a, fa = m, fm
        else:
            b = m

    solution = (a + b) / 2

    for i, m in enumerate(steps, start=1):
        fm = y_end(m, X_TARGET) - Y_TARGET
        offset = 14 if i % 2 == 0 else -20
        ax.plot(np.degrees(m), fm, "o", mfc="white", mec="#3549d1", mew=2, ms=7, zorder=5)

        ax.annotate(
            str(i), (np.degrees(m), fm), textcoords="offset points",
            xytext=(0, offset), ha="center", fontsize=11, weight="bold",
            color="#3549d1"
        )

    ax.axvline(np.degrees(solution), color=SOLUTION, lw=1.8, ls=(0, (6, 5)))

    ax.text(np.degrees(solution) + 1.5, residual.max() * 0.85,
             f"solution $\\approx {np.degrees(solution):.1f}\\degree$",
             color=SOLUTION, fontsize=12)

    ax.set_xlabel(r"launch heading $\theta_0$ (degrees)")
    ax.set_ylabel(r"$y_{\mathrm{end}}(\theta_0) - y_{\mathrm{target}}$")
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xlim(np.degrees(lo), np.degrees(hi))

    save(fig, "bisection", pad=0.3)


if __name__ == "__main__":
    generate_snell_law_figure()
    generate_target_point_figure()
    generate_bisection_figure()
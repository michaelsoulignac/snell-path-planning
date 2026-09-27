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
# Palette (light-mode values lifted from demo_drone_target.html's :root)
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
    The label, if given, is placed automatically at the arc's mid-angle."""
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


def draw_vector(ax, origin, vec, color, label=None, label_offset=(0.08, 0.08), lw=2.2):
    ax.annotate(
        "", xy=(origin[0] + vec[0], origin[1] + vec[1]), xytext=origin,
        arrowprops=dict(arrowstyle="-|>", color=color, lw=lw, mutation_scale=16),
    )
    if label is not None:
        tip = (origin[0] + vec[0], origin[1] + vec[1])
        ax.text(tip[0] + label_offset[0], tip[1] + label_offset[1], label,
                 color=color, fontsize=13, ha="left", va="bottom")


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

def snell_law():
    fig, ax = new_axes((10.5, 3.6))

    xlim, ylim = (-6.4, 6.4), (-1.9, 1.9)
    ax.axvspan(xlim[0], 0, color=PANEL, zorder=0)
    ax.axvspan(0, xlim[1], color=PANEL, zorder=0)
    ax.set_xlim(xlim)
    ax.set_ylim(ylim)
    ax.add_patch(plt.Rectangle((xlim[0], ylim[0]), xlim[1] - xlim[0], ylim[1] - ylim[0],
                                 fill=False, edgecolor=INK, lw=1.3))
    ax.axvline(0, color=INK, lw=1.4)  # the boundary itself

    theta1, theta2 = 22.0, 13.0
    X = np.array([0.06, 0.0])
    L1, L2 = 4.6, 4.8
    S = X - L1 * heading_dir(theta1)  # S is up-stream, to the left
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
    draw_arc(ax, X, 180, 180 + theta1, 0.8, HEADING, r"$\theta_1$", label_radius_factor=1.3)

    # theta2: angle at X between the normal (pointing forward, angle 0, along
    # the dashed line) and the direction towards E.
    draw_arc(ax, X, 0, theta2, 0.8, PATH, r"$\theta_2$", label_radius_factor=1.55)

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
    Returns the list of (x, y) breakpoints, stopping at up_to_x if given."""
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

def leg_headings(theta0, num_legs):
    """Recomputes the per-leg heading (one per crossed zone), independently
    from propagate(), purely for the drone-heading arrows drawn at each
    waypoint. Mirrors propagate()'s own logic without altering it, since
    propagate()/y_end()/find_solution() are shared with bisection()."""
    cx0, cy0 = ZONES[0]["c"]
    w0 = V + cx0 * np.cos(theta0) + cy0 * np.sin(theta0)
    lam = np.sin(theta0) / w0
    thetas = [theta0]
    for z in ZONES[1:num_legs]:
        thetas.append(heading_from_lambda(lam, z["c"][0], z["c"][1]))
    return thetas


def target_point():
    fig, ax = new_axes((10.5, 4.6), aspect_equal=False)
    ax.set_aspect("equal")

    theta0 = np.radians(8.0)
    pts, _ = propagate(theta0, up_to_x=X_TARGET)
    xs, ys = zip(*pts)
    thetas = leg_headings(theta0, num_legs=len(pts) - 1)

    plot_w = sum(z["dx"] for z in ZONES)
    top_margin = 1.6
    target_gap = 0.6

    y_max = max(max(ys), Y_TARGET) + target_gap + top_margin
    y_min = min(0, min(ys)) - 0.7

    ZONE_BG = "#e6f3e9"
    ax.add_patch(plt.Rectangle((0, y_min), plot_w, y_max - y_min,
                                 facecolor=ZONE_BG, edgecolor=INK, lw=1.4, zorder=0))
    # the target sits inside the last zone rather than exactly on a real
    # frontier, so its abscissa is marked with a dashed "virtual boundary".
    ax.plot([X_TARGET, X_TARGET], [y_min, y_max], color=MUTED, lw=1.6,
             ls=(0, (5, 4)), zorder=2)
    ax.text(X_TARGET + 0.15, y_min + 0.15, r"virtual boundary, $x=x_{\mathrm{target}}$",
             color=MUTED, fontsize=10, rotation=90, va="bottom", ha="left")

    # a couple of light horizontal gridlines, with a dashed axis at y=0
    for gy in np.arange(np.ceil(y_min / 2) * 2, y_max + 0.01, 2):
        is_axis = abs(gy) < 1e-9
        ax.plot([0, plot_w], [gy, gy], color=LINE if is_axis else GRID,
                 lw=1.2 if is_axis else 1.0, ls=(0, (2, 5)) if is_axis else "-", zorder=1)
        ax.text(-0.3, gy, f"{gy:+.0f}" if gy != 0 else "0", ha="right", va="center",
                 fontsize=10.5, color=MUTED)

    # wind zones
    wind_center_y = y_max - 1.1
    x0 = 0.0
    for i, z in enumerate(ZONES):
        width = z["dx"]
        if i > 0:
            ax.plot([x0, x0], [y_min, y_max], color=INK, lw=1.4, zorder=2)
        cx_lab = x0 + width / 2
        ax.text(cx_lab, y_max - 0.4, f"Zone {i + 1}", ha="center", fontsize=12.5,
                 weight="bold")
        cx, cy = z["c"]
        speed = np.hypot(cx, cy)
        c_dir = np.array([cx, cy]) / speed * 0.85
        center = np.array([cx_lab, wind_center_y])
        draw_vector(ax, center - c_dir / 2, c_dir, WIND, lw=2.6)
        x0 += width

    # drone heading arrow at every waypoint
    for p, th in zip(pts[:-1], thetas):
        draw_vector(ax, p, 1.1 * heading_dir(np.degrees(th)), HEADING, lw=2.2)

    ax.plot(xs, ys, color=PATH, lw=3.2, solid_capstyle="round", zorder=3)
    for p in pts[1:-1]:
        ax.plot(*p, "o", mfc=PANEL, mec=INK, mew=1.8, ms=6.5, zorder=4)
    ax.plot(*pts[0], "o", color=INK, ms=7, zorder=4)
    ax.text(pts[0][0] - 0.3, pts[0][1] - 0.5, "start", ha="right", fontsize=12)
    ax.plot(*pts[-1], "o", color=PATH, mec=PATH, ms=7, zorder=4)

    # target marker
    tx, ty = X_TARGET, Y_TARGET
    ax.plot(tx, ty, "o", mfc="none", mec=INK, mew=2, ms=13, zorder=5)
    ax.plot(tx, ty, "o", color=INK, ms=3, zorder=5)
    ax.text(tx + 0.35, ty, "target", fontsize=12, va="center")

    ax.set_xlim(-0.9, plot_w + 1.9)
    ax.set_ylim(y_min - 0.3, y_max + 0.3)
    ax.axis("off")

    save(fig, "target_point")


# ---------------------------------------------------------------------------
# Figure: Bisection
# ---------------------------------------------------------------------------

def bisection():
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
        ax.annotate(str(i), (np.degrees(m), fm), textcoords="offset points",
                     xytext=(0, offset), ha="center", fontsize=11, weight="bold",
                     color="#3549d1")

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
    snell_law()
    target_point()
    bisection()
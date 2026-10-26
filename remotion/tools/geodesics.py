"""Null geodesics in the Schwarzschild equatorial plane (rs = 1) for the
3Blue1Brown-style diagrams: u'' = 1.5u² − u (u = 1/r, ' = d/dφ), RK4.
Writes src/shorts/horizon/data/geodesics.json (polylines in units of rs).
"""
import json, math, sys

def trace(u0, du0, phi0, dphi=0.004, umin=1 / 14, umax=30, n=40000):
    u, du, phi = u0, du0, phi0
    pts = []
    f = lambda u: 1.5 * u * u - u
    for _ in range(n):
        r = 1 / u
        pts.append([round(r * math.cos(phi), 4), round(r * math.sin(phi), 4)])
        if u < umin or u > umax:
            break
        k1u, k1v = du, f(u)
        k2u, k2v = du + dphi / 2 * k1v, f(u + dphi / 2 * k1u)
        k3u, k3v = du + dphi / 2 * k2v, f(u + dphi / 2 * k2u)
        k4u, k4v = du + dphi * k3v, f(u + dphi * k3u)
        u += dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u)
        du += dphi / 6 * (k1v + 2 * k2v + 2 * k3v + k4v)
        phi += dphi
    # thin the polyline
    out = [pts[0]]
    for p in pts[1:]:
        if math.dist(p, out[-1]) > 0.02:
            out.append(p)
    out.append(pts[-1])
    return out, ('escape' if u < umin else 'capture')

def emit(r, alpha_deg, phi0):
    """Photon emitted at r (static observer, r > 1) at angle alpha from the outward radial."""
    a = math.radians(alpha_deg)
    u = 1 / r
    b = r * abs(math.sin(a)) / math.sqrt(1 - u) if abs(math.sin(a)) > 1e-6 else 1e6
    g = max(0.0, 1 / b ** 2 - u * u + u ** 3)
    du = -math.sqrt(g) if math.cos(a) > 0 else math.sqrt(g)  # outward: u decreasing
    pts, fate = trace(u, du, 0)
    if math.sin(a) < 0:
        pts = mirror(pts)
    return rotate(pts, phi0), fate

def mirror(pts):
    return [[x, -y] for x, y in pts]

def rotate(pts, phi0):
    c, s = math.cos(phi0), math.sin(phi0)
    return [[round(x * c - y * s, 4), round(x * s + y * c, 4)] for x, y in pts]

UP = -math.pi / 2  # screen "up" in diagram coordinates (y down)
data = {}

# Light from far away reaching a point just inside the horizon (r = 0.82, straight up).
# Traced backwards from the point outward (u decreasing) for |b| < bc.
P = 0.82
incoming = []
for b in [-1.9, -1.2, -0.5, 0.5, 1.2, 1.9]:
    u = 1 / P
    g = 1 / b ** 2 - u * u + u ** 3
    pts, fate = trace(u, -math.sqrt(g), 0)
    pts = pts if b > 0 else mirror(pts)
    if fate == 'escape':
        incoming.append(list(reversed(rotate(pts, UP))))
data['incoming'] = incoming

# Light emitted from the same point inside: every direction ends at r = 0.
inside = []
for b in [-6, -2.5, -1.2, -0.6, -0.25, 0.25, 0.6, 1.2, 2.5, 6]:
    u = 1 / P
    g = 1 / b ** 2 - u * u + u ** 3
    pts, _ = trace(u, math.sqrt(g), 0, umax=40)
    inside.append(rotate(pts if b > 0 else mirror(pts), UP))
data['inside'] = inside

# A flash at r = 2.5 (outside): most directions escape, the inward cone is captured.
outside = []
for a in range(0, 360, 20):
    pts, fate = emit(2.5, a + 0.01, UP)
    outside.append({'pts': pts, 'fate': fate})
data['outside'] = outside

json.dump(data, open(sys.argv[1], 'w'))
print({k: len(v) for k, v in data.items()}, sum(1 for o in outside if o['fate'] == 'escape'), 'of', len(outside), 'escape')

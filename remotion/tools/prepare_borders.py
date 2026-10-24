"""Downloads historical borders for a year (aourednik/historical-basemaps, GPL-3.0),
trims them to a bounding box and rewinds rings so d3-geo renders them.
Usage: python3 tools/prepare_borders.py 1938 -25 30 50 72 src/shorts/<slug>/data/europe_1938.json
Available years: see https://github.com/aourednik/historical-basemaps/tree/master/geojson
"""
import json, sys, urllib.request

year, w, s, e, n, out = sys.argv[1], *map(float, sys.argv[2:6]), sys.argv[6]
url = f'https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_{year}.geojson'
d = json.loads(urllib.request.urlopen(url, timeout=60).read())

def pts(c):
    if isinstance(c[0], (int, float)):
        yield c
    else:
        for x in c:
            yield from pts(x)

def in_box(geom):
    xs, ys = zip(*((p[0], p[1]) for p in pts(geom['coordinates'])))
    return max(xs) > w and min(xs) < e and max(ys) > s and min(ys) < n

def area(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2

def rewind(poly):
    # d3 expects the exterior ring clockwise and holes counter-clockwise.
    rings = []
    for i, r in enumerate(poly):
        a = area(r)
        if (i == 0 and a > 0) or (i > 0 and a < 0):
            r = r[::-1]
        rings.append([[round(x, 4), round(y, 4)] for x, y in r])
    return rings

feats = []
for f in d['features']:
    g = f['geometry']
    if not g or not in_box(g):
        continue
    g['coordinates'] = rewind(g['coordinates']) if g['type'] == 'Polygon' else [rewind(p) for p in g['coordinates']]
    feats.append({'type': 'Feature', 'properties': {'name': f['properties'].get('NAME')}, 'geometry': g})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(out, 'w'), separators=(',', ':'))
print(len(feats), 'features ->', out)

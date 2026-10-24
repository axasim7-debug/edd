"""Turns an OSM XML extract (api.openstreetmap.org /map?bbox=) into a compact
GeoJSON with ink-map layers: water, rail, roads, buildings, industrial, wood.
Data © OpenStreetMap contributors (ODbL) — credit it in the video description.
Usage: python3 tools/osm_extract.py area.osm out.json
"""
import json, sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
nodes = {n.get('id'): (round(float(n.get('lon')), 6), round(float(n.get('lat')), 6)) for n in root.iter('node')}
ways = {}
for w in root.iter('way'):
    tags = {t.get('k'): t.get('v') for t in w.iter('tag')}
    pts = [nodes[nd.get('ref')] for nd in w.iter('nd') if nd.get('ref') in nodes]
    ways[w.get('id')] = (tags, pts)

def layer(tags):
    if tags.get('natural') == 'water' or tags.get('waterway') == 'riverbank' or tags.get('landuse') == 'reservoir':
        return 'water'
    if tags.get('railway') in ('rail', 'disused'):
        return 'rail'
    if tags.get('highway') in ('primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'trunk'):
        return 'road'
    if 'building' in tags:
        return 'building'
    if tags.get('landuse') == 'industrial' or tags.get('power') in ('plant', 'generator'):
        return 'industrial'
    if tags.get('natural') == 'wood' or tags.get('landuse') == 'forest':
        return 'wood'
    if tags.get('waterway') in ('river', 'canal', 'stream'):
        return 'waterline'
    return None

def ring_area(r):
    return sum(r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1] for i in range(len(r) - 1)) / 2

def cw(r, outer=True):
    # d3 wants exterior rings clockwise in lon/lat (negative signed area here).
    a = ring_area(r)
    return r[::-1] if (outer and a > 0) or (not outer and a < 0) else r

def merge(segments):
    # Joins open way segments end to end into closed rings.
    segs = [list(s) for s in segments if len(s) > 1]
    rings = []
    while segs:
        ring = segs.pop()
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == ring[-1]: ring += s[1:]
                elif s[-1] == ring[-1]: ring += s[::-1][1:]
                elif s[-1] == ring[0]: ring = s[:-1] + ring
                elif s[0] == ring[0]: ring = s[::-1][:-1] + ring
                else: continue
                segs.pop(i); changed = True; break
        if ring[0] == ring[-1] and len(ring) > 3:
            rings.append(ring)
    return rings

feats = []
used = set()
for rel in root.iter('relation'):
    tags = {t.get('k'): t.get('v') for t in rel.iter('tag')}
    if tags.get('type') != 'multipolygon':
        continue
    lay = layer(tags)
    if lay not in ('water', 'wood', 'industrial'):
        continue
    outer = [ways[m.get('ref')][1] for m in rel.iter('member') if m.get('type') == 'way' and m.get('role') == 'outer' and m.get('ref') in ways]
    inner = [ways[m.get('ref')][1] for m in rel.iter('member') if m.get('type') == 'way' and m.get('role') == 'inner' and m.get('ref') in ways]
    rings = [cw(r) for r in merge(outer)] + [cw(r, False) for r in merge(inner)]
    if rings:
        feats.append({'type': 'Feature', 'properties': {'layer': lay, 'name': tags.get('name:en') or tags.get('name')},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': [[r] for r in rings[:len(merge(outer))]]}})
for wid, (tags, pts) in ways.items():
    lay = layer(tags)
    if not lay or len(pts) < 2:
        continue
    closed = pts[0] == pts[-1] and len(pts) > 3
    props = {'layer': lay, 'name': tags.get('name:en') or tags.get('name'), 'bridge': tags.get('bridge') == 'yes'}
    if lay in ('water', 'building', 'industrial', 'wood') and closed:
        geom = {'type': 'Polygon', 'coordinates': [cw(pts)]}
    elif lay in ('rail', 'road', 'waterline'):
        geom = {'type': 'LineString', 'coordinates': pts}
    else:
        continue
    feats.append({'type': 'Feature', 'properties': props, 'geometry': geom})
json.dump({'type': 'FeatureCollection', 'features': feats}, open(sys.argv[2], 'w'), separators=(',', ':'))
import collections
print(collections.Counter(f['properties']['layer'] for f in feats))

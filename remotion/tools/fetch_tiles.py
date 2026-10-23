"""Stitches Web-Mercator satellite tiles into one JPEG plus a JSON sidecar
describing its exact geographic bounds, so Remotion can place it precisely.

Usage: python3 tools/fetch_tiles.py <source> <zoom> <west> <south> <east> <north> <out.jpg>
Sources:
  nasa : NASA GIBS Blue Marble shaded relief + bathymetry (public domain, max z8)
  s2   : Sentinel-2 cloudless 2016 by EOX (CC BY 4.0, attribution required)
"""
import io, json, math, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

SOURCES = {
    'nasa': 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    's2': 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg',
}

def tile_xy(lon, lat, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y

def tile_lonlat(x, y, z):
    n = 2 ** z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon, lat

def get(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'edd-shorts/1.0'})
            return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert('RGB')
        except Exception:
            time.sleep(2 ** attempt)
    return Image.new('RGB', (256, 256), (10, 30, 50))

def main(src, z, w, s, e, n, out):
    z = int(z)
    x0, y0 = map(math.floor, tile_xy(float(w), float(n), z))
    x1, y1 = map(math.floor, tile_xy(float(e), float(s), z))
    tiles = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    img = Image.new('RGB', ((x1 - x0 + 1) * 256, (y1 - y0 + 1) * 256))
    with ThreadPoolExecutor(8) as ex:
        for (x, y), t in zip(tiles, ex.map(lambda xy: get(SOURCES[src].format(z=z, x=xy[0], y=xy[1])), tiles)):
            img.paste(t, ((x - x0) * 256, (y - y0) * 256))
    img.save(out, quality=92)
    west, north = tile_lonlat(x0, y0, z)
    east, south = tile_lonlat(x1 + 1, y1 + 1, z)
    meta = {'source': src, 'zoom': z, 'west': west, 'north': north, 'east': east, 'south': south,
            'width': img.width, 'height': img.height}
    json.dump(meta, open(out.rsplit('.', 1)[0] + '.json', 'w'), indent=1)
    print(out, len(tiles), 'tiles', img.size)

if __name__ == '__main__':
    main(*sys.argv[1:])

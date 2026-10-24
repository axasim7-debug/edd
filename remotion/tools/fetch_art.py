"""Downloads public-domain paintings from Wikimedia Commons (resized) and
records their source page for attribution.
Usage: python3 tools/fetch_art.py <out_dir> name="search terms" ...
"""
import json, sys, time, urllib.parse, urllib.request

UA = 'EddShortsBot/1.0 (https://github.com/axasim7-debug/edd)'

def get(url, tries=8):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:
            time.sleep(6 * (i + 1))
    raise RuntimeError(url)

def api(**params):
    params.update(format='json')
    return json.loads(get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))

import os
out = sys.argv[1]
cpath = f'{out}/credits.json'
credits = json.load(open(cpath)) if os.path.exists(cpath) else {}
for arg in sys.argv[2:]:
    name, query = arg.split('=', 1)
    if os.path.exists(f'{out}/{name}.jpg') and os.path.getsize(f'{out}/{name}.jpg') > 0:
        continue  # already downloaded
    # An exact 'File:...' title skips the search.
    hits = [{'title': query}] if query.startswith('File:') else api(action='query', list='search', srnamespace=6, srlimit=5, srsearch=query)['query']['search']
    for h in hits:
        title = h['title']
        if not title.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        info = api(action='query', titles=title, prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=1000)
        page = next(iter(info['query']['pages'].values()))['imageinfo'][0]
        try:
            open(f'{out}/{name}.jpg', 'wb').write(get(page['thumburl'].split('?')[0]))
            break
        except RuntimeError:
            continue
    lic = page.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '?')
    credits[name] = {'title': title, 'page': page['descriptionurl'], 'license': lic}
    print(name, '<-', title, '|', lic)
    json.dump(credits, open(cpath, 'w'), indent=1, ensure_ascii=False)
    time.sleep(6)

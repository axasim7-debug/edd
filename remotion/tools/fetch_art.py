"""Downloads public-domain paintings from Wikimedia Commons (resized) and
records their source page for attribution.
Usage: python3 tools/fetch_art.py <out_dir> name="search terms" ...
"""
import json, sys, time, urllib.parse, urllib.request

UA = 'EddShortsBot/1.0 (https://github.com/axasim7-debug/edd)'

def get(url, tries=6):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=60).read()
        except Exception as e:
            time.sleep(3 * (i + 1))
    raise RuntimeError(url)

def api(**params):
    params.update(format='json')
    return json.loads(get('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params)))

out = sys.argv[1]
credits = {}
for arg in sys.argv[2:]:
    name, query = arg.split('=', 1)
    hits = api(action='query', list='search', srnamespace=6, srlimit=5, srsearch=query)['query']['search']
    title = next(h['title'] for h in hits if h['title'].lower().endswith(('.jpg', '.jpeg', '.png')))
    info = api(action='query', titles=title, prop='imageinfo', iiprop='url|extmetadata', iiurlwidth=1000)
    page = next(iter(info['query']['pages'].values()))['imageinfo'][0]
    open(f'{out}/{name}.jpg', 'wb').write(get(page['thumburl']))
    lic = page.get('extmetadata', {}).get('LicenseShortName', {}).get('value', '?')
    credits[name] = {'title': title, 'page': page['descriptionurl'], 'license': lic}
    print(name, '<-', title, '|', lic)
    time.sleep(2)
json.dump(credits, open(f'{out}/credits.json', 'w'), indent=1, ensure_ascii=False)

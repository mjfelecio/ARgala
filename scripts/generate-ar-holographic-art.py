"""Generate small native textures from authored SVG geometry and global.css.
Requires FFmpeg with librsvg, only at development time. No app dependency.
"""
from pathlib import Path
import re
import hashlib
import subprocess

root = Path(__file__).resolve().parent.parent
css = (root / 'global.css').read_text()
def token(name):
    return re.search(r'--color-' + name + r':\s*(#[0-9A-Fa-f]+)', css).group(1)
forest, edge = token('ar-panel'), token('ar-edge')
out = root / 'assets/ar'
out.mkdir(exist_ok=True)
def write(name, body, size=512):
    svg = out / f'{name}.svg'
    svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 512 512">{body}</svg>\n')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(svg), '-frames:v', '1', '-threads', '1', str(out / f'{name}.png')], check=True)

# A matte surface with a directional edge reflection, not a fabricated camera blur.
write('holographic-frame', f'''
<defs><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
<stop stop-color="{edge}" stop-opacity=".14"/><stop offset=".35" stop-color="{forest}" stop-opacity=".38"/><stop offset="1" stop-color="{forest}" stop-opacity=".55"/></linearGradient>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{edge}" stop-opacity=".95"/><stop offset=".5" stop-color="{edge}" stop-opacity=".3"/><stop offset="1" stop-color="{edge}" stop-opacity=".8"/></linearGradient></defs>
<rect x="5" y="5" width="502" height="502" rx="30" fill="{forest}" fill-opacity=".78"/>
<rect x="5" y="5" width="502" height="502" rx="30" fill="url(#glass)" stroke="url(#rim)" stroke-width="3"/>
<path d="M27 66V42Q27 27 42 27H66 M446 27H470Q485 27 485 42V66 M485 446V470Q485 485 470 485H446 M66 485H42Q27 485 27 470V446" fill="none" stroke="{edge}" stroke-opacity=".9" stroke-width="5" stroke-linecap="round"/>
''')
write('holographic-glint', f'<rect x="5" y="5" width="502" height="502" rx="30" fill="none" stroke="{edge}" stroke-width="7"/>')
paths = {
 'overview': '<path d="M156 184Q206 163 256 188Q306 163 356 184V328Q306 307 256 332Q206 307 156 328Z M256 188V332 M183 218Q207 208 229 218 M283 218Q307 208 329 218 M183 253H229 M283 253H329"/>',
 'history': '<circle cx="256" cy="256" r="96"/><path d="M256 194V258L299 286 M256 160V174 M352 256H338 M256 352V338 M160 256H174"/>',
 'highlights': '<path d="M256 148L284 226L364 256L284 286L256 364L228 286L148 256L228 226Z"/>',
 'visitor-notes': '<path d="M202 172H176V354H336V172H310 M222 159H290V198H222Z M210 239H303 M210 279H303 M210 319H266"/>',
 'facts': '<path d="M224 308C224 282 192 275 192 232A64 64 0 0 1 320 232C320 275 288 282 288 308Z M224 331H288 M236 352H276 M256 133V115 M169 161L156 148 M343 161L356 148 M153 232H134 M359 232H378"/>',
 'chapter': '<path d="M166 174H346V338H166Z M197 214H315 M197 256H315 M197 298H267"/>',
}
for name, path in paths.items():
    write(f'chapter-{name}', f'<circle cx="256" cy="256" r="211" fill="{edge}" fill-opacity=".07" stroke="{edge}" stroke-opacity=".55" stroke-width="7"/><g fill="none" stroke="{edge}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">{path}</g>', 256)

# Verify pixels, not just file presence: ImageMagick's internal SVG delegate
# previously flattened opacity and erased every chapter symbol.
def pixels(name):
    return subprocess.check_output(['ffmpeg', '-loglevel', 'error', '-i', str(out / f'{name}.png'), '-threads', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'])
frame = pixels('holographic-frame')
assert 190 < frame[(256 * 512 + 256) * 4 + 3] < 245, 'Frame must retain camera transparency'
assert frame[3] == 0, 'Rounded exterior must be transparent'
hashes = set()
for name in paths:
    image = pixels(f'chapter-{name}')
    assert image[(50 * 256 + 100) * 4 + 3] < 64, 'Icon circle must not hide its symbol'
    hashes.add(hashlib.sha256(image).digest())
assert len(hashes) == len(paths), 'Chapter symbols must be distinct'
print('Verified translucent frame and six distinct chapter textures')

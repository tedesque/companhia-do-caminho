"""Build an installable release from this repository without publishing it."""
import argparse
import json
import re
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--repository', required=True, help='OWNER/REPOSITORY')
parser.add_argument('--tag', required=True, help='v0.1.0')
args = parser.parse_args()
if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repository):
    parser.error('Invalid repository')
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'system.json').read_text())
if args.tag != 'v' + manifest['version']:
    parser.error('Tag must match system.json version')
base = f'https://github.com/{args.repository}'
manifest.update(url=base,
    manifest=base + '/releases/latest/download/system.json',
    download=base + f'/releases/download/{args.tag}/companhia-do-caminho.zip')
dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'system.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(dist / 'companhia-do-caminho.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('system.json', (dist / 'system.json').read_bytes())
    for name in ['scripts', 'templates', 'styles', 'examples', 'tests']:
        for path in sorted((root / name).rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(root))
    for name in ['README.md', 'VALIDACAO.md']:
        archive.write(root / name, name)
print('Built release assets in dist/. No files have been published.')

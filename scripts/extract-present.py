"""Extract present indicative from an ian-hamlin/verb-data source tarball.
Usage: python3 scripts/extract-present.py /path/to/verb-data.tar.gz
Input word data is the app's unchanged dist/words.js JSON export.
"""
import html
import json
from pathlib import Path
import re
import sys
import tarfile

root = Path(__file__).resolve().parent.parent
words = json.loads((root / 'dist/words.js').read_text().removeprefix('export const words = ').removesuffix(';\n'))
result = {}
with tarfile.open(sys.argv[1]) as archive:
    for word in words:
        # Explicit source senses; do not classify nouns by their ending (e.g. particolare).
        if not re.match(r'^(to |can|must)', word['english']):
            continue
        name = word['italian']
        path = f'verb-data-master/json/italian/content/{name[0]}/{name}.json'
        data = json.load(archive.extractfile(path))
        source_forms = [entry for entry in data['conjugations'] if entry['group'] == 'indicative/present']
        assert [entry['form'] for entry in source_forms] == ['s1', 's2', 's3', 'p1', 'p2', 'p3'], name
        forms = []
        for entry in source_forms:
            value = html.unescape(entry['value']).split(',')[0].strip()
            forms.append(None if value == '—' else value)
        # Prefer modern diphthong forms from the source's alternatives.
        if name == 'promuovere':
            forms[3:5] = ['promuoviamo', 'promuovete']
        note = ''
        if name in ['accadere', 'avvenire']:
            forms = [None, None, forms[2], None, None, forms[5]]
            note = 'For “to happen”, practice the usual third-person forms: something happens, things happen.'
        if name == 'bisognare':
            note = 'Usually impersonal: bisogna means “it is necessary”. Only this common form is practiced.'
        if name == 'piacere':
            note = 'Piacere means “to please”: mi piace (I like it), mi piacciono (I like them). The verb agrees with the thing liked.'
        result[name] = {'present': forms, 'source': data['url']}
        if note:
            result[name]['note'] = note
header = '// Adapted from ian-hamlin/verb-data and Wiktionary, CC BY-SA 3.0.\n// Common modern present indicative forms; see conjugations-LICENSE.md for attribution and changes.\n'
(root / 'dist/present-data.js').write_text(header + 'export const conjugations = ' + json.dumps(result, ensure_ascii=False, indent=2) + ';\n')
print(f'Extracted {len(result)} verbs.')

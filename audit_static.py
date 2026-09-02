#!/usr/bin/env python3
from pathlib import Path
import re, sys, hashlib, json
root=Path(__file__).resolve().parent
errors=[]
app=(root/'app.js').read_text(encoding='utf-8')
if len(re.findall(r"id:'(?:cpt|mcst|corsi|digits|stroop|tapping|fitts|steering|dots)'",app)) != 9:
    errors.append('Le registre ne contient pas exactement les 9 tests attendus.')
for p in [root/'app.js',root/'index.html',*(root/'runners').glob('*.html')]:
    txt=p.read_text(encoding='utf-8')
    for bad in ['localStorage','sessionStorage','indexedDB','document.cookie']:
        if bad in txt and p.name!='index.html': errors.append(f'{bad} trouvé dans {p.name}')
for p in [root/'runners'/'attention.html',root/'runners'/'neuro.html',root/'runners'/'visuo.html']:
    if 'neuro-observation-web' not in p.read_text(encoding='utf-8'): errors.append(f'adaptateur absent: {p}')
print('OK' if not errors else '\n'.join('ERREUR: '+x for x in errors))
sys.exit(1 if errors else 0)

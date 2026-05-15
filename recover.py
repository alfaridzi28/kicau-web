import os, re, json, glob

paths = [
    r'C:\Users\ruben\.gemini\antigravity\brain\87464201-f9c4-4247-bc15-6a2584bc2391\.system_generated\logs\overview.txt',
    r'C:\Users\ruben\.gemini\antigravity\brain\f67a0daf-f5d3-4c03-8c42-6d9780223155\.system_generated\logs\overview.txt'
]
files = {}

for path in paths:
    if not os.path.exists(path): continue
    content = open(path, encoding='utf-8', errors='ignore').read()
    
    matches = re.findall(r'Call: default_api:write_to_file\nArguments: (\{.*?\n\})', content, re.DOTALL)
    for m in matches:
        try:
            target_match = re.search(r'\"TargetFile\":\s*\"([^\"]+)\"', m)
            code_match = re.search(r'\"CodeContent\":\s*\"(.*)\"(?:\s*\}|\s*,\s*\"[A-Za-z]+\")', m, re.DOTALL)
            if target_match and code_match:
                tf = target_match.group(1).replace('\\\\', '/')
                cc = json.loads('"' + code_match.group(1) + '"')
                if 'src/app/dashboard' in tf:
                    files[tf] = cc
        except Exception as e:
            pass

    matches_view = re.findall(r'File Path: `[^`]+?([^`]+?)`\nTotal Lines: \d+\nTotal Bytes: \d+\nShowing lines \d+ to \d+\n.*?\n((?:\d+: .*\n)*)', content)
    for tf, body in matches_view:
        if 'src/app/dashboard' in tf.replace('\\\\', '/'):
            clean_body = re.sub(r'^\d+: ', '', body, flags=re.MULTILINE)
            files[tf.replace('\\\\', '/')] = clean_body

print(f'Found {len(files)} files in logs.')

empty_files = glob.glob('src/app/dashboard/**/*.tsx', recursive=True)
recovered = 0
for ef in empty_files:
    abs_ef = os.path.abspath(ef).replace('\\\\', '/')
    best_match = None
    for k in files.keys():
        if ef.replace('\\\\', '/').split('kicau-frontend/')[-1] in k:
            best_match = k
    if best_match:
        open(ef, 'w', encoding='utf-8').write(files[best_match])
        recovered += 1

print(f'Recovered {recovered} out of {len(empty_files)} empty files.')

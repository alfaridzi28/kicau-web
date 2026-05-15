import os, json, glob

brain_dir = r'C:\Users\ruben\.gemini\antigravity\brain'
overview_files = glob.glob(os.path.join(brain_dir, '**', 'overview.txt'), recursive=True)

files_map = {}

for path in overview_files:
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    for tc in data.get('tool_calls', []):
                        if tc.get('name') == 'write_to_file':
                            args = tc.get('args', {})
                            tf = args.get('TargetFile', '')
                            cc = args.get('CodeContent', '')
                            
                            if isinstance(tf, str): tf = tf.strip('"')
                            if isinstance(cc, str):
                                if cc.startswith('"') and cc.endswith('"'):
                                    cc = json.loads(cc)
                            
                            tf_unix = tf.replace('\\', '/')
                            if 'src/app/dashboard' in tf_unix:
                                files_map[tf_unix] = cc
                except: pass
    except: pass

empty_files = glob.glob('src/app/dashboard/**/*.tsx', recursive=True)
recovered = 0

for ef in empty_files:
    if os.path.getsize(ef) > 0: continue
    
    ef_unix = ef.replace('\\', '/')
    best_match = None
    for k in files_map.keys():
        if ef_unix.split('kicau-frontend/')[-1] in k:
            best_match = k
            
    if best_match:
        with open(ef, 'w', encoding='utf-8') as f:
            f.write(files_map[best_match])
        recovered += 1
        print(f"Recovered {ef}")

print(f"Recovered {recovered} out of {len(empty_files)} empty files.")

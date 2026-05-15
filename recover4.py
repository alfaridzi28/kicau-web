import os, glob, json

paths = [
    r'C:\Users\ruben\.gemini\antigravity\brain\87464201-f9c4-4247-bc15-6a2584bc2391\.system_generated\logs\overview.txt',
    r'C:\Users\ruben\.gemini\antigravity\brain\f67a0daf-f5d3-4c03-8c42-6d9780223155\.system_generated\logs\overview.txt'
]

empty_files = glob.glob('src/app/dashboard/**/*.tsx', recursive=True)
recovered = 0

files_map = {}

for path in paths:
    if not os.path.exists(path): continue
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            try:
                data = json.loads(line)
                tool_calls = data.get('tool_calls', [])
                for tc in tool_calls:
                    if tc.get('name') == 'write_to_file' or tc.get('name') == 'replace_file_content':
                        args = tc.get('args', {})
                        tf = args.get('TargetFile', '')
                        cc = args.get('CodeContent', '')
                        
                        # Note: The JSON logs wrap strings in escaped quotes like "\"TargetFile\"" and the value is also escaped.
                        # Actually, wait, `args["TargetFile"]` might be a string `"...path..."`.
                        if isinstance(tf, str):
                            tf = tf.strip('"')
                        if isinstance(cc, str):
                            if cc.startswith('"') and cc.endswith('"'):
                                cc = json.loads(cc) # decode JSON encoded string
                        
                        tf_unix = tf.replace('\\', '/')
                        if 'src/app/dashboard' in tf_unix:
                            if tc.get('name') == 'write_to_file':
                                files_map[tf_unix] = cc
                            elif tc.get('name') == 'replace_file_content':
                                # This is dangerous, but usually we just wrote the file. Let's ignore replace for now.
                                pass
            except Exception as e:
                pass

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

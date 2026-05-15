import os, json
brain_dir = r'C:\Users\ruben\.gemini\antigravity\brain'
for root, _, files in os.walk(brain_dir):
    if 'overview.txt' in files:
        path = os.path.join(root, 'overview.txt')
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    for tc in data.get('tool_calls', []):
                        if tc.get('name') == 'write_to_file':
                            args = tc.get('args', {})
                            tf = args.get('TargetFile', '')
                            if 'dashboard' in str(tf):
                                print("Found raw TF:", tf)
                except: pass

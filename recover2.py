import os, glob, json, shutil

hist_dir = os.path.expandvars(r"%APPDATA%\Code\User\History")
empty_files = glob.glob('src/app/dashboard/**/*.tsx', recursive=True)
recovered = 0

for root, _, files in os.walk(hist_dir):
    if 'entries.json' in files:
        entries_path = os.path.join(root, 'entries.json')
        try:
            with open(entries_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            resource = data.get('resource', '')
            if 'kicau-frontend' in resource and 'src/app/dashboard' in resource:
                entries = data.get('entries', [])
                # loop backwards
                for entry in reversed(entries):
                    hash_id = entry.get('id')
                    history_file = os.path.join(root, hash_id)
                    
                    if os.path.exists(history_file) and os.path.getsize(history_file) > 100:
                        for ef in empty_files:
                            if ef.replace('\\', '/').endswith(resource.split('src/app/dashboard/')[-1]):
                                if os.path.getsize(ef) == 0:
                                    shutil.copy2(history_file, ef)
                                    recovered += 1
                                    print(f"Recovered {ef}")
                        break # found a valid version, stop going backwards
        except Exception as e:
            pass

print(f"Recovered {recovered} out of {len(empty_files)} empty files.")

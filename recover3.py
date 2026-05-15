import os, glob, re, json

paths = [
    r'C:\Users\ruben\.gemini\antigravity\brain\87464201-f9c4-4247-bc15-6a2584bc2391\.system_generated\logs\overview.txt',
    r'C:\Users\ruben\.gemini\antigravity\brain\f67a0daf-f5d3-4c03-8c42-6d9780223155\.system_generated\logs\overview.txt'
]

empty_files = glob.glob('src/app/dashboard/**/*.tsx', recursive=True)
recovered = 0

for ef in empty_files:
    if os.path.getsize(ef) > 0: continue
    
    # We want to find the last occurrence of this file being written in the logs.
    file_content = None
    ef_unix = ef.replace('\\', '/')
    ef_win = ef.replace('/', '\\')
    
    for path in paths:
        if not os.path.exists(path): continue
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        
        # Read the file line by line to find write_to_file arguments for this file
        in_args = False
        arg_lines = []
        
        for line in lines:
            if line.startswith('Call: default_api:write_to_file'):
                in_args = True
                arg_lines = []
                continue
            
            if in_args:
                if line.startswith('Tool Response:'):
                    in_args = False
                    # Parse the captured arg_lines
                    arg_str = "".join(arg_lines)
                    # arg_str starts with 'Arguments: {\n'
                    if arg_str.startswith('Arguments:'):
                        arg_str = arg_str[10:].strip()
                    try:
                        args = json.loads(arg_str)
                        target = args.get('TargetFile', '')
                        if ef_unix in target.replace('\\', '/'):
                            file_content = args.get('CodeContent')
                    except Exception as e:
                        # Try to extract CodeContent manually if JSON fails
                        m = re.search(r'"CodeContent":\s*"(.*)"(?:\n|\r|\s*,\s*"[A-Za-z]+)', arg_str, re.DOTALL)
                        if m:
                            try:
                                code = json.loads('"' + m.group(1) + '"')
                                target_m = re.search(r'"TargetFile":\s*"([^"]+)"', arg_str)
                                if target_m and ef_unix in target_m.group(1).replace('\\', '/'):
                                    file_content = code
                            except: pass
                else:
                    arg_lines.append(line)
                    
    if file_content:
        with open(ef, 'w', encoding='utf-8') as f:
            f.write(file_content)
        recovered += 1
        print(f"Recovered {ef}")

print(f"Recovered {recovered} out of {len(empty_files)} empty files.")

import os
import re

def replace_colors(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Text replacements
    content = re.sub(r'text-gray-(800|900)', r'text-[var(--text-1)]', content)
    content = re.sub(r'text-gray-(600|700)', r'text-[var(--text-2)]', content)
    content = re.sub(r'text-gray-(400|500)', r'text-[var(--text-4)]', content)
    
    # Background replacements
    content = re.sub(r'bg-gray-(50|100)', r'bg-[var(--surface-2)]', content)
    content = re.sub(r'bg-gray-(200|300)', r'bg-[var(--surface-3)]', content)
    
    # Border replacements
    content = re.sub(r'border-gray-(50|100|200)', r'border-[var(--border)]', content)
    content = re.sub(r'border-gray-(300|400)', r'border-[var(--border-2)]', content)
    
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

def walk_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                replace_colors(os.path.join(root, file))

if __name__ == '__main__':
    base_dir = '/Users/harshitgoyal/Downloads/files/bika-banquet/client/src/app'
    components_dir = '/Users/harshitgoyal/Downloads/files/bika-banquet/client/src/components'
    walk_dir(base_dir)
    walk_dir(components_dir)

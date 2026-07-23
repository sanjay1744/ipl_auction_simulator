import re

file_path = r'frontend/src/app/core/data/teams-data.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

color_updates = {
    'CSK': '#F9CD05',
    'MI': '#0066FF',
    'RCB': '#EC1C24',
    'KKR': '#A855F7',
    'SRH': '#FF6600',
    'RR': '#EA1A85',
    'DC': '#0078FF',
    'PBKS': '#DD1D25',
    'GT': '#00C49F',
    'LSG': '#00A3E0'
}

for code, color in color_updates.items():
    pattern = rf'("code": "{code}",[\s\S]*?"primaryColor": ")[^"]+'
    content = re.sub(pattern, rf'\g<1>{color}', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated teams-data.ts primary colors successfully.')

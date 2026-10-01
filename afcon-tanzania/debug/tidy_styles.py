import re, glob, os
base = r"c:\Users\user\Desktop\scrapper\mirrors\afcon-tanzania"
for f in glob.glob(os.path.join(base, "*.html")):
    s = open(f, encoding='utf-8', errors='ignore').read()
    orig = s
    s = s.replace(' style=""', '')
    s = re.sub(r'\s+style="\s*"', '', s)
    # tidy: '<body ... ><div' -> '<body ...><div'
    s = re.sub(r'(<body[^>]*?)\s+>', r'\1>', s, count=1)
    if s != orig:
        open(f, 'w', encoding='utf-8', newline='').write(s)
        print('TIDIED', os.path.basename(f))
print('done')

#!/usr/bin/env python3
"""
Pulls the pure-logic core (mergeKB → detectArchonMode, plus fmt/esc) out of
ai.html by exact line range, so tests.js tests the REAL shipped code, not a
reimplementation. Re-run this after editing any function between mergeKB()
and detectArchonMode() (inclusive) in ai.html, then re-run `node tests.js`.

If you add/remove lines in that range, this script's line numbers will
drift — it prints the resolved function names it found so you can sanity
check before trusting the output; if a name looks wrong, re-grep ai.html
for the current line numbers and update FUNC_STARTS below.
"""
import re

SRC_FILE = 'ai.html'
OUT_FILE = 'extracted_core.js'

FUNC_STARTS = [
    ('mergeKB',              r'^function mergeKB\('),
    ('detectArchonMode_end', r'^function detectArchonMode\('),  # marks end of the contiguous block
]

def main():
    lines = open(SRC_FILE, encoding='utf-8').read().split('\n')

    start_line = None
    for i, l in enumerate(lines, 1):
        if re.match(r'^function mergeKB\(', l):
            start_line = i
            break
    if start_line is None:
        raise SystemExit('mergeKB not found — has ai.html changed shape?')

    detect_start = None
    for i, l in enumerate(lines, 1):
        if re.match(r'^function detectArchonMode\(', l):
            detect_start = i
            break
    if detect_start is None:
        raise SystemExit('detectArchonMode not found')

    # walk forward from detect_start to find its closing brace (first line
    # that is exactly "}" after we've seen the opening brace and depth
    # returns to 0)
    depth = 0
    end_line = None
    for i in range(detect_start, len(lines) + 1):
        line = lines[i - 1]
        depth += line.count('{') - line.count('}')
        if i > detect_start and depth == 0:
            end_line = i
            break
    if end_line is None:
        raise SystemExit('could not find end of detectArchonMode')

    fmt_start = None
    for i, l in enumerate(lines, 1):
        if re.match(r'^function fmt\(', l):
            fmt_start = i
            break
    depth = 0
    fmt_end = None
    for i in range(fmt_start, len(lines) + 1):
        line = lines[i - 1]
        depth += line.count('{') - line.count('}')
        if i > fmt_start and depth == 0:
            fmt_end = i
            break

    esc_line = None
    for i, l in enumerate(lines, 1):
        if re.match(r'^function esc\(', l):
            esc_line = i
            break

    def grab(a, b):
        return '\n'.join(lines[a - 1:b])

    block1 = grab(start_line, end_line)
    block2 = grab(fmt_start, fmt_end)
    block3 = grab(esc_line, esc_line)

    out = block1 + '\n\n' + block2 + '\n\n' + block3 + '\n'
    open(OUT_FILE, 'w', encoding='utf-8').write(out)
    print(f'Extracted lines {start_line}-{end_line} (mergeKB..detectArchonMode), '
          f'{fmt_start}-{fmt_end} (fmt), {esc_line} (esc) → {OUT_FILE} ({len(out)} chars)')

if __name__ == '__main__':
    main()

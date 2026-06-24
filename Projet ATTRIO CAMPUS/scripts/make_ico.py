#!/usr/bin/env python3

import struct
import sys
from pathlib import Path


def build_ico(png_path: Path, ico_path: Path) -> None:
    png_data = png_path.read_bytes()

    header = struct.pack('<HHH', 0, 1, 1)
    directory_entry = struct.pack(
        '<BBBBHHII',
        0,
        0,
        0,
        0,
        1,
        32,
        len(png_data),
        6 + 16,
    )

    ico_path.write_bytes(header + directory_entry + png_data)


def main() -> int:
    if len(sys.argv) != 3:
        print('Usage: make_ico.py <input.png> <output.ico>')
        return 1

    png_path = Path(sys.argv[1])
    ico_path = Path(sys.argv[2])

    if not png_path.exists():
        print(f'Input file not found: {png_path}')
        return 1

    ico_path.parent.mkdir(parents=True, exist_ok=True)
    build_ico(png_path, ico_path)
    print(f'ICO generated: {ico_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

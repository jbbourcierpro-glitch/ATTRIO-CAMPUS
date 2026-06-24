#!/usr/bin/env python3

import struct
import sys
from pathlib import Path


ICON_MAP = [
    ('icp4', 'icon_16x16.png'),
    ('icp5', 'icon_32x32.png'),
    ('icp6', 'icon_32x32@2x.png'),
    ('ic07', 'icon_128x128.png'),
    ('ic08', 'icon_256x256.png'),
    ('ic09', 'icon_512x512.png'),
    ('ic10', 'icon_512x512@2x.png'),
]


def build_icns(iconset_dir: Path, icns_path: Path) -> None:
    chunks = []

    for icon_type, file_name in ICON_MAP:
        icon_path = iconset_dir / file_name
        if not icon_path.exists():
            raise FileNotFoundError(f'Missing icon file: {icon_path}')

        icon_data = icon_path.read_bytes()
        chunks.append(icon_type.encode('ascii') + struct.pack('>I', len(icon_data) + 8) + icon_data)

    total_size = 8 + sum(len(chunk) for chunk in chunks)
    icns_path.write_bytes(b'icns' + struct.pack('>I', total_size) + b''.join(chunks))


def main() -> int:
    if len(sys.argv) != 3:
        print('Usage: make_icns.py <iconset_dir> <output.icns>')
        return 1

    iconset_dir = Path(sys.argv[1])
    icns_path = Path(sys.argv[2])

    if not iconset_dir.exists():
        print(f'Iconset directory not found: {iconset_dir}')
        return 1

    icns_path.parent.mkdir(parents=True, exist_ok=True)
    build_icns(iconset_dir, icns_path)
    print(f'ICNS generated: {icns_path}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

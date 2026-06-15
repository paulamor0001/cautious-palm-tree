import { writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

function makeIcon(size, outPath) {
  const png = new PNG({ width: size, height: size });
  // Solid brown background #6b4423
  const bg = [0x6b, 0x44, 0x23, 0xff];
  // Light "DT" pixel-mark - simple block letters on a 32x32 grid scaled up
  // Letter cells (1 = ink, 0 = bg) on a 24x10 grid
  const dtRows = [
    '11110.1111.', // 1 = brown ink
    '11110.1111.',
    '11.11.11...',
    '11.11.11...',
    '11.11.1111.',
    '11.11.11...',
    '11.11.11...',
    '11.11.11...',
    '11110.11...',
    '11110.11...',
  ].map(r => r.replace(/\./g, '').padEnd(11, ' '));

  function isInk(x, y) {
    // Map (x,y) in [0,size) into the 11-wide x 10-tall stencil centred 65% of icon.
    const ix = Math.floor((x - size * 0.18) / (size * 0.64 / 11));
    const iy = Math.floor((y - size * 0.35) / (size * 0.30 / 10));
    if (iy < 0 || iy >= 10 || ix < 0 || ix >= 11) return false;
    return dtRows[iy][ix] === '1';
  }

  const ink = [0xf5, 0xef, 0xe6, 0xff];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) * 4;
      const color = isInk(x, y) ? ink : bg;
      png.data[idx] = color[0];
      png.data[idx+1] = color[1];
      png.data[idx+2] = color[2];
      png.data[idx+3] = color[3];
    }
  }
  writeFileSync(outPath, PNG.sync.write(png));
}

mkdirSync('assets/icons', { recursive: true });
makeIcon(192, 'assets/icons/icon-192.png');
makeIcon(512, 'assets/icons/icon-512.png');
console.log('Wrote assets/icons/icon-{192,512}.png');

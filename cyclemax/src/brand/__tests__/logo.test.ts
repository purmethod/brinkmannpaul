import { readFileSync } from 'fs';
import path from 'path';

import { LOGO_ARCS, LOGO_SHIELD, LOGO_TRANSFORM, LOGO_VIEWBOX } from '../logo';

describe('logo', () => {
  const svg = readFileSync(path.join(__dirname, '../../../assets/logo.svg'), 'utf8');

  it('matches assets/logo.svg exactly', () => {
    expect(svg).toContain(`viewBox="${LOGO_VIEWBOX}"`);
    expect(svg).toContain(`transform="${LOGO_TRANSFORM}"`);
    expect(svg).toContain(
      `<path d="${LOGO_SHIELD.d}" fill="#FFFFFF" stroke="${LOGO_SHIELD.stroke}" stroke-width="${LOGO_SHIELD.strokeWidth}" stroke-linejoin="round"/>`,
    );
    for (const arc of LOGO_ARCS) {
      expect(svg).toContain(`<path d="${arc.d}" fill="none" stroke="${arc.stroke}" stroke-width="6"/>`);
    }
  });
});

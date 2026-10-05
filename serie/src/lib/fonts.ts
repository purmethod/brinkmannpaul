import {continueRender, delayRender, staticFile} from 'remotion';

/** Verschnörkelte Schreibschrift (Pinyon Script, SIL OFL) — lokal unter public/fonts. */
export const SCRIPT_FONT = 'PinyonScript';

let requested = false;

export const ensureFonts = () => {
  if (requested || typeof document === 'undefined') return;
  requested = true;
  const handle = delayRender('Schrift laden');
  const face = new FontFace(SCRIPT_FONT, `url(${staticFile('fonts/PinyonScript.woff2')}) format('woff2')`);
  face
    .load()
    .then(() => {
      document.fonts.add(face);
      continueRender(handle);
    })
    .catch((err) => {
      console.error('Schrift konnte nicht geladen werden', err);
      continueRender(handle);
    });
};

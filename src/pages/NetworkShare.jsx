import { localized } from '../i18n/localizer.js';
import { useEffect, useRef, useState } from 'react';
import {
  FORMATS,
  canShare,
  canCopyImage,
  canCopyText,
  copyImage,
  copyText,
  download,
  fileName,
  rasterize,
  shareTargets,
  svgBlob,
} from '../links/export';
import { linksText } from '../links/edit';
import { useLang } from '../i18n/prefs';
import { Download } from 'lucide-react';
import { iconProps } from '../components/icons';

/**
 * Downloads of the picture in every format, copies, the share sheet of the
 * system and links to the share dialogs of social networks (issue #17).
 */
export default function NetworkShare({ code, links, svg, style, url, text, busy = false }) {
  const { t } = useLang();
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const prepared = useRef(null);
  const done = (message) => setStatus(t(message));
  const failed = (error) => setStatus(`${t(localized('mc453b55b8099'))}: ${error.message}`);
  const image = (format) =>
    rasterize(svg, {
      width: style.width,
      height: style.height,
      type: format.type,
      quality: style.quality,
      // JPEG has no transparency: a transparent picture gets its background colour.
      fill: format.id === 'jpeg' ? style.bgColor : null,
    });
  const png = FORMATS[0];

  // Web Share, like Clipboard, needs the call itself inside the user gesture.
  // Prepare files beforehand; while conversion is pending the sheet shares the
  // current link. Never share an image prepared for an older drawing.
  useEffect(() => {
    let cancelled = false;
    let timer;
    prepared.current = null;
    if (!busy && canShare([new File([], 'network.png', { type: 'image/png' })])) {
      // Avoid rasterizing a large canvas for every input event in a drag.
      timer = setTimeout(() => {
        rasterize(svg, { width: style.width, height: style.height, type: 'image/png' })
          .then((blob) => {
            if (!cancelled) prepared.current = { svg, blob };
          })
          .catch(() => {}); // Link sharing remains available if image conversion fails.
      }, 200);
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [svg, style.width, style.height, busy]);

  const save = (format) =>
    image(format)
      .then((blob) => {
        download(blob, fileName(code, format.ext || format.id));
        done({ en: `${format.label} saved.`, ru: `${format.label} сохранён.` });
      })
      .catch(failed);

  const share = () => {
    const blob = !busy && prepared.current?.svg === svg ? prepared.current.blob : null;
    const files = blob ? [new File([blob], fileName(code, 'png'), { type: 'image/png' })] : null;
    return navigator
      .share(files && canShare(files) ? { files, title: text, text, url } : { title: text, text, url })
      .then(() => done(localized('m4794c0e52823')))
      .catch((error) => error.name !== 'AbortError' && failed(error));
  };

  return (
    <div className="network-share">
      <div className="network__actions" role="group" aria-label={t(localized('m9ad6a19742da'))}>
        <button
          type="button"
          className="button"
          disabled={busy}
          onClick={() => {
            download(svgBlob(svg), fileName(code, 'svg'));
            done(localized('mb14b0fbf0910'));
          }}
        >
          <Download {...iconProps} /> SVG
        </button>
        {FORMATS.map((format) => (
          <button key={format.id} type="button" className="button" disabled={busy} onClick={() => save(format)}>
            <Download {...iconProps} /> {format.label}
          </button>
        ))}
        <button
          type="button"
          className="button"
          onClick={() => {
            download(
              new Blob([`${linksText(links, '\n')}\n`], { type: 'text/plain;charset=utf-8' }),
              fileName(code, 'lino'),
            );
            done(localized('m68c85afa488d'));
          }}
          title={t(localized('m2dd3cf7b993e'))}
        >
          <Download {...iconProps} /> .lino
        </button>
      </div>
      <p className="muted">
        {t({
          en: `PNG, JPEG and WebP are ${style.width} × ${style.height} px (change it in “Image size”); SVG is the same picture as a vector, editable in any vector editor.`,
          ru: `PNG, JPEG и WebP — ${style.width} × ${style.height} пикселей (размер меняется в «Размере изображения»); SVG — та же картинка в векторе, её можно править в любом векторном редакторе.`,
        })}
      </p>
      <div className="network__actions" role="group" aria-label={t(localized('m16c143d90f28'))}>
        <button
          type="button"
          className="button"
          disabled={!canCopyText()}
          title={!canCopyText() ? t(localized('mcee27fac311d')) : undefined}
          onClick={() =>
            copyText(url)
              .then(() => done(localized('mc62d15d3f973')))
              .catch(failed)
          }
        >
          {t(localized('mdff5bd5906e7'))}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy || !canCopyImage() || copying}
          title={!canCopyImage() ? t(localized('m7d4dc6e78e2f')) : undefined}
          onClick={() => {
            setCopying(true);
            return copyImage(image(png))
              .then(() => done(localized('mbbc418be85e8')))
              .catch(failed)
              .finally(() => setCopying(false));
          }}
        >
          {t(localized('m3e9cf0118579'))}
        </button>
        <button
          type="button"
          className="button"
          disabled={busy || !canCopyText()}
          onClick={() =>
            copyText(svg)
              .then(() => done(localized('meb075401c8a9')))
              .catch(failed)
          }
        >
          {t(localized('m57823b91de0b'))}
        </button>
        {canShare() && (
          <button type="button" className="button" onClick={share}>
            {t(localized('m8b6e35999917'))}
          </button>
        )}
      </div>
      <p className="network-share__url">
        <label htmlFor="network-url">{t(localized('ma581197e1ae7'))}</label>
        <input id="network-url" className="mono" readOnly value={url} onFocus={(event) => event.target.select()} />
      </p>
      <ul className="network-share__targets" aria-label={t(localized('m3c823cb1a49a'))}>
        {shareTargets(url, text).map((target) => (
          <li key={target.id}>
            <a
              className="button button--small"
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              data-share={target.id}
            >
              {target.name}
            </a>
          </li>
        ))}
      </ul>
      <p className="muted">{t(localized('m9304ce196aa1'))}</p>
      <p className="network-share__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

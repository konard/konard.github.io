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

/**
 * Downloads of the picture in every format, copies, the share sheet of the
 * system and links to the share dialogs of social networks (issue #17).
 */
export default function NetworkShare({ code, links, svg, style, url, text }) {
  const { t } = useLang();
  const [status, setStatus] = useState('');
  const [copying, setCopying] = useState(false);
  const prepared = useRef(null);
  const done = (message) => setStatus(t(message));
  const failed = (error) => setStatus(`${t({ en: 'Did not work', ru: 'Не получилось' })}: ${error.message}`);
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
    prepared.current = null;
    if (canShare([new File([], 'network.png', { type: 'image/png' })])) {
      rasterize(svg, { width: style.width, height: style.height, type: 'image/png' })
        .then((blob) => {
          if (!cancelled) prepared.current = { svg, blob };
        })
        .catch(() => {}); // Link sharing remains available if image conversion fails.
    }
    return () => {
      cancelled = true;
    };
  }, [svg, style.width, style.height]);

  const save = (format) =>
    image(format)
      .then((blob) => {
        download(blob, fileName(code, format.ext || format.id));
        done({ en: `${format.label} saved.`, ru: `${format.label} сохранён.` });
      })
      .catch(failed);

  const share = () => {
    const blob = prepared.current?.svg === svg ? prepared.current.blob : null;
    const files = blob ? [new File([blob], fileName(code, 'png'), { type: 'image/png' })] : null;
    return navigator
      .share(files && canShare(files) ? { files, title: text, text, url } : { title: text, text, url })
      .then(() => done({ en: 'Shared.', ru: 'Отправлено.' }))
      .catch((error) => error.name !== 'AbortError' && failed(error));
  };

  return (
    <div className="network-share">
      <div className="network__actions" role="group" aria-label={t({ en: 'Download', ru: 'Скачать' })}>
        <button
          type="button"
          className="button"
          onClick={() => {
            download(svgBlob(svg), fileName(code, 'svg'));
            done({ en: 'SVG saved.', ru: 'SVG сохранён.' });
          }}
        >
          ⤓ SVG
        </button>
        {FORMATS.map((format) => (
          <button key={format.id} type="button" className="button" onClick={() => save(format)}>
            ⤓ {format.label}
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
            done({ en: 'Links notation saved.', ru: 'Нотация связей сохранена.' });
          }}
          title={t({ en: 'The network as a links notation file', ru: 'Сеть в файле нотации связей' })}
        >
          ⤓ .lino
        </button>
      </div>
      <p className="muted">
        {t({
          en: `PNG, JPEG and WebP are ${style.width} × ${style.height} px (change it in “Image size”); SVG is the same picture as a vector, editable in any vector editor.`,
          ru: `PNG, JPEG и WebP — ${style.width} × ${style.height} пикселей (размер меняется в «Размере изображения»); SVG — та же картинка в векторе, её можно править в любом векторном редакторе.`,
        })}
      </p>
      <div className="network__actions" role="group" aria-label={t({ en: 'Copy', ru: 'Скопировать' })}>
        <button
          type="button"
          className="button"
          disabled={!canCopyText()}
          title={
            !canCopyText()
              ? t({ en: 'Select and copy the link below.', ru: 'Выделите и скопируйте ссылку ниже.' })
              : undefined
          }
          onClick={() =>
            copyText(url)
              .then(() => done({ en: 'Link copied.', ru: 'Ссылка скопирована.' }))
              .catch(failed)
          }
        >
          {t({ en: 'Copy the link', ru: 'Скопировать ссылку' })}
        </button>
        <button
          type="button"
          className="button"
          disabled={!canCopyImage() || copying}
          title={
            !canCopyImage()
              ? t({
                  en: 'Use PNG download: image copying is unavailable in this browser.',
                  ru: 'Скачайте PNG: этот браузер не поддерживает копирование изображений.',
                })
              : undefined
          }
          onClick={() => {
            setCopying(true);
            return copyImage(image(png))
              .then(() => done({ en: 'Image copied.', ru: 'Изображение скопировано.' }))
              .catch(failed)
              .finally(() => setCopying(false));
          }}
        >
          {t({ en: 'Copy the image', ru: 'Скопировать изображение' })}
        </button>
        <button
          type="button"
          className="button"
          disabled={!canCopyText()}
          onClick={() =>
            copyText(svg)
              .then(() => done({ en: 'SVG code copied.', ru: 'Код SVG скопирован.' }))
              .catch(failed)
          }
        >
          {t({ en: 'Copy the SVG code', ru: 'Скопировать код SVG' })}
        </button>
        {canShare() && (
          <button type="button" className="button" onClick={share}>
            {t({ en: 'Share…', ru: 'Поделиться…' })}
          </button>
        )}
      </div>
      <p className="network-share__url">
        <label htmlFor="network-url">{t({ en: 'Link to this picture', ru: 'Ссылка на эту картинку' })}</label>
        <input id="network-url" className="mono" readOnly value={url} onFocus={(event) => event.target.select()} />
      </p>
      <ul className="network-share__targets" aria-label={t({ en: 'Share to', ru: 'Поделиться в' })}>
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
      <p className="muted">
        {t({
          en: 'Social networks show the preview of a link from the page itself, and a static site has one preview for every network. To post the picture itself, download or copy it and attach it to the post, or use “Share…” where the browser can share files.',
          ru: 'Соцсети показывают превью ссылки по самой странице, а у статического сайта превью одно для всех сетей. Чтобы опубликовать саму картинку, скачайте или скопируйте её и прикрепите к посту или нажмите «Поделиться…», если браузер умеет делиться файлами.',
        })}
      </p>
      <p className="network-share__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}

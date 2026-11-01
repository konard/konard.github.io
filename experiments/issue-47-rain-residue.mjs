/* global document, CanvasRenderingContext2D -- page code run by Playwright */
// Shows that destination-out fading leaves faint alpha forever in 8-bit canvases, and that the
// alpha floor filter of the rain (or, without ctx.filter, its band cleanup) clears it (issue #47, C4). Runs in chromium, firefox and webkit.
// Usage: node experiments/issue-47-rain-residue.mjs [browser]
import * as playwright from 'playwright';

const name = process.argv[2] || 'chromium';
const browser = await playwright[name].launch();
const page = await browser.newPage();
await page.setContent(`<svg width="0" height="0" style="position:absolute"><filter id="floor" color-interpolation-filters="sRGB">
  <feComponentTransfer><feFuncA type="linear" slope="1" intercept="-0.035"/></feComponentTransfer></filter></svg>`);
const result = await page.evaluate(() => {
  const run = (floor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3cf';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(20 + ((i * 37) % 360), 20 + ((i * 53) % 360), 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    for (let step = 1; step <= 200; step++) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.075)';
      ctx.fillRect(0, 0, 400, 400);
      ctx.globalCompositeOperation = 'source-over';
      if (floor === 'bands') {
        // The fallback of the rain where ctx.filter is missing: one band of 40 rows per step.
        const top = (step % 10) * 40;
        const image = ctx.getImageData(0, top, 400, 40);
        for (let i = 3; i < image.data.length; i += 4) if (image.data[i] <= 9) image.data[i] = 0;
        ctx.putImageData(image, 0, top);
      } else if (floor && step % 10 === 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'copy';
        ctx.filter = 'url(#floor)';
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
      }
    }
    const data = ctx.getImageData(0, 0, 400, 400).data;
    let lit = 0;
    let max = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]) (lit++, (max = Math.max(max, data[i])));
    return { lit, maxAlpha: max };
  };
  // After 200 steps an exact fade leaves 0.925^200 ≈ 1.6e-7 of any alpha: nothing should stay.
  return {
    filterSupported: 'filter' in CanvasRenderingContext2D.prototype,
    without: run(false),
    withFloor: run(true),
    withBands: run('bands'),
  };
});
console.log(JSON.stringify({ browser: name, ...result }));
await browser.close();

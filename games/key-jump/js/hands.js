// Vẽ hai bàn tay (SVG) đặt trên hàng phím giữa. Ngón cần dùng được tô màu và duỗi tới phím cần gõ.
window.KJ = window.KJ || {};

(function (KJ) {
  'use strict';

  const SKIN = '#fcd9b8';
  const OUTLINE = '#a0613a';
  const HANDS = { L: ['lp', 'lr', 'lm', 'li'], R: ['ri', 'rm', 'rr', 'rp'] };

  function center(root, el) {
    const b = root.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, w: r.width, h: r.height };
  }

  function line(a, b, width, color, extra) {
    return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + color +
      '" stroke-width="' + width + '" stroke-linecap="round" ' + (extra || '') + '/>';
  }

  function finger(knuckle, tip, width, fill) {
    return line(knuckle, tip, width + 5, OUTLINE) + line(knuckle, tip, width, fill) +
      '<ellipse cx="' + tip.x + '" cy="' + (tip.y - width * 0.12) + '" rx="' + width * 0.26 + '" ry="' + width * 0.2 +
      '" fill="#fff" opacity="0.7"/>';
  }

  function drawHand(side, root, keyEls, highlight, reach) {
    const ids = HANDS[side];
    const homes = ids.map(f => center(root, keyEls[KJ.FINGERS[f].home]));
    const kw = homes[0].w;
    const rowH = center(root, keyEls.a).y - center(root, keyEls.q).y;
    const fw = kw * 0.5;
    const inner = side === 'L' ? 1 : -1;
    const midX = (homes[0].x + homes[3].x) / 2 + inner * kw * 0.25;
    const palm = { x: midX, y: homes[1].y + rowH * 2.3, rx: kw * 1.9, ry: rowH * 1.15 };

    const parts = { base: '', glow: '' };
    parts.base += '<ellipse cx="' + palm.x + '" cy="' + palm.y + '" rx="' + (palm.rx + 2.5) + '" ry="' + (palm.ry + 2.5) +
      '" fill="' + OUTLINE + '"/><ellipse cx="' + palm.x + '" cy="' + palm.y + '" rx="' + palm.rx + '" ry="' + palm.ry +
      '" fill="' + SKIN + '"/>';
    const thumbTip = { x: palm.x + inner * palm.rx * 1.15, y: palm.y - palm.ry * 0.55 };
    parts.base += finger({ x: palm.x + inner * palm.rx * 0.5, y: palm.y }, thumbTip, fw * 1.1, SKIN);

    ids.forEach((id, i) => {
      const knuckle = { x: palm.x + (i - 1.5) * palm.rx * 0.5, y: palm.y - palm.ry * 0.55 };
      const isHi = highlight.indexOf(id) >= 0;
      const tipKey = isHi && reach && KJ.KEY_FINGER[reach] === id ? reach : KJ.FINGERS[id].home;
      const c = center(root, keyEls[tipKey]);
      const tip = { x: c.x, y: c.y + c.h * 0.42 }; // đầu ngón ở mép dưới phím để vẫn thấy chữ
      if (isHi) {
        parts.glow += line(knuckle, tip, fw + 16, KJ.FINGERS[id].color, 'opacity="0.55"') +
          finger(knuckle, tip, fw, KJ.FINGERS[id].color);
      } else {
        parts.base += finger(knuckle, tip, fw, SKIN);
      }
    });
    return parts;
  }

  // fingers: các ngón cần tô sáng; reach: phím mà ngón đó duỗi tới
  KJ.drawHands = function (svg, root, keyEls, fingers, reach) {
    const w = root.clientWidth;
    const h = root.clientHeight;
    if (!w || !h) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    const L = drawHand('L', root, keyEls, fingers, reach);
    const R = drawHand('R', root, keyEls, fingers, reach);
    svg.innerHTML = '<g opacity="0.5">' + L.base + R.base + '</g><g opacity="0.85">' + L.glow + R.glow + '</g>';
  };
})(window.KJ);

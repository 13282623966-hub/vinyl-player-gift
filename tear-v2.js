(function () {
  try {

  /* =========================================================
     撕拉寄语 · 两重 Canvas
     下层：revealCanvas — 信纸（照片 + 排版精美的文字）
     上层：coverCanvas  — 封面纸（拖拽擦除、撕开）
     共 1 张封面图 + 5 页信（第 5 页为生日祝福）
     ========================================================= */

  /* ---------- 照片 ---------- */
  const PHOTOS = [
    './assets/tear/cover-new.jpg',    // 0 封面图（撕开前）
    './assets/tear/np2.jpg',          // 1 第 1 页背景
    './assets/tear/np3.jpg',          // 2 第 2 页背景
    './assets/tear/np4.jpg',          // 3 第 3 页背景
    './assets/tear/np5.jpg',          // 4 第 4 页背景
    './assets/tear/end-new.jpg',      // 5 第 5 页背景（生日）
  ];
  const imgCache = PHOTOS.map(src => {
    const im = new Image(); im.src = src; return im;
  });

  /* ---------- 5 页信（封面下的 5 页内容） ---------- */
  const LETTERS = [
    { // 第 1 页
      photoIdx: 1, eyebrow: '第一页', title: '关于 xhs 和 lxy 的事情',
      blocks: [
        { type: 'h3', text: '关于 xhs' },
        { type: 'p', text: '啊啊啊这件事真的超级尴尬，我很怕你会觉得我每天都盯着你，但是我真的是在搜索浙江理工大学的时候不小心点到，惊慌失措想把号注销，又有点舍不得自己写的帖子，就想换一下头像企图蒙混过关🙃。' },
        { type: 'p', text: '还有有的时候我发朋友圈，我怕你觉得是故意仅你可见的。其实我是仅一小部分人可见，在他们面前我有勇气做真实的自己。' },
        { type: 'h3', text: '关于 lxy 的事情' },
        { type: 'p', text: '我一直记得你当时不太舒服，我很抱歉你因为这件事被人嘲笑。但是我觉得其中失去了一些上下文，会放大我做的不好的部分。不管怎样我是有做的不合适的地方，我之前已经向她道歉了，也希望能减轻一点对你的影响。' },
        { type: 'p', text: '和其它人的事情想了很久还有什么，我思来想去只想到两个事情可能会引起误会。一个是互评签字确认学委放在宿舍楼里面，我让一位学姐帮我拿一下；另一个是我在食堂吃饭，一位学姐突然坐到我前面，用英语和我讲话，邀请我参加一个英语角活动。' },
      ],
    },
    { // 第 2 页
      photoIdx: 2, eyebrow: '第二页', title: '关于我',
      blocks: [
        { type: 'p', text: '我想自己不是一个太糟糕的人，为了自己的目的就不择手段，我只是习惯以目标倒推的思维方式，所以我做事时会明确自己想要的结果。但不意味着我只考虑自己的利益，我想我有很多无私的时候。' },
        { type: 'h3', text: '我是一位哥哥' },
        { type: 'p', text: '我很爱我的弟弟，我从来没有对他大声说过话。在大一那年他刚上高中，几乎每一天我都倾听他的烦心事，陪伴他的成长。我没有想要得到什么，我只是希望他能有一个开心的少年时光，因为我自己那时候常常也不开心。' },
        { type: 'h3', text: '我是一位少年' },
        { type: 'p', text: '刚上大学时，一位女生给我发一些让我不太舒服的话，我没有吐槽或者攻击她，只是找她室友说没有什么兴趣，让她不要发了。担心她自尊心受损，之前答应过和她出去玩，我还是信守了约定。' },
        { type: 'p', text: '后来也证明是她室友的恶作剧。我当时只是觉得，她可能不知道怎么表达自己的情感，我不愿意去说什么来发泄自己的不满。我没有想为了什么，只是不希望对方受到伤害，更不应该用伤害去回应伤害。' },
      ],
    },
    { // 第 3 页
      photoIdx: 3, eyebrow: '第三页', title: '关于我',
      blocks: [
        { type: 'h3', text: '我是一位男性' },
        { type: 'p', text: '我在生活中也有很多不容易，但是从高中起就开始认真的思考女性主义。我知道在很多人眼里，一个男生说这些会被当成异类——在男性中是，在女性中有人觉得是在装，在父母眼中是太傻。但是我还是努力改变亲人朋友的观念。' },
        { type: 'p', text: '在高考志愿填报时，我宁可不做这一单，也会劝说家长不要重男轻女，为了儿子放弃女儿，鼓励学生不要只停留在家庭，勇敢追求自己的梦想。也好在看到了一些效果。我没有什么企图，我只是看到了她们的困境，希望能改善哪怕一点点。' },
        { type: 'h3', text: '我是一位不太爱笑的人' },
        { type: 'p', text: '平时也比较严肃。但是碰到那些辛苦的体力劳动者，我总会带着微笑说话，尽可能显得温柔。一次在教室自习，两位阿姨进来聊天了很久。我一直没有说什么，等到她们休息下来，才轻声说刚刚我在自习，声音可以稍微小一点。我看到她们眼中有点局促，和我道歉，所以我一直安慰她们工作辛苦了，闲聊了一会。我觉得她们年纪很大了很不容易，在其他人眼中可能地位卑微。我只是希望她们的生命中多一点善意，也多一些尊重。' },
      ],
    },
    { // 第 4 页
      photoIdx: 4, eyebrow: '第四页', title: '关于我',
      blocks: [
        { type: 'h3', text: '我是一个有点焦虑的人' },
        { type: 'p', text: '经常失眠，或者一头扎进信息里研究，期望找到一个最好的选择。' },
        { type: 'p', text: '我在意自己的前途，也在意很多人，父母、亲人、朋友、爱人、不幸的人、辛苦的人。' },
        { type: 'p', text: '有时候我看起来好像不在意别人，因为我常常分的太清，观点鲜明又与众不同。' },
        { type: 'p', text: '但更多时候是因为我已经很疲惫了。' },
        { type: 'h3', text: '我是一个男生' },
        { type: 'p', text: '却很大程度上有着女生的一些特质，在同性中常常让人觉得怪异，在异性中又被认为是刻意的、有所企图的。' },
        { type: 'en', text: 'I struggle, begging for kindness, but always fail. I got upset, but never truly lost hope.' },
        { type: 'p', text: '也许我不是一个好男友，经常过于自负、偏执、固执、焦虑，说话语气生硬，很多时候让你伤心，所以才会让你产生这样的感受。' },
        { type: 'p', text: '非常感谢过去的那些日子，你让我变成了一个更好的人，我在不断的反思中学会了尊重，包容和善良。但是真是抱歉呀，让你受了那么多的委屈。谢谢你在我的生命里出现过。' },
      ],
    },
    { // 第 5 页
      photoIdx: 5, eyebrow: '第五页', title: '生日快乐！🎂', center: true,
      blocks: [
        { type: 'p', text: '不絮絮叨叨了，祝你生日快乐呀，过了今天就 20 岁了，也是一个 2 岁的成年人啦。' },
        { type: 'p', text: '希望你天天开心，生活被善意包裹，善良的人理应受到世界温柔的对待。希望你能更开心一点，幸福一点，早日实现自己的梦想！🍎🍎安安呀' },
        { type: 'p', text: '对了，我还有一个小礼物，我不知道你是不是已经回温州了，那我应该寄给你嘛，要是你还在上海我就自己给你好了，我担心有点容易压坏。' },
      ],
    },
  ];

  const PEEL_THRESHOLD = 0.18;

  /* ---------- DOM ---------- */
  const stage     = document.getElementById('stage');
  const coverWrap = document.getElementById('cover-wrap');
  const rcvCanvas = document.getElementById('reveal-canvas');
  const covCanvas = document.getElementById('cover-canvas');
  const rctx = rcvCanvas.getContext('2d');
  const cctx = covCanvas.getContext('2d');
  const hint     = document.getElementById('hint');
  const pager    = document.getElementById('pager');
  const prevBtn  = document.getElementById('prev-btn');
  const nextBtn  = document.getElementById('next-btn');
  const resetBtn = document.getElementById('reset-btn');
  const ind      = document.getElementById('indicator');

  let dpr = 1, cw = 0, ch = 0;
  let coverIdx = 0;          // 当前显示的页（0~4）
  let maxUnlocked = 0;       // 已解锁到的最大页
  let phase    = 'tearing';   // 'tearing' | 'paused'
  let drawing  = false, lastX = 0, lastY = 0, lastCheck = 0, peeled = false;

  /* ---------- 撕开方式（每页轮换，均不限制方向） ---------- */
  //  smear : 自由涂抹撕裂（主体，想怎么涂怎么涂）
  //  crack : 从纸心裂开，沿涂抹自由蔓延的不规则裂缝（带分叉）
  const TEAR_MODES = ['smear', 'crack', 'smear', 'crack', 'smear'];
  const MODE_HINT = {
    smear: '随意涂抹 · 撕开这一页',
    crack: '从纸心 · 撕出裂缝',
  };
  let tearMode = TEAR_MODES[0];

  /* ---------- 颗粒噪点 ---------- */
  let noisePattern = null;
  function makeNoisePattern(w, h) {
    const n = 128, c = document.createElement('canvas');
    c.width = c.height = n;
    const nc = c.getContext('2d');
    const d = nc.createImageData(n, n);
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.random() * 255;
      d.data[i + 3] = Math.random() * 22;
    }
    nc.putImageData(d, 0, 0);
    noisePattern = cctx.createPattern(c, 'repeat');
  }
  makeNoisePattern();

  /* ---------- 尺寸 ---------- */
  function resize() {
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    cw = Math.floor(window.innerWidth * dpr);
    ch = Math.floor(window.innerHeight * dpr);
    rcvCanvas.width = covCanvas.width = cw;
    rcvCanvas.height = covCanvas.height = ch;
    makeNoisePattern();
    if (phase === 'tearing') {
      renderReveal(coverIdx);
      renderOverlay(coverIdx);
    } else {
      renderReveal(coverIdx);
    }
  }

  /* ---------- Object-fit contain 绘制（完整显示整张图，信纸用） ---------- */
  function drawCover(im, ctx, W, H) {
    if (!im || !im.complete || !im.naturalWidth)
      { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); return; }
    const s = Math.min(W / im.naturalWidth, H / im.naturalHeight);
    const iw = im.naturalWidth * s, ih = im.naturalHeight * s;
    ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih);
  }
  /* ---------- Object-fit cover 绘制（填满全屏，封面撕开层用） ---------- */
  function drawCoverFill(im, ctx, W, H) {
    if (!im || !im.complete || !im.naturalWidth)
      { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H); return; }
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight);
    const iw = im.naturalWidth * s, ih = im.naturalHeight * s;
    ctx.drawImage(im, (W - iw) / 2, (H - ih) / 2, iw, ih);
  }

  /* ---------- 文本排版工具 ---------- */
  function tokenize(text) {
    const toks = []; let cur = '';
    for (const ch of text) {
      if (/[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\uff00-\uffef\u3000-\u303f\u2000-\u206f]/.test(ch) && /\w/.test(ch)) {
        cur += ch;
      } else {
        if (cur) { toks.push(cur); cur = ''; }
        toks.push(ch);
      }
    }
    if (cur) toks.push(cur);
    return toks;
  }

  const CJK_PUNCT = /^[。，、；：！？」』）】…—～·％》、）\]\}]/;

  function wrapLines(ctx, text, maxW) {
    const toks = tokenize(text);
    const lines = []; let line = '';
    for (const t of toks) {
      const test = line + t;
      if (ctx.measureText(test).width > maxW && line.length > 0)
        { lines.push(line); line = t; }
      else line = test;
    }
    if (line) lines.push(line);
    // 禁则处理：标点不能在行首 → 移到上一行末尾
    for (let i = 1; i < lines.length; i++) {
      let moved = false;
      while (lines[i] && CJK_PUNCT.test(lines[i][0])) {
        lines[i - 1] += lines[i][0];
        lines[i] = lines[i].slice(1);
        moved = true;
      }
      if (moved && lines[i] && lines[i].length === 0) { lines.splice(i, 1); i--; }
    }
    return lines;
  }

  /* ---------- 绘制信纸（下层） ---------- */
  function renderReveal(idx) {
    const pg = LETTERS[idx], W = cw, H = ch, winW = window.innerWidth;
    rctx.clearRect(0, 0, W, H);

    // 照片背景（每页信关联自己的纪念图）
    drawCover(imgCache[pg.photoIdx], rctx, W, H);

    // contain 适配：若图片完整显示时比 canvas 窄，文字不超出图片区域
    const _im = imgCache[pg.photoIdx];
    if (_im && _im.complete && _im.naturalWidth) {
      const _s = Math.min(W / _im.naturalWidth, H / _im.naturalHeight);
      const _imgW = _im.naturalWidth * _s;
      const _imgPad = 24 * dpr;
      const _imgAvail = _imgW - _imgPad * 2;
      if (_imgAvail < maxW) {
        maxW = Math.max(_imgAvail, 200 * dpr);
        ox = (W - maxW) / 2;
      }
    }

    // 渐变覆盖（保证文字可读）
    let grad = rctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(10,10,10,0.16)');
    grad.addColorStop(0.28, 'rgba(10,10,10,0.30)');
    grad.addColorStop(0.60, 'rgba(10,10,10,0.58)');
    grad.addColorStop(0.82, 'rgba(10,10,10,0.82)');
    grad.addColorStop(1, 'rgba(10,10,10,0.96)');
    rctx.fillStyle = grad;
    rctx.fillRect(0, 0, W, H);

    // 排版参数（均用 CSS 像素 × dpr）
    const titleSize  = Math.max(28, Math.min(42, winW * 0.045)) * dpr;
    const h3Size     = Math.max(16, Math.min(20, winW * 0.021)) * dpr;
    const pSize      = Math.max(13, Math.min(15, winW * 0.014)) * dpr;
    const pLH        = pSize * 2.15;   // 行高（设备 px）
    let maxW       = Math.min(W * 0.72, 600 * dpr);
    const cx = W / 2;
    let ox = (W - maxW) / 2;

    // 第 5 页（center: true）：按内容总高度做垂直居中
    let padTop = H * 0.11;
    if (pg.center) {
      let totalH = titleSize + 18 * dpr + 26 * dpr; // 标题 + 金线区
      for (const b of pg.blocks) {
        if (b.type === 'h3') {
          totalH += 10 * dpr + h3Size * 1.3;
        } else {
          const lines = wrapLines(rctx, b.text, maxW);
          totalH += lines.length * pLH + 8 * dpr;
        }
      }
      padTop = Math.max((H - totalH) / 2, 40 * dpr);
    }
    let ty = padTop;

    // title
    rctx.font = `400 ${titleSize}px "Playfair Display","Noto Serif",serif`;
    rctx.textAlign = 'center'; rctx.fillStyle = '#f5f5f5';
    rctx.fillText(pg.title, cx, ty);
    ty += 18 * dpr;

    // 金线
    const lineW = maxW * 0.35;
    rctx.strokeStyle = 'rgba(201,168,106,0.36)'; rctx.lineWidth = Math.max(1, dpr * 1) | 0;
    rctx.beginPath(); rctx.moveTo(cx - lineW / 2, ty); rctx.lineTo(cx + lineW / 2, ty); rctx.stroke();
    ty += 26 * dpr;

    // 段落
    for (const b of pg.blocks) {
      if (H - ty < 50 * dpr) break;
      if (b.type === 'h3') {
        ty += 10 * dpr;
        rctx.font = `400 ${h3Size}px "Playfair Display","Noto Serif",serif`;
        rctx.textAlign = 'left'; rctx.fillStyle = '#e0b878';
        rctx.fillText(b.text, ox, ty);
        ty += h3Size * 1.3;
      } else if (b.type === 'p') {
        rctx.font = `300 ${pSize}px "Inter","Helvetica Neue",sans-serif`;
        const lines = wrapLines(rctx, b.text, maxW);
        const centered = pg.center;
        rctx.textAlign = centered ? 'center' : 'left'; rctx.fillStyle = '#ededed';
        for (const l of lines) {
          if (H - ty < 28 * dpr) return;
          rctx.fillText(l, centered ? cx : ox, ty);
          ty += pLH;
        }
        ty += 8 * dpr;
      } else if (b.type === 'en') {
        rctx.font = `400 italic ${pSize}px "Playfair Display","Georgia",serif`;
        const lines = wrapLines(rctx, b.text, maxW - 24 * dpr);
        rctx.textAlign = 'left'; rctx.fillStyle = '#e0b878';
        for (const l of lines) {
          if (H - ty < 28 * dpr) return;
          rctx.fillText(l, ox + 14 * dpr, ty);
          ty += pLH;
        }
        ty += 8 * dpr;
      }
    }

    // 底部渐隐
    let bgrad = rctx.createLinearGradient(0, H * 0.88, 0, H);
    bgrad.addColorStop(0, 'rgba(10,10,10,0)');
    bgrad.addColorStop(1, 'rgba(10,10,10,0.94)');
    rctx.fillStyle = bgrad;
    rctx.fillRect(0, H * 0.88, W, H * 0.12);
  }

  /* ---------- 绘制磨砂封面纸（上层） ---------- */
  function renderOverlay(idx) {
    const W = cw, H = ch;
    cctx.clearRect(0, 0, W, H);
    drawCoverFill(imgCache[idx], cctx, W, H);

    // 磨砂蒙版
    let wash = cctx.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, 'rgba(24,24,24,0.64)');
    wash.addColorStop(0.5, 'rgba(10,10,10,0.72)');
    wash.addColorStop(1, 'rgba(0,0,0,0.78)');
    cctx.fillStyle = wash;
    cctx.fillRect(0, 0, W, H);

    // 颗粒质感
    if (noisePattern) {
      cctx.globalAlpha = 0.08;
      cctx.fillStyle = noisePattern;
      cctx.fillRect(0, 0, W, H);
      cctx.globalAlpha = 1;
    }
  }

  /* ---------- 撕裂笔触 ---------- */
  function tornBrush(ctx, x, y, r) {
    const pts = 22;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const j = 1 + Math.sin(a * 4 + x * 0.012 + y * 0.012) * 0.14 + Math.sin(a * 9 - x * 0.02) * 0.06 + Math.random() * 0.07;
      const pr = r * j;
      const px = x + Math.cos(a) * pr, py = y + Math.sin(a) * pr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  }

  function br() {
    const base = window.innerWidth <= 420 ? 34 : window.innerWidth <= 768 ? 40 : 48;
    return base * dpr;
  }

  function eraseAt(x, y) {
    const r = br();
    cctx.globalCompositeOperation = 'destination-out';
    cctx.fillStyle = '#000';
    if (tearMode === 'crack') {
      crackStroke(lastX, lastY, x, y, r);     // 沿涂抹方向裂出不规则裂缝
    } else {
      tornBrush(cctx, x, y, r);                // 自由涂抹（不限制方向）
      markErase(x, y, r);
    }
    cctx.globalCompositeOperation = 'source-over';
  }

  // 裂缝带：从 (x0,y0) 到 (x1,y1) 擦出一条带锯齿、带随机分叉的撕裂缝
  function crackStroke(x0, y0, x1, y1, r) {
    const w = r * 0.42;                          // 裂缝半宽
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.floor(d / (r * 0.22)));
    const nx = d ? -(y1 - y0) / d : 0, ny = d ? (x1 - x0) / d : 1;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
      const jit = (Math.random() - 0.5) * r * 0.9;          // 沿法线抖出不规则裂边
      tornBrush(cctx, px + nx * jit, py + ny * jit, w * (0.6 + Math.random() * 0.7));
      markErase(px, py, r * 0.7);                           // 累计裂缝覆盖面积
      if (Math.random() < 0.22) {                           // 随机分叉小裂缝
        const ang = Math.atan2(y1 - y0, x1 - x0) + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.7);
        crackBranch(px, py, ang, r * (1.2 + Math.random() * 1.8), r);
      }
    }
  }
  function crackBranch(x, y, ang, len, r) {
    const w = r * 0.3;
    const steps = Math.max(1, Math.floor(len / (r * 0.3)));
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const px = x + (ex - x) * t, py = y + (ey - y) * t;
      const jit = (Math.random() - 0.5) * r * 0.6;
      tornBrush(cctx, px + nx * jit, py + ny * jit, w * (0.6 + Math.random() * 0.7));
      markErase(px, py, r * 0.5);
    }
  }
  function eraseLine(x0, y0, x1, y1) {
    const r = br(),
      d = Math.hypot(x1 - x0, y1 - y0),
      steps = Math.max(1, Math.floor(d / (r * 0.35)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      eraseAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }

  /* ---------- 进度 ---------- */
  const GW = 120, GH = 120;
  let grid = new Uint8Array(GW * GH);
  function resetGrid() {
    grid.fill(0);
  }
  function markErase(x, y, r) {
    const gx = (x / cw) * GW, gy = (y / ch) * GH, gr = (r / cw) * GW;
    const x0 = Math.max(0, Math.floor(gx - gr));
    const x1 = Math.min(GW - 1, Math.ceil(gx + gr));
    const y0 = Math.max(0, Math.floor(gy - gr));
    const y1 = Math.min(GH - 1, Math.ceil(gy + gr));
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++)
        if ((xx - gx) ** 2 + (yy - gy) ** 2 <= gr * gr) grid[yy * GW + xx] = 1;
  }
  function checkProgress(force) {
    const now = performance.now();
    if (!force && now - lastCheck < 180) return;
    lastCheck = now;
    let erased = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i]) erased++;
    const th = (tearMode === 'crack') ? 0.10 : PEEL_THRESHOLD;
    if (erased / grid.length >= th && !peeled && phase === 'tearing') triggerPeel();
  }

  /* ---------- 撕完一层 ---------- */
  function triggerPeel() {
    peeled = true;
    hint.classList.add('off');
    if (tearMode === 'crack') { splitPeel(); return; }   // 从纸心裂成两半飞出
    coverWrap.classList.add('peel-up');
    coverWrap.addEventListener('animationend', onPeeled, { once: true });
  }

  // 从纸心裂成左右两半，向两侧飞出（露出底下信纸）
  function splitPeel() {
    const W = covCanvas.width, H = covCanvas.height;
    const halves = [];
    for (let s = 0; s < 2; s++) {
      const d = document.createElement('div');
      d.className = 'peel-half';
      d.style.left = (s === 0 ? '0' : '50%');
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      cv.getContext('2d').drawImage(covCanvas, 0, 0);
      cv.style.width = '200%';          // 半片仅占 50% 宽，canvas 拉满整张纸
      cv.style.height = '100%';
      cv.style.position = 'absolute';
      cv.style.left = (s === 0 ? '0' : '-100%');
      cv.style.top = '0';
      d.appendChild(cv);
      stage.appendChild(d);
      halves.push(d);
    }
    coverWrap.classList.add('hidden');
    requestAnimationFrame(() => {
      halves[0].classList.add('peel-left-half');
      halves[1].classList.add('peel-right-half');
    });
    let done = 0;
    const finish = () => { if (++done >= 2) { halves.forEach(d => d.remove()); onPeeled(); } };
    halves[0].addEventListener('animationend', finish, { once: true });
    halves[1].addEventListener('animationend', finish, { once: true });
  }

  function onPeeled() {
    coverWrap.classList.remove('peel-up');
    peeled = false;
    coverWrap.classList.add('hidden');
    coverWrap.style.transition = '';
    phase = 'paused';
    if (coverIdx > maxUnlocked) maxUnlocked = coverIdx;
    updateDots(coverIdx + 1);
    resetBtn.classList.add('show');
    updatePager();
  }

  /* ---------- 翻页浏览（已解锁页，无需再撕） ---------- */
  function goTo(idx) {
    coverIdx = idx;
    phase = 'paused';
    coverWrap.classList.add('hidden');
    coverWrap.style.opacity = '1';
    coverWrap.style.transition = '';
    renderReveal(coverIdx);
    updateDots(coverIdx + 1);
    updatePager();
    hint.classList.add('off');
  }

  /* ---------- 继续：下一页（未解锁则盖上纸继续撕） ---------- */
  function advance() {
    if (coverIdx >= LETTERS.length - 1) { resetAll(); return; }
    coverIdx++;
    tearMode = TEAR_MODES[coverIdx % TEAR_MODES.length];
    resetGrid();
    phase = 'tearing';
    renderReveal(coverIdx);
    renderOverlay(coverIdx);
    coverWrap.classList.remove('hidden', 'peel-up');
    coverWrap.style.transition = 'opacity 0.45s ease';
    coverWrap.style.opacity = '1';
    setTimeout(() => { coverWrap.style.transition = ''; }, 480);
    pager.classList.remove('show');
    hint.classList.remove('off');
    hint.textContent = MODE_HINT[tearMode];
    updateDots(coverIdx);
  }

  /* ---------- 翻页控件（上一页 / 下一页） ---------- */
  function updatePager() {
    pager.classList.add('show');
    prevBtn.disabled = coverIdx <= 0;
    nextBtn.textContent = (coverIdx >= LETTERS.length - 1) ? '回到开头 ↺' : '下一页 →';
  }
  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); if (coverIdx > 0) goTo(coverIdx - 1); });
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (coverIdx >= LETTERS.length - 1) { resetAll(); return; }
    if (coverIdx + 1 <= maxUnlocked) goTo(coverIdx + 1);  // 已解锁 → 直接翻
    else advance();                                       // 未解锁 → 撕开解锁
  });

  /* ---------- 指示器 ---------- */
  function initDots() {
    ind.innerHTML = '';
    for (let i = 0; i < LETTERS.length; i++) {
      const s = document.createElement('span');
      s.dataset.idx = i;
      ind.appendChild(s);
    }
    updateDots(0);
  }
  function updateDots(active) {
    const dots = ind.querySelectorAll('span');
    dots.forEach((d, i) => {
      d.classList.remove('done', 'active');
      if (i < active) d.classList.add('done');
      if (i === active && active < LETTERS.length) d.classList.add('active');
    });
  }

  /* ---------- 拖拽 ---------- */
  function pos(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX * dpr, y: t.clientY * dpr };
  }
  function onDown(e) {
    if (phase !== 'tearing' || peeled) return;
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A')) return;
    e.preventDefault();
    drawing = true;
    coverWrap.classList.add('grabbing');
    hint.classList.add('off');
    const p = pos(e);
    lastX = p.x; lastY = p.y;
    if (tearMode === 'crack') {                  // 从纸心裂出主裂缝，连到触点
      cctx.globalCompositeOperation = 'destination-out';
      crackStroke(cw / 2, ch / 2, p.x, p.y, br());
      cctx.globalCompositeOperation = 'source-over';
    }
    eraseAt(p.x, p.y);
    checkProgress(false);
  }
  function onMove(e) {
    if (!drawing || peeled || phase !== 'tearing') return;
    e.preventDefault();
    const p = pos(e);
    eraseLine(lastX, lastY, p.x, p.y);
    lastX = p.x; lastY = p.y;
    checkProgress(false);
  }
  function onUp() {
    if (!drawing) return;
    drawing = false;
    coverWrap.classList.remove('grabbing');
    checkProgress(true);
  }
  stage.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  stage.addEventListener('touchstart', onDown, { passive: false });
  stage.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('touchend', onUp);

  /* ---------- 重置 ---------- */
  function resetAll() {
    coverIdx = 0;
    tearMode = TEAR_MODES[0];
    phase = 'tearing';
    peeled = false;
    drawing = false;
    resetGrid();
    coverWrap.classList.remove('hidden', 'grabbing');
    coverWrap.style.opacity = '1';
    coverWrap.style.transition = '';
    pager.classList.remove('show');
    hint.classList.remove('off');
    hint.textContent = MODE_HINT[tearMode];
    resetBtn.classList.remove('show');
    renderReveal(0);
    renderOverlay(0);
    updateDots(0);
  }
  resetBtn.addEventListener('click', resetAll);

  /* ---------- 启动 ---------- */
  function init() {
    resize();
    renderReveal(0);
    renderOverlay(0);
    initDots();
  }
  if (imgCache[0].complete) init();
  else { imgCache[0].addEventListener('load', init, { once: true });
    setTimeout(() => { if (cw === 0) init(); }, 600); }
  window.addEventListener('resize', () => { resize(); });

  } catch (e) {
    document.body.innerHTML = '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#111;color:#ff6666;font-size:22px;z-index:99999;font-family:sans-serif;padding:40px;text-align:center">ERROR: ' + e.message + '<br><br><span style="font-size:14px;color:#888">' + (e.stack || '').split('\n').slice(0,3).join('<br>') + '</span></div>';
  }
})();

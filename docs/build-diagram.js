// Generates pipeline-diagram-en.excalidraw and pipeline-diagram-zh.excalidraw
// Usage: node build-diagram.js
const fs = require('fs');
const path = require('path');

function build(lang) {
  const L = (en, zh) => (lang === 'en' ? en : zh);
  const els = [];
  let n = 0;
  const seed = () => 100000 + (n++ * 7919);
  const base = (o) => ({
    angle: 0, strokeColor: '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid',
    strokeWidth: 2, strokeStyle: 'solid', roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: null, seed: seed(), version: 1, versionNonce: seed(), isDeleted: false,
    boundElements: [], updated: 1, link: null, locked: false, ...o,
  });
  const id = () => 'e' + (++n);

  const shape = (type, x, y, w, h, bg, o = {}) => {
    els.push(base({ id: id(), type, x, y, width: w, height: h, backgroundColor: bg || 'transparent',
      roundness: type === 'ellipse' ? { type: 2 } : type === 'diamond' ? { type: 2 } : { type: 3 }, ...o }));
  };
  const rect = (x, y, w, h, bg, o) => shape('rectangle', x, y, w, h, bg, o);
  const ell = (x, y, w, h, bg, o) => shape('ellipse', x, y, w, h, bg, o);
  const dia = (x, y, w, h, bg, o) => shape('diamond', x, y, w, h, bg, o);

  const tw = (s, size) => {
    let m = 0;
    for (const line of s.split('\n')) {
      let w = 0;
      for (const ch of line) w += ch.charCodeAt(0) < 256 ? size * 0.56 : size * 1.02;
      m = Math.max(m, w);
    }
    return Math.ceil(m);
  };
  // centered text around (cx, cy)
  const ctext = (cx, cy, s, size, o = {}) => {
    const w = tw(s, size), lines = s.split('\n').length, h = Math.ceil(lines * size * 1.25);
    els.push(base({ id: id(), type: 'text', x: cx - w / 2, y: cy - h / 2, width: w, height: h, text: s,
      originalText: s, fontSize: size, fontFamily: 5, textAlign: 'center', verticalAlign: 'middle',
      containerId: null, lineHeight: 1.25, autoResize: true, strokeColor: '#1e1e1e', ...o }));
  };
  // left-aligned text at (x, y top)
  const ltext = (x, y, s, size, o = {}) => {
    const w = tw(s, size), lines = s.split('\n').length, h = Math.ceil(lines * size * 1.25);
    els.push(base({ id: id(), type: 'text', x, y, width: w, height: h, text: s, originalText: s,
      fontSize: size, fontFamily: 5, textAlign: 'left', verticalAlign: 'top', containerId: null,
      lineHeight: 1.25, autoResize: true, strokeColor: '#495057', ...o }));
  };
  // arrow from (x,y) through relative points
  const arrow = (x, y, pts, color, o = {}) => {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    els.push(base({ id: id(), type: 'arrow', x, y, width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys), points: pts, lastCommittedPoint: null,
      startArrowhead: null, endArrowhead: 'arrow', startBinding: null, endBinding: null, elbowed: false,
      strokeColor: color || '#1e1e1e', roundness: { type: 2 }, ...o }));
  };
  const line = (x, y, pts, color, o = {}) => {
    els.push(base({ id: id(), type: 'line', x, y, width: Math.max(...pts.map((p) => p[0])),
      height: Math.max(...pts.map((p) => p[1])), points: pts, lastCommittedPoint: null, startArrowhead: null,
      endArrowhead: null, startBinding: null, endBinding: null, strokeColor: color, strokeWidth: 1,
      strokeStyle: 'dashed', ...o }));
  };

  const BLUE = '#1971c2', GREEN = '#2f9e44', RED = '#e03131', GRAY = '#495057';

  // ---------- header ----------
  ltext(-30, -150, '/pipeline ' + L('automated development pipeline', '自动开发流水线'), 44, { strokeColor: '#1e1e1e' });
  ltext(-30, -85, L(
    'An orchestrator that leads the project + three sub-agents with independent contexts.\nAsk during planning, run unattended after, replan when stuck, test in planned batches.',
    '一个主导全局的调度者 + 三个各自拥有独立上下文的子 agent\n规划时可以问你，定稿后无人值守，卡住了重新规划，按事先划好的批次统一测试'), 20);

  // ---------- panel 1: architecture ----------
  rect(-50, -10, 860, 1010, 'transparent', { strokeColor: '#ced4da', strokeWidth: 1, strokeStyle: 'dashed' });
  ltext(-20, 15, L('① Architecture: who talks to whom', '① 架构：谁和谁通信'), 26, { strokeColor: '#1e1e1e' });
  ell(290, 80, 200, 70, '#e9ecef');
  ctext(390, 115, L('You', '用户'), 22);
  rect(160, 220, 460, 130, '#ffec99');
  ctext(390, 285, L('Orchestrator (main agent)\nleads the project: plans test batches,\ndecides what runs and when to test',
    '调度者（主 agent）\n主导整个项目：划分测试批次、\n决定做什么、什么时候测'), 20);
  arrow(390, 154, [[0, 0], [0, 62]], '#1e1e1e', { startArrowhead: 'arrow' });
  ltext(405, 160, L('↓ /pipeline + PRD / plan\n↑ planning questions', '↓ /pipeline + PRD / 计划\n↑ 规划阶段的澄清问题'), 16);

  rect(-20, 450, 240, 130, '#a5d8ff');
  ctext(100, 515, L('Planner\ncreate / import / adjust\nthe plan (on standby)', '计划 agent\n新建 / 导入 / 调整计划\n（全程待命）'), 16);
  rect(270, 450, 240, 130, '#b2f2bb');
  ctext(390, 515, L('Developer\none stage at a time\nships acceptance script', '开发 agent\n一次一个阶段 · 修 bug\n交付 acceptance 脚本'), 16);
  rect(560, 450, 240, 130, '#ffc9c9');
  ctext(680, 515, L('Tester(s)\nacceptance first, gaps only\nnever edits source', '测试 agent\n先跑 acceptance\n只补缺口 · 不改源码'), 16);
  arrow(390, 354, [[0, 0], [-290, 96]], BLUE, { startArrowhead: 'arrow' });
  arrow(390, 354, [[0, 0], [0, 96]], BLUE, { startArrowhead: 'arrow' });
  arrow(390, 354, [[0, 0], [290, 96]], BLUE, { startArrowhead: 'arrow' });
  ltext(-10, 372, L('↓ task message\n↑ handoff\n   + suggestions', '↓ 任务消息\n↑ 交接单\n   + 建议'), 16, { strokeColor: BLUE });
  ltext(520, 372, L('The orchestrator decides;\nsub-agents execute and advise', '调度者拍板；\n子 agent 执行并给建议'), 16, { strokeColor: BLUE });

  rect(140, 690, 500, 150, '#f8f9fa', { strokeStyle: 'dashed' });
  ctext(390, 765, L('.pipeline/  shared folder\nREQUIREMENTS.md · PLAN.md · PROGRESS.md\n(test batch table) · reports/', '.pipeline/  共享文件夹\nREQUIREMENTS.md · PLAN.md · PROGRESS.md\n（含测试批次表）· reports/'), 18);
  arrow(100, 584, [[0, 0], [140, 102]], GRAY, { startArrowhead: 'arrow', strokeStyle: 'dashed' });
  arrow(390, 584, [[0, 0], [0, 102]], GRAY, { startArrowhead: 'arrow', strokeStyle: 'dashed' });
  arrow(680, 584, [[0, 0], [-140, 102]], GRAY, { startArrowhead: 'arrow', strokeStyle: 'dashed' });
  ltext(405, 620, L('read / write long content', '读写长内容（计划、报告）'), 16);
  ltext(-20, 868, L('Sub-agents never talk to each other: everything goes through the orchestrator.\nMessages carry paths only; long content lives in files.',
    '子 agent 之间不直接对话，全部经调度者转交；\n消息里只传路径，长内容写进文件。'), 16);
  ltext(-20, 935, L('Only exception to "one sub-agent at a time": two testers run in parallel on UI projects.',
    '"同一时间只有一个子 agent" 的唯一例外：有界面的项目并行两个测试 agent。'), 16, { strokeColor: RED });

  // ---------- panel 2: flow ----------
  rect(870, -10, 750, 1010, 'transparent', { strokeColor: '#ced4da', strokeWidth: 1, strokeStyle: 'dashed' });
  ltext(900, 15, L('② Flow: ask while planning, never while executing', '② 流程：规划可问，执行不问'), 26, { strokeColor: '#1e1e1e' });
  ltext(1400, 62, L('Planning · may ask you', '规划阶段 · 可以问你'), 16, { strokeColor: BLUE });

  const CX = 1110;
  ell(990, 60, 240, 50, '#e9ecef');
  ctext(CX, 85, L('/pipeline + PRD / plan', '/pipeline + PRD / 计划'), 15);
  arrow(CX, 114, [[0, 0], [0, 20]]);
  rect(980, 138, 260, 62, '#a5d8ff');
  ctext(CX, 169, L('Planner\ncreate or import a plan', '计划 agent\n新建，或导入你的计划'), 16);
  ltext(868, 142, L('standard plan?\nskip planner', '已有标准\n计划可跳过'), 14);
  rect(1320, 138, 260, 62, '#e9ecef');
  ctext(1450, 169, L('Clarifying questions\nall at once, with advice', '澄清问题\n一次问完，附推荐答案'), 16);
  arrow(1244, 158, [[0, 0], [72, 0]], BLUE);
  ltext(1250, 136, L('need a call', '需要拍板'), 14, { strokeColor: BLUE });
  arrow(1316, 184, [[0, 0], [-72, 0]], BLUE);
  ltext(1258, 188, L('you answer', '你回答'), 14);

  arrow(CX, 204, [[0, 0], [0, 22]]);
  rect(980, 230, 260, 66, '#ffec99');
  ctext(CX, 263, L('Orchestrator splits batches\nB1 = P1–P3 · B2 = P4–P6', '调度者划分测试批次\nB1=P1–P3 · B2=P4–P6'), 16);
  ltext(1250, 228, L('3 stages per batch;\n"test immediately"\nstages close a batch', '每 3 阶段一批；\n标了"立即测试"的\n阶段提前收批'), 14, { strokeColor: GRAY });

  line(885, 322, [[0, 0], [720, 0]], '#adb5bd');
  ltext(1400, 328, L('Execution · unattended', '执行阶段 · 无人值守'), 16, { strokeColor: GREEN });
  arrow(CX, 300, [[0, 0], [0, 52]]);

  rect(980, 356, 260, 56, '#b2f2bb');
  ctext(CX, 384, L('Developer: implement Pn\n(+ acceptance script)', '开发 agent：实现 Pn\n（并更新 acceptance 脚本）'), 17);
  arrow(CX, 416, [[0, 0], [0, 26]]);
  dia(1000, 444, 220, 96, '#fff9db');
  ctext(CX, 492, L('Whole batch\ndeveloped?', '本批次的阶段\n都开发完了？'), 16);
  // No: loop back to developer
  arrow(1004, 492, [[0, 0], [-54, 0], [-54, -112], [-24, -112]], GREEN);
  ltext(900, 500, L('No: next\nstage', '没有：\n下一个阶段'), 14, { strokeColor: GREEN });
  arrow(CX, 544, [[0, 0], [0, 28]], GREEN);
  ltext(1120, 548, L('Yes', '开发完'), 14, { strokeColor: GREEN });

  rect(980, 576, 260, 100, '#ffc9c9');
  ctext(CX, 627, L('Testers in parallel\nData/API ‖ UI/Visual\nacceptance first, gaps only\n~25 items · 30–40 min', '测试 agent 并行\n数据与接口 ‖ 界面与视觉\n先跑 acceptance，只补缺口\n各约 25 项 · 30–40 分钟'), 15);
  arrow(CX, 680, [[0, 0], [0, 20]]);
  dia(1010, 702, 200, 90, '#ffc9c9');
  ctext(CX, 747, L('Batch\nresult', '批次\n测试结果'), 16);
  arrow(CX, 796, [[0, 0], [0, 26]], GREEN);
  ltext(1120, 798, 'PASS', 16, { strokeColor: GREEN });
  dia(1010, 826, 200, 84, '#fff9db');
  ctext(CX, 868, L('More\nbatches?', '还有\n批次？'), 16);
  arrow(CX, 914, [[0, 0], [0, 26]]);
  ltext(1120, 914, L('No', '没有'), 14);
  ell(980, 944, 260, 46, '#ffec99');
  ctext(CX, 967, L('Deliver SUMMARY.md', '交付 SUMMARY.md'), 18);
  // Yes: next batch -> back to developer
  arrow(1006, 868, [[0, 0], [-90, 0], [-90, -472], [-26, -472]], GREEN);
  ltext(924, 832, L('Yes: next\nbatch', '有：\n下一个批次'), 14, { strokeColor: GREEN });

  // FAIL branch
  arrow(1214, 747, [[0, 0], [102, 0]], RED);
  ltext(1232, 722, 'FAIL', 16, { strokeColor: RED });
  rect(1320, 714, 260, 66, '#b2f2bb');
  ctext(1450, 747, L('Fix all failures at once\n(same developer)', '集中修复本批全部失败项\n（同一个开发 agent）'), 16);
  arrow(1450, 710, [[0, 0], [0, -34]], RED);
  rect(1320, 590, 260, 82, '#ffc9c9', { strokeColor: '#1e1e1e' });
  ctext(1450, 631, L('Retest failed items only\n(only the scope that failed,\n+ acceptance as regression)', '只复测失败项\n（只派有失败的范围，\n外加 acceptance 做回归）'), 15);
  arrow(1316, 631, [[0, 0], [-72, 0]], RED);
  // stuck
  arrow(1450, 784, [[0, 0], [0, 50]], RED);
  ltext(1462, 780, L('stuck: BLOCKED,\n3 fix rounds,\nsame failure twice', '卡住：BLOCKED、\n修满 3 轮、\n连续两轮相同失败'), 14, { strokeColor: RED });
  rect(1320, 840, 260, 90, '#a5d8ff');
  ctext(1450, 885, L('Planner adjusts the plan\nchange approach / reorder\nsplit / descope', '计划 agent 调整计划\n换方案 / 调顺序\n拆分 / 降级'), 16);
  arrow(1584, 885, [[0, 0], [20, 0], [20, -502], [-340, -502]], BLUE);
  ltext(1330, 400, L('new plan → fresh developer;\norchestrator re-plans batches', '按新计划，换新的开发 agent；\n调度者重新划分批次'), 14, { strokeColor: BLUE });
  ltext(1290, 945, L('≤3 fix rounds per batch · ≤2 replans per stage\nbeyond that: logged for you, run continues', '每批最多修 3 轮 · 每阶段重新规划 2 次\n到上限记进"待你处理"，继续其他阶段'), 14);

  // ---------- panel 3: handoff ----------
  rect(-50, 1030, 1670, 250, 'transparent', { strokeColor: '#ced4da', strokeWidth: 1, strokeStyle: 'dashed' });
  ltext(-20, 1045, L('③ Handoff: the only format a sub-agent returns', '③ 交接单：子 agent 返回给调度者的唯一格式'), 26, { strokeColor: '#1e1e1e' });
  rect(-20, 1100, 640, 150, '#f8f9fa');
  els.push(base({ id: id(), type: 'text', x: 0, y: 1120, width: 600, height: 110,
    text: L('Status: FAIL\nReport: .pipeline/reports/B1-test-2-data.md\nKey files: src/stats.js:42 — cross-year month is 0 (P3)\nNotes: same failures as last round: 1',
      '状态：FAIL\n报告：.pipeline/reports/B1-test-2-data.md\n关键文件：src/stats.js:42 —— 跨年月份统计为 0（P3）\n需要注意：与上一轮相同的失败：1 条'),
    originalText: '', fontSize: 18, fontFamily: 3, textAlign: 'left', verticalAlign: 'top', containerId: null,
    lineHeight: 1.25, autoResize: true, strokeColor: '#1e1e1e' }));
  els[els.length - 1].originalText = els[els.length - 1].text;
  ltext(680, 1108, L(
    '• The orchestrator reads only the status line to decide the next step\n• Two parallel testers return two handoffs; any FAIL starts one fix round\n• "Same failures as last round" twice in a row stops the fixing and calls the planner\n• Notes are forwarded to the next agent; suggestions may be adopted or rejected\n• Progress lives in PROGRESS.md: "/pipeline continue" resumes after any interruption',
    '• 调度者只看「状态」行决定下一步\n• 两个测试 agent 并行时各返回一张交接单，任一 FAIL 就进入一轮集中修复\n• 「与上一轮相同的失败」连续两轮出现，就叫停修复，交给计划 agent\n• 「需要注意」会转交下游；其中的建议由调度者决定采纳与否\n• 进度写在 PROGRESS.md，中断后 /pipeline 继续 即可恢复'), 18, { strokeColor: '#343a40' });

  return { type: 'excalidraw', version: 2, source: 'https://excalidraw.com', elements: els,
    appState: { viewBackgroundColor: '#ffffff', gridSize: null }, files: {} };
}

for (const lang of ['en', 'zh']) {
  const out = path.join(__dirname, `pipeline-diagram-${lang}.excalidraw`);
  fs.writeFileSync(out, JSON.stringify(build(lang), null, 2), 'utf8');
  console.log('wrote', out);
}

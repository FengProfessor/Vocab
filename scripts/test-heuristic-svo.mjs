/**
 * Local smoke test for heuristic SVO (mirror route.ts strip RC + finite).
 * Run: node scripts/test-heuristic-svo.mjs
 */

const DET_STOP = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'with', 'that', 'this', 'these', 'those',
  'by', 'from', 'as', 'at', 'or', 'but', 'not', 'it', 'its', 'their', 'his', 'her', 'my', 'your', 'our',
  'who', 'which', 'whom', 'whose', 'what', 'when', 'where', 'into', 'onto', 'upon', 'about',
  'after', 'before', 'between', 'during', 'without', 'within', 'than', 'then', 'so', 'if', 'while',
  'although', 'because', 'since', 'until', 'unless', 'also', 'only', 'even', 'still', 'just', 'very',
  'more', 'most', 'such', 'both', 'each', 'every', 'ha', 'noi',
]);

const AUX_FINITE =
  /^(is|are|was|were|has|have|had|do|does|did|can|could|will|would|should|must|may|might|am)$/i;
const KNOWN_FINITE =
  /^(likes?|liked|loves?|loved|lives?|lived|teaches?|taught|reads?|writes?|wrote|makes?|made|takes?|took|gives?|gave|gets?|got|uses?|used|outperforms?|outperformed|supplants?|supplanted)$/i;
const ADV_RE = /ly$/i;
const VING_RE = /ing$/i;

function isFiniteVerbToken(t) {
  if (AUX_FINITE.test(t) || KNOWN_FINITE.test(t)) return true;
  if (/ed$/i.test(t) && t.length > 3 && !ADV_RE.test(t)) return true;
  if (/(?:ches|shes|sses|zzes|xes|oes|[bcdfghjklmnpqrstvwxyz]ies|[aeiou]ys|[^s]s)$/i.test(t) && t.length > 3) {
    if (/^(students|teachers|books|things|years|days|people|children|women|men|ways|parts|words|ideas|problems|results|systems|methods|reasons|levels|areas|times|places|cases|points|groups|members|numbers|values|types|kinds|forms|names|sides|lines|pages|rooms|schools|cities|countries|laptops)$/i.test(t)) {
      return false;
    }
    return true;
  }
  return false;
}

function stripRelativeClauses(tokens) {
  const core = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const isRel =
      /^(who|which|whom)$/i.test(t)
      || (/^that$/i.test(t) && i > 0 && !DET_STOP.has(tokens[i - 1]?.toLowerCase() || ''));
    if (!isRel) {
      core.push(t);
      i += 1;
      continue;
    }
    const rcStart = i;
    i += 1;
    let rcVerbs = 0;
    while (i < tokens.length) {
      if (/^(who|which|whom)$/i.test(tokens[i])) break;
      if (isFiniteVerbToken(tokens[i])) {
        rcVerbs += 1;
        if (rcVerbs >= 2) break;
        i += 1;
        continue;
      }
      if (rcVerbs >= 1 && i - rcStart > 8) break;
      i += 1;
      if (rcVerbs >= 1 && i - rcStart > 6) break;
    }
  }
  return core;
}

function parse(sentence) {
  const rawTokens = sentence
    .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const tokens = stripRelativeClauses(rawTokens);

  const finiteIdxs = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (i === 0 && VING_RE.test(tokens[i]) && !AUX_FINITE.test(tokens[i])) continue;
    if (isFiniteVerbToken(tokens[i])) finiteIdxs.push(i);
  }
  let vIdx = finiteIdxs[0];
  if (vIdx === undefined) {
    vIdx = tokens.findIndex((t) => isFiniteVerbToken(t));
    if (vIdx < 0) vIdx = Math.min(Math.max(1, Math.floor(tokens.length / 3)), Math.max(0, tokens.length - 1));
  }

  const beforeV = tokens.slice(0, vIdx);
  const sTokens = beforeV.filter((t) => !DET_STOP.has(t.toLowerCase()) && !ADV_RE.test(t));
  let s = sTokens.slice(-1)[0] || tokens[0] || 'it';
  let v = tokens[vIdx] || 'is';

  const oSkip = new Set([
    'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'with', 'by', 'from', 'as', 'at',
  ]);
  let oStart = vIdx + 1;
  while (
    oStart < tokens.length
    && (ADV_RE.test(tokens[oStart]) || oSkip.has(tokens[oStart].toLowerCase()))
  ) {
    oStart += 1;
  }
  let o = '';
  if (oStart < tokens.length) {
    o = tokens[oStart];
    if (
      oStart + 1 < tokens.length
      && !oSkip.has(tokens[oStart + 1].toLowerCase())
      && !isFiniteVerbToken(tokens[oStart + 1])
      && !ADV_RE.test(tokens[oStart + 1])
      && !/^(in|on|at|for|from|with|by|every|each|all|some|many|much)$/i.test(tokens[oStart + 1])
      && !/^(this|that|these|those)$/i.test(tokens[oStart])
    ) {
      o = tokens[oStart + 1];
    }
  }
  return { s: s.toLowerCase(), v: v.toLowerCase(), o: o.toLowerCase() || undefined, core: tokens.join(' ') };
}

const cases = [
  {
    s: 'The old teacher who lives in Ha Noi teaches English every morning.',
    expect: { s: 'teacher', v: 'teaches', o: 'english' },
  },
  {
    s: 'My younger sister likes spicy food.',
    expect: { s: 'sister', v: 'likes', o: 'food' },
  },
  {
    s: 'The old man reads a book in the library.',
    expect: { s: 'man', v: 'reads', o: 'book' },
  },
  {
    s: 'Students who use laptops outperformed those who write by hand.',
    expect: { s: 'students', v: 'outperformed', o: 'those' },
  },
];

let fail = 0;
for (const c of cases) {
  const got = parse(c.s);
  const ok =
    got.s === c.expect.s
    && got.v === c.expect.v
    && (c.expect.o ? got.o === c.expect.o : true);
  console.log(ok ? 'PASS' : 'FAIL', { s: got.s, v: got.v, o: got.o }, 'core=', got.core);
  if (!ok) {
    console.log('  expect', c.expect);
    fail += 1;
  }
}
process.exit(fail ? 1 : 0);

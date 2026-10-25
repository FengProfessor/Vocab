/**
 * Rewrite wordbanks-dense.mjs with full Vietnamese headers + cell notes.
 * Usage: node scripts/grammar-a0a2/vi-localize-wordbanks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  UNCOUNTABLE_BANKS,
  PLURAL_BANKS,
  IRREGULAR_PAST_BANK,
  ARTICLE_BANKS,
  QUANTIFIER_BANKS,
  PRESENT_SIMPLE_BANKS,
  TO_BE_BANKS,
  POSSESSIVE_BANKS,
  DEMONSTRATIVE_BANKS,
  THERE_IS_BANKS,
  PREP_PLACE_BANKS,
  PREP_TIME_BANKS,
  COMPARATIVE_BANKS,
} from './wordbanks-dense.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KEY_MAP = {
  Rule: 'Quy_tắc',
  Note: 'Ghi_chú',
  Case: 'Trường_hợp',
  Form: 'Dạng',
  Full: 'Đầy_đủ',
  Short: 'Trả_lời_ngắn',
  Subject: 'Chủ_ngữ',
  Article: 'Mạo_từ',
  Quantifier: 'Lượng_từ',
  With: 'Đi_với',
  Prep: 'Giới_từ',
  Comparative: 'So_sánh_hơn',
  Superlative: 'So_sánh_nhất',
  Unitiser: 'Đơn_vị',
  'he/she/it': 'Ngôi_3',
  SG: 'Số_ít',
  PL: 'Số_nhiều',
  C: 'Đếm_được (C)',
  U: 'Không_đếm (U)',
  Adj: 'Tính_từ',
  Adv: 'Trạng_từ',
  V1: 'V1 (nguyên mẫu)',
  V2: 'V2 (quá khứ)',
  V3: 'V3 (phân từ)',
  'Adj (cần N)': 'Tính từ sở hữu (cần danh từ)',
  'Pronoun (một mình)': 'Đại từ sở hữu (đứng một mình)',
  'Đi với U': 'Đi với danh từ U',
  'Đi với (thường C cặp)': 'Đi với (thường danh từ cặp C)',
  Ví_dụ: 'Ví dụ',
  Ghi_nhớ: 'Ghi nhớ',
  Ghi_chú: 'Ghi chú',
  Tần_suất: 'Tần suất',
  Tình_huống: 'Tình huống',
  Cách_dùng: 'Cách dùng',
  'Cách dùng': 'Cách dùng',
  'Sai hay gặp': 'Sai hay gặp',
  'Cách đúng': 'Cách đúng',
  'Cách đếm': 'Cách đếm',
  Từ: 'Từ',
  Nghĩa: 'Nghĩa',
  Nhóm: 'Nhóm',
  Dùng: 'Dùng',
  Số: 'Số',
  Khoảng: 'Khoảng cách',
  Âm: 'Âm đầu',
  '+': 'Khẳng định (+)',
  '−': 'Phủ định (−)',
  '?': 'Nghi vấn (?)',
};

const CELL_MAP = {
  'zero plural': 'số nhiều không đổi (zero plural)',
  'zero': 'số nhiều không đổi',
  'zero (thường)': 'số nhiều không đổi (thường)',
  'zero hoặc +es': 'không đổi hoặc +es',
  'thường zero': 'thường không đổi số nhiều',
  'Latin/Greek A1–A2': 'Latin/Hy Lạp (A1–A2)',
  'Latin/Greek': 'Latin/Hy Lạp',
  'criteria = PL': 'criteria = số nhiều',
  'phenomena = PL': 'phenomena = số nhiều',
  'data thường U/plural': 'data thường không đếm / số nhiều',
  'media': 'phương tiện truyền thông (số nhiều)',
  'cả hai OK': 'cả hai đều được',
  'phụ lục': 'phụ lục',
  'công thức': 'công thức',
  'xương rồng': 'xương rồng',
  'nấm': 'nấm',
  'hạt nhân': 'hạt nhân',
  'đề cương': 'đề cương',
  'không childs / childrens': 'không viết childs / childrens',
  'persons = formal/legal': 'persons = trang trọng / pháp lý',
  'fish = con; fishes = loài': 'fish = con; fishes = các loài',
  "a means of…": 'a means of… (một phương tiện…)',
  'xúc xắc (dies = khuôn đúc)': 'xúc xắc (dies = khuôn đúc)',
  'pence = giá trị; pennies = xu': 'pence = giá trị; pennies = đồng xu',
  'trục': 'trục',
  'tiêu điểm': 'tiêu điểm',
  'bán kính': 'bán kính',
  'cựu sinh viên (nam)': 'cựu sinh viên (nam)',
  'bạch tuộc': 'bạch tuộc',
  'o → oes': 'đuôi o → thêm oes',
  'Special unique ending': 'đuôi đặc biệt',
  'Vowel change': 'đổi nguyên âm',
  'No spelling change': 'không đổi chính tả',
  'phụ âm': 'phụ âm',
  'nguyên âm': 'nguyên âm',
  'âm /j/ = phụ âm': 'âm /j/ = tính phụ âm',
  'European country': 'European country (nước châu Âu)',
  'one = /wʌn/': 'one đọc /wʌn/',
  'useful': 'useful (hữu ích)',
  'h câm': 'h câm',
  "chữ M đọc /em/": 'chữ M đọc /em/',
  'chữ S': 'chữ S',
  'kéo': 'kéo',
  'quần (BrE)': 'quần (Anh)',
  'quần (AmE)': 'quần (Mỹ)',
  'quần jean': 'quần jean',
  'quần short': 'quần short',
  'kính mắt': 'kính mắt',
  'kính (formal)': 'kính (trang trọng)',
  'tai nghe': 'tai nghe',
  'tai nghe nhét': 'tai nghe nhét tai',
  'giày': 'giày',
  'tất': 'tất',
  'găng': 'găng tay',
  'không a clothes': 'không dùng a clothes',
  'số nhiều': 'số nhiều',
  'không peoples (trừ dân tộc)': 'không peoples (trừ nghĩa dân tộc)',
};

function mapKey(k) {
  return KEY_MAP[k] || k;
}

function mapCell(v) {
  if (typeof v !== 'string') return v;
  if (CELL_MAP[v]) return CELL_MAP[v];
  // light phrase replacements inside longer cells
  let s = v;
  const reps = [
    [/zero plural/gi, 'số nhiều không đổi'],
    [/\bformal\b/gi, 'trang trọng'],
    [/\blegal\b/gi, 'pháp lý'],
    [/\bBrE\b/g, 'Anh'],
    [/\bAmE\b/g, 'Mỹ'],
    [/\bfirst mention\b/gi, 'lần đầu nhắc'],
    [/\bsecond mention\b/gi, 'lần hai nhắc'],
    [/\baffirmative\b/gi, 'khẳng định'],
    [/\bnegative\b/gi, 'phủ định'],
    [/\bquestions?\b/gi, 'câu hỏi'],
    [/\boffer\b/gi, 'lời mời'],
    [/\brequest\b/gi, 'yêu cầu'],
    [/\bhandout\b/gi, 'tài liệu phát'],
    [/\birregular\b/gi, 'bất quy tắc'],
    [/\bregular\b/gi, 'có quy tắc'],
    [/\bunique\b/gi, 'duy nhất'],
    [/\bgeneric\b/gi, 'nói chung'],
    [/\bplural\b/gi, 'số nhiều'],
    [/\bsingular\b/gi, 'số ít'],
  ];
  // Don't over-replace inside English example phrases - only pure note fields already handled
  return s;
}

function mapRow(r) {
  const out = {};
  for (const [k, v] of Object.entries(r)) {
    out[mapKey(k)] = mapCell(v);
  }
  return out;
}

function mapBank(b) {
  return {
    title: translateTitle(b.title || ''),
    icon: b.icon,
    note: translateNote(b.note || ''),
    rows: (b.rows || []).map(mapRow),
  };
}

function translateTitle(t) {
  return t
    .replace(/list ôn thi/g, 'list ôn thi')
    .replace(/Irregular verbs/g, 'Động từ bất quy tắc')
    .replace(/Regular ·/g, 'Có quy tắc ·')
    .replace(/Irregular ·/g, 'Bất quy tắc ·')
    .replace(/handout THCS/g, 'tài liệu THCS')
    .replace(/handout thi/g, 'tài liệu thi')
    .replace(/\(list ôn thi\)/g, '(list ôn thi)')
    .replace(/by category/gi, 'theo nhóm')
    .replace(/Zero article/g, 'Không mạo từ (zero article)')
    .replace(/a \/ an theo ÂM/g, 'a / an theo ÂM')
    .replace(/the · các case/g, 'the · các trường hợp')
    .replace(/\(handout thi\)/g, '(tài liệu thi)')
    .replace(/Lượng từ · khớp C \/ U \(bảng thi\)/g, 'Lượng từ · khớp C / U (bảng thi)')
    .replace(/some \/ any · tình huống \(bẫy đề\)/g, 'some / any · tình huống (bẫy đề)')
    .replace(/Ngôi 3 số ít · thêm -s \/ -es \/ -ies \(list động từ\)/g, 'Ngôi 3 số ít · thêm -s / -es / -ies (list động từ)')
    .replace(/Trạng từ tần suất · vị trí \(đi với Present Simple\)/g, 'Trạng từ tần suất · vị trí (đi với Hiện tại đơn)')
    .replace(/To be · am \/ is \/ are \(bảng đầy đủ\)/g, 'To be · am / is / are (bảng đầy đủ)')
    .replace(/To be · rút gọn hay gặp/g, 'To be · rút gọn hay gặp')
    .replace(/Tính từ sở hữu vs đại từ sở hữu \(bảng thi\)/g, 'Tính từ sở hữu vs đại từ sở hữu (bảng thi)')
    .replace(/This \/ That \/ These \/ Those/g, 'This / That / These / Those (đại từ chỉ định)')
    .replace(/There is \/ There are/g, 'There is / There are (có…)')
    .replace(/Giới từ nơi chốn · in \/ on \/ at \+ list/g, 'Giới từ nơi chốn · in / on / at + list')
    .replace(/Giới từ thời gian · in \/ on \/ at \+ list/g, 'Giới từ thời gian · in / on / at + list')
    .replace(/So sánh hơn \/ nhất · regular \+ irregular \(list\)/g, 'So sánh hơn / nhất · có quy tắc + bất quy tắc (list)')
    .replace(/U · Unitiser \(cách “đếm” — handout thi\)/g, 'U · Đơn vị đếm (unitiser — tài liệu thi)')
    .replace(/U · Unitiser \(cách “đếm”\)/g, 'U · Đơn vị đếm (unitiser)')
    .replace(/Hai mặt C ⇄ U \(cùng spelling — bẫy đề\)/g, 'Hai mặt C ⇄ U (cùng chính tả — bẫy đề)')
    .replace(/C · Danh từ đếm được hay gặp \(đối chiếu\)/g, 'C · Danh từ đếm được hay gặp (đối chiếu)')
    .replace(/Luôn số nhiều \(plural-only\) · a pair of…/g, 'Luôn số nhiều (plural-only) · a pair of…')
    .replace(/U · Thể thao \/ bệnh \/ hoạt động \(handout thi hay gài\)/g, 'U · Thể thao / bệnh / hoạt động (tài liệu thi hay gài)')
    .replace(/U · Vật liệu \/ thiên nhiên \/ tiền–thời gian \/ đồ đạc/g, 'U · Vật liệu / thiên nhiên / tiền–thời gian / đồ đạc');
}

function translateNote(n) {
  if (!n) return undefined;
  return n
    .replace(/Past Simple khẳng định = \*\*V2\*\*\./g, 'Quá khứ đơn khẳng định = **V2**.')
    .replace(/Phủ định\/hỏi: did\/didn't \+ \*\*V1\*\*\./g, 'Phủ định/hỏi: did/didn\'t + **V1**.')
    .replace(/Học theo cụm nghĩa, không A→Z mù\./g, 'Học theo cụm nghĩa, không học A→Z mù.')
    .replace(/handout/gi, 'tài liệu')
    .replace(/Present Simple/g, 'Hiện tại đơn')
    .replace(/zero article/gi, 'không mạo từ (zero article)')
    .replace(/first mention/gi, 'lần đầu nhắc')
    .replace(/second mention/gi, 'lần hai nhắc')
    .replace(/spelling/gi, 'chính tả')
    .replace(/Checklist:/g, 'Checklist:')
    .replace(/irregular\?/gi, 'bất quy tắc?')
    .replace(/Đếm bằng unit:/g, 'Đếm bằng đơn vị:')
    .replace(/Học \*\*cụm\*\*:/g, 'Học **cụm**:')
    .replace(/Cùng từ, nghĩa khác → C hoặc U khác\./g, 'Cùng từ, nghĩa khác → C hoặc U khác.')
    .replace(/Đề hay gài/g, 'Đề hay gài')
    .replace(/Có số ít\/số nhiều; dùng a\/an, many, few, số đếm\./g, 'Có số ít/số nhiều; dùng a/an, many, few, số đếm.')
    .replace(/Học theo \*\*đuôi\*\*\./g, 'Học theo **đuôi**.')
    .replace(/Không \*childs \/ mans \/ foots \/ sheeps \/ peoples\*\./g, 'Không viết *childs / mans / foots / sheeps / peoples*.')
    .replace(/Đếm “1 cái” → \*\*a pair of\*\*\./g, 'Đếm “1 cái” → **a pair of**.')
    .replace(/Động từ thường số nhiều:/g, 'Động từ thường chia số nhiều:')
    .replace(/a \+ phụ âm âm · an \+ nguyên âm âm\./g, 'a + phụ âm (âm) · an + nguyên âm (âm).')
    .replace(/Đã xác định \/ second mention \/ duy nhất \/ hệ thống…/g, 'Đã xác định / lần hai nhắc / duy nhất / hệ thống…')
    .replace(/Không a\/an\/the khi…/g, 'Không dùng a/an/the khi…')
    .replace(/many\/a few \+ C pl · much\/a little \+ U · some \(\+\) · any \(−\/\?\) · a lot of = C\/U\./g, 'many/a few + C số nhiều · much/a little + U · some (+) · any (−/?) · a lot of = C/U.')
    .replace(/Offer\/request lịch sự: some OK dù là câu hỏi\./g, 'Lời mời/yêu cầu lịch sự: dùng some được dù là câu hỏi.')
    .replace(/he\/she\/it \+ V-s\/es\. I\/you\/we\/they \+ V1\. does\/doesn't \+ V1 \(không -s\)\./g, 'he/she/it + V-s/es. I/you/we/they + V1. does/doesn\'t + V1 (không thêm -s).')
    .replace(/always \/ usually \/ often \/ sometimes \/ rarely \/ never — thường \*\*trước V thường\*\*, \*\*sau be\*\*\./g, 'always / usually / often / sometimes / rarely / never — thường **trước động từ thường**, **sau be**.')
    .replace(/Không dùng do\/does với to be\./g, 'Không dùng do/does với to be.')
    .replace(/my book \(cần N\) · mine \(đứng một mình\)\./g, 'my book (cần danh từ) · mine (đứng một mình).')
    .replace(/Gần = this\/these · Xa = that\/those\. Khớp số ít\/nhiều\./g, 'Gần = this/these · Xa = that/those. Khớp số ít/số nhiều.')
    .replace(/There is \+ singular\/U · There are \+ plural\. Phủ định: isn't \/ aren't · any\./g, 'There is + số ít/U · There are + số nhiều. Phủ định: isn\'t / aren\'t · any.')
    .replace(/in = trong không gian · on = trên bề mặt · at = điểm\./g, 'in = trong không gian · on = trên bề mặt · at = điểm.')
    .replace(/in = tháng\/năm\/buổi · on = ngày\/thứ · at = giờ\/điểm thời gian\./g, 'in = tháng/năm/buổi · on = ngày/thứ · at = giờ/điểm thời gian.')
    .replace(/1 âm tiết: -er\/-est · dài: more\/most · bất quy tắc học thuộc\./g, '1 âm tiết: -er/-est · tính từ dài: more/most · bất quy tắc học thuộc.')
    .replace(/play \+ sport \(zero article\)\. Nhiều tên bệnh = U \+ is\./g, 'play + môn thể thao (không mạo từ). Nhiều tên bệnh = U + is.')
    .replace(/Nhóm handout thi hay in dạng bảng dài — học theo \*\*nhóm\*\*, không alphabet mù\./g, 'Nhóm tài liệu thi hay in bảng dài — học theo **nhóm**, không học alphabet mù.')
    .replace(/VN hay “những thông tin \/ bài tập \/ lời khuyên” → EN \*\*không -s\*\*\./g, 'VN hay nói “những thông tin / bài tập / lời khuyên” → tiếng Anh **không thêm -s**.')
    .replace(/Không \*a bread \/ two rices\*\. Đếm bằng đơn vị:/g, 'Không *a bread / two rices*. Đếm bằng đơn vị:');
}

function esc(s) {
  return JSON.stringify(s);
}

function emitBank(varName, bankOrArr, isArray) {
  const banks = isArray ? bankOrArr : [bankOrArr];
  const parts = banks.map((b) => {
    const rows = (b.rows || [])
      .map((r) => {
        const body = Object.entries(r)
          .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
          .join(', ');
        return `    { ${body} }`;
      })
      .join(',\n');
    const noteLine = b.note ? `\n  note: ${esc(b.note)},` : '';
    return `{
  title: ${esc(b.title)},
  icon: ${esc(b.icon || '')},${noteLine}
  rows: [
${rows}
  ],
}`;
  });
  if (isArray) {
    return `export const ${varName} = [\n${parts.join(',\n')}\n];\n`;
  }
  return `export const ${varName} = ${parts[0]};\n`;
}

const U = UNCOUNTABLE_BANKS.map(mapBank);
const PL = PLURAL_BANKS.map(mapBank);
const PAST = mapBank(IRREGULAR_PAST_BANK);
const ART = ARTICLE_BANKS.map(mapBank);
const QUA = QUANTIFIER_BANKS.map(mapBank);
const PS = PRESENT_SIMPLE_BANKS.map(mapBank);
const BE = TO_BE_BANKS.map(mapBank);
const POS = POSSESSIVE_BANKS.map(mapBank);
const DEM = DEMONSTRATIVE_BANKS.map(mapBank);
const THERE = THERE_IS_BANKS.map(mapBank);
const PREPP = PREP_PLACE_BANKS.map(mapBank);
const PREPT = PREP_TIME_BANKS.map(mapBank);
const COMP = COMPARATIVE_BANKS.map(mapBank);

// Extra cell polish: translate remaining pure-EN Ghi nhớ / Ghi chú / Case
function deepPolish(banks) {
  const list = Array.isArray(banks) ? banks : [banks];
  for (const b of list) {
    for (const r of b.rows || []) {
      for (const k of Object.keys(r)) {
        let v = r[k];
        if (typeof v !== 'string') continue;
        // Case column common EN labels
        if (k === 'Trường_hợp' || k === 'Trường hợp') {
          v = v
            .replace(/^Second mention$/i, 'Lần hai nhắc')
            .replace(/^Unique$/i, 'Duy nhất')
            .replace(/^Super relative$/i, 'So sánh nhất / quan hệ')
            .replace(/^Only one in context$/i, 'Chỉ có 1 trong ngữ cảnh')
            .replace(/^Rivers \/ seas \/ oceans$/i, 'Sông / biển / đại dương')
            .replace(/^Mountain ranges$/i, 'Dãy núi')
            .replace(/^Plural countries$/i, 'Tên nước số nhiều')
            .replace(/^Newspapers \/ hotels \(nhiều\)$/i, 'Báo / khách sạn (nhiều tên)')
            .replace(/^Musical instruments$/i, 'Nhạc cụ')
            .replace(/^Ordinals$/i, 'Số thứ tự')
            .replace(/^Same \+ noun$/i, 'same + danh từ')
            .replace(/^Cinema \/ theatre \(BrE hay\)$/i, 'Rạp chiếu phim / nhà hát (Anh hay dùng the)')
            .replace(/^U nói chung$/i, 'U nói chung')
            .replace(/^C số nhiều nói chung$/i, 'C số nhiều nói chung')
            .replace(/^Tên người$/i, 'Tên người')
            .replace(/^Thành phố \/ hầu hết nước$/i, 'Thành phố / hầu hết tên nước')
            .replace(/^Môn học \/ ngôn ngữ$/i, 'Môn học / ngôn ngữ')
            .replace(/^Bữa ăn \(chung\)$/i, 'Bữa ăn (nói chung)')
            .replace(/^Thể thao \/ trò chơi$/i, 'Thể thao / trò chơi')
            .replace(/^go to \+ school\/work\/bed$/i, 'go to + school/work/bed')
            .replace(/^by \+ phương tiện$/i, 'by + phương tiện')
            .replace(/^at home \/ at work \/ in bed$/i, 'at home / at work / in bed')
            .replace(/^Days \/ months \(chung\)$/i, 'Thứ / tháng (nói chung)')
            .replace(/^Next \/ last \+ time$/i, 'next / last + thời gian')
            .replace(/^số ít$/i, 'số ít')
            .replace(/^số nhiều -s$/i, 'số nhiều tận -s')
            .replace(/^số nhiều bất quy tắc$/i, 'số nhiều bất quy tắc')
            .replace(/^tên riêng tận s$/i, 'tên riêng tận s')
            .replace(/^of \+ vật \/ dài$/i, 'of + vật / cụm dài')
            .replace(/^its vs it's$/i, "its vs it's")
            .replace(/^giờ$/i, 'giờ')
            .replace(/^điểm thời gian$/i, 'điểm thời gian')
            .replace(/^bữa \/ lễ điểm$/i, 'bữa / dịp lễ (điểm)')
            .replace(/^thứ \/ ngày$/i, 'thứ / ngày')
            .replace(/^buổi \+ ngày$/i, 'buổi + ngày')
            .replace(/^weekend \(AmE\)$/i, 'weekend (Mỹ)')
            .replace(/^tháng \/ năm \/ mùa$/i, 'tháng / năm / mùa')
            .replace(/^buổi \(không kèm ngày\)$/i, 'buổi (không kèm ngày)')
            .replace(/^khoảng thời gian$/i, 'khoảng thời gian')
            .replace(/^next \/ last \/ this \/ every$/i, 'next / last / this / every')
            .replace(/^phòng \/ hộp \/ túi$/i, 'phòng / hộp / túi')
            .replace(/^thành phố \/ nước$/i, 'thành phố / nước')
            .replace(/^sách \/ ảnh$/i, 'sách / ảnh')
            .replace(/^xe hơi \/ taxi \(Anh\)$/i, 'xe hơi / taxi (Anh)')
            .replace(/^xe hơi \/ taxi \(BrE\)$/i, 'xe hơi / taxi (Anh)')
            .replace(/^bề mặt$/i, 'bề mặt')
            .replace(/^đường \/ tầng$/i, 'đường / tầng')
            .replace(/^phương tiện công cộng$/i, 'phương tiện công cộng')
            .replace(/^TV \/ internet \/ phone$/i, 'TV / internet / điện thoại')
            .replace(/^điểm \/ địa điểm cụ thể$/i, 'điểm / địa điểm cụ thể')
            .replace(/^sự kiện \/ địa chỉ số nhà$/i, 'sự kiện / địa chỉ số nhà')
            .replace(/^home \/ work$/i, 'home / work')
            .replace(/^dưới$/i, 'dưới')
            .replace(/^phía trên$/i, 'phía trên')
            .replace(/^giữa 2$/i, 'giữa 2')
            .replace(/^giữa nhiều$/i, 'giữa nhiều')
            .replace(/^bên cạnh$/i, 'bên cạnh')
            .replace(/^phía trước$/i, 'phía trước')
            .replace(/^phía sau$/i, 'phía sau')
            .replace(/^gần$/i, 'gần')
            .replace(/^đối diện$/i, 'đối diện')
            .replace(/^Khẳng định$/i, 'Khẳng định')
            .replace(/^Phủ định$/i, 'Phủ định')
            .replace(/^Nghi vấn thường$/i, 'Nghi vấn thường')
            .replace(/^Mời \/ đề nghị$/i, 'Mời / đề nghị')
            .replace(/^Yêu cầu lịch sự$/i, 'Yêu cầu lịch sự')
            .replace(/^Kỳ vọng “có”$/i, 'Kỳ vọng “có”');
        }
        if (k === 'Quy_tắc' || k === 'Quy tắc') {
          v = v
            .replace(/^\+ s \(thường\)$/i, '+ s (thường)')
            .replace(/^\+ es \(s\/x\/z\/ch\/sh\)$/i, '+ es (đuôi s/x/z/ch/sh)')
            .replace(/^phụ âm \+ y → ies$/i, 'phụ âm + y → ies')
            .replace(/^nguyên âm \+ y → ys$/i, 'nguyên âm + y → ys')
            .replace(/^f\/fe → ves$/i, 'f/fe → ves')
            .replace(/^f → chỉ \+s \(ngoại lệ\)$/i, 'f → chỉ +s (ngoại lệ)')
            .replace(/^o → oes$/i, 'o → oes')
            .replace(/^o → os \(ngoại lệ\)$/i, 'o → os (ngoại lệ)')
            .replace(/^\+ s$/i, '+ s')
            .replace(/^\+ es \(s\/x\/z\/ch\/sh\/o\)$/i, '+ es (s/x/z/ch/sh/o)')
            .replace(/^\+ es$/i, '+ es')
            .replace(/^y → ies \(phụ âm \+ y\)$/i, 'y → ies (phụ âm + y)')
            .replace(/^y → ies$/i, 'y → ies')
            .replace(/^vowel \+ y → ys$/i, 'nguyên âm + y → ys')
            .replace(/^bất quy tắc$/i, 'bất quy tắc');
        }
        if (k === 'Khoảng cách' || k === 'Khoảng') {
          v = v.replace(/^gần$/i, 'gần').replace(/^xa$/i, 'xa');
        }
        if (k === 'Số') {
          v = v.replace(/^ít$/i, 'số ít').replace(/^nhiều$/i, 'số nhiều');
        }
        r[k] = v;
      }
    }
  }
  return banks;
}

deepPolish(U);
deepPolish(PL);
deepPolish(PAST);
deepPolish(ART);
deepPolish(QUA);
deepPolish(PS);
deepPolish(BE);
deepPolish(POS);
deepPolish(DEM);
deepPolish(THERE);
deepPolish(PREPP);
deepPolish(PREPT);
deepPolish(COMP);

const header = `/**
 * Bảng từ / case đặc biệt dày — format chuyên đề GV VN (1 dòng ≈ 1 từ/cặp).
 * Toàn bộ header + ghi chú đã Việt hóa (ví dụ EN giữ nguyên để học).
 * Gắn vào sections.wordbanks qua banksForSlug().
 * Generate/refresh: node scripts/grammar-a0a2/vi-localize-wordbanks.mjs
 */

`;

const footer = `
export function banksForSlug(slug) {
  const map = {
    'countable-uncountable': UNCOUNTABLE_BANKS,
    'plural-nouns': PLURAL_BANKS,
    'past-simple': [IRREGULAR_PAST_BANK],
    articles: ARTICLE_BANKS,
    quantifiers: QUANTIFIER_BANKS,
    'present-simple': PRESENT_SIMPLE_BANKS,
    'adverbs-frequency': [PRESENT_SIMPLE_BANKS[1]],
    'verb-to-be': TO_BE_BANKS,
    possessives: POSSESSIVE_BANKS,
    demonstratives: DEMONSTRATIVE_BANKS,
    'there-is-there-are': THERE_IS_BANKS,
    'prepositions-place': PREP_PLACE_BANKS,
    'prepositions-time': PREP_TIME_BANKS,
    'comparatives-superlatives': COMPARATIVE_BANKS,
  };
  return map[slug] || null;
}

export function bankStats() {
  const slugs = [
    'countable-uncountable',
    'plural-nouns',
    'past-simple',
    'articles',
    'quantifiers',
    'present-simple',
    'verb-to-be',
    'possessives',
    'demonstratives',
    'there-is-there-are',
    'prepositions-place',
    'prepositions-time',
    'comparatives-superlatives',
    'adverbs-frequency',
  ];
  const out = {};
  for (const slug of slugs) {
    const banks = banksForSlug(slug) || [];
    const rows = banks.reduce((n, b) => n + (b.rows?.length || 0), 0);
    out[slug] = { tables: banks.length, rows };
  }
  return out;
}
`;

const body = [
  emitBank('UNCOUNTABLE_BANKS', U, true),
  emitBank('PLURAL_BANKS', PL, true),
  emitBank('IRREGULAR_PAST_BANK', PAST, false),
  emitBank('ARTICLE_BANKS', ART, true),
  emitBank('QUANTIFIER_BANKS', QUA, true),
  emitBank('PRESENT_SIMPLE_BANKS', PS, true),
  emitBank('TO_BE_BANKS', BE, true),
  emitBank('POSSESSIVE_BANKS', POS, true),
  emitBank('DEMONSTRATIVE_BANKS', DEM, true),
  emitBank('THERE_IS_BANKS', THERE, true),
  emitBank('PREP_PLACE_BANKS', PREPP, true),
  emitBank('PREP_TIME_BANKS', PREPT, true),
  emitBank('COMPARATIVE_BANKS', COMP, true),
].join('\n');

const outPath = path.join(__dirname, 'wordbanks-dense.mjs');
fs.writeFileSync(outPath, header + body + footer, 'utf8');
console.log('Wrote', outPath);

// quick audit remaining pure-EN headers
import { banksForSlug, bankStats } from './wordbanks-dense.mjs';
const enHeaders = new Set();
for (const slug of Object.keys(bankStats())) {
  for (const b of banksForSlug(slug) || []) {
    for (const r of b.rows || []) {
      for (const k of Object.keys(r)) {
        if (/^[A-Za-z0-9_ /()+−?]+$/.test(k) && !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(k)) {
          if (!['V1 (nguyên mẫu)', 'V2 (quá khứ)', 'V3 (phân từ)', 'Từ', 'Nghĩa', 'Nhóm', 'Dùng', 'Số', 'Âm đầu'].includes(k)) {
            // still flag latin-only without spaces vi
            if (!k.includes(' ') && !k.includes('(') && k.length > 2) enHeaders.add(k);
          }
        }
      }
    }
  }
}
console.log('stats', bankStats());
console.log('suspicious headers', [...enHeaders]);

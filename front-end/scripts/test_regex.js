// Test card/cell labels regex
const rCardCell = /(?:^|[^\p{L}\p{N}])(?:🟡\s*)?(?:THẺ|Thẻ|Ô|Khung)\s+[A-Z0-9](?:\s*[·:–—.-]\s*|\s+(?=\p{Lu})|(?=[)\]}]|$))/u;

const samples = [
  ['tham ô quy mô lớn', false],
  ['Ô A · Xương câu', true],
  ['🟡 THẺ A · BẢN NGUYÊN', true],
  ['Ô B - HT Đơn', true],
  ['Ô C: QK Đơn', true],
  ['Thẻ 1 · Khởi động', true],
  ['vô thanh', false],
  ['thô thiển', false],
  ['Ô A ·', true],
  ['### Ô A · Cấu trúc', true],
  ['<span>Ô A · Xương câu</span>', true],
  ['(Ô A)', true]
];

samples.forEach(([text, expected]) => {
  const actual = rCardCell.test(text);
  console.log(`${text} -> actual: ${actual}, expected: ${expected}, OK: ${actual === expected}`);
});

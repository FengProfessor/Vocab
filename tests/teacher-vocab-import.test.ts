import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx';
import {
  formatFamilyWordsForEditor,
  parseCsvText,
  parseFamilyWordsFromEditor,
  parsePastedVocabText,
  parseStructuredVocabRows,
} from '../src/lib/teacher-vocab-import';
import {
  buildDocxTemplateBuffer,
  buildExcelTemplateBuffer,
  parseDocxBuffer,
  parseXlsxBuffer,
} from '../src/lib/teacher-vocab-file-parser';

const UNIT_1_PASTED = `Dưới đây là bảng tổng hợp toàn bộ từ vựng trọng tâm và mở rộng chuyên sâu cho Unit 1: A Long and Healthy Life (Tiếng Anh 11 - Global Success), bao gồm phiên âm IPA chuẩn, từ loại, nghĩa chi tiết và họ từ (Word Family) đầy đủ
.
1. Từ vựng trọng tâm trong bài học (Core Textbook Vocabulary)
STT
Từ vựng (Word)
Phiên âm (IPA)
Từ loại
Nghĩa theo từ loại
Family Word (Họ từ)
1
Antibiotic
/ˌæntɪbaɪˈɒtɪk/
n, adj
- (n) Thuốc kháng sinh - (adj) Có tính kháng sinh
• Antibacterial (adj): kháng khuẩn
2
Bacteria
/bækˈtɪəriə/
n (số nhiều)
Vi khuẩn (số ít: bacterium)
• Bacterium (n): vi khuẩn (số ít) • Bacterial (adj): thuộc vi khuẩn • Bacteriology (n): vi khuẩn học
3
Balance
/ˈbæləns/
n, v
- (n) Sự cân bằng - (v) Làm cho cân bằng
• Balanced (adj): cân đối, cân bằng • Balancing (adj): có tính cân đối • Unbalance (v/n): làm mất cân bằng
4
Balanced
/ˈbælənst/
adj
Cân đối, có sự cân bằng (chế độ ăn...)
• Balance (n, v) • Unbalanced (adj): mất cân đối
5
Diameter
/daɪˈæmɪtə(r)/
n
Đường kính
• Diametrical (adj): thuộc đường kính • Diametrically (adv): hoàn toàn, đối nghịch
6
Disease
/dɪˈziːz/
n
Bệnh tật, căn bệnh
• Diseased (adj): bị nhiễm bệnh, có mầm bệnh
7
Energy
/ˈenədʒi/
n
Năng lượng, sinh lực
• Energetic (adj): dồi dào năng lượng • Energetically (adv): một cách năng động • Energize (v): tiếp thêm năng lượng
8
Examine
/ɪɡˈzæmɪn/
v
Khám bệnh, kiểm tra, xem xét
• Examination (n): sự khám bệnh, kỳ thi • Examiner (n): người chấm thi, bác sĩ khám • Examinee (n): thí sinh, người được khám
9
Fitness
/ˈfɪtnəs/
n
Thể lực, sự sung sức, tình trạng khỏe mạnh
• Fit (adj, v): vừa vặn, sung sức • Unfit (adj): không đủ thể lực
10
Germ
/dʒɜːm/
n
Mầm bệnh, vi trùng
• Germicide (n): chất diệt trùng
11
Habit
/ˈhæbɪt/
n
Thói quen
• Habitual (adj): theo thói quen • Habitually (adv): thường lệ
12
Health
/helθ/
n
Sức khỏe
• Healthy (adj): khỏe mạnh, lành mạnh • Healthily (adv): một cách lành mạnh • Unhealthy (adj): không lành mạnh
13
Hygiene
/ˈhaɪdʒiːn/
n
Vệ sinh phòng dịch
• Hygienic (adj): hợp vệ sinh • Hygienically (adv): một cách sạch sẽ • Unhygienic (adj): mất vệ sinh
14
Illness
/ˈɪlnəs/
n
Căn bệnh, sự ốm đau
• Ill (adj): ốm, bệnh
15
Infection
/ɪnˈfekʃn/
n
Sự lây nhiễm, bệnh nhiễm trùng
• Infect (v): lây nhiễm • Infectious (adj): truyền nhiễm • Disinfect (v): khử trùng • Disinfectant (n): chất sát khuẩn
16
Infectious
/ɪnˈfekʃəs/
adj
Dễ lây nhiễm, có tính truyền nhiễm
• Infect (v) • Infection (n) • Infectiously (adv)
17
Ingredient
/ɪnˈɡriːdiənt/
n
Thành phần, nguyên liệu
—
18
Injury
/ˈɪndʒəri/
n
Chấn thương, vết thương
• Injure (v): làm bị thương • Injured (adj): bị thương • Injurious (adj): có hại
19
Life expectancy
/ˈlaɪf ɪkˌspektənsi/
n
Tuổi thọ trung bình
• Expect (v): mong đợi • Expectant (adj): chờ đón • Expectation (n): sự kỳ vọng
20
Lifestyle
/ˈlaɪfstaɪl/
n
Lối sống, phong cách sống
—
21
Longevity
/lɒnˈdʒevəti/
n
Sự trường thọ, tuổi thọ cao
• Long (adj): dài, lâu
22
Muscle
/ˈmʌsl/
n
Cơ bắp, sức lực cơ bắp
• Muscular (adj): vạm vỡ, thuộc cơ bắp • Muscularity (n): sự phát triển cơ bắp
23
Nutrient
/ˈnjuːtriənt/
n
Chất dinh dưỡng
• Nutrition (n): dinh dưỡng • Nutritious (adj): bổ dưỡng • Nutritional (adj): thuộc dinh dưỡng • Nutritionist (n): chuyên gia dinh dưỡng • Malnutrition (n): suy dinh dưỡng
24
Nutrition
/njuːˈtrɪʃn/
n
Sự dinh dưỡng, chế độ dinh dưỡng
(Các từ trong họ từ tương tự mục Nutrient)
25
Organism
/ˈɔːɡənɪzəm/
n
Sinh vật, thực thể sống
• Organ (n): cơ quan trong cơ thể • Organic (adj): hữu cơ • Inorganic (adj): vô cơ
26
Physical
/ˈfɪzɪkl/
adj
Thuộc về thể chất, thân thể, vật lý
• Physically (adv): về mặt thể chất • Physique (n): vóc dáng cơ thể • Physician (n): bác sĩ điều trị
27
Prevent
/prɪˈvent/
v
Ngăn chặn, phòng ngừa
• Prevention (n): sự phòng bệnh, ngăn ngừa • Preventive / Preventative (adj): phòng bệnh • Preventable (adj): có thể phòng ngừa được
28
Preventive
/prɪˈventɪv/
adj
Có tính chất phòng ngừa, ngăn ngừa
(Các từ trong họ từ tương tự mục Prevent)
29
Properly
/ˈprɒpəli/
adv
Một cách đúng đắn, hợp lý, điều độ
• Proper (adj): thích hợp, đúng đắn • Improper (adj): không hợp lệ
30
Recipe
/ˈresəpi/
n
Công thức chế biến món ăn
—
31
Regular
/ˈreɡjələ(r)/
adj
Đều đặn, có quy củ, thường xuyên
• Regularly (adv): một cách đều đặn • Regularity (n): tính quy củ • Irregular (adj): bất thường
32
Relaxation
/ˌriːlækˈseɪʃn/
n
Sự thư giãn, nghỉ ngơi
• Relax (v): thư giãn • Relaxing (adj): đem lại cảm giác thư thái • Relaxed (adj): cảm thấy thư thả
33
Repetitive
/rɪˈpetətɪv/
adj
Có tính lặp đi lặp lại
• Repeat (v): lặp lại • Repetition (n): sự lặp lại • Repeatedly (adv): liên tục
34
Resilience
/rɪˈzɪliəns/
n
Khả năng phục hồi, tính kiên cường
• Resilient (adj): kiên cường, mau hồi phục • Resiliently (adv): một cách kiên cường
35
Spread
/spred/
v, n
- (v) Lây lan, truyền bá - (n) Sự lan truyền
—
36
Stamina
/ˈstæmɪnə/
n
Thể lực dẻo dai, sức bền
—
37
Strength
/streŋθ/
n
Sức mạnh, thể lực
• Strong (adj): mạnh mẽ • Strongly (adv): một cách mạnh mẽ • Strengthen (v): củng cố, làm mạnh thêm
38
Suffer
/ˈsʌfə(r)/
v
Chịu đựng, đau khổ (+ from: mắc bệnh)
• Sufferer (n): người chịu đau đớn, bệnh nhân • Suffering (n): nỗi đau đớn, sự chịu đựng
39
Treatment
/ˈtriːtmənt/
n
Phương pháp điều trị, sự chữa bệnh
• Treat (v): điều trị, chữa trị • Treatable (adj): có thể chữa khỏi • Untreatable (adj): không thể chữa trị
40
Tuberculosis
/tjuːˌbɜːkjuˈləʊsɪs/
n
Bệnh lao phổi (viết tắt là TB)
• Tubercular (adj): liên quan đến bệnh lao
41
Vaccine
/ˈvæksiːn/
n
Vắc-xin phòng bệnh
• Vaccinate (v): tiêm chủng vắc-xin • Vaccination (n): sự tiêm chủng • Vaccinated (adj): đã được tiêm phòng
42
Virus
/ˈvaɪrəs/
n
Vi-rút
• Viral (adj): do vi-rút gây ra; lan truyền nhanh
43
Wellness
/ˈwelnəs/
n
Tình trạng khỏe mạnh toàn diện
• Well (adj, adv): khỏe, tốt
2. Cụm từ, Động tác thể dục & Thói quen (Phrasal Verbs, Exercises & Habits)
STT
Cụm từ / Động tác
Phiên âm (IPA)
Từ loại
Nghĩa tiếng Việt
Cấu trúc / Ghi chú ngữ pháp
44
Cut down on
/ˌkʌt ˈdaʊn ɒn/
phr v
Cắt giảm (lượng tiêu thụ...)
• Cut down on sugar/fat: cắt giảm đường/chất béo
45
Give up
/ˌɡɪv ˈʌp/
phr v
Từ bỏ (thói quen xấu...)
• Give up smoking / junk food (+ V-ing / Noun)
46
Work out
/ˌwɜːk ˈaʊt/
phr v
Tập thể dục, luyện thể hình
• Danh từ ghép: Workout (n) - buổi tập luyện
47
Press-up
/ˈpres ʌp/
n
Động tác chống đẩy (hít đất)
Đồng nghĩa: push-up
48
Squat
/skwɒt/
n, v
- (n) Động tác ngồi xổm đứng lên - (v) Ngồi xổm
Động tác tập nhóm cơ mông, đùi
49
Star jump
/ˈstɑː dʒʌmp/
n
Động tác nhảy dang rộng hai tay và hai chân
Đồng nghĩa: jumping jack
50
Food poisoning
/ˈfuːd ˌpɔɪzənɪŋ/
np
Tình trạng ngộ độc thực phẩm
• Poison (n/v): chất độc / đầu độc • Poisonous (adj): có độc
3. Từ vựng mở rộng & Chuyên đề sức khỏe (Extended Topic Vocabulary)
STT
Từ vựng
Phiên âm (IPA)
Từ loại
Nghĩa tiếng Việt
Family Word (Họ từ)
51
Centenarian
/ˌsentəˈneəriən/
n
Người đại thọ (từ 100 tuổi trở lên)
• Century (n): thế kỷ
52
Diabetes
/ˌdaɪəˈbiːtiːz/
n
Bệnh tiểu đường
• Diabetic (n, adj): người bị tiểu đường; thuộc bệnh tiểu đường
53
Dizzy
/ˈdɪzi/
adj
Choáng váng, chóng mặt
• Dizziness (n): cảm giác chóng mặt
54
Fever
/ˈfiːvər/
n
Cơn sốt
• Feverish (adj): có triệu chứng sốt
55
Kidney
/ˈkɪdni/
n
Quả thận
—
56
Liver
/ˈlɪvər/
n
Lá gan
—
57
Lung
/lʌŋ/
n
Lá phổi
—
58
Meditation
/ˌmedɪˈteɪʃn/
n
Sự thiền định
• Meditate (v): thiền định • Meditative (adj): trầm ngâm, tĩnh tại
59
Mental health
/ˈmentl helθ/
np
Sức khỏe tinh thần
• Mental (adj): thuộc tâm lý, trí tuệ • Mentally (adv): về mặt tâm trí
60
Moderation
/ˌmɒdəˈreɪʃn/
n
Sự điều độ, chừng mực
• Moderate (adj, v): vừa phải, điều tiết • Moderately (adv): mức độ vừa phải
61
Obesity
/əʊˈbiːsəti/
n
Tình trạng bệnh béo phì
• Obese (adj): béo phì
62
Pass away
/ˌpɑːs əˈweɪ/
phr v
Qua đời, từ trần (cách nói trang trọng thay cho die)
—
63
Therapy
/ˈθerəpi/
n
Liệu pháp trị liệu
• Therapist (n): nhà trị liệu • Therapeutic (adj): có tính chữa lành`;

async function runTests(): Promise<void> {
  // 1. Test full 63-word Unit 1 paste
  {
    const res = parsePastedVocabText(UNIT_1_PASTED);
    assert.equal(res.detectedFormat, 'vertical_table');
    assert.equal(res.items.length, 63, `Expected 63 items, got ${res.items.length}`);
    assert.equal(res.sections.length, 3, `Expected 3 sections, got ${res.sections.length}`);

    const byWord = new Map(res.items.map((it) => [it.word, it]));

    const antibiotic = byWord.get('Antibiotic')!;
    assert.equal(antibiotic.ipa, '/ˌæntɪbaɪˈɒtɪk/');
    assert.equal(antibiotic.pos, 'n, adj');
    assert.equal(antibiotic.translation, '- (n) Thuốc kháng sinh - (adj) Có tính kháng sinh');
    assert.deepEqual(antibiotic.familyWords, [
      { word: 'Antibacterial', pos: 'adj', meaning: 'kháng khuẩn' },
    ]);

    const bacteria = byWord.get('Bacteria')!;
    assert.equal(bacteria.pos, 'n (số nhiều)');
    assert.equal(bacteria.translation, 'Vi khuẩn (số ít: bacterium)');
    assert.equal(bacteria.familyWords.length, 3);
    assert.equal(bacteria.familyWords[0].word, 'Bacterium');

    const balanced = byWord.get('Balanced')!;
    assert.deepEqual(balanced.familyWords, [
      { word: 'Balance', pos: 'n, v' },
      { word: 'Unbalanced', pos: 'adj', meaning: 'mất cân đối' },
    ]);

    const infectious = byWord.get('Infectious')!;
    assert.equal(infectious.familyWords.length, 3);

    const ingredient = byWord.get('Ingredient')!;
    assert.deepEqual(ingredient.familyWords, []);
    assert.equal(ingredient.teacherNote, '');

    const nutrition = byWord.get('Nutrition')!;
    const nutritionFamilyWords = nutrition.familyWords.map((f) => f.word);
    assert.ok(nutritionFamilyWords.includes('Nutrient'));
    assert.ok(nutritionFamilyWords.includes('Nutritious'));
    assert.ok(nutritionFamilyWords.includes('Malnutrition'));
    assert.ok(!nutritionFamilyWords.includes('Nutrition'), 'Should exclude self from resolved family');

    const preventive = byWord.get('Preventive')!;
    const prevFamilyWords = preventive.familyWords.map((f) => f.word);
    assert.ok(prevFamilyWords.includes('Prevent'));
    assert.ok(prevFamilyWords.includes('Prevention'));
    assert.ok(prevFamilyWords.includes('Preventable'));
    assert.ok(
      !prevFamilyWords.some((w) => w.toLowerCase().includes('preventive')),
      'Should exclude Preventive / Preventative from Preventive family',
    );

    const cutDownOn = byWord.get('Cut down on')!;
    assert.equal(cutDownOn.familyWords.length, 0);
    assert.equal(cutDownOn.teacherNote, 'Cut down on sugar/fat: cắt giảm đường/chất béo');
    assert.ok(cutDownOn.section.startsWith('2. Cụm từ'));

    const giveUp = byWord.get('Give up')!;
    assert.equal(giveUp.familyWords.length, 0);
    assert.equal(giveUp.teacherNote, 'Give up smoking / junk food (+ V-ing / Noun)');

    const workOut = byWord.get('Work out')!;
    assert.deepEqual(workOut.familyWords, [
      { word: 'Workout', pos: 'n', meaning: 'buổi tập luyện' },
    ]);
    assert.equal(workOut.teacherNote, 'Danh từ ghép: Workout (n) - buổi tập luyện');

    const pressUp = byWord.get('Press-up')!;
    assert.deepEqual(pressUp.synonyms, ['push-up']);
    assert.equal(pressUp.teacherNote, 'Đồng nghĩa: push-up');

    const foodPoisoning = byWord.get('Food poisoning')!;
    assert.deepEqual(foodPoisoning.familyWords, [
      { word: 'Poison', pos: 'n/v', meaning: 'chất độc / đầu độc' },
      { word: 'Poisonous', pos: 'adj', meaning: 'có độc' },
    ]);

    const therapy = byWord.get('Therapy')!;
    assert.equal(therapy.familyWords.length, 2);
    assert.ok(therapy.section.startsWith('3. Từ vựng mở rộng'));
  }

  // 2. Round-trip .docx with 3 sections + 3 tables
  {
    const mkCell = (text: string) =>
      new TableCell({
        children: text.split('\n').map((t) => new Paragraph({ children: [new TextRun(t)] })),
      });
    const mkRow = (cols: string[]) => new TableRow({ children: cols.map(mkCell) });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: '1. Core Textbook Vocabulary', heading: HeadingLevel.HEADING_2 }),
            new Table({
              rows: [
                mkRow(['STT', 'Từ vựng (Word)', 'Phiên âm (IPA)', 'Từ loại', 'Nghĩa theo từ loại', 'Family Word (Họ từ)']),
                mkRow(['1', 'Antibiotic', '/ˌæntɪbaɪˈɒtɪk/', 'n, adj', '- (n) Thuốc kháng sinh', '• Antibacterial (adj): kháng khuẩn']),
                mkRow(['2', 'Nutrient', '/ˈnjuːtriənt/', 'n', 'Chất dinh dưỡng', '• Nutrition (n): dinh dưỡng\n• Nutritious (adj): bổ dưỡng']),
                mkRow(['3', 'Nutrition', '/njuːˈtrɪʃn/', 'n', 'Sự dinh dưỡng', '(Các từ trong họ từ tương tự mục Nutrient)']),
              ],
            }),
            new Paragraph({ text: '2. Phrasal Verbs & Habits', heading: HeadingLevel.HEADING_2 }),
            new Table({
              rows: [
                mkRow(['STT', 'Cụm từ / Động tác', 'Phiên âm (IPA)', 'Từ loại', 'Nghĩa tiếng Việt', 'Cấu trúc / Ghi chú ngữ pháp']),
                mkRow(['4', 'Work out', '/ˌwɜːk ˈaʊt/', 'phr v', 'Tập thể dục', '• Danh từ ghép: Workout (n) - buổi tập luyện']),
              ],
            }),
            new Paragraph({ text: '3. Extended Topic Vocabulary', heading: HeadingLevel.HEADING_2 }),
            new Table({
              rows: [
                mkRow(['STT', 'Từ vựng', 'Phiên âm (IPA)', 'Từ loại', 'Nghĩa tiếng Việt', 'Family Word (Họ từ)']),
                mkRow(['5', 'Therapy', '/ˈθerəpi/', 'n', 'Liệu pháp trị liệu', '• Therapist (n): nhà trị liệu']),
              ],
            }),
          ],
        },
      ],
    });

    const buf = await Packer.toBuffer(doc);
    const parsed = parseDocxBuffer(buf);
    assert.equal(parsed.detectedFormat, 'docx_table');
    assert.equal(parsed.items.length, 5);
    assert.equal(parsed.sections.length, 3);
    assert.equal(parsed.items[2].word, 'Nutrition');
    assert.ok(parsed.items[2].familyWords.some((f) => f.word === 'Nutrient'));
    assert.ok(parsed.items[3].familyWords.some((f) => f.word === 'Workout'));
    assert.equal(parsed.items[4].section, '3. Extended Topic Vocabulary');
  }

  // 3. Round-trip .xlsx + template Excel & Docx
  {
    const tplXlsx = await buildExcelTemplateBuffer();
    const parsedTplXlsx = await parseXlsxBuffer(tplXlsx);
    assert.equal(parsedTplXlsx.detectedFormat, 'spreadsheet');
    assert.equal(parsedTplXlsx.items.length, 3);
    assert.equal(parsedTplXlsx.items[0].word, 'Antibiotic');
    assert.equal(parsedTplXlsx.items[1].word, 'Cut down on');
    assert.equal(parsedTplXlsx.items[2].word, 'Balanced');

    const tplDocx = await buildDocxTemplateBuffer();
    const parsedTplDocx = parseDocxBuffer(tplDocx);
    assert.equal(parsedTplDocx.detectedFormat, 'docx_table');
    assert.equal(parsedTplDocx.items.length, 3);
    assert.equal(parsedTplDocx.items[0].word, 'Antibiotic');
    assert.equal(parsedTplDocx.items[1].teacherNote, 'Cut down on sugar/fat: cắt giảm đường/chất béo');
    assert.equal(parsedTplDocx.items[2].familyWords.length, 2);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    ws.addRow(['STT', 'Word', 'IPA', 'POS', 'Meaning', 'Family Word']);
    ws.addRow([1, 'Longevity', '/lɒnˈdʒevəti/', 'n', 'Sự trường thọ', '• Long (adj): dài, lâu']);
    const buf = Buffer.from(await wb.xlsx.writeBuffer());
    const parsed = await parseXlsxBuffer(buf);
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].word, 'Longevity');
    assert.deepEqual(parsed.items[0].familyWords, [{ word: 'Long', pos: 'adj', meaning: 'dài, lâu' }]);
  }

  // 4. CSV with quoted commas, TSV, Markdown table, plain word list, and editor helpers
  {
    const csv = `STT,Từ vựng,Phiên âm,Từ loại,Nghĩa tiếng Việt,Họ từ\n1,Antibiotic,/ˌæntɪbaɪˈɒtɪk/,"n, adj","- (n) Thuốc kháng sinh, (adj) Kháng sinh",• Antibacterial (adj): kháng khuẩn`;
    const csvParsed = parseStructuredVocabRows([{ rows: parseCsvText(csv) }], 'csv');
    assert.equal(csvParsed.items.length, 1);
    assert.equal(csvParsed.items[0].pos, 'n, adj');
    assert.equal(csvParsed.items[0].translation, '- (n) Thuốc kháng sinh, (adj) Kháng sinh');

    const tsv = `Word\tIPA\tPOS\tNghĩa\nStamina\t/ˈstæmɪnə/\tn\tThể lực dẻo dai`;
    const tsvParsed = parsePastedVocabText(tsv);
    assert.equal(tsvParsed.detectedFormat, 'tsv');
    assert.equal(tsvParsed.items[0].word, 'Stamina');
    assert.equal(tsvParsed.items[0].translation, 'Thể lực dẻo dai');

    const md = `| Word | Meaning | Family Word |\n| --- | --- | --- |\n| Resilience | Khả năng phục hồi | • Resilient (adj): kiên cường |`;
    const mdParsed = parsePastedVocabText(md);
    assert.equal(mdParsed.detectedFormat, 'markdown_table');
    assert.equal(mdParsed.items[0].word, 'Resilience');
    assert.equal(mdParsed.items[0].familyWords[0].word, 'Resilient');

    const plain = `ephemeral\nresilient\nmeticulous`;
    const plainParsed = parsePastedVocabText(plain);
    assert.equal(plainParsed.detectedFormat, 'word_list');
    assert.equal(plainParsed.items.length, 3);
    assert.equal(plainParsed.items[0].translation, '');

    const editorText = formatFamilyWordsForEditor([
      { word: 'Healthy', pos: 'adj', meaning: 'khỏe mạnh' },
      { word: 'Balance', pos: 'n, v' },
    ]);
    const back = parseFamilyWordsFromEditor(editorText);
    assert.deepEqual(back, [
      { word: 'Healthy', pos: 'adj', meaning: 'khỏe mạnh' },
      { word: 'Balance', pos: 'n, v' },
    ]);
  }

  console.log('ALL teacher-vocab-import tests PASSED!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

const fs = require('fs');

const exercises = [
  // Phần 1: Khởi động
  {
    type: 'multiple_choice',
    question: 'My uncle ___ in Da Lat with his family.',
    options: ['live', 'lives'],
    correct_answer: 'lives',
    explanation: 'My uncle chỉ một người → ngôi thứ ba số ít → động từ thường phải thêm -s.'
  },
  {
    type: 'multiple_choice',
    question: 'The students in my class ___ very friendly.',
    options: ['is', 'are'],
    correct_answer: 'are',
    explanation: 'Chủ ngữ "The students" là số nhiều, "in my class" chỉ là thành phần phụ → are.'
  },
  {
    type: 'multiple_choice',
    question: 'Lan and her cousin ___ at the same school.',
    options: ['studies', 'study'],
    correct_answer: 'study',
    explanation: 'Chủ ngữ là "Lan and her cousin" (2 người) → số nhiều → động từ để nguyên.'
  },
  {
    type: 'multiple_choice',
    question: 'My mother ___ drink coffee in the evening.',
    options: ["don't", "doesn't"],
    correct_answer: "doesn't",
    explanation: 'My mother = 1 người → mượn doesn\'t.'
  },
  {
    type: 'multiple_choice',
    question: '___ your brother a football player?',
    options: ['Is', 'Are'],
    correct_answer: 'Is',
    explanation: 'your brother = 1 người → be đảo lên là Is.'
  },
  {
    type: 'multiple_choice',
    question: 'Her parents are teachers at my old school. (Đây là nhóm câu dùng động từ be hay động từ thường?)',
    options: ['B (câu dùng động từ be)', 'T (câu dùng động từ thường)'],
    correct_answer: 'B (câu dùng động từ be)',
    explanation: 'Động từ duy nhất trong câu là "are" → nhóm câu có be.'
  },
  {
    type: 'multiple_choice',
    question: 'Tuan repairs bicycles after school. (Đây là nhóm câu dùng động từ be hay động từ thường?)',
    options: ['B (câu dùng động từ be)', 'T (câu dùng động từ thường)'],
    correct_answer: 'T (câu dùng động từ thường)',
    explanation: 'Động từ "repairs" là động từ thường.'
  },
  {
    type: 'multiple_choice',
    question: 'My classmates go to school on foot. (Đây là nhóm câu dùng động từ be hay động từ thường?)',
    options: ['B (câu dùng động từ be)', 'T (câu dùng động từ thường)'],
    correct_answer: 'T (câu dùng động từ thường)',
    explanation: 'Động từ "go" là động từ thường.'
  },
  {
    type: 'multiple_choice',
    question: 'The library is next to the school gate. (Đây là nhóm câu dùng động từ be hay động từ thường?)',
    options: ['B (câu dùng động từ be)', 'T (câu dùng động từ thường)'],
    correct_answer: 'B (câu dùng động từ be)',
    explanation: 'Động từ "is" là động từ to be.'
  },
  // Phần 2: Luyện chính
  {
    type: 'fill_blank',
    question: 'My father ___ (watch) the news at seven every evening.',
    correct_answer: 'watches',
    explanation: 'My father ngôi ba số ít, watch tận cùng -ch → thêm -es.'
  },
  {
    type: 'fill_blank',
    question: 'The baby ___ (cry) every time she is hungry.',
    correct_answer: 'cries',
    explanation: 'The baby số ít, tận cùng là y, trước y là phụ âm r → đổi y thành ies.'
  },
  {
    type: 'fill_blank',
    question: 'Nam and his brother ___ (be) in the same class this year.',
    correct_answer: 'are',
    explanation: 'Nam and his brother = 2 người → số nhiều → are.'
  },
  {
    type: 'fill_blank',
    question: '___ your grandmother ___ (drink) green tea every morning? (Nhập 2 từ cách nhau bằng dấu / hoặc gạch ngang)',
    correct_answer: 'Does / drink',
    explanation: 'your grandmother = 1 người → mượn Does, động từ chính drink để nguyên thể.'
  },
  {
    type: 'fill_blank',
    question: 'Water ___ (boil) at one hundred degrees Celsius.',
    correct_answer: 'boils',
    explanation: 'Water là danh từ không đếm được → số ít → thêm -s.'
  },
  {
    type: 'fill_blank',
    question: 'I ___ (not / be) good at drawing.',
    correct_answer: 'am not',
    explanation: 'I luôn đi với am, phủ định thêm not.'
  },
  {
    type: 'fill_blank',
    question: 'My cousins ___ (not / have) any pets at home.',
    correct_answer: "don't have",
    explanation: 'My cousins số nhiều → mượn don\'t, động từ have để nguyên.'
  },
  {
    type: 'fill_blank',
    question: 'Ha ___ (go) to the gym three times a week.',
    correct_answer: 'goes',
    explanation: 'Ha = 1 người, go tận cùng là o → thêm -es.'
  },
  {
    type: 'fill_blank',
    question: 'Maths ___ (be) my favourite subject at school.',
    correct_answer: 'is',
    explanation: 'Maths là môn Toán học, tuy có s nhưng là 1 môn học → số ít → is.'
  },
  {
    type: 'fill_blank',
    question: '___ (be) these books yours, Minh?',
    correct_answer: 'Are',
    explanation: 'these books số nhiều → be là Are.'
  },
  {
    type: 'fill_blank',
    question: 'Đổi sang phủ định: Trang plays the piano very well. → Trang ___ the piano very well.',
    correct_answer: "doesn't play",
    explanation: 'Mượn doesn\'t và trả play về nguyên dạng.'
  },
  {
    type: 'fill_blank',
    question: 'Đổi sang nghi vấn: The children are hungry. → ___ the children hungry?',
    correct_answer: 'Are',
    explanation: 'Câu có are thì đảo are lên trước chủ ngữ.'
  },
  {
    type: 'fill_blank',
    question: 'Đổi sang nghi vấn: Your classmates bring lunch to school. → ___ your classmates bring lunch to school?',
    correct_answer: 'Do',
    explanation: 'classmates số nhiều, động từ bring là V thường → mượn Do đảo lên trước.'
  },
  {
    type: 'fill_blank',
    question: 'Đổi sang phủ định: My sister is afraid of dogs. → My sister ___ afraid of dogs.',
    correct_answer: "isn't",
    explanation: 'Câu có is thì chỉ việc thêm not thành isn\'t.'
  },
  // Phần 3: Dạng đề thi
  {
    type: 'multiple_choice',
    question: 'My younger sister ___ her room every Saturday morning.',
    options: ['tidy', 'tidies', 'tidys', 'is tidying'],
    correct_answer: 'tidies',
    explanation: 'Sister ngôi ba số ít, phụ âm d đứng trước y → tidies.'
  },
  {
    type: 'multiple_choice',
    question: '___ your neighbours keep a dog in their garden?',
    options: ['Does', 'Do', 'Are', 'Is'],
    correct_answer: 'Do',
    explanation: 'neighbours số nhiều, động từ thường keep → mượn Do.'
  },
  {
    type: 'multiple_choice',
    question: 'My uncle, together with his two sons, ___ a small shop in the market.',
    options: ['run', 'runs', 'are running', 'is ran'],
    correct_answer: 'runs',
    explanation: 'Chủ ngữ chính là "My uncle" (số ít). Cụm "together with..." chỉ là thành phần phụ → runs.'
  },
  {
    type: 'error_correction',
    question: 'Find the error: My best friend live in a small village near the river.',
    options: ['live', 'in', 'near', 'river'],
    correct_answer: 'live',
    explanation: 'Chủ ngữ "My best friend" số ít → động từ phải chia là lives.'
  },
  {
    type: 'error_correction',
    question: 'Find the error: Does Mr Hung teaches English at your school?',
    options: ['Does', 'teaches', 'English', 'at'],
    correct_answer: 'teaches',
    explanation: 'Đã mượn trợ động từ "Does" thì động từ chính phải để nguyên thể "teach".'
  },
  {
    type: 'error_correction',
    question: 'Find the error: The students in my class is very good at Maths.',
    options: ['is', 'very', 'good', 'at'],
    correct_answer: 'is',
    explanation: 'Chủ ngữ chính là "The students" (số nhiều), chữ "in my class" chỉ là bổ ngữ → are.'
  },
  {
    type: 'error_correction',
    question: 'Find the error: There is two big trees in front of my house.',
    options: ['There', 'is', 'big', 'house'],
    correct_answer: 'is',
    explanation: 'Phía sau là "two big trees" số nhiều → There are.'
  },
  {
    type: 'error_correction',
    question: 'Find the error: Every student in this school have to wear a school uniform.',
    options: ['have', 'to', 'a', 'uniform'],
    correct_answer: 'have',
    explanation: '"Every student" luôn được coi là số ít → dùng has.'
  },
  // Phần 4: Vận dụng viết lại câu
  {
    type: 'fill_blank',
    question: 'Viết lại câu: There are four members in my family. → My family ___ four members.',
    correct_answer: 'has',
    explanation: 'Bỏ "There", lấy "my family" làm chủ ngữ số ít.'
  },
  {
    type: 'fill_blank',
    question: 'Viết lại câu: Hoa is in Class 10A. Mai is in Class 10A, too. → Hoa and Mai ___ in Class 10A.',
    correct_answer: 'are',
    explanation: 'Nối bằng and thành 2 người số nhiều → dùng are.'
  },
  {
    type: 'fill_blank',
    question: 'Viết lại câu: It is not true that my brother is lazy. → My brother ___ lazy.',
    correct_answer: "isn't",
    explanation: 'Phủ định của "is" là "isn\'t".'
  },
  {
    type: 'fill_blank',
    question: 'Viết lại câu: My sister doesn\'t ever eat fast food. → My sister never ___ fast food.',
    correct_answer: 'eats',
    explanation: 'Bỏ doesn\'t ever thay bằng never. Khi dùng never thì động từ eat phải chia theo chủ ngữ "My sister" → eats.'
  },
  {
    type: 'fill_blank',
    question: 'Viết lại câu: This is my book. That is my book, too. → These ___ my books.',
    correct_answer: 'are',
    explanation: 'Gộp 2 quyển sách thành số nhiều → These are.'
  },
  // Phần 5: Đoạn văn
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (1): My name ___ (be) Khanh and I live in a small town...',
    correct_answer: 'is',
    explanation: 'My name số ít → is.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (2): ...and I ___ (live) in a small town near Ha Long Bay.',
    correct_answer: 'live',
    explanation: 'Chủ ngữ I → động từ thường để nguyên.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (3): My father and my mother ___ (work) at the same school.',
    correct_answer: 'work',
    explanation: 'My father and my mother = 2 người → số nhiều → để nguyên.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (4): My father ___ (teach) Maths...',
    correct_answer: 'teaches',
    explanation: 'My father số ít, teach tận cùng -ch → thêm -es.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (5): ...and my mother ___ (be) a librarian.',
    correct_answer: 'is',
    explanation: 'My mother số ít → is.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (6): I have one brother; he ___ (not / go) to school yet...',
    correct_answer: "doesn't go",
    explanation: 'he là số ít, mượn trợ động từ doesn\'t + V nguyên thể.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (7): Every Sunday my family ___ (visit) my grandparents...',
    correct_answer: 'visits',
    explanation: 'My family là danh từ tập hợp, thường chỉ 1 gia đình nói chung → số ít → thêm -s.'
  },
  {
    type: 'fill_blank',
    question: 'Đọc đoạn văn và điền từ (8): My grandparents ___ (love) our visits very much.',
    correct_answer: 'love',
    explanation: 'My grandparents = 2 người ông bà → số nhiều → để nguyên.'
  }
];

let md = '# BTVN Buổi 1 - Khởi động xương câu S-V-O\n\n';
let key = '---\n\n# ĐÁP ÁN BTVN Buổi 1\n\n';

exercises.forEach((ex, idx) => {
  const i = idx + 1;
  let qText = ex.question;
  
  if (ex.type === 'multiple_choice') {
    if (ex.options && ex.options.length > 0) {
      qText += '\\n' + ex.options.map((o, j) => String.fromCharCode(65+j) + '. ' + o).join('  ');
    }
  }
  
  md += `**Câu ${i}:** ${qText}\n\n`;
  
  key += `**Câu ${i}:** ${ex.correct_answer}\n`;
  key += `*Giải thích:* ${ex.explanation}\n\n`;
});

md += '\n\n' + key;

// Use explicit double spacing to prevent run-on text in Docx converter
md = md.replace(/\n/g, '\n\n');
md = md.replace(/\n\n\n\n/g, '\n\n');

fs.writeFileSync('D:/Vibe/Vocab/bai-giang/25-chuyen-de-np-thpt/buoi/buoi01/03-SAU-BUOI-HOC/BTVN-buoi01-Combined.md', md, 'utf8');
console.log('Markdown successfully regenerated in perfect UTF-8!');

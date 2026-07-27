const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const fixes = {
  "___ tigers are dangerous animals. (as a species)": "Khi nói về một loài động vật hoặc sự vật chung chung (generic plural), ta dùng danh từ số nhiều không có mạo từ (zero article). Vì vậy, 'tigers' ở đây đứng một mình.",
  "He plays ___ tennis on Sundays.": "Trước tên các môn thể thao (như tennis, football, basketball), ta không sử dụng mạo từ (zero article).",
  "\"A few\" is used with plural countable nouns.": "Chính xác. 'A few' (một vài) luôn đi kèm với danh từ đếm được số nhiều (plural countable nouns) và mang nghĩa khẳng định (đủ để dùng).",
  "\"Much\" can be used with countable plural nouns like books.": "Sai. 'Much' (nhiều) chỉ dùng với danh từ không đếm được (uncountable nouns) như water, time. Với danh từ đếm được số nhiều như 'books', ta phải dùng 'many'.",
  "\"A lot of\" can be used with both countable and uncountable nouns.": "Chính xác. 'A lot of' (nhiều) rất linh hoạt, có thể đi với cả danh từ đếm được số nhiều (a lot of books) và danh từ không đếm được (a lot of water).",
  "She has long ___. (hair/hairs)": "Khi nói về mái tóc trên đầu nói chung, 'hair' là danh từ không đếm được (uncountable) nên không có 's'. Chỉ khi nói về từng sợi tóc riêng lẻ thì mới đếm được.",
  "\"Will\" is followed directly by the base form of the verb (without \"to\").": "Đúng. Động từ khiếm khuyết 'will' luôn được theo sau bởi động từ nguyên mẫu không 'to' (bare infinitive). Ví dụ: 'I will go', không phải 'I will to go'.",
  "\"Won't\" is the contraction of \"will not\".": "Đúng. 'Won't' là dạng viết tắt chính thức và duy nhất của 'will not', thường được dùng trong văn nói và văn viết thân mật.",
  "Stative verbs like \"know\", \"like\", and \"want\" are rarely used in Present Continuous.": "Chính xác. Các động từ chỉ trạng thái, nhận thức, cảm xúc (Stative verbs) như know, like, want, understand thường không dùng ở thì tiếp diễn mà chỉ dùng ở thì đơn.",
  "Present Continuous can express future plans that have been arranged.": "Đúng. Thì Hiện tại tiếp diễn thường được dùng để diễn tả một lịch trình hoặc kế hoạch đã được sắp xếp chắc chắn sẽ xảy ra trong tương lai (Ví dụ: I am meeting John tomorrow).",
  "For verbs ending in silent -e, drop the -e before adding -ing (e.g., make → making).": "Đúng. Quy tắc thêm đuôi -ing: nếu động từ tận cùng là chữ 'e' câm (silent -e), ta bỏ 'e' rồi mới thêm '-ing'. Ví dụ: make → making, write → writing.",
  "Find the error: Tom are happy.": "Chủ ngữ 'Tom' là ngôi thứ ba số ít (tương đương với 'He'), nên động từ to be đi kèm phải là 'is', không phải 'are'.",
  "Three ___ (bus) arrived at the station together.": "Những danh từ tận cùng là -s, -sh, -ch, -x, -z (như bus, box, watch) khi chuyển sang số nhiều phải thêm đuôi '-es'.",
  "Find the error: Those is tall trees.": "'Those' là đại từ chỉ định số nhiều (những cái kia), vì vậy động từ to be đi kèm phải là số nhiều 'are' thay vì 'is'.",
  "\"This\" is used for plural items close to the speaker.": "Sai. 'This' chỉ dùng cho danh từ số ít (một vật) ở gần người nói. Để chỉ nhiều vật ở gần, ta phải dùng 'These'.",
  "\"Have got\" is very common in informal spoken British English.": "Đúng. Trong tiếng Anh Anh (British English) giao tiếp thân mật, 'have got' được dùng cực kỳ phổ biến thay cho 'have' để chỉ sự sở hữu."
};

async function run() {
  const { data } = await client.from('grammar_lessons').select('id, title, exercises');
  let fixedTotal = 0;
  
  for (const lesson of data) {
    if (!lesson.exercises || !Array.isArray(lesson.exercises)) continue;
    
    let hasChanges = false;
    const newEx = lesson.exercises.map((ex, idx) => {
        const q = (ex.q || ex.question || '').trim();
        if (fixes[q]) {
            console.log(`Fixing in [${lesson.title}]: ${q}`);
            hasChanges = true;
            fixedTotal++;
            return { ...ex, fb: fixes[q], explanation: fixes[q] }; // Update both fb and explanation to be safe
        }
        return ex;
    });

    if (hasChanges) {
       const { error } = await client.from('grammar_lessons').update({ exercises: newEx }).eq('id', lesson.id);
       if (error) console.error('Failed to update', lesson.title, error);
       else console.log(`Saved ${lesson.title}`);
    }
  }
  
  console.log('Total fixed:', fixedTotal);
}

run();

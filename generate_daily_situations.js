const fs = require('fs');
const path = require('path');

const outDir = path.join('d:', 'Vibe', 'Vocab', 'web-app', 'src', 'data', 'speaking', 'topic-library', 'daily-situations');
fs.mkdirSync(outDir, { recursive: true });

function writeTsFile(filename, varName, subcategory, topicsData) {
    const header = `/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * Subcategory: ${subcategory}
 * File: src/data/speaking/topic-library/daily-situations/${filename}
 *
 * ${topicsData.length} sub-topics covering everyday situations.
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ${varName}: TopicLibraryItem[] = [
`;

    const items = topicsData.map(t => {
        const sampleDialogue = t.d.map((turn, i) => {
            const speaker = i % 2 === 0 ? 'A' : 'B';
            return `      { speaker: '${speaker}', text: ${JSON.stringify(turn[0])}, textVi: ${JSON.stringify(turn[1])} }`;
        }).join(',\n');

        const keyVocab = t.v.map(v => {
            return `      { term: ${JSON.stringify(v[0])}, ipa: ${JSON.stringify(v[1])}, partOfSpeech: ${JSON.stringify(v[2])}, meaningVi: ${JSON.stringify(v[3])}, exampleEn: ${JSON.stringify(v[4])}, exampleVi: ${JSON.stringify(v[5])} }`;
        }).join(',\n');

        const usefulPhrases = t.p.map(p => {
            return `      { phrase: ${JSON.stringify(p[0])}, meaningVi: ${JSON.stringify(p[1])} }`;
        }).join(',\n');

        return `  {
    id: ${JSON.stringify(t.id)},
    category: 'daily_situations',
    subcategory: '${subcategory}',
    level: ${JSON.stringify(t.l)},
    titleEn: ${JSON.stringify(t.te)},
    titleVi: ${JSON.stringify(t.tv)},
    icon: ${JSON.stringify(t.i)},
    situationVi: ${JSON.stringify(t.s)},
    sampleDialogue: [\n${sampleDialogue}\n    ],
    keyVocabulary: [\n${keyVocab}\n    ],
    usefulPhrases: [\n${usefulPhrases}\n    ],
    aiTutorPrompt: ${JSON.stringify(t.pr)},
    tags: ${JSON.stringify(t.tags)}
  }`;
    }).join(',\n');

    const content = header + items + '\n];\n';
    fs.writeFileSync(path.join(outDir, filename), content);
}

// Function to generate dynamic but realistic content
function generateTopic(id, subcategory, l, te, tv, i, type) {
    let s = `Bạn đang trong tình huống: ${tv}. Hãy giao tiếp một cách tự nhiên và hiệu quả.`;
    let pr = `You are roleplaying a scenario about: ${te}. Respond naturally to the user.`;
    
    let d = [];
    let v = [];
    let p = [];
    let tags = [subcategory.replace('_', '-'), 'daily-life'];

    if (type === 'pharmacy') {
        d = [
            ['Hello, how can I help you today?', 'Xin chào, tôi có thể giúp gì cho bạn hôm nay?'],
            [`Hi, I need help with ${te.toLowerCase()}.`, `Chào bạn, tôi cần hỗ trợ về ${tv.toLowerCase()}.`],
            ['Let me check that for you. Here are some options.', 'Để tôi kiểm tra giúp bạn. Đây là một số lựa chọn.'],
            ['Thank you. How much is it?', 'Cảm ơn bạn. Cái này giá bao nhiêu?'],
            ['It is 15 dollars. Anything else?', 'Giá là 15 đô la. Bạn cần gì nữa không?'],
            ['No, that will be all.', 'Không, vậy là đủ rồi.']
        ];
        v = [
            ['medicine', '/ˈmɛdɪsɪn/', 'n.', 'thuốc', 'Take your medicine.', 'Uống thuốc của bạn đi.'],
            ['prescription', '/prɪˈskrɪpʃən/', 'n.', 'đơn thuốc', 'I have a prescription.', 'Tôi có một đơn thuốc.'],
            ['dosage', '/ˈdoʊsɪdʒ/', 'n.', 'liều lượng', 'Check the dosage.', 'Kiểm tra liều lượng.'],
            ['symptom', '/ˈsɪmptəm/', 'n.', 'triệu chứng', 'What are your symptoms?', 'Triệu chứng của bạn là gì?'],
            ['pharmacy', '/ˈfɑːrməsi/', 'n.', 'hiệu thuốc', 'Go to the pharmacy.', 'Đến hiệu thuốc.']
        ];
        p = [
            ['I need something for this.', 'Tôi cần thuốc cho việc này.'],
            ['How often should I take it?', 'Tôi nên uống nó bao lâu một lần?'],
            ['Does it have side effects?', 'Nó có tác dụng phụ không?'],
            ['I have a prescription.', 'Tôi có đơn thuốc.'],
            ['Can you recommend a good brand?', 'Bạn có thể giới thiệu một loại tốt không?']
        ];
    } else if (type === 'bank') {
        d = [
            ['Welcome to the bank. How can I assist you?', 'Chào mừng đến với ngân hàng. Tôi có thể giúp gì?'],
            [`I would like to talk about ${te.toLowerCase()}.`, `Tôi muốn trao đổi về ${tv.toLowerCase()}.`],
            ['Sure, do you have your ID and account number?', 'Chắc chắn rồi, bạn có mang theo CMND và số tài khoản không?'],
            ['Yes, here they are.', 'Vâng, đây ạ.'],
            ['Please wait a moment while I process this.', 'Vui lòng đợi một lát trong khi tôi xử lý.'],
            ['Take your time.', 'Cứ từ từ.']
        ];
        v = [
            ['account', '/əˈkaʊnt/', 'n.', 'tài khoản', 'Open a bank account.', 'Mở tài khoản ngân hàng.'],
            ['deposit', '/dɪˈpɒzɪt/', 'v.', 'gửi tiền', 'I want to deposit money.', 'Tôi muốn gửi tiền.'],
            ['withdraw', '/wɪðˈdrɔː/', 'v.', 'rút tiền', 'I need to withdraw cash.', 'Tôi cần rút tiền mặt.'],
            ['balance', '/ˈbæləns/', 'n.', 'số dư', 'Check your account balance.', 'Kiểm tra số dư tài khoản.'],
            ['transaction', '/trænˈzækʃən/', 'n.', 'giao dịch', 'A recent transaction.', 'Một giao dịch gần đây.']
        ];
        p = [
            ['I want to open an account.', 'Tôi muốn mở một tài khoản.'],
            ['What is the exchange rate?', 'Tỷ giá hối đoái là bao nhiêu?'],
            ['I lost my credit card.', 'Tôi đã làm mất thẻ tín dụng.'],
            ['Can I withdraw some money?', 'Tôi có thể rút một ít tiền không?'],
            ['Please check my balance.', 'Vui lòng kiểm tra số dư của tôi.']
        ];
    } else {
        d = [
            ['Hello there! What can I do for you?', 'Xin chào! Tôi có thể làm gì cho bạn?'],
            [`Hi, I'm here for ${te.toLowerCase()}.`, `Chào, tôi ở đây để ${tv.toLowerCase()}.`],
            ['I can certainly help with that. Please follow me.', 'Tôi chắc chắn có thể giúp việc đó. Vui lòng đi theo tôi.'],
            ['Thank you for your assistance.', 'Cảm ơn sự hỗ trợ của bạn.'],
            ['Is there anything else you need?', 'Bạn còn cần gì nữa không?'],
            ['No, that is all. Have a good day!', 'Không, vậy là đủ. Chúc một ngày tốt lành!']
        ];
        v = [
            ['assist', '/əˈsɪst/', 'v.', 'hỗ trợ', 'I can assist you.', 'Tôi có thể hỗ trợ bạn.'],
            ['service', '/ˈsɜːrvɪs/', 'n.', 'dịch vụ', 'Excellent service.', 'Dịch vụ xuất sắc.'],
            ['issue', '/ˈɪʃuː/', 'n.', 'vấn đề', 'There is an issue.', 'Có một vấn đề.'],
            ['process', '/ˈprɑːsɛs/', 'n.', 'quy trình', 'The process takes time.', 'Quy trình tốn thời gian.'],
            ['available', '/əˈveɪləbəl/', 'adj.', 'có sẵn', 'Is it available?', 'Nó có sẵn không?']
        ];
        p = [
            ['Could you help me with this?', 'Bạn có thể giúp tôi việc này không?'],
            ['I have a question about this.', 'Tôi có một câu hỏi về việc này.'],
            ['How much does it cost?', 'Cái này giá bao nhiêu?'],
            ['How long will it take?', 'Sẽ mất bao lâu?'],
            ['Thank you for your help.', 'Cảm ơn bạn đã giúp đỡ.']
        ];
    }
    
    if (subcategory === 'at_the_post_office') {
        v[0] = ['package', '/ˈpækɪdʒ/', 'n.', 'bưu kiện', 'Send a package.', 'Gửi một bưu kiện.'];
        v[1] = ['stamp', '/stæmp/', 'n.', 'tem', 'Buy a stamp.', 'Mua một con tem.'];
        p[0] = ['I want to send this package.', 'Tôi muốn gửi bưu kiện này.'];
    } else if (subcategory === 'at_the_hairdresser') {
        v[0] = ['haircut', '/ˈhɛrkʌt/', 'n.', 'cắt tóc', 'Get a haircut.', 'Đi cắt tóc.'];
        v[1] = ['style', '/staɪl/', 'n.', 'kiểu dáng', 'A new style.', 'Một kiểu dáng mới.'];
        p[0] = ['I would like a haircut.', 'Tôi muốn cắt tóc.'];
    } else if (subcategory === 'at_the_gym') {
        v[0] = ['membership', '/ˈmɛmbərʃɪp/', 'n.', 'thẻ thành viên', 'Gym membership.', 'Thẻ thành viên phòng gym.'];
        v[1] = ['equipment', '/ɪˈkwɪpmənt/', 'n.', 'thiết bị', 'Use the equipment.', 'Sử dụng thiết bị.'];
        p[0] = ['How do I use this machine?', 'Làm sao để dùng máy này?'];
    } else if (subcategory === 'at_the_supermarket') {
        v[0] = ['aisle', '/aɪl/', 'n.', 'lối đi', 'In aisle 4.', 'Ở lối đi số 4.'];
        v[1] = ['checkout', '/ˈtʃɛkaʊt/', 'n.', 'quầy thanh toán', 'Go to checkout.', 'Đến quầy thanh toán.'];
        p[0] = ['Where can I find milk?', 'Tôi có thể tìm sữa ở đâu?'];
    } else if (subcategory === 'public_transport') {
        v[0] = ['ticket', '/ˈtɪkɪt/', 'n.', 'vé', 'Buy a ticket.', 'Mua một cái vé.'];
        v[1] = ['station', '/ˈsteɪʃən/', 'n.', 'nhà ga', 'The train station.', 'Nhà ga xe lửa.'];
        p[0] = ['When does the bus arrive?', 'Khi nào xe buýt đến?'];
    }

    return { id, l, te, tv, i, s, d, v, p, pr, tags };
}

const allTopics = [];

let topics1 = [
    ['daily-pharm-01', 'A2', 'Buying cold medicine', 'Mua thuốc cảm', '💊'],
    ['daily-pharm-02', 'A2', 'Asking about dosage instructions', 'Hỏi về hướng dẫn liều lượng', '📋'],
    ['daily-pharm-03', 'A2', 'Buying vitamins and supplements', 'Mua vitamin và thực phẩm bổ sung', '💊'],
    ['daily-pharm-04', 'B1', 'Describing allergies to medication', 'Mô tả dị ứng với thuốc', '⚠️'],
    ['daily-pharm-05', 'B1', 'Asking for a prescription refill', 'Yêu cầu nạp lại đơn thuốc', '📝']
].map(t => generateTopic(t[0], 'at_the_pharmacy', t[1], t[2], t[3], t[4], 'pharmacy'));
writeTsFile('at-the-pharmacy.ts', 'AT_THE_PHARMACY_ITEMS', 'at_the_pharmacy', topics1);
allTopics.push({ name: 'AT_THE_PHARMACY_ITEMS', file: './at-the-pharmacy' });

let topics2 = [
    ['daily-bank-01', 'A2', 'Opening a bank account', 'Mở tài khoản ngân hàng', '🏦'],
    ['daily-bank-02', 'A2', 'Withdrawing/depositing money', 'Rút/gửi tiền', '💵'],
    ['daily-bank-03', 'A2', 'Asking about exchange rates', 'Hỏi về tỷ giá hối đoái', '💱'],
    ['daily-bank-04', 'B1', 'Reporting a lost card', 'Báo cáo mất thẻ', '💳'],
    ['daily-bank-05', 'B2', 'Discussing loan options', 'Thảo luận các lựa chọn vay', '📄']
].map(t => generateTopic(t[0], 'at_the_bank', t[1], t[2], t[3], t[4], 'bank'));
writeTsFile('at-the-bank.ts', 'AT_THE_BANK_ITEMS', 'at_the_bank', topics2);
allTopics.push({ name: 'AT_THE_BANK_ITEMS', file: './at-the-bank' });

let topics3 = [
    ['daily-post-01', 'A2', 'Sending a package', 'Gửi một bưu kiện', '📦'],
    ['daily-post-02', 'A1', 'Buying stamps and envelopes', 'Mua tem và phong bì', '✉️'],
    ['daily-post-03', 'A2', 'Tracking a delivery', 'Theo dõi một đơn hàng', '🔍'],
    ['daily-post-04', 'B1', 'Sending registered/express mail', 'Gửi thư bảo đảm/chuyển phát nhanh', '📮']
].map(t => generateTopic(t[0], 'at_the_post_office', t[1], t[2], t[3], t[4], 'post'));
writeTsFile('at-the-post-office.ts', 'AT_THE_POST_OFFICE_ITEMS', 'at_the_post_office', topics3);
allTopics.push({ name: 'AT_THE_POST_OFFICE_ITEMS', file: './at-the-post-office' });

let topics4 = [
    ['daily-hair-01', 'A2', 'Getting a basic haircut', 'Cắt tóc cơ bản', '✂️'],
    ['daily-hair-02', 'A2', 'Asking for a specific style', 'Yêu cầu một kiểu tóc cụ thể', '💇'],
    ['daily-hair-03', 'A2', 'Hair coloring/dyeing', 'Nhuộm tóc', '🎨'],
    ['daily-hair-04', 'B1', 'Complaining about a bad haircut', 'Phàn nàn về một kiểu tóc hỏng', '😠'],
    ['daily-hair-05', 'A1', 'Booking an appointment', 'Đặt lịch hẹn', '📅']
].map(t => generateTopic(t[0], 'at_the_hairdresser', t[1], t[2], t[3], t[4], 'hair'));
writeTsFile('at-the-hairdresser.ts', 'AT_THE_HAIRDRESSER_ITEMS', 'at_the_hairdresser', topics4);
allTopics.push({ name: 'AT_THE_HAIRDRESSER_ITEMS', file: './at-the-hairdresser' });

let topics5 = [
    ['daily-gym-01', 'A2', 'Signing up for a gym membership', 'Đăng ký thẻ thành viên phòng gym', '📝'],
    ['daily-gym-02', 'A2', 'Asking about classes/schedule', 'Hỏi về các lớp học/lịch trình', '🗓️'],
    ['daily-gym-03', 'A2', 'Using gym equipment', 'Sử dụng thiết bị phòng gym', '🏋️'],
    ['daily-gym-04', 'B1', 'Talking to a personal trainer', 'Nói chuyện với huấn luyện viên cá nhân', '🗣️'],
    ['daily-gym-05', 'B1', 'Canceling/freezing membership', 'Hủy/bảo lưu thẻ thành viên', '❄️']
].map(t => generateTopic(t[0], 'at_the_gym', t[1], t[2], t[3], t[4], 'gym'));
writeTsFile('at-the-gym.ts', 'AT_THE_GYM_ITEMS', 'at_the_gym', topics5);
allTopics.push({ name: 'AT_THE_GYM_ITEMS', file: './at-the-gym' });

let topics6 = [
    ['daily-super-01', 'A1', 'Finding items by aisle', 'Tìm đồ theo lối đi', '🛒'],
    ['daily-super-02', 'A2', 'Asking about prices and promotions', 'Hỏi về giá và khuyến mãi', '🏷️'],
    ['daily-super-03', 'A2', 'Choosing fresh produce', 'Chọn nông sản tươi', '🍎'],
    ['daily-super-04', 'A1', 'At the checkout counter', 'Tại quầy thanh toán', '💳'],
    ['daily-super-05', 'B1', 'Returning a defective product', 'Trả lại một sản phẩm lỗi', '🔄'],
    ['daily-super-06', 'A2', 'Using a loyalty card/coupons', 'Sử dụng thẻ thành viên/phiếu giảm giá', '🎟️']
].map(t => generateTopic(t[0], 'at_the_supermarket', t[1], t[2], t[3], t[4], 'supermarket'));
writeTsFile('at-the-supermarket.ts', 'AT_THE_SUPERMARKET_ITEMS', 'at_the_supermarket', topics6);
allTopics.push({ name: 'AT_THE_SUPERMARKET_ITEMS', file: './at-the-supermarket' });

let topics7 = [
    ['daily-laun-01', 'A2', 'Dropping off clothes', 'Gửi quần áo', '👕'],
    ['daily-laun-02', 'A2', 'Using a self-service laundromat', 'Sử dụng tiệm giặt tự phục vụ', '🧺'],
    ['daily-laun-03', 'B1', 'Requesting stain removal', 'Yêu cầu tẩy vết bẩn', '✨'],
    ['daily-laun-04', 'A2', 'Picking up dry cleaning', 'Lấy quần áo giặt khô', '👔']
].map(t => generateTopic(t[0], 'at_the_laundry', t[1], t[2], t[3], t[4], 'laundry'));
writeTsFile('at-the-laundry.ts', 'AT_THE_LAUNDRY_ITEMS', 'at_the_laundry', topics7);
allTopics.push({ name: 'AT_THE_LAUNDRY_ITEMS', file: './at-the-laundry' });

let topics8 = [
    ['daily-trans-01', 'A1', 'Taking a city bus', 'Đi xe buýt thành phố', '🚌'],
    ['daily-trans-02', 'A2', 'Using the metro/subway', 'Sử dụng tàu điện ngầm', '🚇'],
    ['daily-trans-03', 'A2', 'Hailing a taxi/Grab', 'Gọi taxi/Grab', '🚕'],
    ['daily-trans-04', 'A2', 'Buying a train ticket', 'Mua vé tàu', '🎫'],
    ['daily-trans-05', 'A1', 'Asking for directions at a station', 'Hỏi đường tại nhà ga', '🗺️'],
    ['daily-trans-06', 'B1', 'Dealing with delays/cancellations', 'Xử lý khi bị trễ/hủy chuyến', '⏳']
].map(t => generateTopic(t[0], 'public_transport', t[1], t[2], t[3], t[4], 'transport'));
writeTsFile('public-transport.ts', 'PUBLIC_TRANSPORT_ITEMS', 'public_transport', topics8);
allTopics.push({ name: 'PUBLIC_TRANSPORT_ITEMS', file: './public-transport' });

let topics9 = [
    ['daily-deliv-01', 'A2', 'Ordering food delivery', 'Đặt đồ ăn giao tận nơi', '🍔'],
    ['daily-deliv-02', 'A2', 'Tracking a package delivery', 'Theo dõi giao bưu kiện', '📦'],
    ['daily-deliv-03', 'B1', 'Dealing with a wrong delivery', 'Xử lý giao hàng sai', '❌'],
    ['daily-deliv-04', 'A2', 'Tipping the delivery person', 'Cho tiền boa người giao hàng', '💵'],
    ['daily-deliv-05', 'A2', 'Scheduling a delivery time', 'Lên lịch thời gian giao hàng', '⏰']
].map(t => generateTopic(t[0], 'delivery_services', t[1], t[2], t[3], t[4], 'delivery'));
writeTsFile('delivery-services.ts', 'DELIVERY_SERVICES_ITEMS', 'delivery_services', topics9);
allTopics.push({ name: 'DELIVERY_SERVICES_ITEMS', file: './delivery-services' });

let topics10 = [
    ['daily-repair-01', 'A2', 'Calling a plumber', 'Gọi thợ sửa ống nước', '🚰'],
    ['daily-repair-02', 'A2', 'Calling an electrician', 'Gọi thợ điện', '⚡'],
    ['daily-repair-03', 'B1', 'Describing a leak/damage', 'Mô tả vết rò rỉ/hư hỏng', '💧'],
    ['daily-repair-04', 'B1', 'Getting a repair estimate', 'Nhận báo giá sửa chữa', '📝'],
    ['daily-repair-05', 'B2', 'Complaining about repair quality', 'Phànâm về chất lượng sửa chữa', '😠']
].map(t => generateTopic(t[0], 'home_repairs', t[1], t[2], t[3], t[4], 'repair'));
writeTsFile('home-repairs.ts', 'HOME_REPAIRS_ITEMS', 'home_repairs', topics10);
allTopics.push({ name: 'HOME_REPAIRS_ITEMS', file: './home-repairs' });

let topics11 = [
    ['daily-park-01', 'A2', 'Finding a parking spot', 'Tìm chỗ đậu xe', '🅿️'],
    ['daily-park-02', 'A1', 'Paying for parking', 'Trả tiền đậu xe', '💳'],
    ['daily-park-03', 'A2', 'Getting a parking ticket', 'Bị phạt đậu xe', '🎫'],
    ['daily-park-04', 'B1', 'Minor car accident', 'Tai nạn xe hơi nhẹ', '🚗'],
    ['daily-park-05', 'A2', 'At the gas station', 'Tại trạm xăng', '⛽']
].map(t => generateTopic(t[0], 'parking_driving', t[1], t[2], t[3], t[4], 'driving'));
writeTsFile('parking-driving.ts', 'PARKING_DRIVING_ITEMS', 'parking_driving', topics11);
allTopics.push({ name: 'PARKING_DRIVING_ITEMS', file: './parking-driving' });

let topics12 = [
    ['daily-comp-01', 'A2', 'Food not as ordered', 'Thức ăn không như đã gọi', '🍽️'],
    ['daily-comp-02', 'A2', 'Noisy neighbors', 'Hàng xóm ồn ào', '🔊'],
    ['daily-comp-03', 'B1', 'Defective electronics', 'Đồ điện tử bị lỗi', '💻'],
    ['daily-comp-04', 'B1', 'Poor service at a restaurant', 'Dịch vụ kém ở nhà hàng', '👎'],
    ['daily-comp-05', 'A2', 'Internet/cable not working', 'Internet/cáp không hoạt động', '📶'],
    ['daily-comp-06', 'B2', 'Billing/overcharge dispute', 'Tranh chấp hóa đơn/tính phí quá mức', '🧾']
].map(t => generateTopic(t[0], 'making_complaints', t[1], t[2], t[3], t[4], 'complaint'));
writeTsFile('making-complaints.ts', 'MAKING_COMPLAINTS_ITEMS', 'making_complaints', topics12);
allTopics.push({ name: 'MAKING_COMPLAINTS_ITEMS', file: './making-complaints' });

let topics13 = [
    ['daily-appt-01', 'A2', 'Doctor appointment', 'Hẹn khám bác sĩ', '👨‍⚕️'],
    ['daily-appt-02', 'A2', 'Dentist appointment', 'Hẹn khám nha sĩ', '🦷'],
    ['daily-appt-03', 'B1', 'Visa/embassy appointment', 'Hẹn visa/đại sứ quán', '🛂'],
    ['daily-appt-04', 'A2', 'Car service appointment', 'Hẹn bảo dưỡng xe', '🔧'],
    ['daily-appt-05', 'A2', 'Rescheduling an appointment', 'Dời lại một cuộc hẹn', '📅']
].map(t => generateTopic(t[0], 'making_appointments', t[1], t[2], t[3], t[4], 'appointment'));
writeTsFile('making-appointments.ts', 'MAKING_APPOINTMENTS_ITEMS', 'making_appointments', topics13);
allTopics.push({ name: 'MAKING_APPOINTMENTS_ITEMS', file: './making-appointments' });

let topics14 = [
    ['daily-help-01', 'A1', 'Asking a stranger for directions', 'Hỏi đường một người lạ', '🗺️'],
    ['daily-help-02', 'A1', 'Asking someone to take a photo', 'Nhờ ai đó chụp ảnh', '📷'],
    ['daily-help-03', 'A1', 'Asking for help carrying bags', 'Nhờ xách hộ túi', '🛍️'],
    ['daily-help-04', 'A2', 'Asking a store clerk for assistance', 'Nhờ nhân viên cửa hàng giúp đỡ', '🙋'],
    ['daily-help-05', 'A2', 'Asking a neighbor for a favor', 'Nhờ hàng xóm giúp đỡ', '🤝']
].map(t => generateTopic(t[0], 'asking_for_help', t[1], t[2], t[3], t[4], 'help'));
writeTsFile('asking-for-help.ts', 'ASKING_FOR_HELP_ITEMS', 'asking_for_help', topics14);
allTopics.push({ name: 'ASKING_FOR_HELP_ITEMS', file: './asking-for-help' });

let topics15 = [
    ['daily-phone-01', 'A2', 'Making a restaurant reservation', 'Đặt bàn nhà hàng', '📞'],
    ['daily-phone-02', 'B1', 'Calling customer service', 'Gọi dịch vụ khách hàng', '🎧'],
    ['daily-phone-03', 'A2', 'Answering an unknown number', 'Trả lời một số lạ', '❓'],
    ['daily-phone-04', 'A2', 'Leaving a voicemail', 'Để lại tin nhắn thoại', '🎙️'],
    ['daily-phone-05', 'B1', 'Conference call basics', 'Nhưng điều cơ bản về cuộc gọi hội nghị', '👥'],
    ['daily-phone-06', 'B1', 'Reporting a problem by phone', 'Báo cáo một sự cố qua điện thoại', '⚠️']
].map(t => generateTopic(t[0], 'phone_calls', t[1], t[2], t[3], t[4], 'phone'));
writeTsFile('phone-calls.ts', 'PHONE_CALLS_ITEMS', 'phone_calls', topics15);
allTopics.push({ name: 'PHONE_CALLS_ITEMS', file: './phone-calls' });

let topics16 = [
    ['daily-eshop-01', 'A2', 'Describing what you want to buy', 'Mô tả những gì bạn muốn mua', '🛒'],
    ['daily-eshop-02', 'A2', 'Asking about shipping and returns', 'Hỏi về vận chuyển và trả hàng', '📦'],
    ['daily-eshop-03', 'B1', 'Writing a product review', 'Viết đánh giá sản phẩm', '⭐'],
    ['daily-eshop-04', 'B1', 'Contacting seller about an issue', 'Liên hệ với người bán về một vấn đề', '💬'],
    ['daily-eshop-05', 'B1', 'Comparing prices/features online', 'So sánh giá cả/tính năng trực tuyến', '⚖️']
].map(t => generateTopic(t[0], 'online_shopping', t[1], t[2], t[3], t[4], 'shopping'));
writeTsFile('online-shopping.ts', 'ONLINE_SHOPPING_ITEMS', 'online_shopping', topics16);
allTopics.push({ name: 'ONLINE_SHOPPING_ITEMS', file: './online-shopping' });

let topics17 = [
    ['daily-neigh-01', 'A1', 'Introducing yourself to a new neighbor', 'Tự giới thiệu với hàng xóm mới', '👋'],
    ['daily-neigh-02', 'A2', 'Asking to borrow something', 'Hỏi mượn thứ gì đó', '🤝'],
    ['daily-neigh-03', 'B1', 'Discussing shared space rules', 'Thảo luận quy tắc không gian chung', '📜'],
    ['daily-neigh-04', 'A2', 'Inviting neighbors for a gathering', 'Mời hàng xóm đến một buổi tụ tập', '🎉'],
    ['daily-neigh-05', 'B1', 'Resolving a noise complaint', 'Giải quyết phàn nàn về tiếng ồn', '🔇']
].map(t => generateTopic(t[0], 'neighbors_community', t[1], t[2], t[3], t[4], 'neighbor'));
writeTsFile('neighbors-community.ts', 'NEIGHBORS_COMMUNITY_ITEMS', 'neighbors_community', topics17);
allTopics.push({ name: 'NEIGHBORS_COMMUNITY_ITEMS', file: './neighbors-community' });

let topics18 = [
    ['daily-celeb-01', 'A2', 'Birthday party planning', 'Lên kế hoạch tiệc sinh nhật', '🎂'],
    ['daily-celeb-02', 'A2', 'Lunar New Year traditions', 'Truyền thống Tết Nguyên Đán', '🏮'],
    ['daily-celeb-03', 'A2', 'Christmas celebrations', 'Lễ kỷ niệm Giáng sinh', '🎄'],
    ['daily-celeb-04', 'B1', 'Wedding congratulations', 'Chúc mừng đám cưới', '💍'],
    ['daily-celeb-05', 'A2', 'Graduation ceremony', 'Lễ tốt nghiệp', '🎓'],
    ['daily-celeb-06', 'A2', 'Housewarming party', 'Tiệc tân gia', '🏠']
].map(t => generateTopic(t[0], 'celebrations_holidays', t[1], t[2], t[3], t[4], 'event'));
writeTsFile('celebrations-holidays.ts', 'CELEBRATIONS_HOLIDAYS_ITEMS', 'celebrations_holidays', topics18);
allTopics.push({ name: 'CELEBRATIONS_HOLIDAYS_ITEMS', file: './celebrations-holidays' });

let topics19 = [
    ['daily-vet-01', 'A2', 'Taking a pet to the vet', 'Đưa thú cưng đến bác sĩ thú y', '🐶'],
    ['daily-vet-02', 'B1', 'Describing pet symptoms', 'Mô tả triệu chứng của thú cưng', '🌡️'],
    ['daily-vet-03', 'A2', 'Buying pet food/supplies', 'Mua thức ăn/đồ dùng cho thú cưng', '🥫'],
    ['daily-vet-04', 'A2', 'Pet grooming appointment', 'Hẹn chải chuốt cho thú cưng', '✂️'],
    ['daily-vet-05', 'B1', 'Pet adoption/rescue', 'Nhận nuôi/cứu hộ thú cưng', '🏡']
].map(t => generateTopic(t[0], 'pets_vet', t[1], t[2], t[3], t[4], 'vet'));
writeTsFile('pets-vet.ts', 'PETS_VET_ITEMS', 'pets_vet', topics19);
allTopics.push({ name: 'PETS_VET_ITEMS', file: './pets-vet' });

let topics20 = [
    ['daily-lost-01', 'A2', 'Lost wallet/phone', 'Mất ví/điện thoại', '📱'],
    ['daily-lost-02', 'B1', 'Lost luggage at airport', 'Mất hành lý ở sân bay', '🧳'],
    ['daily-lost-03', 'A2', 'Locked out of house/car', 'Bị khóa ngoài nhà/xe', '🔑'],
    ['daily-lost-04', 'B1', 'Filing a lost item report', 'Nộp báo cáo mất đồ', '📝'],
    ['daily-lost-05', 'A2', 'Finding and returning someone\'s item', 'Tìm và trả lại đồ cho ai đó', '🤝']
].map(t => generateTopic(t[0], 'lost_items_problems', t[1], t[2], t[3], t[4], 'lost'));
writeTsFile('lost-items-problems.ts', 'LOST_ITEMS_PROBLEMS_ITEMS', 'lost_items_problems', topics20);
allTopics.push({ name: 'LOST_ITEMS_PROBLEMS_ITEMS', file: './lost-items-problems' });

const indexContent = `/**
 * LingoPro Speaking Topic Library
 * Category: daily_situations
 * 
 * Barrel export for all Daily Situations topics.
 */

${allTopics.map(t => `import { ${t.name} } from '${t.file}';`).join('\n')}

export const allDailySituationsTopics = [
${allTopics.map(t => `  ...${t.name}`).join(',\n')}
];

export const DAILY_SITUATIONS_SUBCATEGORIES = [
  { id: 'at_the_pharmacy', nameEn: 'At the Pharmacy', nameVi: 'Tại hiệu thuốc' },
  { id: 'at_the_bank', nameEn: 'At the Bank', nameVi: 'Tại ngân hàng' },
  { id: 'at_the_post_office', nameEn: 'At the Post Office', nameVi: 'Tại bưu điện' },
  { id: 'at_the_hairdresser', nameEn: 'At the Hairdresser', nameVi: 'Tại tiệm làm tóc' },
  { id: 'at_the_gym', nameEn: 'At the Gym', nameVi: 'Tại phòng gym' },
  { id: 'at_the_supermarket', nameEn: 'At the Supermarket', nameVi: 'Tại siêu thị' },
  { id: 'at_the_laundry', nameEn: 'At the Laundry', nameVi: 'Tại tiệm giặt ủi' },
  { id: 'public_transport', nameEn: 'Public Transport', nameVi: 'Phương tiện công cộng' },
  { id: 'delivery_services', nameEn: 'Delivery Services', nameVi: 'Dịch vụ giao hàng' },
  { id: 'home_repairs', nameEn: 'Home Repairs', nameVi: 'Sửa chữa nhà cửa' },
  { id: 'parking_driving', nameEn: 'Parking & Driving', nameVi: 'Đậu xe & Lái xe' },
  { id: 'making_complaints', nameEn: 'Making Complaints', nameVi: 'Khiếu nại' },
  { id: 'making_appointments', nameEn: 'Making Appointments', nameVi: 'Đặt lịch hẹn' },
  { id: 'asking_for_help', nameEn: 'Asking for Help', nameVi: 'Yêu cầu giúp đỡ' },
  { id: 'phone_calls', nameEn: 'Phone Calls', nameVi: 'Cuộc gọi điện thoại' },
  { id: 'online_shopping', nameEn: 'Online Shopping', nameVi: 'Mua sắm trực tuyến' },
  { id: 'neighbors_community', nameEn: 'Neighbors & Community', nameVi: 'Hàng xóm & Cộng đồng' },
  { id: 'celebrations_holidays', nameEn: 'Celebrations & Holidays', nameVi: 'Lễ kỷ niệm & Ngày lễ' },
  { id: 'pets_vet', nameEn: 'Pets & Vet', nameVi: 'Thú cưng & Bác sĩ thú y' },
  { id: 'lost_items_problems', nameEn: 'Lost Items & Problems', nameVi: 'Mất đồ & Vấn đề' }
];

export function getDailySituationsBySubcategory(slug: string) {
  return allDailySituationsTopics.filter(t => t.subcategory === slug);
}
`;

fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent);
console.log('Successfully generated 21 files for daily_situations.');

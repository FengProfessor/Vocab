/**
 * Foundational Speaking System for False Beginners (A0-A1)
 * Stage 2: Luyện tập thế khối Lego (Modular Slot Substitution)
 * File: src/data/speaking/foundation/stage-2-lego-slots.ts
 *
 * Automated <1s Speech Reflex Drills:
 * Decouples sentence structure from lexical slots.
 * Learners fix an invariant grammatical baseplate and rapidly snap in modular Lego bricks
 * (items, preferences, places, amenities, deliverables, symptoms, times).
 *
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { LegoSlotLesson } from '@/types/speaking-foundation';

export const STAGE_2_LEGO_LESSONS: LegoSlotLesson[] = [
  // ── Lesson 1: F&B Item Substitution ─────────────────────────────────────────
  {
    id: 'lego-fnb-ordering',
    title: 'Thế khối Lego: Gọi món ăn & Thức uống (F&B)',
    baseFrame: 'Can I have a {item}, please?',
    meaningVi: 'Cho tôi một {món} nhé, làm ơn.',
    phoneticTipVi:
      'Cố định cụm đầu "Can I have a" nối âm thành /kə.naɪ.hæ.və/, chỉ thay thế khối tên món ở cuối và kết thúc bằng "please".',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'item',
        slotLabelVi: 'Món đồ ăn / Thức uống',
        bricks: [
          {
            value: 'hot latte',
            meaningVi: 'ly latte nóng',
            ipa: '/hɑːt ˈlɑːteɪ/',
            icon: '☕',
          },
          {
            value: 'iced black coffee',
            meaningVi: 'cà phê đen đá',
            ipa: '/aɪst blæk ˈkɔːfi/',
            icon: '🧊',
          },
          {
            value: 'bottle of water',
            meaningVi: 'chai nước khoáng',
            ipa: '/ˈbɑːtl əv ˈwɔːtər/',
            icon: '💧',
          },
          {
            value: 'warm croissant',
            meaningVi: 'bánh sừng bò ấm',
            ipa: '/wɔːrm krwɑːˈsɑːnt/',
            icon: '🥐',
          },
          {
            value: 'chicken sandwich',
            meaningVi: 'bánh mì kẹp gà',
            ipa: '/ˈtʃɪkɪn ˈsænwɪtʃ/',
            icon: '🥪',
          },
          {
            value: 'green tea',
            meaningVi: 'tách trà xanh',
            ipa: '/ɡriːn tiː/',
            icon: '🍵',
          },
        ],
      },
    ],
  },

  // ── Lesson 2: Clothing Preference Substitution ──────────────────────────────
  {
    id: 'lego-clothing-preference',
    title: 'Thế khối Lego: Lựa chọn Kích cỡ & Màu sắc (Shopping)',
    baseFrame: 'Do you have this in {preference}?',
    meaningVi: 'Bạn có món đồ này ở {kích cỡ/màu sắc} không?',
    phoneticTipVi:
      'Giữ nhịp nối âm /duː juː hæv ðɪ.sɪn/, phản xạ đưa nhanh khối màu hoặc cỡ áo vào cuối câu.',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'preference',
        slotLabelVi: 'Kích cỡ hoặc Màu sắc',
        bricks: [
          {
            value: 'size medium',
            meaningVi: 'cỡ vừa (M)',
            ipa: '/saɪz ˈmiːdiəm/',
            icon: '👕',
          },
          {
            value: 'a larger size',
            meaningVi: 'cỡ lớn hơn (L/XL)',
            ipa: '/ə ˈlɑːrdʒər saɪz/',
            icon: '📏',
          },
          {
            value: 'a smaller size',
            meaningVi: 'cỡ nhỏ hơn (S)',
            ipa: '/ə ˈsmɔːlər saɪz/',
            icon: '📐',
          },
          {
            value: 'black',
            meaningVi: 'màu đen',
            ipa: '/blæk/',
            icon: '🖤',
          },
          {
            value: 'navy blue',
            meaningVi: 'màu xanh tím than',
            ipa: '/ˈneɪvi bluː/',
            icon: '🔵',
          },
          {
            value: 'white',
            meaningVi: 'màu trắng',
            ipa: '/waɪt/',
            icon: '⚪',
          },
        ],
      },
    ],
  },

  // ── Lesson 3: Urban Navigation Substitution ─────────────────────────────────
  {
    id: 'lego-urban-navigation',
    title: 'Thế khối Lego: Tìm kiếm Địa điểm & Tiện ích (Navigation)',
    baseFrame: 'Excuse me, where is the nearest {place}?',
    meaningVi: 'Xin lỗi, {địa điểm} gần nhất ở đâu vậy ạ?',
    phoneticTipVi:
      'Âm /wer ɪz ðə ˈnɪrɪst/ phát âm liền một hơi thở, sau đó gắn ngay địa điểm cần tìm.',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'place',
        slotLabelVi: 'Địa điểm / Tiện ích công cộng',
        bricks: [
          {
            value: 'restroom',
            meaningVi: 'nhà vệ sinh',
            ipa: '/ˈrestruːm/',
            icon: '🚻',
          },
          {
            value: 'subway station',
            meaningVi: 'ga tàu điện ngầm',
            ipa: '/ˈsʌbweɪ ˈsteɪʃn/',
            icon: '🚇',
          },
          {
            value: 'pharmacy',
            meaningVi: 'hiệu thuốc tây',
            ipa: '/ˈfɑːrməsi/',
            icon: '💊',
          },
          {
            value: 'ATM',
            meaningVi: 'cây rút tiền ATM',
            ipa: '/ˌeɪ tiː ˈem/',
            icon: '🏧',
          },
          {
            value: 'bus stop',
            meaningVi: 'trạm xe buýt',
            ipa: '/ˈbʌs stɑːp/',
            icon: '🚏',
          },
          {
            value: 'convenience store',
            meaningVi: 'cửa hàng tiện lợi 24/7',
            ipa: '/kənˈviːniəns stɔːr/',
            icon: '🏪',
          },
        ],
      },
    ],
  },

  // ── Lesson 4: Hotel Amenity Substitution ────────────────────────────────────
  {
    id: 'lego-hotel-amenities',
    title: 'Thế khối Lego: Báo sự cố Tiện ích phòng (Hotel)',
    baseFrame: 'The {amenity} in my room is not working.',
    meaningVi: '{Thiết bị} trong phòng tôi không hoạt động.',
    phoneticTipVi:
      'Nhấn mạnh vào tên thiết bị và từ phủ định "not working" (/nɑːt ˈwɜːrkɪŋ/) để nhân viên lễ tân nắm bắt ngay vấn đề.',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'amenity',
        slotLabelVi: 'Thiết bị hoặc Tiện nghi phòng',
        bricks: [
          {
            value: 'air conditioner',
            meaningVi: 'máy điều hòa không khí',
            ipa: '/ˈer kəndɪʃənər/',
            icon: '❄️',
          },
          {
            value: 'hot water',
            meaningVi: 'vòi nước nóng',
            ipa: '/hɑːt ˈwɔːtər/',
            icon: '🚿',
          },
          {
            value: 'Wi-Fi connection',
            meaningVi: 'kết nối mạng Wi-Fi',
            ipa: '/ˈwaɪ faɪ kəˈnekʃn/',
            icon: '📶',
          },
          {
            value: 'key card',
            meaningVi: 'thẻ từ mở cửa',
            ipa: '/ˈkiː kɑːrd/',
            icon: '💳',
          },
          {
            value: 'hairdryer',
            meaningVi: 'máy sấy tóc',
            ipa: '/ˈherdraɪər/',
            icon: '💨',
          },
          {
            value: 'television',
            meaningVi: 'ti-vi màn hình',
            ipa: '/ˈtelɪvɪʒn/',
            icon: '📺',
          },
        ],
      },
    ],
  },

  // ── Lesson 5: Office Deliverables & Times (Double Slot) ──────────────────────
  {
    id: 'lego-office-deliverables',
    title: 'Thế khối Lego kép: Báo cáo & Hạn chót công việc (Workplace)',
    baseFrame: 'Could you send me the {document} by {time}?',
    meaningVi: 'Bạn có thể gửi cho tôi {tài liệu} trước {thời gian} được không?',
    phoneticTipVi:
      'Luyện tập thế đồng thời 2 khối: Khối 1 là nội dung tài liệu, Khối 2 là mốc deadline với giới từ "by".',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'document',
        slotLabelVi: 'Tài liệu / Bản báo cáo',
        bricks: [
          {
            value: 'sales report',
            meaningVi: 'bản báo cáo doanh số',
            ipa: '/seɪlz rɪˈpɔːrt/',
            icon: '📊',
          },
          {
            value: 'meeting summary',
            meaningVi: 'tóm tắt cuộc họp',
            ipa: '/ˈmiːtɪŋ ˈsʌməri/',
            icon: '📝',
          },
          {
            value: 'updated invoice',
            meaningVi: 'hóa đơn cập nhật',
            ipa: '/ˌʌpˈdeɪtɪd ˈɪnvɔɪs/',
            icon: '🧾',
          },
          {
            value: 'project presentation',
            meaningVi: 'bài thuyết trình dự án',
            ipa: '/ˈprɑːdʒekt ˌpreznˈteɪʃn/',
            icon: '📑',
          },
        ],
      },
      {
        slotKey: 'time',
        slotLabelVi: 'Mốc thời gian hạn chót',
        bricks: [
          {
            value: 'this afternoon',
            meaningVi: 'chiều nay',
            ipa: '/ðɪs ˌæftərˈnuːn/',
            icon: '🕑',
          },
          {
            value: 'tomorrow morning',
            meaningVi: 'sáng mai',
            ipa: '/təˈmɔːroʊ ˈmɔːrnɪŋ/',
            icon: '🌅',
          },
          {
            value: "five o'clock",
            meaningVi: '5 giờ chiều',
            ipa: '/faɪv əˈklɑːk/',
            icon: '🕔',
          },
          {
            value: 'end of day',
            meaningVi: 'cuối ngày hôm nay',
            ipa: '/end əv deɪ/',
            icon: '🌙',
          },
        ],
      },
    ],
  },

  // ── Lesson 6: Medical Symptoms Substitution ─────────────────────────────────
  {
    id: 'lego-medical-symptoms',
    title: 'Thế khối Lego: Diễn đạt Triệu chứng Sức khỏe (Emergency)',
    baseFrame: 'I feel sick. I have a severe {symptom}.',
    meaningVi: 'Tôi thấy không khỏe. Tôi bị {triệu chứng} dữ dội.',
    phoneticTipVi:
      'Nối âm "have a" /hæ.və/ và nhấn mạnh vào danh từ chỉ triệu chứng bệnh ở cuối.',
    targetReflexMs: 1000,
    slots: [
      {
        slotKey: 'symptom',
        slotLabelVi: 'Triệu chứng bệnh lý',
        bricks: [
          {
            value: 'headache',
            meaningVi: 'cơn đau đầu nhức nhối',
            ipa: '/ˈhedeɪk/',
            icon: '🤕',
          },
          {
            value: 'stomachache',
            meaningVi: 'cơn đau dạ dày/đau bụng',
            ipa: '/ˈstʌməkeɪk/',
            icon: '🤢',
          },
          {
            value: 'fever',
            meaningVi: 'cơn sốt nhiệt cao',
            ipa: '/ˈfiːvər/',
            icon: '🌡️',
          },
          {
            value: 'toothache',
            meaningVi: 'cơn đau buốt răng',
            ipa: '/ˈtuːθeɪk/',
            icon: '🦷',
          },
          {
            value: 'throat infection',
            meaningVi: 'chứng viêm họng rát cổ',
            ipa: '/θroʊt ɪnˈfekʃn/',
            icon: '😷',
          },
          {
            value: 'back pain',
            meaningVi: 'chứng đau lưng dữ dội',
            ipa: '/bæk peɪn/',
            icon: '⚡',
          },
        ],
      },
    ],
  },
];

import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from 'docx';

const primaryColor = '1F497D'; // Xanh Navy chuyên nghiệp
const accentColor = 'C00000'; // Đỏ rượu
const lightBg = 'F2F4F7'; // Xám nhạt thanh lịch
const borderColor = 'D9D9D9';

function createHeader(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    run: {
      color: primaryColor,
      bold: true,
      size: 28,
      font: 'Calibri'
    }
  });
}

function createSubHeader(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    run: {
      color: accentColor,
      bold: true,
      size: 24,
      font: 'Calibri'
    }
  });
}

function createBullet(title, desc) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: title + ': ', bold: true, color: '17231D', size: 22, font: 'Calibri' }),
      new TextRun({ text: desc, color: '333333', size: 22, font: 'Calibri' })
    ]
  });
}

function createScriptBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: lightBg, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: primaryColor }
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'LỜI THOẠI MẪU (NÓI TỰ NHIÊN):',
                    bold: true,
                    color: primaryColor,
                    size: 20,
                    font: 'Calibri'
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: `"${text}"`,
                    italics: true,
                    color: '262626',
                    size: 22,
                    font: 'Calibri'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createNoteLines(lines = 3) {
  const paras = [];
  for (let i = 0; i < lines; i++) {
    paras.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: '....................................................................................................................................................................................',
            color: 'BFBFBF',
            size: 20
          })
        ]
      })
    );
  }
  return paras;
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: 'PHIẾU KHẢO SÁT CHUYÊN SÂU: MÔ HÌNH ĐÀO TẠO TIẾNG TRUNG ONLINE',
              bold: true,
              size: 32,
              color: primaryColor,
              font: 'Calibri'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: 'BỘ CÂU HỎI THĂM DÒ NHU CẦU, ĐIỂM NGHẼN VẬN HÀNH & ĐỊNH HƯỚNG PHÁT TRIỂN',
              italics: true,
              size: 22,
              color: '595959',
              font: 'Calibri'
            })
          ]
        }),

        // Box thông tin chung
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: lightBg, type: ShadingType.CLEAR },
                  margins: { top: 100, bottom: 100, left: 150, right: 150 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                    left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
                    right: { style: BorderStyle.SINGLE, size: 4, color: borderColor }
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'Tên Trung Tâm: ', bold: true, font: 'Calibri' }),
                        new TextRun({ text: '............................................................  ', font: 'Calibri' }),
                        new TextRun({ text: 'Người đại diện: ', bold: true, font: 'Calibri' }),
                        new TextRun({ text: '................................................', font: 'Calibri' })
                      ]
                    }),
                    new Paragraph({
                      spacing: { before: 80 },
                      children: [
                        new TextRun({ text: 'Ngày khảo sát: ', bold: true, font: 'Calibri' }),
                        new TextRun({ text: '...... / ...... / 2026   |   ', font: 'Calibri' }),
                        new TextRun({ text: 'Chuyên viên tư vấn: ', bold: true, font: 'Calibri' }),
                        new TextRun({ text: '................................................................', font: 'Calibri' })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 200 } }),

        // Phần 1: Nguyên tắc & Lời mở đầu
        createHeader('I. NGUYÊN TẮC KHẢO SÁT & KỊCH BẢN MỞ ĐẦU'),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Nguyên tắc vàng: ',
              bold: true,
              color: accentColor,
              font: 'Calibri'
            }),
            new TextRun({
              text: 'Tuyệt đối KHÔNG báo giá, KHÔNG chèo kéo bán hàng. Hãy đóng vai Chuyên gia Học thuật đi lắng nghe để hiểu rõ nỗi đau thực tế của mô hình Online. Dành 80% thời gian để họ nói và ghi chép cẩn thận.',
              font: 'Calibri'
            })
          ]
        }),
        new Paragraph({ spacing: { before: 100 } }),
        createScriptBox(
          'Chào Thầy/Cô, trước khi bàn về công nghệ hay hợp tác, em muốn xin phép dành ít phút hỏi thăm thật kỹ về mô hình của trung tâm mình trước. Vì dạy online có những đặc thù rất riêng, nếu không hiểu học viên của Thầy/Cô là ai và đang gặp khó ở đâu thì mọi giải pháp đưa ra đều là sáo rỗng. Em chỉ muốn lắng nghe để xem bên em có thực sự giúp được đúng bài toán của trung tâm mình hay không thôi ạ.'
        ),

        // Phần 2: 5 Cụm câu hỏi
        createHeader('II. 5 CỤM CÂU HỎI THĂM DÒ CHI TIẾT'),

        // Cụm 1
        createSubHeader('1. Chân dung & Trình độ học viên hiện tại (Họ là ai? Ở tầm nào?)'),
        createBullet('Câu hỏi 1.1', 'Học viên bên mình hiện tại chủ yếu là tệp nào vậy Thầy/Cô? Là sinh viên học để lấy bằng HSK ra trường, người đi làm văn phòng, hay người buôn bán đánh hàng Taobao/1688?'),
        createBullet('Câu hỏi 1.2', 'Tỷ lệ học viên mất gốc / bắt đầu từ con số 0 (chưa biết gì) chiếm khoảng bao nhiêu %?'),
        createBullet('Câu hỏi 1.3', 'Mục tiêu phổ biến nhất của các bạn khi đăng ký là đạt đến HSK mấy (HSK 2, 3, 4) hay chỉ cần giao tiếp phản xạ ngắn hạn?'),
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: 'Ghi chú câu trả lời:', bold: true, color: '595959', font: 'Calibri' })]
        }),
        ...createNoteLines(3),

        // Cụm 2
        createSubHeader('2. Quy mô & Hình thức tổ chức lớp Online (Vận hành ra sao?)'),
        createBullet('Câu hỏi 2.1', 'Lớp online bên mình hiện đang dạy qua nền tảng nào là chính ạ? (Zoom, Google Meet, MS Teams, hay video quay sẵn VOD)?'),
        createBullet('Câu hỏi 2.2', 'Sĩ số trung bình mỗi lớp online là bao nhiêu bạn? (Dạy kèm 1-1, nhóm nhỏ 4-6 bạn, hay lớp đông 15-25 bạn)?'),
        createBullet('Câu hỏi 2.3', 'Một tuần học sinh học bao nhiêu buổi và mỗi buổi kéo dài bao nhiêu phút?'),
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: 'Ghi chú câu trả lời:', bold: true, color: '595959', font: 'Calibri' })]
        }),
        ...createNoteLines(3),

        // Cụm 3
        createSubHeader('3. Điểm nghẽn lớn nhất trong việc Dạy & Học Online (Nỗi đau vận hành)'),
        createBullet('Câu hỏi 3.1', 'Dạy online thì giữ nhịp học sinh rất khó: học sinh hay tắt cam, ngại nói. Giáo viên bên mình hiện tại kiểm soát việc luyện phát âm và nhớ mặt chữ Hán của học sinh như thế nào ạ?'),
        createBullet('Câu hỏi 3.2', 'Khâu giao và chấm bài tập về nhà đang diễn ra qua đâu? Giáo viên / Trợ giảng có bị quá tải khi chấm bài chụp ảnh qua Zalo không?'),
        createBullet('Câu hỏi 3.3', 'Tỷ lệ học sinh bỏ học giữa chừng (drop-out) ở các lớp online của mình ước chừng khoảng bao nhiêu %? Các bạn thường rụng ở giai đoạn nào nhất (HSK 1 lên 2, hay khi chữ Hán bắt đầu nhiều)?'),
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: 'Ghi chú câu trả lời:', bold: true, color: '595959', font: 'Calibri' })]
        }),
        ...createNoteLines(3),

        // Cụm 4
        createSubHeader('4. Khâu Tuyển sinh & Kênh Kiếm Lead Online (Nỗi đau tìm khách)'),
        createBullet('Câu hỏi 4.1', 'Hiện tại nguồn học viên mới của trung tâm chủ yếu đến từ đâu ạ? (Chạy quảng cáo Facebook Ads, TikTok, kênh cá nhân của giáo viên, hay học viên cũ giới thiệu)?'),
        createBullet('Câu hỏi 4.2', 'Quy trình tư vấn hiện tại của bên mình như thế nào? Cho các bạn vào học thử 1 buổi Zoom rồi mới chốt, hay nhân viên gọi điện tư vấn là chốt luôn?'),
        createBullet('Câu hỏi 4.3', 'Chi phí để trung tâm có được 1 số điện thoại (Lead) hoặc 1 học viên mới hiện tại trung tâm thấy có đang bị tăng cao không ạ?'),
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: 'Ghi chú câu trả lời:', bold: true, color: '595959', font: 'Calibri' })]
        }),
        ...createNoteLines(3),

        // Cụm 5
        createSubHeader('5. Tầm nhìn & Mục tiêu sắp tới (Trung tâm đang hướng đến tầm nào?)'),
        createBullet('Câu hỏi 5.1', 'Trong 6 tháng đến 1 năm tới, mục tiêu ưu tiên số 1 của Thầy/Cô là gì? (Tăng gấp đôi số lượng học viên, hay nâng cao chất lượng để tăng học phí, hay đóng gói bài giảng tự động để giải phóng sức giáo viên)?'),
        createBullet('Câu hỏi 5.2', 'Trung tâm có định hướng mở rộng thêm mảng thi chứng chỉ HSK chuẩn quốc tế hay chuyên sâu vào mảng tiếng Trung thương mại đánh hàng?'),
        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: 'Ghi chú câu trả lời:', bold: true, color: '595959', font: 'Calibri' })]
        }),
        ...createNoteLines(3),

        // Phần 3: Lời kết
        createHeader('III. KỊCH BẢN KẾT THÚC BUỔI GẶP (CHUYÊN NGHIỆP, KHÔNG BÁO GIÁ VỘI)'),
        createScriptBox(
          'Dạ em cảm ơn Thầy/Cô rất nhiều vì đã chia sẻ rất chi tiết và cởi mở. Hôm nay em đã nắm được chính xác bức tranh của trung tâm mình: từ tệp học viên, cách vận hành lớp Zoom cho đến những điểm nghẽn về việc kiểm soát bài tập và tuyển sinh. Em xin phép không vội đưa ra kết luận hay báo giá ngay bây giờ. Em sẽ về ngồi lại với đội ngũ kỹ thuật trong 1 - 2 ngày, dựa đúng trên các thông tin Thầy/Cô vừa chia sẻ để thiết kế một PHƯƠNG ÁN MAY ĐO RIÊNG cho mô hình online của trung tâm mình. Sau đó em sẽ gửi lại Thầy/Cô bản đề xuất hoàn chỉnh để Thầy/Cô xem qua. Nếu Thầy/Cô thấy đúng cái trung tâm đang cần thì lúc đó hai bên mới bàn tiếp. Em rất cảm ơn thời gian quý báu của Thầy/Cô hôm nay!'
        ),

        // Phần 4: Bảng tóm tắt đối chiếu giải pháp
        new Paragraph({ spacing: { before: 200 } }),
        createHeader('IV. BẢNG GHI NHỚ ĐỐI CHIẾU GIẢI PHÁP LINGOPRO (DÀNH CHO BẠN)'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: primaryColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Nỗi đau họ chia sẻ', bold: true, color: 'FFFFFF', font: 'Calibri' })] })]
                }),
                new TableCell({
                  shading: { fill: primaryColor, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Vũ khí Lingopro giải quyết', bold: true, color: 'FFFFFF', font: 'Calibri' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Học sinh online hay lười, quên chữ Hán, rụng nhiều' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Thuật toán FSRS nhắc học tự động + Game ghép bộ thủ' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Học sinh online ngại nói, sai thanh điệu không ai sửa' })] }),
                new TableCell({ children: [new Paragraph({ text: 'AI Tone Pitch Visualizer vẽ biểu đồ cao độ giọng nói' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Giáo viên mệt mỏi vì chấm bài chụp ảnh qua Zalo' })] }),
                new TableCell({ children: [new Paragraph({ text: 'LMS tự động chấm trắc nghiệm & luyện viết nét chữ Hán' })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'Chi phí chạy Ads online đắt đỏ, lead về không chốt được' })] }),
                new TableCell({ children: [new Paragraph({ text: 'Phễu Mini-Test 5 phút chẩn đoán HSK + Thử thách 7 ngày' })] })
              ]
            })
          ]
        })
      ]
    }
  ]
});

async function run() {
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve('d:/Vibe/Vocab/web-app/KHAO_SAT_TRUNG_TAM_TIENG_TRUNG_ONLINE.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('SUCCESS: Generated ' + outPath);
}

run();

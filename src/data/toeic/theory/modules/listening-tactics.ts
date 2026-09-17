import type { TheoryModule } from '../types';

export const listeningTacticsModule: TheoryModule = {
  id: 'listening-tactics',
  title: 'Chiến Thuật Luyện Nghe Đỉnh Cao (Part 1 - 4)',
  shortTitle: 'Listening Tactics',
  description:
    'Hệ thống phương pháp bắt tranh Part 1, quy tắc loại trừ 3 bẫy Part 2, kỹ thuật đón đầu băng 1 nhịp Part 3 & 4 và bẻ khóa câu hỏi ngụ ý, bảng biểu.',
  targetParts: [1, 2, 3, 4],
  icon: 'Headphones',
  badgeColor: 'amber',
  lessons: [
    // =========================================================================
    // LESSON 01: Part 1 Photo Tactics
    // =========================================================================
    {
      id: 'toeic-listening-01-part1-photos',
      moduleId: 'listening-tactics',
      slug: 'part1-photo-tactics',
      order: 1,
      title: 'Chiến Thuật Bắt Tranh Part 1: Tranh Người vs Tranh Vật',
      englishTitle: "Part 1 Photo Tactics: Action vs State, The Deadly 'Being' Trap & Scene Scanning",
      targetPart: 1,
      targetSections: ['listening'],
      difficulty: 'starter',
      estimatedMinutes: 15,
      textbookSources: [
        'Tactics for TOEIC Listening and Reading Unit 1-2 (Oxford / ETS)',
        'Hackers TOEIC Listening Start Chapter 1-2',
        'Tomato TOEIC Compact Listening Part 1',
      ],
      objectives: [
        'Nắm vững quy trình 5 giây quét tranh trước khi băng phát (chủ thể trung tâm, động tác tay/chân/mắt, bối cảnh không gian).',
        'Phân biệt triệt để giữa Hành động đang diễn ra (Action) và Trạng thái đã hoàn tất (State): wearing vs putting on, boarding vs riding.',
        'Bẻ khóa bẫy tử thần "is/are being + V3/ed" trong tranh không có người tác động (nguyên tắc loại trừ 99%).',
        'Làm chủ các cấu trúc mô tả tranh tĩnh vật và cảnh quan bằng thì Hiện tại hoàn thành bị động và Hiện tại đơn bị động.',
      ],
      sections: [
        {
          id: 'l01-s1-5s-observation',
          order: 1,
          title: 'Quy Trình 5 Giây Vàng Quét Tranh Trước Khi Băng Phát',
          sectionType: 'concept',
          contentMarkdown: `Trong Part 1 (6 câu tranh), bạn có khoảng 5 giây giữa các câu để quan sát bức tranh tiếp theo. Nếu chỉ nhìn lướt qua một cách vô thức, não bộ sẽ bị động khi băng phát các phương án A, B, C, D.

**Quy trình quét 3 điểm neo thị giác trong 5 giây:**
1. **Xác định loại tranh**: Tranh có 1 người, nhóm người, hay tranh chỉ có đồ vật / phong cảnh?
2. **Điểm neo hành động (Với tranh người)**: Nhìn nhanh vào **Bàn tay** (đang cầm, nắm, gõ, xách gì?), **Tư thế** (đang đứng, ngồi, cúi, đi bộ?), và **Ánh mắt** (đang nhìn vào màn hình máy tính, nhìn nhau, hay nhìn tài liệu?).
3. **Điểm neo không gian (Với tranh vật/ngoại cảnh)**: Vị trí tương quan giữa các vật thể (bên cạnh, trên kệ, đối diện, xếp chồng), ánh sáng, và trạng thái (trống không, đông đúc).`,
          tipBox: {
            title: 'Quy Tắc Quét Tranh 3 Điểm Neo Thị Giác',
            type: 'rule',
            content:
              'Khi nhìn vào tranh người: Bàn tay đang làm gì? Mắt nhìn đi đâu? Chân đang di chuyển hay đứng yên? 80% câu miêu tả đúng trong Part 1 xoay quanh động từ chỉ hành động của bàn tay hoặc ánh mắt.',
            keySignals: [
              'Tay: typing, holding, carrying, operating, reaching for',
              'Mắt: examining, looking at, reviewing, inspecting',
              'Chân / Tư thế: walking along, standing next to, leaning against',
            ],
          },
          examples: [
            {
              context: 'Văn phòng làm việc (Office Scene)',
              english: 'A woman is reviewing a document while typing on a laptop computer.',
              vietnamese: 'Một người phụ nữ đang xem lại tài liệu trong khi gõ bàn phím trên máy tính xách tay.',
              analysis:
                'Tranh có người: Động từ kết hợp giữa mắt (reviewing a document) và tay (typing on a laptop).',
              highlights: ['reviewing a document', 'typing on a laptop'],
            },
            {
              context: 'Công trường xây dựng (Construction Site)',
              english: 'Construction workers are examining blueprints on a wooden table.',
              vietnamese: 'Các công nhân xây dựng đang nghiên cứu bản thiết kế trên chiếc bàn gỗ.',
              analysis:
                'Nhóm người: Hành động chung của cả nhóm là cùng nhìn chăm chú vào bản thiết kế (examining blueprints).',
              highlights: ['examining blueprints'],
            },
          ],
        },
        {
          id: 'l01-s2-action-vs-state',
          order: 2,
          title: 'Bẫy Phân Biệt Hành Động (Action) vs Trạng Thái (State)',
          sectionType: 'traps',
          contentMarkdown: `Một trong những bẫy kinh điển nhất của ETS là lợi dụng sự nhầm lẫn giữa **Hành động đang diễn ra** (Action in progress) và **Trạng thái cố định** (Completed state).

Ví dụ điển hình nhất:
- **Wearing** (Trạng thái): Quần áo, mũ nón, kính, đồng hồ ĐÃ ĐƯỢC MẶC/ĐỘI SẴN trên người nhân vật.
- **Putting on / Trying on** (Hành động): Nhân vật đang dùng tay xỏ tay vào áo, cầm mũ chuẩn bị đội lên đầu, cài cúc áo.

Nếu trong tranh nhân vật đang ngồi làm việc và đã đội sẵn chiếc mũ bảo hộ trên đầu, phương án *He is putting on a hard hat* là **BẪY SAI HOÀN TOÀN**!`,
          trapAlert: {
            trapName: "Bẫy Hành Động vs Trạng Thái Trang Phục (Wearing vs Putting on)",
            trapLevel: 'high_distractor',
            trapDescription:
              'ETS cố tình dùng các động từ chỉ thao tác mặc đồ (putting on, trying on, tying) cho một bức tranh mà nhân vật đã mặc sẵn trang phục trên người.',
            distractorExample: {
              prompt: 'Tranh người đàn ông đứng cạnh máy photocopy, trên đầu đã đội sẵn mũ bảo hộ và đeo kính.',
              incorrectChoice: 'He is putting on a safety helmet.',
              correctChoice: 'He is wearing protective eyewear.',
              whyDistractorFails:
                'Putting on là động tác tay đang cầm mũ đội lên đầu. Trong tranh hai tay anh ta đang cầm tài liệu, chiếc mũ đã đội sẵn nên chỉ được dùng wearing.',
            },
            antidote:
              'Nhìn nhanh vào bàn tay nhân vật: Nếu hai tay KHÔNG chạm vào mũ/kính/áo để xỏ vào, 100% LOẠI BỎ các phương án có "putting on", "trying on", "taking off".',
          },
          comparisonTable: {
            title: 'Bảng So Sánh Các Cặp Từ Hành Động (Action) vs Trạng Thái (State)',
            headers: ['Động Từ Hành Động (Action - Đang thao tác)', 'Động Từ Trạng Thái (State - Đã hoàn tất)', 'Dấu Hiệu Nhận Biết'],
            rows: [
              {
                colValues: [
                  'is putting on / trying on (đang xỏ/thử đồ)',
                  'is wearing / has on (đang mặc sẵn trên người)',
                  'Tay đang nâng mũ/xỏ tay vào áo vs Quần áo đã yên vị',
                ],
                highlight: true,
                badge: 'Xuất hiện 90%',
              },
              {
                colValues: [
                  'is picking up (cúi xuống nhặt vật lên)',
                  'is holding / carrying (đang cầm/xách vật trên tay)',
                  'Tay vừa chạm vào vật dưới sàn vs Vật đã ở trên tay',
                ],
              },
              {
                colValues: [
                  'is boarding / getting on (đang bước chân lên tàu/xe)',
                  'is riding / is seated in (đã ngồi yên vị trong khoang)',
                  'Một chân trên mặt đất một chân trên bậc thang vs Đã ngồi',
                ],
              },
              {
                colValues: [
                  'is hanging a picture (tay đang đóng đinh/treo tranh)',
                  'a picture is hanging on the wall (tranh đã treo trên tường)',
                  'Có người thao tác với bức tranh vs Tranh tĩnh trên tường',
                ],
              },
            ],
            summaryNote:
              'Quy tắc vàng: Nếu tranh tĩnh hoặc hành động đã kết thúc, ưu tiên các động từ chỉ trạng thái.',
          },
        },
        {
          id: 'l01-s3-deadly-being-trap',
          order: 3,
          title: "Cái Bẫy Tử Thần: 'BEING + V3' Trong Tranh Không Người",
          sectionType: 'traps',
          contentMarkdown: `Trong các câu hỏi miêu tả tranh **chỉ có đồ vật hoặc phong cảnh (hoàn toàn không có người)**, ETS cài đặt một bẫy có tỷ lệ thí sinh mất điểm cao nhất: **Bẫy bị động tiếp diễn (is/are being + V3/ed)**.

Cấu trúc: \`S + is/are being + V3/ed\`
Ý nghĩa: Một hành động ĐANG ĐƯỢC THỰC HIỆN BỞI CON NGƯỜI lên vật thể đó ngay tại thời điểm chụp ảnh.
- *The car is being repaired.* $\\rightarrow$ Bắt buộc phải có người thợ đang cầm cờ-lê sửa xe.
- *The goods are being loaded.* $\\rightarrow$ Bắt buộc phải có công nhân đang bốc hàng lên xe.

**Hậu quả**: Nếu bức tranh chỉ chụp dãy ghế trống trong công viên hoặc kệ hàng trong siêu thị không có bóng dáng người nào, bất kỳ phương án nào phát âm ra chữ \`/ˈbiː.ɪŋ/\` (being) đều là **BẪY SAI NGAY LẬP TỨC**!`,
          trapAlert: {
            trapName: "Bẫy 'BEING + V3' Trong Tranh Không Người (Passive Continuous Trap)",
            trapLevel: 'high_distractor',
            trapDescription:
              'Câu mô tả dùng "is/are being + V3" cho tranh đồ vật để lừa thí sinh chỉ nghe được danh từ (chủ ngữ) đúng.',
            distractorExample: {
              prompt: 'Tranh phòng họp trống, ghế được xếp ngay ngắn quanh bàn tròn, không có ai trong phòng.',
              incorrectChoice: 'Chairs are being arranged around the conference table.',
              correctChoice: 'Chairs have been positioned around the table.',
              whyDistractorFails:
                '"Are being arranged" đòi hỏi phải có bàn tay con người đang dịch chuyển ghế. Tranh tĩnh không người thì hành động này không tồn tại.',
            },
            antidote:
              'QUY TẮC PHẢN XẠ 0.5 GIÂY: Ngay khi mắt thấy tranh KHÔNG CÓ NGƯỜI, tai nghe thấy âm thanh "BEING" (/ˈbiː.ɪŋ/) -> GẠCH BỎ PHƯƠNG ÁN ĐÓ NGAY LẬP TỨC!',
          },
          tipBox: {
            title: "Ngoại Lệ Cực Kỳ Hiếm Của 'Being' Trong Đề Thi TOEIC",
            type: 'warning',
            content:
              'Có 1-2 trường hợp cực hiếm mà "being" xuất hiện với vật thể mà không cần thấy rõ bàn tay con người, nhưng vẫn đúng:',
            keySignals: [
              'The display is being viewed (nếu có khách đứng từ xa ngắm nhìn).',
              'Đặc biệt lưu ý câu đổ bóng tĩnh: "The trees are casting shadows on the lawn" (dùng chủ động casting shadows chứ không dùng being).',
            ],
          },
        },
        {
          id: 'l01-s4-object-scene-structures',
          order: 4,
          title: 'Cấu Trúc Mô Tả Tranh Đồ Vật & Phong Cảnh Chuẩn ETS',
          sectionType: 'rules',
          contentMarkdown: `Đối với tranh tĩnh vật hoặc phong cảnh, phương án đúng thường sử dụng hai cấu trúc ngữ pháp chính:
1. **Hiện tại hoàn thành bị động**: \`S + have/has been + V3/ed\` (Nhấn mạnh trạng thái kết quả sau khi ai đó đã sắp xếp xong).
2. **Hiện tại đơn bị động / Giới từ chỉ vị trí**: \`S + is/are + V3/ed / Prepositional Phrase\`.`,
          formula: {
            pattern: 'Subject (Vật) + have/has been + V3/ed + Prepositional Phrase',
            elements: [
              {
                symbol: 'Subject',
                label: 'Đồ vật / Hàng hóa',
                explanation: 'Danh từ số ít hoặc số nhiều chỉ đồ vật trong hình (chairs, merchandise, boats).',
                color: 'blue',
              },
              {
                symbol: 'have/has been',
                label: 'Trợ động từ hoàn thành bị động',
                explanation: 'Diễn tả trạng thái đã hoàn tất và kết quả lưu lại ở hiện tại.',
                color: 'purple',
              },
              {
                symbol: 'V3/ed',
                label: 'Động từ phân từ',
                explanation: 'Các động từ sắp đặt: stacked, lined up, displayed, parked, arranged.',
                color: 'emerald',
              },
              {
                symbol: 'Prep Phrase',
                label: 'Cụm giới từ chỉ nơi chốn',
                explanation: 'Xác định vị trí: on shelves, against the wall, along the street, at the dock.',
                color: 'amber',
              },
            ],
            notes: 'Ví dụ chuẩn: Merchandise has been displayed on wooden shelves.',
          },
          comparisonTable: {
            title: 'Từ Vựng & Cụm Động Từ Miêu Tả Vật Xuất Hiện 95% Trong Đề Thi',
            headers: ['Cụm Từ Tiếng Anh', 'Nghĩa Tiếng Việt', 'Bối Cảnh Thường Gặp'],
            rows: [
              {
                colValues: [
                  'be stacked / piled up',
                  'được xếp chồng lên nhau',
                  'Hộp carton trong kho, ghế trong góc phòng, tài liệu trên bàn',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'be lined up / in a row',
                  'được xếp thành một hàng dài',
                  'Xe đạp bên lề đường, ghế dài trong công viên, cây cối dọc phố',
                ],
              },
              {
                colValues: [
                  'be propped against',
                  'được dựng tựa vào (tường, cột)',
                  'Chiếc thang dựng tựa vào tòa nhà, xe đạp tựa vào hàng rào',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'be suspended from',
                  'được treo lơ lửng từ (trần nhà)',
                  'Đèn chùm, chậu hoa treo, biển báo tại nhà ga',
                ],
              },
              {
                colValues: [
                  'be unoccupied / vacant',
                  'trống, không có người ngồi/ở',
                  'Ghế công viên không người, bàn ăn nhà hàng trống',
                ],
              },
              {
                colValues: [
                  'overlook the water / harbor',
                  'nhìn ra mặt nước / bến cảng',
                  'Ban công khách sạn, nhà hàng ven sông, cây cầu',
                ],
              },
            ],
          },
        },
        {
          id: 'l01-s5-shortcuts',
          order: 5,
          title: 'Kỹ Thuật Ngón Tay Loại Trừ & Phản Xạ 5 Giây Bỏ Túi',
          sectionType: 'shortcuts',
          contentMarkdown: `Vì Part 1 trôi qua rất nhanh (mỗi câu chỉ khoảng 5 giây), nếu bạn đợi nghe xong cả 4 phương án A, B, C, D mới suy nghĩ thì não bộ sẽ bị lẫn lộn âm thanh.

**Kỹ thuật 4 ngón tay loại trừ (The 4-Finger Method):**
- Đặt 4 ngón tay (ngón trỏ, giữa, áp út, út) tương ứng với 4 phương án A, B, C, D trên mặt bàn hoặc mép tờ đề.
- Khi băng đọc câu A: Nếu nghe thấy từ sai (danh từ không có trong hình, hoặc động từ sai) $\\rightarrow$ **Gập ngón A lại ngay**.
- Khi băng đọc câu B: Nếu thấy có vẻ đúng hoặc chưa chắc chắn $\\rightarrow$ **Giữ nguyên ngón B**.
- Khi băng đọc câu C: Nghe thấy "being" trong tranh không người $\\rightarrow$ **Gập ngón C lại ngay**.
- Khi băng đọc câu D: Nghe thấy danh từ sai $\\rightarrow$ **Gập ngón D lại**.
- Kết quả: Ngón tay nào còn mở duy nhất chính là đáp án đúng!`,
          tipBox: {
            title: 'Bộ Mẹo Bỏ Túi 5 Giây Cho Part 1',
            type: 'shortcut',
            content:
              'Không bao giờ suy diễn vượt quá những gì nhìn thấy trong ảnh. Nếu bức tranh chụp một người đang nhìn vào tài liệu, không được suy luận là "He is angry" hay "He is studying for an exam". Chỉ chọn những gì miêu tả thuần túy chuyển động vật lý.',
            keySignals: [
              'Xuất hiện danh từ lạ không có trong ảnh -> Loại phương án ngay từ 3 từ đầu.',
              'Tranh không người có "is/are being + V3" -> 99% LOẠI BỎ.',
              'Nhân vật đã đội sẵn mũ/mặc sẵn áo mà dùng "putting on" -> LOẠI BỎ.',
            ],
          },
          keyTakeaways: [
            'Dành trọn vẹn 5 giây trước mỗi câu để quét 3 điểm neo: Tay, Mắt, và Bối cảnh.',
            'Phân biệt rõ: Wearing (trạng thái đã mặc) vs Putting on (thao tác đang mặc).',
            'Quy tắc Being: Không có người thì không có being + V3 (loại trừ ngay).',
            'Áp dụng phương pháp 4 ngón tay loại trừ để không bị quên phương án.',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'cp-l01-01',
          order: 1,
          prompt:
            '[Hình ảnh mô tả]: Một người đàn ông mặc áo sơ mi trắng đang ngồi tại bàn làm việc. Chiếc kính cận đã được đeo ngay ngắn trên mắt. Hai bàn tay anh ta đang đặt trên bàn phím máy tính xách tay và mắt nhìn chăm chú vào màn hình.',
          options: [
            { key: 'A', text: 'He is putting on his eyeglasses.' },
            { key: 'B', text: 'He is typing on a keyboard.' },
            { key: 'C', text: 'He is shutting down a laptop computer.' },
            { key: 'D', text: 'He is adjusting his office chair.' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích chi tiết:\n- Phương án A SAI: "is putting on" miêu tả hành động tay đang cầm kính đeo vào mắt (Action). Trong tranh chiếc kính đã được đeo sẵn trên mặt (State), nếu dùng đúng phải là "is wearing eyeglasses". Đây là bẫy kinh điển!\n- Phương án B ĐÚNG: "is typing on a keyboard" miêu tả chính xác chuyển động hai bàn tay của người đàn ông đang đặt trên bàn phím.\n- Phương án C SAI: Không có hành động gập màn hình tắt máy (shutting down).\n- Phương án D SAI: Không có thao tác chỉnh ghế (adjusting his chair).',
          trapSignal: 'Bẫy Hành động vs Trạng thái trang phục (putting on vs wearing)',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l01-02',
          order: 2,
          prompt:
            '[Hình ảnh mô tả]: Một bến cảng lúc hoàng hôn, hoàn toàn không có bóng dáng con người. Một vài chiếc thuyền buồm nhỏ đang được neo đậu cố định dọc theo cầu tàu bằng gỗ.',
          options: [
            { key: 'A', text: 'Passengers are boarding a ferry.' },
            { key: 'B', text: 'Boats are being loaded with cargo.' },
            { key: 'C', text: 'Some vessels are tied up at a pier.' },
            { key: 'D', text: 'The pier is crowded with fishermen.' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích chi tiết:\n- Phương án A SAI: Tranh hoàn toàn không có người, xuất hiện "passengers" và "boarding" là loại ngay.\n- Phương án B SAI: "are being loaded" là thì Bị động tiếp diễn (Passive Continuous). Trong tranh không có công nhân nào đang bốc dỡ hàng, nên sự xuất hiện của âm thanh "being" là BẪY TỬ THẦN!\n- Phương án C ĐÚNG: "Some vessels are tied up at a pier" (Một số tàu thuyền được buộc dây neo đậu tại cầu tàu) miêu tả chính xác trạng thái tĩnh của đồ vật bằng hiện tại đơn bị động.\n- Phương án D SAI: Không có người câu cá (fishermen) và cầu tàu vắng tanh (không hề crowded).',
          trapSignal: 'Bẫy "BEING + V3" trong tranh tĩnh vật không người',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l01-03',
          order: 3,
          prompt:
            '[Hình ảnh mô tả]: Trong nhà kho, một chiếc thang kim loại đang được dựng tựa nghiêng vào một bức tường gạch cao. Dưới sàn có vài chiếc thùng carton được xếp ngay ngắn.',
          options: [
            { key: 'A', text: 'A ladder has been propped against a wall.' },
            { key: 'B', text: 'A worker is climbing up a ladder.' },
            { key: 'C', text: 'Boxes are being unpacked on the floor.' },
            { key: 'D', text: 'Bricks are being laid along the path.' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích chi tiết:\n- Phương án A ĐÚNG: "A ladder has been propped against a wall" (Chiếc thang đã được dựng tựa vào tường) sử dụng chính xác thì Hiện tại hoàn thành bị động chỉ trạng thái và cụm từ ăn điểm "propped against".\n- Phương án B SAI: Không có công nhân nào đang trèo thang (climbing up).\n- Phương án C & D SAI: Bẫy "being unpacked" và "being laid" trong bức tranh không có con người tác động.',
          trapSignal: 'Cụm từ chỉ trạng thái vị trí "propped against" và bẫy "being"',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l01-04',
          order: 4,
          prompt:
            '[Hình ảnh mô tả]: Một người phụ nữ đang đứng trước giá sách trong thư viện, một tay cô ấy đang vươn ra chạm vào gáy một cuốn sách trên kệ cao.',
          options: [
            { key: 'A', text: 'She is checking out books at the front desk.' },
            { key: 'B', text: 'She is reaching for a book on a shelf.' },
            { key: 'C', text: 'She is returning a library card.' },
            { key: 'D', text: 'She is sitting at a study carrel.' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích chi tiết:\n- Phương án A SAI: Không phải ở bàn lễ tân làm thủ tục mượn sách (checking out books at front desk).\n- Phương án B ĐÚNG: "is reaching for a book on a shelf" (đang với tay lấy một cuốn sách trên kệ) miêu tả chuẩn xác động tác của cánh tay.\n- Phương án C SAI: Không có thẻ thư viện (library card).\n- Phương án D SAI: Cô ấy đang đứng chứ không ngồi (sitting).',
          trapSignal: 'Động từ chỉ hành động bàn tay "reaching for"',
          timeTargetSeconds: 5,
        },
      ],
      bridgeToPractice: {
        targetPart: 1,
        partName: 'Part 1: Photographs',
        recommendedQuestionCount: 6,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=1&limit=6&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 6 câu Part 1 Bắt Tranh Thực Chiến',
      },
    },

    // =========================================================================
    // LESSON 02: Part 2 3-Trap Elimination Rules
    // =========================================================================
    {
      id: 'toeic-listening-02-part2-traps',
      moduleId: 'listening-tactics',
      slug: 'part2-trap-elimination',
      order: 2,
      title: 'Quy Tắc Loại Trừ 3 Bẫy Kinh Điển Part 2 (Question - Response)',
      englishTitle: 'Part 2 Mastery: 3-Trap Elimination Rules & Indirect Responses',
      targetPart: 2,
      targetSections: ['listening'],
      difficulty: 'starter',
      estimatedMinutes: 20,
      textbookSources: [
        'Hackers TOEIC Listening Chapter 3',
        'Tomato TOEIC Compact Listening Part 2',
        'Tactics for TOEIC Unit 3-6',
      ],
      objectives: [
        'Làm chủ phản xạ "Đóng băng 3 từ đầu tiên" để định vị chuẩn xác dạng câu hỏi (Wh-, Yes/No, Lời mời/Đề nghị, Trần thuật).',
        'Nhận diện và loại bỏ ngay lập tức 3 bẫy kinh điển: Bẫy từ gần âm/lặp từ (Similar Sound), Bẫy Yes/No cho Wh- Question, Bẫy sai đại từ/thời thì.',
        'Nhận diện các phương án trả lời gián tiếp né tránh (Indirect Responses) - chìa khóa chinh phục mức điểm 800+.',
        'Sử dụng phương pháp loại trừ 3 phương án (A, B, C) bằng kỹ thuật 3 ngón tay.',
      ],
      sections: [
        {
          id: 'l02-s1-first-three-words',
          order: 1,
          title: 'Kỹ Thuật Đóng Băng 3 Từ Đầu Tiên Của Câu Hỏi',
          sectionType: 'rules',
          contentMarkdown: `Đặc điểm đặc thù nhất của Part 2 (25 câu): **ĐỀ THI HOÀN TOÀN TRẮNG TINH, KHÔNG CÓ BẤT KỲ CHỮ NÀO TRÊN GIẤY**. Não bộ bạn phải tiếp nhận câu hỏi qua tai và chỉ có khoảng 5 giây để đưa ra lựa chọn giữa 3 phương án A, B, C.

Nếu bạn cố nghe và dịch toàn bộ câu hỏi dài, não bộ sẽ bị quá tải thông tin.
**Quy tắc vàng 80/20**: **3 từ đầu tiên của câu hỏi quyết định 80% tính chất câu trả lời!**

Các nhóm từ đầu câu cần đóng băng trong tâm trí:
1. **Wh- Questions**:
   - \`Who...\` $\\rightarrow$ Cần nghe: Tên người, Chức danh, Phòng ban, Đại từ.
   - \`Where...\` $\\rightarrow$ Cần nghe: Nơi chốn, Tòa nhà, Ngăn kéo, Vị trí.
   - \`When...\` $\\rightarrow$ Cần nghe: Thời gian, Ngày tháng, Sau khi một sự kiện xảy ra.
   - \`Why...\` $\\rightarrow$ Cần nghe: Lý do (Because, In order to, Due to, hoặc giải thích sự cố).
   - \`How...\` $\\rightarrow$ \`How much/many\` (số lượng/giá cả), \`How often\` (tần suất), \`How long\` (thời lượng), \`How do I...\` (phương thức/cách làm).
2. **Yes/No & Trợ động từ**: \`Is/Are/Was/Were\`, \`Do/Does/Did\`, \`Have/Has/Had\`, \`Can/Could/Should\`.
3. **Lời đề nghị / Yêu cầu**: \`Would you like...\`, \`Why don't we...\`, \`Could you please...\`.
4. **Câu trần thuật (Statement)**: Không có từ để hỏi, đưa ra nhận xét hoặc thông báo sự cố.`,
          formula: {
            pattern: 'Freeze 3 Words (Wh- / Aux / Modal) -> Filter Traps [Similar Sound | Wh- Yes/No | Pronoun Mismatch] -> Safe / Indirect Pick',
            elements: [
              {
                symbol: '1. Freeze First 3 Words',
                label: 'Định vị loại câu',
                explanation: 'Bắt Wh- (Who/Where/When/Why/How), Trợ động từ (Do/Did/Have), hay Lời mời (Would you like).',
                color: 'blue',
              },
              {
                symbol: '2. Filter Trap 1: Echo',
                label: 'Bẫy gần âm / Lặp từ',
                explanation: 'Loại 85% phương án phát âm trùng từ hoặc na ná câu hỏi (copy vs coffee, plan vs plant).',
                color: 'amber',
              },
              {
                symbol: '3. Filter Trap 2: Yes/No',
                label: 'Bẫy Yes/No trên Wh-',
                explanation: 'Câu hỏi Wh- tuyệt đối không trả lời bằng Yes/No/Sure/Of course -> Gạch bỏ ngay 0.1s.',
                color: 'purple',
              },
              {
                symbol: '4. Select Safe / Indirect',
                label: 'Phương án an toàn / gián tiếp',
                explanation: 'Ưu tiên câu gián tiếp né tránh: "Let me check", "I haven\'t heard", "Ask someone else".',
                color: 'emerald',
              },
            ],
            notes: 'Ma trận ra quyết định Part 2: Giơ 3 ngón tay (A, B, C) -> Nghe phương án nào dính 1 trong 3 bẫy thì gập ngay ngón tay đó lại -> Ngón tay còn lại là đáp án chính xác.',
          },
          tipBox: {
            title: 'Phản Xạ Bắt Âm "Where" vs "When"',
            type: 'shortcut',
            content:
              'Hai từ để hỏi này cực kỳ dễ bị nhầm lẫn khi người bản xứ đọc lướt nhanh với tốc độ cao:',
            keySignals: [
              'WHERE có nguyên âm đôi /eə/ mở rộng miệng, âm kéo dài và thường nối âm với trợ động từ: "Where-is" (/weə-rɪz/), "Where-did" (/weə-dɪd/).',
              'WHEN có nguyên âm đơn ngắn /en/, kết thúc dứt khoát bằng âm mũi /n/: "When-is" (/wen-nɪz/), "When-will" (/wen-wɪl/).',
            ],
          },
          examples: [
            {
              context: 'Đóng băng 3 từ đầu tiên (Freeze First 3 Words)',
              english:
                'Question: "When will the construction on the north bridge be completed?"\n(A) "Yes, the bridge is very wide."\n(B) "He works as a construction engineer."\n(C) "It is scheduled to finish by late November."',
              vietnamese:
                'Câu hỏi: "Khi nào việc thi công cây cầu phía bắc sẽ hoàn tất?"\n(A) "Vâng, cây cầu rất rộng." [Bẫy Yes/No cho Wh- Question]\n(B) "Anh ấy làm kỹ sư xây dựng." [Bẫy lặp từ construction & sai đại từ He]\n(C) "Dự kiến sẽ hoàn thành vào cuối tháng 11." [Đáp án đúng]',
              analysis:
                '3 từ đầu tiên "When will the..." xác định ngay cần tìm mốc thời gian. Loại trừ lập tức phương án (A) vì bắt đầu bằng "Yes", loại trừ phương án (B) vì lặp từ "construction" và dùng sai đại từ "He". Phương án (C) cung cấp mốc thời gian chuẩn xác.',
              highlights: ['When will the', 'scheduled to finish by late November'],
            },
          ],
        },
        {
          id: 'l02-s2-similar-sound-trap',
          order: 2,
          title: 'Bẫy 1: Từ Đồng Âm, Gần Âm & Lặp Lại Nguyên Văn (Similar Sound Trap)',
          sectionType: 'traps',
          contentMarkdown: `Đây là chiếc bẫy tinh vi nhất mà người ra đề ETS thiết kế riêng để "trừng phạt" những thí sinh có thói quen **nghe bắt từ bập bõm** (Keyword Matching Fallacy).

Khi một thí sinh nghe câu hỏi không trọn vẹn nhưng bắt được từ "coffee", đến khi nghe các phương án A, B, C, nếu thấy phương án A có từ "copy" (nghe na ná) hoặc lặp lại nguyên văn từ "coffee", thí sinh sẽ cảm thấy quen tai và chọn ngay!

**Thực tế phũ phàng**: Trong 85% trường hợp ở Part 2, **phương án nào lặp lại từ vựng nguyên xi hoặc có âm tiết na ná câu hỏi ĐỀU LÀ BẪY SAI!**`,
          trapAlert: {
            trapName: 'Bẫy Từ Gần Âm & Lặp Từ (Echo Trap)',
            trapLevel: 'high_distractor',
            trapDescription:
              'ETS cố tình đưa vào các từ đồng âm (homophones), từ gần âm (similar sounds), hoặc lặp lại chính xác từ trong câu hỏi nhưng đổi ngữ cảnh nghĩa.',
            distractorExample: {
              prompt: 'Could you make a copy of this financial report?',
              incorrectChoice: 'I prefer black coffee without sugar.',
              correctChoice: 'Sure, how many copies do you need?',
              whyDistractorFails:
                '"coffee" (/ˈkɒf.i/) nghe gần như tương tự "copy" (/ˈkɒp.i/). Thí sinh nghe loáng thoáng âm /kɒf/ sẽ vội vàng chọn đáp án A.',
            },
            antidote:
              'BẬT CẢNH BÁO TỐI CAO: Nghe thấy phương án nào phát âm giống hệt hoặc na ná một từ nổi bật trên câu hỏi -> Hãy nghi ngờ ngay đó là bẫy và kiểm tra nghĩa logic!',
          },
          comparisonTable: {
            title: 'Các Cặp Từ Gần Âm Kinh Điển Thường Xuất Hiện Trong Part 2',
            headers: ['Từ Ở Câu Hỏi', 'Từ Bẫy Ở Phương Án', 'Sự Khác Biệt Nghĩa'],
            rows: [
              {
                colValues: ['copy (bản sao)', 'coffee (cà phê)', 'Văn phòng phẩm vs Đồ uống'],
                highlight: true,
                badge: 'Gặp rất nhiều',
              },
              {
                colValues: ['depart (khởi hành)', 'department (phòng ban)', 'Động từ di chuyển vs Danh từ cơ cấu'],
              },
              {
                colValues: ['walk (đi bộ)', 'work (làm việc)', 'Vận động thể chất vs Hoạt động nghề nghiệp'],
                highlight: true,
              },
              {
                colValues: ['plant (nhà máy / cây)', 'plan (kế hoạch)', 'Cơ sở vật chất vs Dự định'],
              },
              {
                colValues: ['flight (chuyến bay)', 'light (đèn / nhẹ)', 'Giao thông hàng không vs Thiết bị chiếu sáng'],
              },
              {
                colValues: ['produce (nông sản)', 'product (sản phẩm)', 'Hàng rau củ quả vs Đồ sản xuất'],
              },
            ],
          },
          examples: [
            {
              context: 'Bẫy từ gần âm công sở (Office Similar Sound Trap)',
              english:
                'Question: "Could you please help me make a copy of this financial report?"\n(A) "I prefer black coffee without sugar."\n(B) "No, I didn\'t see the reporter."\n(C) "Sure, how many copies do you need?"',
              vietnamese:
                'Câu hỏi: "Bạn có thể giúp tôi phôtô bản báo cáo tài chính này được không?"\n(A) "Tôi thích cà phê đen không đường hơn." [Bẫy gần âm: copy /ˈkɒp.i/ vs coffee /ˈkɒf.i/]\n(B) "Không, tôi không nhìn thấy người phóng viên." [Bẫy lặp gốc từ: report vs reporter]\n(C) "Chắc chắn rồi, bạn cần bao nhiêu bản sao chép?" [Đáp án đúng]',
              analysis:
                'Phương án (A) là bẫy từ gần âm kinh điển (copy vs coffee). Phương án (B) bẫy liên tưởng từ vựng (report -> reporter). Phương án (C) phản hồi tự nhiên và giải quyết trực tiếp yêu cầu giúp đỡ.',
              highlights: ['make a copy', 'how many copies do you need', 'coffee', 'reporter'],
            },
          ],
        },
        {
          id: 'l02-s3-wh-yes-no-trap',
          order: 3,
          title: 'Bẫy 2: Dùng Yes/No Trả Lời Cho Câu Hỏi Wh- (Wh- Yes/No Trap)',
          sectionType: 'traps',
          contentMarkdown: `Một quy tắc ngữ pháp nền tảng trong tiếng Anh nhưng lại là công cụ loại trừ quyền lực nhất trong Part 2:
**CÂU HỎI BẮT ĐẦU BẰNG WH- KHÔNG BAO GIỜ ĐƯỢC PHÉP TRẢ LỜI BẰNG YES / NO / SURE / OF COURSE!**

Các từ để hỏi bắt đầu bằng Wh-:
- \`Who\`, \`Where\`, \`When\`, \`Why\`, \`What\`, \`Which\`, \`How\`.
Các câu hỏi này đòi hỏi thông tin cụ thể (ai, ở đâu, khi nào, lý do gì, như thế nào), chứ không phải xác nhận đúng hay sai.

Ví dụ:
- Hỏi: *"Where did you park your car?"* (Bạn đỗ xe ở đâu?)
- Phương án: *"Yes, in the garage."* $\\rightarrow$ **SAI NGAY TỪ CHỮ YES!** Cho dù vế sau "in the garage" là nơi chốn hoàn toàn hợp lý, nhưng chỉ cần có "Yes" đứng đầu thì câu này là rác!`,
          trapAlert: {
            trapName: 'Bẫy Yes/No Cho Câu Hỏi Wh- & Câu Hỏi Lựa Chọn',
            trapLevel: 'common',
            trapDescription:
              'Phương án bắt đầu bằng Yes, No, Sure, Of course, Definitely cho một câu hỏi đòi hỏi thông tin chi tiết (Wh-).',
            distractorExample: {
              prompt: 'When is the new branch opening in Chicago?',
              incorrectChoice: 'Yes, it opened last week.',
              correctChoice: 'Sometime around mid-November.',
              whyDistractorFails:
                'Câu hỏi "When" hỏi về thời gian. Dùng "Yes" để mở đầu câu trả lời là vi phạm quy tắc hội thoại cơ bản.',
            },
            antidote:
              'QUY TẮC 0.1 GIÂY: Nghe câu hỏi là Wh- (Who, Where, When, Why, What, How) hoặc câu hỏi lựa chọn (Would you prefer tea OR coffee?) -> Bất kỳ phương án nào phát ra chữ "Yes", "No", "Sure", "Certainly" -> GẠCH BỎ NGAY LẬP TỨC KHÔNG CẦN NGHE ĐOẠN SAU!',
          },
          examples: [
            {
              context: 'Bẫy Yes/No cho câu hỏi Wh- (Wh- Question Elimination)',
              english:
                'Question: "Where did Ms. Tanaka leave the signed client agreements?"\n(A) "Yes, she signed them this morning."\n(B) "Mr. Tanaka is out of town today."\n(C) "In the blue folder on your desk."',
              vietnamese:
                'Câu hỏi: "Cô Tanaka đã để các hợp đồng khách hàng đã ký ở đâu?"\n(A) "Vâng, cô ấy đã ký chúng sáng nay." [Bẫy Yes/No cho câu hỏi Where]\n(B) "Ông Tanaka hôm nay đi công tác rồi." [Bẫy sai chức danh/đối tượng Ms. vs Mr.]\n(C) "Trong tập hồ sơ màu xanh trên bàn của bạn." [Đáp án đúng]',
              analysis:
                'Câu hỏi bắt đầu bằng "Where" (ở đâu) tuyệt đối không trả lời bằng "Yes" -> Gạch bỏ phương án (A) trong 0.1 giây. Phương án (B) bẫy lặp họ Tanaka nhưng đổi từ Ms. sang Mr. Phương án (C) cung cấp chính xác vị trí nơi chốn.',
              highlights: ['Where did', 'signed client agreements', 'In the blue folder'],
            },
          ],
        },
        {
          id: 'l02-s4-pronoun-tense-trap',
          order: 4,
          title: 'Bẫy 3: Sai Đại Từ Nhân Xưng & Lệch Thì Thời Gian',
          sectionType: 'traps',
          contentMarkdown: `Bẫy thứ ba nhắm vào sự lỏng lẻo trong việc theo dõi thông tin của thí sinh:
1. **Lệch Đại từ nhân xưng (Pronoun mismatch)**:
   - Câu hỏi hỏi về một người phụ nữ: *"Did Ms. Jenkins submit the financial audit?"*
   - Phương án bẫy: *"Yes, HE submitted it yesterday."* (Dùng sai "he" thay vì "she").
   - Câu hỏi hỏi về một người cụ thể: *"Is Mr. Tanaka coming to the banquet?"*
   - Phương án bẫy: *"THEY said it was delicious."* (Dùng "they" không ăn nhập).
2. **Lệch Thì thời gian (Tense mismatch)**:
   - Câu hỏi hỏi về sự việc đã kết thúc trong quá khứ: *"Did you attend yesterday's orientation?"*
   - Phương án bẫy: *"I will definitely sign up tomorrow."* (Lệch thì sang tương lai).`,
          trapAlert: {
            trapName: 'Bẫy Lệch Đại Từ & Thời Thì',
            trapLevel: 'subtle',
            trapDescription:
              'Phương án nghe có vẻ rất thuận tai nhưng sử dụng sai đại từ chỉ đối tượng (he/she/they) hoặc sai mốc thời gian (quá khứ vs tương lai).',
            distractorExample: {
              prompt: 'Has Mr. Gomez finished repairing the air conditioner?',
              incorrectChoice: 'She said it needs a new filter.',
              correctChoice: 'He is still working on it.',
              whyDistractorFails:
                'Chủ ngữ là "Mr. Gomez" (nam giới, ngôi thứ 3 số ít). Phương án bẫy dùng đại từ "She".',
            },
            antidote:
              'Khớp nhanh 2 tọa độ: Đối tượng là Ai (nam/nữ/số nhiều) và Sự việc xảy ra Khi nào (đã làm, đang làm, hay chưa làm).',
          },
        },
        {
          id: 'l02-s5-shortcuts',
          order: 5,
          title: 'Vũ Khí Thượng Thừa: Câu Trả Lời Gián Tiếp (Indirect Safe Answers)',
          sectionType: 'shortcuts',
          contentMarkdown: `Trong các đề thi TOEIC từ 2024 đến 2026, ETS đã giảm tỷ lệ câu trả lời trực tiếp (Hỏi đâu trả lời đó) xuống chỉ còn khoảng 50%. 50% còn lại là các **Câu trả lời gián tiếp / né tránh (Indirect Responses)**. Đây chính là công cụ phân loại điểm số giữa mức 600 và 800+.

So sánh:
- Hỏi: *"Where is the quarterly marketing report?"*
- Trả lời trực tiếp (Dễ, band 500): *"On your desk."*
- Trả lời gián tiếp (Khó, band 800+): *"Hasn't Susan emailed it to you yet?"* (Hỏi ngược lại) hoặc *"I just got back from annual leave today."* (Nêu lý do không biết).

**Đặc điểm nhận diện**: Dù câu hỏi là gì, những mẫu câu thể hiện sự không chắc chắn, đẩy trách nhiệm cho người khác, hoặc thông báo chưa có quyết định **99% XUẤT HIỆN LÀ ĐÁP ÁN ĐÚNG!**`,
          tipBox: {
            title: 'Kho Mẫu Câu Trả Lời Gián Tiếp - Xuất Hiện Là Chọn Ngay!',
            type: 'shortcut',
            content:
              'Khi phân vân giữa các phương án, nếu nghe thấy một trong các nhóm câu sau, hãy tự tin chọn ngay vì tỷ lệ đúng lên tới 99%:',
            keySignals: [
              'Nhóm 1 - "Tôi không biết / Chưa chắc": I\'m not really sure / I have no idea / I didn\'t know that.',
              'Nhóm 2 - "Để tôi kiểm tra": Let me check the schedule / Let me find out / I\'ll look into it.',
              'Nhóm 3 - "Hỏi người khác đi": You should ask Sarah / Why don\'t you check with HR? / Talk to the manager.',
              'Nhóm 4 - "Chưa quyết định / Chưa công bố": It hasn\'t been decided yet / They haven\'t announced it yet.',
              'Nhóm 5 - Bác bỏ tiền đề: "Didn\'t you hear? It was canceled" / "The meeting was postponed".',
            ],
          },
          examples: [
            {
              context: 'Câu trả lời gián tiếp né tránh (Indirect Safe Responses)',
              english:
                'Question: "Who was chosen to lead the European marketing campaign?"\n(A) "Yes, it was a very successful campaign."\n(B) "To increase international sales."\n(C) "They haven\'t announced the committee\'s decision yet."',
              vietnamese:
                'Câu hỏi: "Ai đã được chọn để dẫn dắt chiến dịch tiếp thị châu Âu?"\n(A) "Vâng, đó là một chiến dịch rất thành công." [Bẫy Yes/No + lặp từ campaign]\n(B) "Để tăng doanh số bán hàng quốc tế." [Bẫy trả lời cho câu hỏi mục đích Why]\n(C) "Họ vẫn chưa công bố quyết định của ủy ban." [Đáp án đúng: Gián tiếp né tránh]',
              analysis:
                'Câu hỏi "Who" nhưng phương án đúng không đưa ra tên người cụ thể mà dùng mẫu câu gián tiếp an toàn "They haven\'t announced... yet" (Chưa công bố). Cấu trúc né tránh trách nhiệm/thông tin chưa chốt có xác suất đúng 99% trong TOEIC.',
              highlights: ['Who was chosen', 'haven\'t announced', 'decision yet'],
            },
          ],
          keyTakeaways: [
            'Đóng băng 3 từ đầu tiên: Xác định ngay dạng câu hỏi và từ để hỏi.',
            'Loại bỏ 85% phương án có từ lặp lại hoặc từ gần âm với câu hỏi.',
            'Wh- questions thì 100% không trả lời bằng Yes/No/Sure.',
            'Tự tin chọn các câu trả lời gián tiếp: "Let me check", "I\'m not sure", "Ask someone else".',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'cp-l02-01',
          order: 1,
          prompt: '[Audio Question]: "Where did you leave the spare keys to the supply closet?"',
          options: [
            { key: 'A', text: 'Yes, in the top drawer.' },
            { key: 'B', text: 'He leaves the office at five o\'clock.' },
            { key: 'C', text: 'I think Mark has them right now.' },
            { key: 'D', text: 'To buy some extra office supplies.' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích chi tiết:\n- Câu hỏi bắt đầu bằng "Where" (Ở đâu) -> Cần thông tin về nơi chốn hoặc người đang giữ chìa khóa.\n- Phương án A SAI: Câu hỏi Wh- ("Where") KHÔNG BAO GIỜ trả lời bằng "Yes" (Bẫy Yes/No).\n- Phương án B SAI: Bẫy lặp từ "leaves" (nghe giống "leave" trong câu hỏi nhưng đổi nghĩa thành rời văn phòng) và bẫy sai đại từ "He" trong khi câu hỏi hỏi "you".\n- Phương án C ĐÚNG: "I think Mark has them right now" (Tôi nghĩ hiện Mark đang giữ chúng) là câu trả lời gián tiếp an toàn cung cấp người đang cầm chìa khóa.\n- Phương án D SAI: Bẫy trả lời cho câu hỏi mục đích "Why" (To buy...).',
          trapSignal: 'Bẫy Yes/No cho Wh- Question & Bẫy lặp từ "leave"',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l02-02',
          order: 2,
          prompt: '[Audio Question]: "When is the final inspection of the new laboratory scheduled?"',
          options: [
            { key: 'A', text: 'Yes, it was thoroughly inspected.' },
            { key: 'B', text: 'The spectrometer is very modern.' },
            { key: 'C', text: 'At the main hospital building downtown.' },
            { key: 'D', text: 'Let me double-check the project calendar.' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích chi tiết:\n- Câu hỏi bắt đầu bằng "When" (Khi nào) -> Cần thông tin thời gian.\n- Phương án A SAI: Bẫy Yes/No cho câu hỏi Wh- ("When") và bẫy lặp lại từ "inspected".\n- Phương án B SAI: Lạc đề, mô tả thiết bị trong phòng thí nghiệm.\n- Phương án C SAI: Trả lời cho câu hỏi nơi chốn "Where" (At the main hospital building), không trả lời cho "When".\n- Phương án D ĐÚNG: "Let me double-check the project calendar" (Để tôi kiểm tra lại lịch trình dự án) là câu trả lời gián tiếp kinh điển (mẫu câu Let me check), 99% xuất hiện là đáp án đúng.',
          trapSignal: 'Mẫu câu an toàn gián tiếp "Let me check" & Bẫy Wh- Yes/No',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l02-03',
          order: 3,
          prompt: '[Audio Question]: "Could you help me move these filing cabinets into Room 204?"',
          options: [
            { key: 'A', text: 'I moved here about two years ago.' },
            { key: 'B', text: 'Room 204 is painted blue.' },
            { key: 'C', text: 'I have a client meeting starting in five minutes.' },
            { key: 'D', text: 'The coffee machine is around the corner.' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích chi tiết:\n- Câu hỏi đưa ra lời yêu cầu giúp đỡ: "Could you help me move...?"\n- Phương án A SAI: Bẫy lặp từ "moved" nhưng đổi sang nghĩa dọn nhà đến đây sống.\n- Phương án B SAI: Bẫy lặp từ "Room 204" nhưng đưa thông tin màu sơn lạc lõng không giải quyết lời đề nghị.\n- Phương án C ĐÚNG: "I have a client meeting starting in five minutes" (Tôi có cuộc họp với khách hàng bắt đầu sau 5 phút nữa) là lời từ chối khéo léo và gián tiếp (đưa ra lý do bận việc không thể giúp ngay).\n- Phương án D SAI: Hoàn toàn không liên quan đến việc chuyển tủ hồ sơ.',
          trapSignal: 'Bẫy lặp từ "move" & Câu từ chối khéo léo gián tiếp',
          timeTargetSeconds: 5,
        },
        {
          id: 'cp-l02-04',
          order: 4,
          prompt: '[Audio Question]: "The photocopier on the third floor is out of paper again, isn\'t it?"',
          options: [
            { key: 'A', text: 'I prefer to make black and white copies.' },
            { key: 'B', text: 'No, he didn\'t receive the document.' },
            { key: 'C', text: 'The third floor is currently under construction.' },
            { key: 'D', text: 'There are several extra reams in the supply room.' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích chi tiết:\n- Câu hỏi dạng câu hỏi đuôi / trần thuật thông báo máy photocopy hết giấy.\n- Phương án A SAI: Bẫy từ gần âm / liên tưởng "photocopier" -> "copies".\n- Phương án B SAI: Bẫy sai đại từ nhân xưng "he" (câu hỏi nói về máy móc "the photocopier", không hề có người đàn ông nào).\n- Phương án C SAI: Bẫy lặp từ "third floor" nhưng thông tin công trường không ăn nhập với việc máy hết giấy.\n- Phương án D ĐÚNG: "There are several extra reams in the supply room" (Có vài ram giấy dự phòng trong phòng kho đấy) phản hồi trực tiếp giải pháp giải quyết vấn đề hết giấy.',
          trapSignal: 'Phản hồi logic tình huống & Bẫy sai đại từ nhân xưng',
          timeTargetSeconds: 5,
        },
      ],
      bridgeToPractice: {
        targetPart: 2,
        partName: 'Part 2: Question - Response',
        recommendedQuestionCount: 25,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=2&limit=25&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 25 câu Part 2 Hỏi - Đáp Thực Chiến',
      },
    },

    // =========================================================================
    // LESSON 03: Part 3 Pre-Reading & Paraphrasing
    // =========================================================================
    {
      id: 'toeic-listening-03-part3-conversations',
      moduleId: 'listening-tactics',
      slug: 'part3-prereading-paraphrase',
      order: 3,
      title: 'Kỹ Thuật Đón Đầu Băng 1 Nhịp & Bắt Sóng Paraphrase (Part 3 Conversations)',
      englishTitle: 'Part 3 Tactics: The 30s Pre-Reading Rhythm, Positioning & Paraphrase Decoding',
      targetPart: 3,
      targetSections: ['listening'],
      difficulty: 'intermediate',
      estimatedMinutes: 20,
      textbookSources: [
        'Tactics for TOEIC Listening Unit 7-8',
        'Hackers TOEIC Listening Chapter 4-5',
        'Tomato TOEIC Compact Listening Part 3',
      ],
      objectives: [
        'Thiết lập nhịp thở chuẩn ETS: Kỹ thuật 30 giây đọc trước câu hỏi (Pre-Reading Rhythm) - làm chủ bài thi thay vì bị băng dẫn dắt.',
        'Định vị tọa độ 3 câu hỏi tương ứng 3 phần của đoạn hội thoại: Mở đầu (Overview/Purpose) -> Thân bài (Problem/Detail) -> Kết thúc (Action/Next Step).',
        'Bẻ khóa cơ chế Paraphrasing (thay thế từ đồng nghĩa) giữa đoạn nghe và phương án chữ.',
        'Nhận diện vai trò người nói (Speaker Roles) và tránh bẫy bắt chữ y hệt (Literal Word Echo Trap) cùng bẫy đổi ý phút chót.',
      ],
      sections: [
        {
          id: 'l03-s1-30s-prereading',
          order: 1,
          title: 'Chiến Lược "Đi Trước Băng 1 Nhịp" (The 30-Second Pre-Reading Rhythm)',
          sectionType: 'concept',
          contentMarkdown: `Bi kịch lớn nhất của thí sinh thi Part 3 là **"chạy theo đuôi băng"**: vừa nghe hai người nói chuyện, vừa căng mắt đọc câu hỏi và 4 phương án $\\rightarrow$ Não bộ rơi vào trạng thái quá tải nhận thức, lỡ mất thông tin của câu 2 và câu 3, sau đó tiếp tục cuống cuồng đọc đề của đoạn tiếp theo trong khi băng đã nói được một nửa.

**Giải pháp sống còn: Quy tắc "Đi trước băng 1 nhịp":**
1. **0 - 30 giây mở đầu Part 3**: Khi máy đọc phần hướng dẫn "Directions: You will hear some conversations...", TUYỆT ĐỐI KHÔNG NGHE DIRECTIONS! Hãy dùng 30 giây này đọc lướt thật nhanh bộ 3 câu hỏi đầu tiên (Q32 - Q34).
2. **Trong khi hội thoại đang phát (30-40 giây)**: Tai lắng nghe, mắt nhìn vào 3 câu hỏi để bắt từ khóa. Ngón tay giữ vị trí đáp án nhẩm trong đầu hoặc chấm nhẹ trên giấy thi.
3. **Khi máy bắt đầu đọc câu hỏi**: "Number 32: What are the speakers discussing?... Number 33: What problem does the woman mention?..." $\\rightarrow$ **LÚC NÀY BẠN ĐÃ TÔ XONG CẢ 3 CÂU VÀ ĐANG DÙNG TOÀN BỘ 30 GIÂY NÀY ĐỂ ĐỌC TRƯỚC BỘ 3 CÂU TIẾP THEO (Q35 - Q37)!**`,
          tipBox: {
            title: 'Quy Tắc Buông Bỏ Cứu Vãn Toàn Bộ Bài Thi',
            type: 'warning',
            content:
              'Nếu lỡ không nghe được 1 câu hỏi, hãy chọn bừa trong 2 giây và BUÔNG BỎ NGAY LẬP TỨC! Tuyệt đối không ngồi suy nghĩ chần chừ trong thời gian máy đọc câu hỏi. Nếu mất 30 giây đọc trước của bài tiếp theo, bạn sẽ kích hoạt "hiệu ứng domino" sụp đổ toàn bộ Part 3 và Part 4!',
            keySignals: [
              'Băng đọc xong hội thoại -> Tô đáp án trong 5 giây.',
              'Băng đọc câu hỏi Q1, Q2, Q3 -> Chuyển mắt đọc trước đoạn tiếp theo.',
              'Không bao giờ vừa nghe vừa dịch 16 phương án chữ.',
            ],
          },
        },
        {
          id: 'l03-s2-three-question-positioning',
          order: 2,
          title: 'Quy Luật Định Vị 3 Tọa Độ Trong Hội Thoại (Beginning - Middle - End)',
          sectionType: 'rules',
          contentMarkdown: `Trong 90% các bài hội thoại Part 3 của ETS, thứ tự của 3 câu hỏi trên giấy thi **CHẠY TRÙNG KHỚP VỚI TIẾN TRÌNH THỜI GIAN CỦA CUỘC HỘI THOẠI**:

- **Câu 1: Câu hỏi Tổng quan (Overview / Gist)**: Xuất hiện ở **1 - 2 lượt thoại đầu tiên**.
  - Hỏi về Chủ đề: *What are the speakers discussing?*
  - Hỏi về Mục đích gọi điện: *Why is the woman calling?*
  - Hỏi về Nghề nghiệp / Nơi chốn: *Where do the speakers most likely work? / Who is the man?*
- **Câu 2: Câu hỏi Chi tiết hoặc Vấn đề (Specific Detail / Problem)**: Xuất hiện ở **phần giữa hội thoại**.
  - Hỏi về trục trặc: *What problem does the man mention?*
  - Dấu hiệu chuyển ý (Pivot words) cần chú ý cao độ: \`However\`, \`Unfortunately\`, \`The problem is\`, \`Actually\`.
- **Câu 3: Câu hỏi Hành động tiếp theo hoặc Đề xuất (Next Step / Offer / Suggestion)**: Xuất hiện ở **1 - 2 lượt thoại cuối cùng**.
  - Hỏi về việc sắp làm: *What will the woman probably do next?*
  - Hỏi về lời đề nghị: *What does the man offer to do?*
  - Dấu hiệu ngôn ngữ: \`Why don't you...\`, \`I will...\`, \`Could you please...\`, \`Let me...\`.`,
          formula: {
            pattern: 'Beginning (Overview/Purpose) -> Middle (Problem/Pivot) -> End (Action/Offer)',
            elements: [
              {
                symbol: 'Beginning (1-2 lines)',
                label: 'Câu hỏi 1',
                explanation: 'Nơi chốn, danh tính người nói, lý do gọi điện hoặc chủ đề cuộc họp.',
                color: 'blue',
              },
              {
                symbol: 'Middle (Pivot words)',
                label: 'Câu hỏi 2',
                explanation: 'Chi tiết sự cố, nguyên nhân trục trặc (bắt sóng: But, Unfortunately, Actually).',
                color: 'amber',
              },
              {
                symbol: 'End (Last 2 lines)',
                label: 'Câu hỏi 3',
                explanation: 'Hành động kế tiếp (What will do next?), lời hứa, đề xuất hỗ trợ.',
                color: 'emerald',
              },
            ],
            notes: 'Mắt luôn dịch chuyển dần từ Câu 1 xuống Câu 3 theo nhịp trao đổi của hai nhân vật.',
          },
          examples: [
            {
              context: 'Dịch vụ khách hàng & Hậu cần (Customer Service & Logistics)',
              english:
                'Man: "Good afternoon, Apex Electronics. How may I direct your call?"\nWoman: "Hello, I\'m calling about order number 408 for ten office monitors. They were supposed to arrive yesterday, but our loading dock hasn\'t received anything yet."\nMan: "Let me check the tracking status right away... Ah, it appears the shipment was delayed due to severe road closures. I will contact the dispatch team immediately and email you an updated delivery time."',
              vietnamese:
                'Nam: "Xin chào buổi chiều, Điện tử Apex xin nghe. Tôi có thể chuyển máy cho bạn tới ai ạ?"\nNữ: "Xin chào, tôi gọi về đơn hàng số 408 gồm 10 màn hình văn phòng. Hàng dự kiến giao hôm qua, nhưng khu vực bốc dỡ hàng của chúng tôi vẫn chưa nhận được gì cả."\nNam: "Để tôi kiểm tra trạng thái vận đơn ngay... À, có vẻ lô hàng bị hoãn do tắc nghẽn giao thông nghiêm trọng. Tôi sẽ liên hệ với đội điều phối ngay lập tức và gửi email cho bạn thời gian giao hàng cập nhật."',
              analysis:
                '- Tọa độ 1 (Mở đầu - Câu 1): Mục đích cuộc gọi (calling about order #408 -> order status inquiry).\n- Tọa độ 2 (Thân bài - Câu 2): Vấn đề phát sinh (supposed to arrive yesterday, hasn\'t received anything -> delivery delay due to road closures).\n- Tọa độ 3 (Kết bài - Câu 3): Hành động kế tiếp (contact dispatch team and email updated delivery time -> notify the customer).',
              highlights: [
                'calling about order number 408',
                'hasn\'t received anything yet',
                'shipment was delayed',
                'contact the dispatch team immediately',
              ],
            },
          ],
        },
        {
          id: 'l03-s3-paraphrase-thesaurus',
          order: 3,
          title: 'Từ Điển Paraphrasing Cốt Lõi Part 3 (Audio vs Written)',
          sectionType: 'comparison',
          contentMarkdown: `Kỹ thuật cốt lõi để đạt 800+ Listening là nhận diện **Paraphrasing (Diễn giải bằng từ đồng nghĩa)**. ETS hiếm khi để từ ngữ trong Audio xuất hiện y hệt 100% trong phương án đúng. Ngược lại, phương án đúng thường được thay thế bằng một từ đồng nghĩa trang trọng và tổng quát hơn.`,
          comparisonTable: {
            title: 'Bảng Đối Chiếu Paraphrasing Xuất Hiện Nhiều Nhất Trong Đề ETS',
            headers: ['Từ Nghe Thấy Trong Audio', 'Từ Viết Trong Đáp Án Đúng', 'Chủ Điểm Ngữ Cảnh'],
            rows: [
              {
                colValues: [
                  'give a 20% discount / lower the price',
                  'offer a reduced rate',
                  'Đàm phán giá cả / Mua sắm',
                ],
                highlight: true,
                badge: 'Tần suất rất cao',
              },
              {
                colValues: [
                  'renovate the lobby / repaint the office',
                  'remodel a workspace / refurbishment',
                  'Cơ sở vật chất văn phòng',
                ],
              },
              {
                colValues: [
                  'meeting moved to Friday / postponed',
                  'reschedule an appointment / schedule change',
                  'Quản lý thời gian / Lịch họp',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'photocopier is broken / not working',
                  'equipment malfunction / out of order',
                  'Sự cố thiết bị công sở',
                ],
              },
              {
                colValues: [
                  'submit your resume and portfolio',
                  'send job application materials',
                  'Tuyển dụng & Phỏng vấn',
                ],
              },
              {
                colValues: [
                  'hire three more accountants',
                  'recruit additional personnel / staff',
                  'Nhân sự công ty',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'discuss contract terms / reach an agreement',
                  'negotiate a contract',
                  'Hợp tác kinh doanh',
                ],
              },
            ],
            summaryNote:
              'Phương châm làm bài: Nghe từ chi tiết trong Audio -> Tìm từ tổng quát / đồng nghĩa trong Đáp án.',
          },
          examples: [
            {
              context: 'Cơ sở vật chất & Mở rộng văn phòng (Facilities Management)',
              english:
                'Woman: "Our design team has expanded significantly this quarter, and we\'ve completely run out of desk space in the main studio."\nMan: "Why don\'t we convert the old storage archive on the fourth floor into additional workstations?"\nWoman: "That sounds like a practical solution. Let\'s draft a budget proposal for the refurbishment."',
              vietnamese:
                'Nữ: "Đội ngũ thiết kế của chúng ta đã mở rộng đáng kể trong quý này, và chúng ta đã hoàn toàn hết chỗ kê bàn làm việc ở xưởng chính rồi."\nNam: "Sao chúng ta không chuyển đổi kho lưu trữ cũ ở tầng 4 thành các bàn làm việc bổ sung nhỉ?"\nNữ: "Nghe có vẻ là một giải pháp thiết thực đấy. Hãy cùng soạn thảo bản đề xuất ngân sách cho việc tu sửa nhé."',
              analysis:
                '- Audio: "run out of desk space" -> Paraphrased in Question as "The department requires more workspace."\n- Audio: "convert the old storage archive... into additional workstations" -> Paraphrased in Options as "remodel an existing room".\n- Audio: "draft a budget proposal for the refurbishment" -> Paraphrased as "submit a cost estimate".',
              highlights: [
                'run out of desk space',
                'convert the old storage archive',
                'budget proposal for the refurbishment',
              ],
            },
          ],
        },
        {
          id: 'l03-s4-literal-trap-and-mind-change',
          order: 4,
          title: 'Bẫy Bắt Chữ Y Hệt (Literal Trap) vs Bẫy Đổi Ý Phút Chót',
          sectionType: 'traps',
          contentMarkdown: `Trong Part 3, có hai dạng bẫy mà người học thường xuyên mắc phải nếu chỉ nghe hời hợt:
1. **Bẫy Bắt chữ y hệt (Literal Word Echo Trap)**: Phương án sai chứa từ ngữ giống hệt trong đoạn băng, nhưng mang ý nghĩa bị phủ định hoặc chỉ là chi tiết phụ không giải quyết câu hỏi.
2. **Bẫy Đổi ý phút chót (Mind Change Trap)**: Người nói A đề xuất một phương án (ví dụ: đặt bàn vào thứ Năm). Thí sinh nghe thấy vội vàng chọn thứ Năm. Nhưng ngay sau đó, người nói B báo bận, và người A chốt lại: "Vậy chuyển sang thứ Sáu nhé". Đáp án đúng phải là thứ Sáu!`,
          trapAlert: {
            trapName: 'Bẫy Bắt Chữ Y Hệt (Literal Word Echo Distractor)',
            trapLevel: 'high_distractor',
            trapDescription:
              'Phương án sử dụng nguyên xi từ ngữ xuất hiện trong đoạn hội thoại nhưng gắn với trạng thái đã bị hủy bỏ hoặc phủ định.',
            distractorExample: {
              prompt:
                'Audio: "We originally considered hiring an outside consultant to audit the accounting department, but due to budget cuts, we decided to conduct the review internally."',
              incorrectChoice: 'To hire an outside consultant.',
              correctChoice: 'To conduct an internal review.',
              whyDistractorFails:
                '"outside consultant" nghe rất to và rõ ràng, nhưng bị vô hiệu hóa bởi cụm "originally considered... but due to budget cuts".',
            },
            antidote:
              'Luôn cảnh giác cao độ với các từ chỉ sự đổi ý hoặc điều kiện: originally (ban đầu định), used to (từng), but (nhưng), instead (thay vào đó).',
          },
          examples: [
            {
              context: 'Bẫy đổi ý phút chót trong đàm phán lịch trình (Mind Change Trap)',
              english:
                'Man: "Should we book the conference room for our client presentation on Thursday morning?"\nWoman: "Thursday morning looks clear on my schedule, so that should work."\nMan: "Actually, I just remembered our regional director is flying in Thursday at ten. Let\'s push our session to Friday afternoon instead."\nWoman: "Good catch. I will send out the revised calendar invite right away."',
              vietnamese:
                'Nam: "Chúng ta có nên đặt phòng hội thảo cho bài thuyết trình với khách hàng vào sáng thứ Năm không?"\nNữ: "Sáng thứ Năm lịch của tôi trống, thế nên chắc là được đấy."\nNam: "Thực ra, tôi vừa nhớ ra giám đốc khu vực sẽ bay đến vào 10 giờ thứ Năm. Chúng ta hãy chuyển phiên họp sang chiều thứ Sáu thay vào đó nhé."\nNữ: "May mà anh nhớ ra. Tôi sẽ gửi thư mời lịch họp đã sửa đổi ngay lập tức."',
              analysis:
                '- Thí sinh nghe thấy "Thursday morning" ở lượt thoại đầu sẽ vội vàng chọn đáp án Thứ Năm (BẪY).\n- Người nam đổi ý bằng cụm từ tín hiệu: "Actually, I just remembered... Let\'s push our session to Friday afternoon instead".\n- Đáp án đúng cho câu hỏi "When will the presentation be held?" phải là Friday afternoon.',
              highlights: [
                'Thursday morning',
                'Actually, I just remembered',
                'push our session to Friday afternoon instead',
              ],
            },
          ],
        },
        {
          id: 'l03-s5-shortcuts',
          order: 5,
          title: 'Kỹ Thuật Phân Tách Giọng Nói (Speaker Attribution)',
          sectionType: 'shortcuts',
          contentMarkdown: `Trong mỗi câu hỏi của Part 3, hãy chú ý đến **chủ ngữ của câu hỏi**:
- \`What does the woman ask the man to do?\` $\\rightarrow$ Cần tập trung cao độ khi **GIỌNG NỮ (Woman)** cất tiếng đưa ra yêu cầu!
- \`What does the man suggest?\` $\\rightarrow$ Cần tập trung khi **GIỌNG NAM (Man)** đưa ra lời khuyên!
- \`What will the woman probably do next?\` $\\rightarrow$ Tập trung vào lời hứa của **GIỌNG NỮ** ở cuối hội thoại.

Việc phân biệt trước giới tính người nói giúp bạn biết chính xác thời điểm nào trong đoạn hội thoại là lúc thông tin quan trọng nhất được phát ra.`,
          tipBox: {
            title: 'Mẹo Bắt Dấu Hiệu Giọng Nói Trong Đề Thi',
            type: 'shortcut',
            content:
              'Khi đọc lướt câu hỏi trong 30 giây chuẩn bị, hãy dùng bút gạch chân ngay từ "man" hoặc "woman" trong đề. Khi băng chạy, nếu câu hỏi hỏi về "woman", tai bạn sẽ tự động tăng cường độ tập trung gấp đôi mỗi khi giọng nữ cất lên.',
            keySignals: [
              'What does the woman imply... -> Tập trung nghe giọng Nữ.',
              'What will the man do next... -> Tập trung nghe giọng Nam ở cuối bài.',
              'According to the speakers... -> Cả hai người đều có thể cung cấp thông tin.',
            ],
          },
          keyTakeaways: [
            'Luôn "đi trước băng 1 nhịp": Dùng thời gian đọc câu hỏi của đoạn trước để đọc trước đề đoạn sau.',
            'Cấu trúc 3 tọa độ: Câu 1 ở đầu, Câu 2 ở giữa (tìm pivot words), Câu 3 ở cuối.',
            'Nghe từ chi tiết trong Audio -> Tìm từ Paraphrase tổng quát trong Đáp án.',
            'Cảnh giác với bẫy đổi ý phút chót (originally, but, instead).',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'cp-l03-01',
          order: 1,
          prompt:
            '[Questions 1-3 refer to the following conversation]\n\nWhere do the speakers most likely work?',
          passage:
            'Woman: Marcus, have you had a chance to review the catering contract for the annual banquet at the Riverside Hotel?\nMan: Yes, Ms. Vance. The prices look reasonable, but they noted that the main ballroom is undergoing minor renovations until October fifteenth.\nWoman: That might be cutting it close since our banquet is scheduled for October eighteenth. Could you please call the banquet coordinator to verify whether the construction noise will be completely cleared by then?\nMan: Absolutely. I will get in touch with them right after lunch and update you.',
          options: [
            { key: 'A', text: 'At a catering service company' },
            { key: 'B', text: 'At a hotel reception desk' },
            { key: 'C', text: 'At an interior design firm' },
            { key: 'D', text: 'At a corporate office planning an event' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích chi tiết:\n- Ngay từ câu mở đầu, người phụ nữ hỏi: "have you had a chance to review the catering contract for the annual banquet at the Riverside Hotel?" (Anh đã xem hợp đồng tiệc cho bữa tiệc thường niên tại Khách sạn Riverside chưa?).\n- Họ đang lên kế hoạch tổ chức tiệc thường niên của công ty mình tại một khách sạn bên ngoài, chứ không phải họ là nhân viên khách sạn hay công ty tiệc.\n- Các phương án A, B, C đều là bẫy bắt từ (catering, hotel, renovations). Đáp án đúng là D (Văn phòng công ty đang lập kế hoạch sự kiện).',
          trapSignal: 'Bẫy bắt từ y hệt (catering, hotel) cho câu hỏi nơi chốn',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l03-02',
          order: 2,
          prompt: 'What problem does the man mention regarding the venue?',
          passage:
            'Woman: Marcus, have you had a chance to review the catering contract for the annual banquet at the Riverside Hotel?\nMan: Yes, Ms. Vance. The prices look reasonable, but they noted that the main ballroom is undergoing minor renovations until October fifteenth.\nWoman: That might be cutting it close since our banquet is scheduled for October eighteenth. Could you please call the banquet coordinator to verify whether the construction noise will be completely cleared by then?\nMan: Absolutely. I will get in touch with them right after lunch and update you.',
          options: [
            { key: 'A', text: 'The rental fees exceed their allocated budget.' },
            { key: 'B', text: 'The catering staff is currently unavailable.' },
            { key: 'C', text: 'The facility is undergoing refurbishment.' },
            { key: 'D', text: 'The hotel double-booked the ballroom.' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích chi tiết:\n- Tọa độ câu 2 nằm ở giữa hội thoại: Người nam nói "The prices look reasonable, BUT they noted that the main ballroom is undergoing minor renovations until October fifteenth" (Giá cả hợp lý, NHƯNG họ lưu ý rằng phòng khiêu vũ chính đang được sửa chữa nhỏ cho đến 15/10).\n- Từ trong audio "undergoing minor renovations" được PARAPHRASE hoàn hảo trong đáp án C thành "The facility is undergoing refurbishment" (Cơ sở vật chất đang được tu sửa).\n- Phương án A sai vì người nam khen "prices look reasonable". Phương án B và D không được nhắc đến.',
          trapSignal: 'Paraphrase: renovations -> refurbishment',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l03-03',
          order: 3,
          prompt: 'What will the man probably do after lunch?',
          passage:
            'Woman: Marcus, have you had a chance to review the catering contract for the annual banquet at the Riverside Hotel?\nMan: Yes, Ms. Vance. The prices look reasonable, but they noted that the main ballroom is undergoing minor renovations until October fifteenth.\nWoman: That might be cutting it close since our banquet is scheduled for October eighteenth. Could you please call the banquet coordinator to verify whether the construction noise will be completely cleared by then?\nMan: Absolutely. I will get in touch with them right after lunch and update you.',
          options: [
            { key: 'A', text: 'Contact a representative at the venue' },
            { key: 'B', text: 'Sign the catering service agreement' },
            { key: 'C', text: 'Inspect the construction site in person' },
            { key: 'D', text: 'Reschedule the banquet to a later date' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích chi tiết:\n- Tọa độ câu 3 nằm ở lượt thoại cuối cùng: Người phụ nữ yêu cầu: "Could you please call the banquet coordinator...?" và người nam trả lời: "Absolutely. I will get in touch with them right after lunch and update you."\n- "call the banquet coordinator" và "get in touch with them" được PARAPHRASE thành "Contact a representative at the venue" (Liên hệ với người đại diện tại địa điểm tổ chức) -> Đáp án A.\n- Phương án B, C, D không được đề cập làm ngay sau bữa trưa.',
          trapSignal: 'Paraphrase: call / get in touch with coordinator -> contact a representative',
          timeTargetSeconds: 10,
        },
      ],
      bridgeToPractice: {
        targetPart: 3,
        partName: 'Part 3: Short Conversations',
        recommendedQuestionCount: 15,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=3&limit=15&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 15 câu Part 3 Hội Thoại Thực Chiến',
      },
    },

    // =========================================================================
    // LESSON 04: Part 3 & 4 Implied Meaning & Graphics
    // =========================================================================
    {
      id: 'toeic-listening-04-implied-and-graphics',
      moduleId: 'listening-tactics',
      slug: 'implied-meaning-graphics',
      order: 4,
      title: 'Bẻ Khóa Câu Hỏi Ngụ Ý & Kèm Biểu Bảng Đồ Họa (Part 3 & 4 Graphics)',
      englishTitle: 'Part 3 & 4 Advanced: Decoding Speaker Intent & Graphic Cross-Referencing',
      targetPart: 3,
      targetSections: ['listening'],
      difficulty: 'advanced',
      estimatedMinutes: 20,
      textbookSources: [
        'Hackers TOEIC Listening Chapter 6-7',
        'ETS Official TOEIC Test Guide',
        'Tactics for TOEIC Unit 9-10',
      ],
      objectives: [
        'Bẻ khóa câu hỏi Ngụ ý của người nói ("What does the speaker imply by saying...?") dựa trên ngữ điệu và ngữ cảnh 1 câu trước / 1 câu sau.',
        'Làm chủ Nguyên Tắc Đối Chiếu Chéo (The Cross-Referencing Rule) cho câu hỏi có đồ họa / bảng biểu (Look at the graphic).',
        'Xử lý thành thạo các dạng đồ họa phổ biến: Lịch trình (Schedules), Sơ đồ mặt bằng (Floor plans), Bảng giá (Price lists), và Phiếu giảm giá (Coupons).',
        'Tránh triệt để bẫy "Chọn ngay thông tin nghe thấy trong audio" (The Same Column Trap).',
      ],
      sections: [
        {
          id: 'l04-s1-speaker-intent-method',
          order: 1,
          title: '3 Bước Bẻ Khóa Câu Hỏi Ngụ Ý Của Người Nói (Implied Meaning)',
          sectionType: 'rules',
          contentMarkdown: `Dạng câu hỏi ngụ ý xuất hiện từ 2 đến 4 câu trong Part 3 và Part 4:
Dấu hiệu: \`What does the woman imply when she says, "[Quoted text]"?\` hoặc \`Why does the man say, "[Quoted text]"?\`.

Đặc trưng của dạng này: **Nghĩa đen của câu trích dẫn hoàn toàn không quan trọng, điều quyết định là CHỨC NĂNG GIAO TIẾP trong ngữ cảnh cụ thể!**

**3 Bước giải quyết câu hỏi ngụ ý:**
1. **Bước 1**: Đọc trước câu trích dẫn trong 30 giây chuẩn bị.
2. **Bước 2: LẮNG NGHE KỸ CÂU NÓI NGAY PHÍA TRƯỚC**. Đây là chìa khóa vàng vì câu nói trước chính là nguyên nhân hoặc tình huống khiến người nói thốt ra câu trích dẫn.
3. **Bước 3: LẮNG NGHE NGỮ ĐIỆU (Intonation)**:
   - Giọng ngập ngừng, thở dài: Thể hiện sự thất vọng, khó khăn, từ chối khéo.
   - Giọng nhấn mạnh, dứt khoát: Thể hiện sự giục giã, thúc bách hoặc không đồng tình.`,
          examples: [
            {
              context: 'Văn phòng làm việc',
              english:
                'Speaker A: "Would you like to grab some lunch at the Italian bistro across the street?"\nSpeaker B: "I have a board presentation at one o\'clock."',
              vietnamese:
                'Người A: "Cậu có muốn đi ăn trưa ở quán Ý đối diện không?"\nNgười B: "Tôi có bài thuyết trình trước hội đồng quản trị lúc 1 giờ."',
              analysis:
                'Nghĩa đen: Người B có cuộc họp lúc 1 giờ. Ngụ ý giao tiếp: Người B từ chối lời mời ăn trưa vì quá bận / không có thời gian.',
              highlights: ['board presentation at one o\'clock', 'declining an invitation'],
            },
            {
              context: 'Quản lý dự án',
              english:
                'Speaker A: "Should we add three more case studies to this financial proposal?"\nSpeaker B: "The document is already forty pages long."',
              vietnamese:
                'Người A: "Chúng ta có nên thêm 3 nghiên cứu điển hình nữa vào bản đề xuất tài chính không?"\nNgười B: "Tài liệu này đã dài tới 40 trang rồi đấy."',
              analysis:
                'Nghĩa đen: Tài liệu dài 40 trang. Ngụ ý giao tiếp: Người B phản đối việc bổ sung thêm nội dung vì tài liệu đã quá dài.',
              highlights: ['already forty pages long', 'disagreeing with an addition'],
            },
          ],
        },
        {
          id: 'l04-s2-literal-meaning-trap',
          order: 2,
          title: 'Bẫy Chọn Đáp Án Nghĩa Đen (Literal Meaning Trap)',
          sectionType: 'traps',
          contentMarkdown: `Chiếc bẫy phổ biến nhất trong câu hỏi ngụ ý là ETS sẽ đưa ra một phương án giải thích **đúng 100% nghĩa đen từng từ** của câu trích dẫn. Thí sinh không hiểu ngữ cảnh sẽ vội vàng chọn đáp án này.

Ví dụ:
- Người A: *"Can you help me assemble these exhibition booths?"*
- Người B: *"My shift ended ten minutes ago."* (Ca làm việc của tôi kết thúc 10 phút trước rồi).
- Câu hỏi: *What does the man mean when he says, "My shift ended ten minutes ago"?*
  - Phương án bẫy A: *He forgot what time his shift finished.* (Nghĩa đen về giờ giấc $\\rightarrow$ SAI).
  - Phương án bẫy B: *He wants to work extra hours.* (Suy diễn ngược $\\rightarrow$ SAI).
  - Phương án đúng C: *He is unable to provide assistance.* (Ngụ ý: Từ chối giúp đỡ $\\rightarrow$ ĐÚNG).`,
          trapAlert: {
            trapName: 'Bẫy Giải Nghĩa Đen Từng Chữ (The Literal Translation Distractor)',
            trapLevel: 'high_distractor',
            trapDescription:
              'Phương án chỉ lặp lại nghĩa đen của câu trích dẫn mà hoàn toàn bỏ qua hàm ý giao tiếp (từ chối, phàn nàn, nhắc nhở).',
            distractorExample: {
              prompt: 'Woman: "The printer on our floor has been jammed since this morning."',
              incorrectChoice: 'She wants to buy a new printer model.',
              correctChoice: 'She explains why a task has been delayed.',
              whyDistractorFails:
                'Cô ấy nói máy in kẹt giấy để giải thích lý do tại sao báo cáo chưa in xong, chứ không phải muốn mua máy mới.',
            },
            antidote:
              'Phương án đúng của câu hỏi ngụ ý thường chứa các động từ chỉ chức năng ngôn ngữ: to decline (từ chối), to remind (nhắc nhở), to emphasize (nhấn mạnh), to express concern (bày tỏ lo ngại), to explain (giải thích).',
          },
        },
        {
          id: 'l04-s3-cross-referencing-rule',
          order: 3,
          title: 'Nguyên Tắc Đối Chiếu Chéo Thần Tốc Cho Câu Hỏi Đồ Họa (Look at the Graphic)',
          sectionType: 'rules',
          contentMarkdown: `Trong bài thi TOEIC có khoảng 3 cụm câu hỏi kèm đồ họa (Look at the graphic) ở Part 3 và Part 4.
Đồ họa có thể là: Lịch trình hội nghị, Sơ đồ mặt bằng gian hàng, Bảng giá cước vận chuyển, Thực đơn, hoặc Phiếu tích điểm.

**NGUYÊN TẮC ĐỐI CHIẾU CHÉO (THE CROSS-REFERENCING RULE):**
Đây là quy tắc toán học tuyệt đối của ETS để làm câu hỏi đồ họa trong 5 giây:
1. **Bước 1**: Nhìn vào 4 phương án A, B, C, D của câu hỏi đồ họa. Xác định chúng nằm ở **CỘT NÀO (hoặc DÒNG NÀO)** trong bảng!
   - Ví dụ: 4 phương án A, B, C, D là tên 4 Diễn giả: *Dr. Foster, Ms. Chen, Mr. Alvarez, Dr. Kim*.
2. **Bước 2**: Mắt BẠN **KHÔNG ĐƯỢC NHÌN VÀO CỘT DIỄN GIẢ NỮA!** Hãy khoanh vùng cột thông tin đối ứng còn lại (Ví dụ: Cột *Chủ đề thuyết trình* hoặc Cột *Phòng hội thảo*).
3. **Bước 3**: Trong Audio, người nói **CHẮC CHẮN SẼ KHÔNG BAO GIỜ ĐỌC TÊN DIỄN GIẢ**! Họ sẽ nhắc đến thông tin ở **CỘT ĐỐI ỨNG**!
   - Ví dụ: Audio nói: *"I am really looking forward to the session on Renewable Energy Systems."*
4. **Bước 4**: Mắt dóng nhanh từ *"Renewable Energy Systems"* sang ngang cột Diễn giả $\\rightarrow$ Thấy tên *Ms. Chen* $\\rightarrow$ **Chọn ngay Ms. Chen!**`,
          formula: {
            pattern: 'Options (Column A) -> Audio mentions (Column B) -> Cross-Reference -> Correct Answer',
            elements: [
              {
                symbol: 'Options (Col A)',
                label: 'Cột phương án',
                explanation: 'Xác định 4 đáp án thuộc cột nào trên bảng (ví dụ: Phòng họp, Giá tiền, Tên người).',
                color: 'blue',
              },
              {
                symbol: 'Target (Col B)',
                label: 'Cột mục tiêu cần nghe',
                explanation: 'Cột còn lại trên bảng (ví dụ: Thời gian, Chủ đề, Địa điểm).',
                color: 'amber',
              },
              {
                symbol: 'Audio Signal',
                label: 'Từ khóa trong băng',
                explanation: 'Người nói nhắc đến dữ liệu thuộc Cột B chứ không đọc Cột A.',
                color: 'purple',
              },
              {
                symbol: 'Match',
                label: 'Dóng hàng ngang',
                explanation: 'Dóng từ dữ liệu Cột B sang Cột A để tìm đáp án đúng tương ứng.',
                color: 'emerald',
              },
            ],
            notes: 'Quy tắc vàng: Thông tin đọc trong audio KHÔNG PHẢI là đáp án, mà là chìa khóa để dóng sang đáp án!',
          },
        },
        {
          id: 'l04-s4-same-column-and-discount-traps',
          order: 4,
          title: 'Bẫy Cùng Cột (The Same Column Trap) & Bẫy Giảm Giá Chưa Trừ',
          sectionType: 'traps',
          contentMarkdown: `Hai chiếc bẫy tinh vi nhất trong câu hỏi đồ họa:
1. **Bẫy Cùng Cột (Same Column Trap)**: Người ra đề đưa chính thông tin được nhắc trong audio vào các phương án A, B, C, D (hoặc cùng cột với thông tin audio). Thí sinh nghe thấy từ nào chọn từ đó sẽ bị dính bẫy ngay lập tức.
2. **Bẫy Giảm Giá / Mã Khuyến Mãi Chưa Tính Toán**:
   - Biểu đồ hiển thị giá phòng: Standard ($120), Deluxe ($160), Suite ($220).
   - Audio nói: *"We usually book the Deluxe room, and luckily we have a corporate coupon for $30 off today."*
   - Đề hỏi: *How much will the company pay for the room?*
   - Phương án bẫy: *$160* (Giá gốc nghe thấy trong audio $\\rightarrow$ BẪY).
   - Phương án đúng: *$130* (Sau khi lấy $160 - $30 = $130).`,
          trapAlert: {
            trapName: 'Bẫy Cùng Cột & Bẫy Số Tiền Chưa Trừ Voucher',
            trapLevel: 'high_distractor',
            trapDescription:
              'Người nghe chọn ngay con số hoặc tên gọi vừa nghe thấy trong băng mà quên làm phép đối chiếu chéo hoặc phép trừ khuyến mãi.',
            distractorExample: {
              prompt: 'Audio: "We opted for Flight 402, but due to bad weather we were transferred to the departure one hour later."',
              incorrectChoice: 'Flight 402',
              correctChoice: 'Flight 516 (chuyến bay khởi hành sau 1 tiếng)',
              whyDistractorFails:
                '"Flight 402" là chuyến ban đầu đã bị đổi, người nói chuyển sang chuyến kế tiếp trên bảng giờ bay.',
            },
            antidote:
              'Khi gặp câu hỏi về chi phí hoặc chuyến bay, luôn chú ý từ vựng chỉ sự thay đổi: transfer to, discount of, reduced by, delayed by.',
          },
        },
        {
          id: 'l04-s5-shortcuts',
          order: 5,
          title: 'Mẹo 10 Giây Phân Tích Sơ Đồ Mặt Bằng (Maps & Floor Plans)',
          sectionType: 'shortcuts',
          contentMarkdown: `Khi đồ họa là một **Sơ đồ mặt bằng (Map / Floor Plan)** (ví dụ: sơ đồ tòa nhà văn phòng, khu triển lãm hội chợ, hoặc trung tâm thương mại):
1. **Tìm điểm mốc định vị**: Tìm chữ \`Main Entrance\`, \`You are here\`, \`Elevator\`, hoặc \`Restrooms\`.
2. **Nằm lòng các cặp giới từ không gian**:
   - \`Across from / Opposite\`: Đối diện bên kia hành lang hoặc qua con đường.
   - \`Adjacent to / Next to / Beside\`: Ngay cạnh bên (chung vách tường).
   - \`At the end of the hallway / corridor\`: Ở cuối hành lang.
   - \`Between A and B\`: Nằm kẹp giữa hai gian phòng A và B.
   - \`In the northwest corner\`: Ở góc tây bắc (phía trên bên trái).`,
          tipBox: {
            title: 'Mẹo Bắt Tọa Độ Sơ Đồ Mặt Bằng',
            type: 'shortcut',
            content:
              'Trong audio, người nói sẽ luôn dẫn đường bằng cách chỉ từ một điểm mốc: "Once you exit the elevator, turn left and it\'s the second door on your right, across from the conference room." Hãy dùng đầu bút dò theo đường đi như một chiếc xe chạy trên bản đồ!',
            keySignals: [
              'Across from -> Nhìn sang phía đối diện bên kia lối đi.',
              'Adjacent to -> Nhìn ngay phòng bên cạnh.',
              'Turn left / right -> Xoay hướng nhìn theo chỉ dẫn.',
            ],
          },
          keyTakeaways: [
            'Câu hỏi ngụ ý: Lắng nghe kỹ câu nói ngay phía trước và ngữ điệu người nói.',
            'Loại bỏ phương án dịch nghĩa đen trong câu hỏi ngụ ý.',
            'Nguyên tắc đối chiếu chéo đồ họa: Tìm cột của 4 đáp án -> Nghe thông tin ở cột còn lại -> Dóng hàng ngang tìm kết quả.',
            'Cảnh giác bẫy cùng cột và luôn làm phép tính trừ với voucher giảm giá.',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'cp-l04-01',
          order: 1,
          prompt:
            '[Questions 1-3 refer to the following conversation and schedule]\n\nLook at the graphic. Which workshop session will the man attend?',
          passage:
            'Conference Schedule - Room Assignments:\n| Time | Topic | Speaker | Room |\n| 09:00 AM | Cloud Architecture | Dr. Aris Thorne | Room 101 |\n| 10:30 AM | AI Cybersecurity | Ms. Elena Rostova | Room 104 |\n| 01:00 PM | Data Pipeline Optimization | Mr. Kenji Sato | Room 202 |\n| 02:30 PM | Quantum Computing Trends | Dr. Sarah Jenkins | Room 205 |\n\nAudio Transcript:\nWoman: Kenji, are you ready for your afternoon presentation in Room 202?\nMan: Almost ready, Ms. Vance. But before that, I am planning to sit in on the morning session led by Ms. Rostova. Her research on threat detection is directly related to our upcoming client project.\nWoman: That is a great idea. Just keep in mind that our team lunch is scheduled for twelve thirty sharp.\nMan: I will be there on time. Why would I miss the team lunch?',
          options: [
            { key: 'A', text: 'Cloud Architecture' },
            { key: 'B', text: 'AI Cybersecurity' },
            { key: 'C', text: 'Data Pipeline Optimization' },
            { key: 'D', text: 'Quantum Computing Trends' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích chi tiết (Áp dụng Nguyên Tắc Đối Chiếu Chéo):\n- Bước 1: 4 phương án A, B, C, D là 4 Chủ đề (Topic) trên bảng lịch trình.\n- Bước 2: Trong Audio, người nam nói: "I am planning to sit in on the morning session led by Ms. Rostova" (Tôi định tham dự phiên buổi sáng do cô Rostova dẫn dắt).\n- Bước 3: Nhìn vào bảng lịch trình, tìm cột Speaker có tên "Ms. Elena Rostova" -> Dóng sang cột Topic tương ứng -> Thấy "AI Cybersecurity".\n- Do đó, đáp án đúng chính xác là B.\n- Bẫy distractor C: "Data Pipeline Optimization" là bài thuyết trình của chính người nam vào buổi chiều (Room 202), không phải phiên anh ta tham dự vào buổi sáng.',
          trapSignal: 'Nguyên tắc đối chiếu chéo: Speaker (Rostova) -> Topic (AI Cybersecurity)',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l04-02',
          order: 2,
          prompt: 'What does the man imply when he says, "Why would I miss the team lunch?"',
          passage:
            'Conference Schedule - Room Assignments:\n| Time | Topic | Speaker | Room |\n| 09:00 AM | Cloud Architecture | Dr. Aris Thorne | Room 101 |\n| 10:30 AM | AI Cybersecurity | Ms. Elena Rostova | Room 104 |\n| 01:00 PM | Data Pipeline Optimization | Mr. Kenji Sato | Room 202 |\n| 02:30 PM | Quantum Computing Trends | Dr. Sarah Jenkins | Room 205 |\n\nAudio Transcript:\nWoman: Kenji, are you ready for your afternoon presentation in Room 202?\nMan: Almost ready, Ms. Vance. But before that, I am planning to sit in on the morning session led by Ms. Rostova. Her research on threat detection is directly related to our upcoming client project.\nWoman: That is a great idea. Just keep in mind that our team lunch is scheduled for twelve thirty sharp.\nMan: I will be there on time. Why would I miss the team lunch?',
          options: [
            { key: 'A', text: 'He does not know where the restaurant is located.' },
            { key: 'B', text: 'He certainly intends to join his colleagues for lunch.' },
            { key: 'C', text: 'He forgot about the scheduled lunch appointment.' },
            { key: 'D', text: 'He is asking for permission to arrive late.' },
          ],
          correctAnswer: 'B',
          explanationVi:
            'Phân tích chi tiết:\n- Người phụ nữ nhắc nhở: "Just keep in mind that our team lunch is scheduled for twelve thirty sharp" (Hãy nhớ bữa trưa cả nhóm lúc 12h30 đúng giờ đấy nhé).\n- Người nam phản hồi: "I will be there on time. Why would I miss the team lunch?" (Tôi sẽ đến đúng giờ mà. Sao tôi lại bỏ lỡ bữa trưa cả nhóm được chứ?).\n- Câu hỏi tu từ này thể hiện sự khẳng định chắc chắn rằng anh ta nhất định sẽ tham gia ăn trưa cùng đồng nghiệp (He certainly intends to join his colleagues for lunch).\n- Phương án A, C, D đều là bẫy suy diễn sai lệch so với tinh thần câu nói.',
          trapSignal: 'Giải mã câu hỏi tu từ ngụ ý khẳng định tham gia',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l04-03',
          order: 3,
          prompt: 'What will the man do at 1:00 PM?',
          passage:
            'Conference Schedule - Room Assignments:\n| Time | Topic | Speaker | Room |\n| 09:00 AM | Cloud Architecture | Dr. Aris Thorne | Room 101 |\n| 10:30 AM | AI Cybersecurity | Ms. Elena Rostova | Room 104 |\n| 01:00 PM | Data Pipeline Optimization | Mr. Kenji Sato | Room 202 |\n| 02:30 PM | Quantum Computing Trends | Dr. Sarah Jenkins | Room 205 |\n\nAudio Transcript:\nWoman: Kenji, are you ready for your afternoon presentation in Room 202?\nMan: Almost ready, Ms. Vance. But before that, I am planning to sit in on the morning session led by Ms. Rostova. Her research on threat detection is directly related to our upcoming client project.\nWoman: That is a great idea. Just keep in mind that our team lunch is scheduled for twelve thirty sharp.\nMan: I will be there on time. Why would I miss the team lunch?',
          options: [
            { key: 'A', text: 'Deliver a presentation to attendees' },
            { key: 'B', text: 'Meet with a potential corporate client' },
            { key: 'C', text: 'Conduct an interview with Dr. Thorne' },
            { key: 'D', text: 'Install threat detection software' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích chi tiết:\n- Nhìn vào bảng lịch trình tại mốc 01:00 PM, diễn giả là "Mr. Kenji Sato" (chính là người nam trong hội thoại, do người nữ gọi: "Kenji, are you ready for your afternoon presentation in Room 202?").\n- Do đó lúc 1:00 PM anh ta sẽ thuyết trình bài phát biểu của mình (Deliver a presentation to attendees).\n- Cụm "afternoon presentation" được diễn giải chuẩn xác trong đáp án A.',
          trapSignal: 'Khớp danh tính nhân vật với lịch trình buổi chiều',
          timeTargetSeconds: 10,
        },
      ],
      bridgeToPractice: {
        targetPart: 3,
        partName: 'Part 3 & 4: Graphics & Implied',
        recommendedQuestionCount: 15,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=3&limit=15&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 15 câu Đồ Họa & Ngụ Ý Thực Chiến',
      },
    },

    // =========================================================================
    // LESSON 05: Part 4 Short Talks Classification
    // =========================================================================
    {
      id: 'toeic-listening-05-part4-talks',
      moduleId: 'listening-tactics',
      slug: 'part4-workplace-monologues',
      order: 5,
      title: 'Cẩm Nang Độc Thoại Công Sở Part 4 (Short Talks: Memos, Voicemails, Broadcasts)',
      englishTitle: 'Part 4 Mastery: Short Talks Classification & Workplace Monologues',
      targetPart: 4,
      targetSections: ['listening'],
      difficulty: 'intermediate',
      estimatedMinutes: 20,
      textbookSources: [
        'Tomato TOEIC Compact Listening Part 4',
        'Tactics for TOEIC Unit 15-16',
        'Hackers TOEIC Listening Chapter 8-10',
      ],
      objectives: [
        'Phân loại và làm chủ 5 thể loại bài nói độc thoại công sở cốt lõi: Tin nhắn thoại (Voicemails), Thông báo công cộng (Public Announcements), Thông báo nội bộ công ty (Corporate Memos), Bài phát biểu hội nghị (Introductions/Speeches), và Bản tin quảng cáo / thời sự (Broadcasts).',
        'Phân biệt tuyệt đối giữa Người nói (Speaker) và Người nghe (Listeners / Target Audience).',
        'Nắm vững cấu trúc 3 phần chuẩn mực của một bài nói đơn giọng: Mở đầu định danh -> Thân bài chi tiết sự cố -> Kết luận kêu gọi hành động (Call to Action).',
        'Bẻ khóa bẫy đính chính thông tin phút chót (Correction Trap) và các câu hỏi số liệu.',
      ],
      sections: [
        {
          id: 'l05-s1-5-talk-genres',
          order: 1,
          title: '5 Thể Loại Độc Thoại Công Sở Kinh Điển Trong Part 4',
          sectionType: 'concept',
          contentMarkdown: `Điểm khác biệt căn bản giữa Part 3 và Part 4:
- Part 3 có sự tương tác qua lại giữa 2 hoặc 3 người (có giọng nam, giọng nữ luân phiên giúp người nghe dễ nhận biết điểm chuyển ý).
- **Part 4 chỉ có DUY NHẤT MỘT NGƯỜI NÓI LIÊN TỤC trong 35-45 giây**. Tốc độ nói đều và lượng thông tin dồn dập, đòi hỏi thí sinh phải nắm chắc cấu trúc của 5 thể loại bài nói kinh điển:

1. **Tin nhắn thoại (Telephone Messages / Voicemails)**:
   - Cấu trúc: Lời chào $\\rightarrow$ Danh tính người gọi + Công ty $\\rightarrow$ Lý do gọi điện $\\rightarrow$ Hướng dẫn gọi lại / Số điện thoại liên hệ.
2. **Thông báo công cộng (Public Announcements)**:
   - Bối cảnh: Sân bay, nhà ga xe lửa, trung tâm mua sắm, trên máy bay.
   - Cấu trúc: Hướng sự chú ý đến đối tượng (\`Attention all passengers on Flight...\`) $\\rightarrow$ Thông báo sự thay đổi cổng/trì hoãn $\\rightarrow$ Chỉ dẫn di chuyển.
3. **Thông báo nội bộ công sở (Internal Corporate Announcements)**:
   - Bối cảnh: Cuộc họp nhân viên, buổi tổng kết quý, email âm thanh.
   - Cấu trúc: Khen ngợi thành tích / Thông báo chính sách mới / Sửa chữa cơ sở vật chất $\\rightarrow$ Phân công nhiệm vụ.
4. **Bài phát biểu giới thiệu (Conference Speeches & Introductions)**:
   - Cấu trúc: Giới thiệu vinh dự đón chào diễn giả khách mời $\\rightarrow$ Tóm tắt tiểu sử và giải thưởng $\\rightarrow$ Mời cử tọa vỗ tay đón chào.
5. **Bản tin truyền thanh & Quảng cáo (Broadcasts & Advertisements)**:
   - Cấu trúc: Dự báo thời tiết mưa bão / Tình hình tắc đường giờ cao điểm / Khuyến mãi giảm giá khai trương cửa hàng.`,
          comparisonTable: {
            title: 'Bảng Nhận Diện 5 Thể Loại Bài Nói Part 4 Qua Từ Khóa Mở Đầu',
            headers: ['Thể Loại Bài Nói', 'Từ Khóa / Câu Mở Đầu Đặc Trưng', 'Câu Hỏi Câu 1 Thường Gặp'],
            rows: [
              {
                colValues: [
                  'Voicemail (Tin nhắn thoại)',
                  '"Hello, this is [Name] calling from [Company] regarding your order..."',
                  'Why is the speaker calling?',
                ],
                highlight: true,
                badge: 'Gặp 30%',
              },
              {
                colValues: [
                  'Public Announcement (Thông báo công cộng)',
                  '"May I have your attention please? Passengers bound for Chicago..."',
                  'Where is the announcement taking place?',
                ],
                highlight: true,
              },
              {
                colValues: [
                  'Corporate Talk (Họp công ty)',
                  '"Good morning team. I called this emergency staff meeting to discuss..."',
                  'Who most likely is the speaker?',
                ],
              },
              {
                colValues: [
                  'Introduction (Giới thiệu diễn giả)',
                  '"It is my distinct privilege to introduce tonight\'s keynote speaker..."',
                  'Who is being introduced?',
                ],
              },
              {
                colValues: [
                  'Broadcast (Bản tin truyền thông)',
                  '"And now for your local Channel 5 traffic update on the Interstate..."',
                  'What is the broadcast mainly about?',
                ],
              },
            ],
          },
          examples: [
            {
              context: 'Thông báo tại sân bay quốc tế (Airport Terminal Announcement)',
              english:
                '"May I have your attention, please. Passengers booked on Pacific Rim Airways Flight 840 with non-stop service to Tokyo Narita: Due to the late arrival of the inbound aircraft, our departure has been delayed by approximately forty-five minutes. Boarding will now commence at Gate 24B at three fifteen PM. Business-class passengers and families traveling with small children are invited to proceed to the podium first. Please have your boarding pass and passport ready for inspection. We apologize for any inconvenience."',
              vietnamese:
                '"Xin quý hành khách chú ý. Các hành khách đã đặt vé trên Chuyến bay 840 của Hãng hàng không Pacific Rim bay thẳng đến Tokyo Narita: Do máy bay đến muộn, giờ khởi hành của chúng ta bị hoãn khoảng 45 phút. Việc lên máy bay sẽ bắt đầu tại Cổng 24B lúc 3 giờ 15 phút chiều. Hành khách hạng thương gia và gia đình có trẻ nhỏ xin mời tiến tới bục cửa trước tiên. Xin vui lòng chuẩn bị sẵn thẻ lên máy bay và hộ chiếu để kiểm tra. Chúng tôi thành thật xin lỗi vì sự bất tiện này."',
              analysis:
                '- Thể loại bài nói: Public Announcement (Thông báo công cộng tại nhà ga hàng không).\n- Cấu trúc 3 phần rõ nét:\n  1. Opening (Mở đầu): Hướng sự chú ý và định danh chuyến bay (Flight 840 to Tokyo Narita).\n  2. Body (Thân bài): Vấn đề & Thay đổi (delayed by 45 minutes, Gate 24B at 3:15 PM).\n  3. Closing (Kết bài): Hướng dẫn hành khách (have boarding pass and passport ready).',
              highlights: [
                'Pacific Rim Airways Flight 840',
                'delayed by approximately forty-five minutes',
                'Boarding will now commence at Gate 24B',
                'have your boarding pass and passport ready',
              ],
            },
          ],
        },
        {
          id: 'l05-s2-speaker-vs-listener-trap',
          order: 2,
          title: 'Bẫy Nhầm Lẫn Đối Tượng: Người Nói (Speaker) vs Người Nghe (Listeners)',
          sectionType: 'traps',
          contentMarkdown: `Đây là chiếc bẫy gây mất điểm nhiều nhất trong câu hỏi đầu tiên của Part 4:
Thí sinh không đọc kỹ đại từ trong câu hỏi:
- \`Who is the speaker?\` $\\rightarrow$ Hỏi về **NGƯỜI NÓI**.
- \`Who most likely are the listeners? / Who is this talk intended for?\` $\\rightarrow$ Hỏi về **NGƯỜI NGHE**.

Ví dụ:
Audio mở đầu: *"Good morning, everyone. As the chief medical officer of St. Jude Hospital, I would like to welcome all of our new medical interns to your first day of orientation."*
- Nếu đề hỏi: *Who is the speaker?* $\\rightarrow$ Đáp án: **A hospital official / Chief doctor** (Bác sĩ trưởng).
- Nếu đề hỏi: *Who are the listeners?* $\\rightarrow$ Đáp án: **Medical interns / New employees** (Bác sĩ thực tập mới).

Thí sinh nghe thấy cụm từ hoành tráng "chief medical officer" ngay đầu câu bèn vội vàng chọn đáp án "Hospital executives" cho câu hỏi về *listeners* $\\rightarrow$ **DÍNH BẪY 100%!**`,
          trapAlert: {
            trapName: 'Bẫy Nhầm Lẫn Speaker (Người nói) và Listeners (Người nghe)',
            trapLevel: 'high_distractor',
            trapDescription:
              'Người ra đề cài đặt danh tính của Người nói vào các phương án khi câu hỏi đang hỏi về đối tượng Người nghe (Audience).',
            distractorExample: {
              prompt:
                'Speaker: "Welcome aboard Flight 302 to Toronto. As your lead flight attendant, I ask that you stow all carry-on baggage..." Question: "Who are the listeners?"',
              incorrectChoice: 'Flight attendants.',
              correctChoice: 'Airplane passengers.',
              whyDistractorFails:
                '"Flight attendant" là nghề nghiệp của người đang nói (Speaker). Người nghe là hành khách đi máy bay (Passengers).',
            },
            antidote:
              'Luôn gạch chân từ khóa trong đề: Nếu hỏi "listeners" hoặc "intended audience", hãy tìm danh từ đứng sau các từ như "Welcome all...", "Attention...", "To all our clients/employees/patients".',
          },
          examples: [
            {
              context: 'Buổi họp định hướng nhân viên mới (New Employee Orientation)',
              english:
                '"Good morning, everyone, and welcome to Metro Financial Group. As the Vice President of Human Resources, I am thrilled to lead your orientation session this morning. Over the next three days, you will be introduced to our corporate compliance guidelines, client management software, and benefits packages. Before we begin our campus tour, please make sure you have submitted your tax withholding forms to Ms. Diaz at the registration desk."',
              vietnamese:
                '"Chào buổi sáng mọi người, và chào mừng quý vị đến với Tập đoàn Tài chính Metro. Với tư cách là Phó Chủ tịch phụ trách Nhân sự, tôi rất vui mừng được hướng dẫn buổi định hướng sáng nay của quý vị. Trong 3 ngày tới, quý vị sẽ được giới thiệu về các quy định tuân thủ doanh nghiệp, phần mềm quản lý khách hàng và các gói phúc lợi. Trước khi bắt đầu chuyến tham quan khuôn viên công ty, xin hãy đảm bảo quý vị đã nộp biểu mẫu khấu trừ thuế cho cô Diaz tại bàn đăng ký."',
              analysis:
                '- Speaker (Người nói): "Vice President of Human Resources" -> Giám đốc/Phó chủ tịch nhân sự.\n- Listeners (Người nghe): "welcome to Metro Financial... your orientation session" -> Nhân viên mới tuyển dụng (New employees / Hires).\n- Call to action (Kết bài): "submit your tax withholding forms to Ms. Diaz" -> Nộp giấy tờ thuế tại bàn đăng ký.',
              highlights: [
                'Vice President of Human Resources',
                'lead your orientation session',
                'submitted your tax withholding forms',
              ],
            },
          ],
        },
        {
          id: 'l05-s3-three-part-structure',
          order: 3,
          title: 'Cấu Trúc 3 Phần Chuẩn Mực Của Một Bài Độc Thoại',
          sectionType: 'rules',
          contentMarkdown: `Mỗi bài nói Part 4 kéo dài khoảng 35-45 giây và gồm khoảng 8-12 câu đơn. Thông tin được phân bổ cực kỳ chặt chẽ theo cấu trúc 3 phần:

1. **Phần Mở Đầu (Opening - 10 giây đầu)**:
   - Trả lời cho **Câu hỏi 1**:
     - *Who is the speaker?*
     - *Where does this talk take place?*
     - *What is the main purpose of the talk?*
2. **Phần Thân Bài (Body - 20 giây giữa)**:
   - Trả lời cho **Câu hỏi 2**:
     - *What problem is mentioned?*
     - *What special feature does the speaker highlight?*
     - Dấu hiệu chuyển ý (Pivot words): \`However\`, \`Unfortunately\`, \`As a reminder\`, \`Because of this\`.
3. **Phần Kết Luận (Closing - 10 giây cuối)**:
   - Trả lời cho **Câu hỏi 3**:
     - *What are listeners asked to do?*
     - *What will happen at 3:00 PM?*
     - *How can listeners get more information?*`,
          formula: {
            pattern: 'Opening (Speaker/Context) -> Body (Problem/Feature) -> Closing (Call to Action)',
            elements: [
              {
                symbol: 'Opening (10s)',
                label: 'Tọa độ Câu 1',
                explanation: 'Định danh ai nói, nói cho ai nghe, và lý do của bài nói.',
                color: 'blue',
              },
              {
                symbol: 'Body (20s)',
                label: 'Tọa độ Câu 2',
                explanation: 'Chi tiết cụ thể: Trục trặc kỹ thuật, chính sách thay đổi, thời gian địa điểm.',
                color: 'amber',
              },
              {
                symbol: 'Closing (10s)',
                label: 'Tọa độ Câu 3',
                explanation: 'Kêu gọi hành động: Nộp hồ sơ, gọi lại số máy, truy cập trang web.',
                color: 'emerald',
              },
            ],
            notes: 'Không bao giờ được dừng lại quá lâu ở câu 1 khiến bạn bị trễ nhịp phần Thân bài và Kết luận.',
          },
        },
        {
          id: 'l05-s4-shortcuts',
          order: 4,
          title: 'Mẹo Bắt Sóng Tín Hiệu "Call to Action" & Hướng Dẫn Kế Tiếp',
          sectionType: 'shortcuts',
          contentMarkdown: `Câu hỏi thứ 3 trong mỗi bài nói Part 4 hầu như luôn hỏi về hành động trong tương lai:
- \`What are the listeners instructed to do?\`
- \`What does the speaker urge listeners to do?\`
- \`What should listeners do before Friday?\`

Trong 10 giây cuối của bài nói, người nói sẽ luôn dùng các **cụm từ mệnh lệnh hoặc tín hiệu hành động (Action Signals)** để chỉ dẫn. Khi tai bạn nghe thấy các tín hiệu này, ĐÁP ÁN ĐÚNG NẰM NGAY SAU ĐÓ!`,
          tipBox: {
            title: 'Kho Tín Hiệu Kích Hoạt Câu Hỏi Cuối Cùng (Action Triggers)',
            type: 'shortcut',
            content:
              'Tập trung cao độ khi nghe thấy một trong các cấu trúc mệnh lệnh sau ở đoạn kết:',
            keySignals: [
              'Please remember to... / Please be sure to... (Xin hãy nhớ...)',
              'Make sure you... (Đảm bảo rằng bạn...)',
              'I encourage everyone to... (Tôi khuyến khích mọi người...)',
              'Don\'t hesitate to... (Đừng ngần ngại...)',
              'For further details / For more information, visit our website at... (Để biết thêm thông tin...)',
              'Please stop by the front desk to pick up... (Hãy ghé qua quầy lễ tân để lấy...)',
            ],
          },
        },
        {
          id: 'l05-s5-correction-trap',
          order: 5,
          title: 'Bẫy Đính Chính Thông Tin Phút Chót (The Correction Trap)',
          sectionType: 'traps',
          contentMarkdown: `Trong các bài nói về Lịch trình, Thời gian hoặc Chi phí, ETS rất thích đưa vào **Bẫy đính chính (Self-Correction Trap)**:

Người nói phát âm một thông tin ban đầu rất rõ ràng, nhưng sau đó lập tức đính chính lại bằng một liên từ điều chỉnh:
- *"The budget meeting will start at nine o'clock in Conference Room A. Actually, scratch that—Room A is currently occupied, so we will gather in Room C instead."*
- Câu hỏi: *Where will the meeting take place?*
  - Phương án bẫy: *Conference Room A* (Xuất hiện đầu tiên $\\rightarrow$ BẪY).
  - Phương án đúng: *Room C* (Thông tin đính chính sau từ "Actually, scratch that" $\\rightarrow$ ĐÚNG).`,
          trapAlert: {
            trapName: 'Bẫy Tự Đính Chính / Thay Đổi Kế Hoạch (Correction Trap)',
            trapLevel: 'high_distractor',
            trapDescription:
              'Người nói đưa ra thông tin đầu tiên, sau đó dùng các từ như "Actually", "Correction", "Wait, that\'s wrong" để sửa đổi thông tin.',
            distractorExample: {
              prompt:
                'Speaker: "The bus will depart from Platform 4 at 10:15. Oh wait, my dispatch sheet says Platform 7 today due to construction." Question: "Where will passengers board the bus?"',
              incorrectChoice: 'Platform 4',
              correctChoice: 'Platform 7',
              whyDistractorFails:
                '"Platform 4" được nghe thấy đầu tiên nhưng đã bị người nói hủy bỏ bởi từ "Oh wait... Platform 7 today".',
            },
            antidote:
              'Khi nghe thấy: "Actually", "Correction", "Oh wait", "Scratch that", "Instead" -> GẠCH BỎ NGAY thông tin vừa nghe trước đó, phương án đúng nằm ở vế sau!',
          },
          examples: [
            {
              context: 'Tin nhắn thoại đính chính lịch họp (Voicemail Schedule Correction)',
              english:
                '"Hi David, this is Sandra from Marketing. I\'m calling about our project review scheduled for Thursday afternoon. Originally, we planned to meet at two o\'clock in Conference Room B, but the regional director requested to join remotely via video link. Because Room B lacks video conferencing gear, we\'ve moved the meeting to the executive boardroom on the tenth floor instead. The time remains the same. Please let me know if you need me to print copies of the agenda."',
              vietnamese:
                '"Chào David, tôi là Sandra bên phòng Marketing. Tôi gọi về buổi đánh giá dự án dự kiến vào chiều thứ Năm. Ban đầu, chúng ta định họp lúc 2 giờ ở Phòng họp B, nhưng giám đốc khu vực đã yêu cầu tham gia từ xa qua liên kết video. Vì Phòng B thiếu thiết bị hội nghị truyền hình, chúng ta đã chuyển cuộc họp sang phòng họp ban giám đốc ở tầng 10 thay vào đó. Giờ họp vẫn giữ nguyên. Vui lòng cho tôi biết nếu anh cần tôi in các bản sao chương trình họp nhé."',
              analysis:
                '- Bẫy tự đính chính: "Originally, we planned to meet in Room B... but moved the meeting to the executive boardroom on the tenth floor instead."\n- Nếu câu hỏi hỏi "Where will the meeting take place?", chọn Room B là dính bẫy (kế hoạch ban đầu đã bị hủy); phương án đúng phải là phòng họp ban giám đốc ở tầng 10.',
              highlights: [
                'Originally, we planned to meet in Conference Room B',
                'moved the meeting to the executive boardroom on the tenth floor instead',
              ],
            },
          ],
          keyTakeaways: [
            'Phân biệt rõ ràng: Who is the speaker? (Người nói) vs Who are the listeners? (Người nghe).',
            'Bắt trọn 3 câu hỏi theo tiến trình: Mở đầu (10s) -> Thân bài (20s) -> Kết luận (10s).',
            'Tọa độ câu cuối nằm ở các cụm từ hành động: "Please remember to", "Make sure you", "Visit our website".',
            'Cảnh giác cao độ với bẫy đính chính phút chót (Actually, Oh wait, Instead).',
          ],
        },
      ],
      checkpoints: [
        {
          id: 'cp-l05-01',
          order: 1,
          prompt:
            '[Questions 1-3 refer to the following telephone message]\n\nWho most likely is the speaker?',
          passage:
            'Hello, Mr. Delgado. This is Brenda Walsh calling from Apex Fleet Management. I am reaching out regarding the commercial delivery vans your logistics company leased from us last month. Our maintenance records show that two of the vehicles are now due for their mandatory thirty-day engine checkup. To ensure your warranty remains valid, these inspections must be carried out before this Friday. We can provide courtesy replacement vans while the service is being performed so your deliveries won\'t be disrupted. Please call me back at 555-0182 by four o\'clock today to schedule an appointment time that works for your drivers. Thank you.',
          options: [
            { key: 'A', text: 'A logistics delivery driver' },
            { key: 'B', text: 'An insurance claims adjuster' },
            { key: 'C', text: 'A commercial van leasing agent' },
            { key: 'D', text: 'A customer inquiring about shipping rates' },
          ],
          correctAnswer: 'C',
          explanationVi:
            'Phân tích chi tiết:\n- Tọa độ câu 1 nằm ở ngay 2 câu đầu của tin nhắn: Người gọi tự giới thiệu: "This is Brenda Walsh calling from Apex Fleet Management. I am reaching out regarding the commercial delivery vans your logistics company leased from us last month" (Tôi là Brenda Walsh gọi từ Công ty Quản lý Đội xe Apex về những chiếc xe tải giao hàng mà công ty hậu cần của ông đã thuê từ chúng tôi tháng trước).\n- Do đó, người nói là đại diện của công ty cho thuê xe thương mại (A commercial van leasing agent) -> Đáp án C.\n- Phương án A SAI: Người nghe (Mr. Delgado) mới là công ty hậu cần (logistics company).\n- Phương án B, D sai bối cảnh.',
          trapSignal: 'Bẫy Speaker vs Listener: Người cho thuê vs Công ty hậu cần thuê xe',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l05-02',
          order: 2,
          prompt: 'Why must the maintenance inspections be completed before Friday?',
          passage:
            'Hello, Mr. Delgado. This is Brenda Walsh calling from Apex Fleet Management. I am reaching out regarding the commercial delivery vans your logistics company leased from us last month. Our maintenance records show that two of the vehicles are now due for their mandatory thirty-day engine checkup. To ensure your warranty remains valid, these inspections must be carried out before this Friday. We can provide courtesy replacement vans while the service is being performed so your deliveries won\'t be disrupted. Please call me back at 555-0182 by four o\'clock today to schedule an appointment time that works for your drivers. Thank you.',
          options: [
            { key: 'A', text: 'To avoid late payment penalty fees' },
            { key: 'B', text: 'To prepare the vans for resale' },
            { key: 'C', text: 'To comply with city emissions laws' },
            { key: 'D', text: 'To maintain the equipment warranty coverage' },
          ],
          correctAnswer: 'D',
          explanationVi:
            'Phân tích chi tiết:\n- Tọa độ câu 2 nằm ở giữa bài nói: Người nói nêu rõ lý do: "To ensure your warranty remains valid, these inspections must be carried out before this Friday" (Để đảm bảo gói bảo hành của quý khách vẫn có hiệu lực, các cuộc kiểm tra này phải được thực hiện trước thứ Sáu này).\n- Cụm "To ensure your warranty remains valid" được PARAPHRASE thành "To maintain the equipment warranty coverage" (Để duy trì phạm vi bảo hành của thiết bị) -> Đáp án D.\n- Phương án A, B, C không được đề cập trong bài nói.',
          trapSignal: 'Paraphrase: warranty remains valid -> maintain warranty coverage',
          timeTargetSeconds: 10,
        },
        {
          id: 'cp-l05-03',
          order: 3,
          prompt: 'What does the speaker offer to do to assist the listener?',
          passage:
            'Hello, Mr. Delgado. This is Brenda Walsh calling from Apex Fleet Management. I am reaching out regarding the commercial delivery vans your logistics company leased from us last month. Our maintenance records show that two of the vehicles are now due for their mandatory thirty-day engine checkup. To ensure your warranty remains valid, these inspections must be carried out before this Friday. We can provide courtesy replacement vans while the service is being performed so your deliveries won\'t be disrupted. Please call me back at 555-0182 by four o\'clock today to schedule an appointment time that works for your drivers. Thank you.',
          options: [
            { key: 'A', text: 'Supply temporary vehicles during the service' },
            { key: 'B', text: 'Waive the cost of the routine maintenance' },
            { key: 'C', text: 'Send technicians directly to the client\'s warehouse' },
            { key: 'D', text: 'Extend the deadline until next Monday' },
          ],
          correctAnswer: 'A',
          explanationVi:
            'Phân tích chi tiết:\n- Tọa độ câu 3 nằm ở phần gần cuối bài nói: Người nói đưa ra lời đề nghị hỗ trợ: "We can provide courtesy replacement vans while the service is being performed so your deliveries won\'t be disrupted" (Chúng tôi có thể cung cấp các xe tải thay thế miễn phí trong khi dịch vụ được tiến hành để việc giao hàng của quý khách không bị gián đoạn).\n- Cụm "provide courtesy replacement vans" được PARAPHRASE hoàn hảo thành "Supply temporary vehicles during the service" (Cung cấp phương tiện tạm thời trong thời gian bảo dưỡng) -> Đáp án A.\n- Phương án B, C, D không được người nói đề xuất.',
          trapSignal: 'Paraphrase: courtesy replacement vans -> supply temporary vehicles',
          timeTargetSeconds: 10,
        },
      ],
      bridgeToPractice: {
        targetPart: 4,
        partName: 'Part 4: Short Talks',
        recommendedQuestionCount: 15,
        filterMode: 'unseen',
        practiceUrl: '/toeic/exam/bank?part=4&limit=15&mode=practice&filterMode=unseen',
        ctaText: 'Luyện ngay 15 câu Part 4 Độc Thoại Thực Chiến',
      },
    },
  ],
};

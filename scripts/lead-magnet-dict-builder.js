const fs = require('fs');
const path = require('path');
const { getCitation } = require('./lead-magnet-corpus-helper.js');

// 150 items across 6 domains: 25 items each
const dictData = [
  // Group 1: Workplace & Office Hypernyms (1-25)
  ['light fixture', '/ˈlaɪt ˌfɪks.tʃɚ/', 'thiết bị chiếu sáng/đèn treo', 'hang from the ceiling', 'light fixture', 'Thí sinh hay chờ nghe lamp/chandelier'],
  ['merchandise', '/ˈmɝː.tʃən.daɪs/', 'hàng hóa thương mại', 'display merchandise for sale', '\\bmerchandise\\b', 'Danh từ không đếm được, không thêm -s'],
  ['apparel', '/əˈpær.əl/', 'y phục, quần áo may mặc', 'an apparel store / clothing item', '\\bapparel\\b', 'Dùng thay cho shirts, dresses, jackets'],
  ['produce', '/ˈprɑː.duːs/', 'nông sản tươi sống', 'fresh agricultural produce', '\\bproduce\\b', 'Trọng âm rơi âm 1 khi là danh từ nông sản'],
  ['utensils', '/juːˈten.sɪlz/', 'dụng cụ nhà bếp/ăn uống', 'eating utensils, kitchen utensils', '\\butensil', 'Dùng thay cho fork, knife, spoon'],
  ['beverage', '/ˈbev.ɚ.ɪdʒ/', 'đồ uống các loại', 'pour a beverage into a glass', '\\bbeverage\\b', 'Bao gồm cả nước ngọt, cà phê, trà, rượu'],
  ['refreshments', '/rɪˈfreʃ.mənts/', 'đồ ăn thức uống nhẹ giải khát', 'serve refreshments at the reception', '\\brefreshment', 'Dùng bao quát cho tiệc đứng hoặc hội thảo'],
  ['filing cabinet', '/ˈfaɪ.lɪŋ ˌkæb.ɪ.nət/', 'tủ đựng hồ sơ nhiều ngăn', 'stand next to a filing cabinet', 'filing cabinet', 'Bẫy phát âm nhầm với filling'],
  ['bulletin board', '/ˈbʊl.ə.t̬ɪn ˌbɔːrd/', 'bảng tin/thông báo công ty', 'posted on the bulletin board', 'bulletin board', 'Nơi dán thông báo nội bộ, lịch họp'],
  ['promotional items', '/prəˈmoʊ.ʃən.əl ˈaɪ.t̬əmz/', 'vật phẩm quảng cáo/quà tặng', 'promotional items with company logo', 'promotional', 'Paraphrase cho giveaway pens, free mugs'],
  ['crate', '/kreɪt/', 'thùng gỗ/nhựa thưa đựng đồ', 'wooden crate filled with produce', '\\bcrate\\b', 'Dùng cho bối cảnh chợ nông sản hoặc kho hàng'],
  ['pallet', '/ˈpæl.ət/', 'tấm pallet kê hàng', 'stacked on a wooden pallet', '\\bpallet\\b', 'Hay gặp trong câu Part 1 tranh kho bãi'],
  ['stool', '/stuːl/', 'ghế đẩu không tựa', 'placed on a step stool', '\\bstool\\b', 'Phân biệt với chair có tựa lưng'],
  ['windowsill', '/ˈwɪn.doʊ.sɪl/', 'bậu cửa sổ', 'lay a brush on a windowsill', '\\bwindowsill\\b', 'Chi tiết nhỏ góc ảnh hay dùng làm đáp án đúng'],
  ['reimbursement', '/ˌriː.ɪmˈbɝːs.mənt/', 'khoản hoàn chi phí công tác', 'submit a reimbursement form', '\\breimbursement\\b', 'Từ vựng vàng của Part 3 & 4 về tài chính'],
  ['onboarding', '/ˈɑːnˌbɔːr.dɪŋ/', 'đào tạo hội nhập nhân sự mới', 'employee onboarding session', '\\bonboarding\\b', 'Đồng nghĩa với orientation session'],
  ['agenda', '/əˈdʒen.də/', 'chương trình nghị sự cuộc họp', 'the first agenda item', '\\bagenda\\b', 'Hay xuất hiện ở câu mở đầu Part 4'],
  ['estimate', '/ˈes.tə.mət/', 'bản dự toán/báo giá', 'contact companies for estimates', '\\bestimate\\b', 'Đồng nghĩa với quote / quotation'],
  ['inventory', '/ˈɪn.vən.tɔːr.i/', 'kiểm kê hàng tồn kho', 'conduct an annual inventory count', '\\binventory\\b', 'Nhấn âm 1 (Mỹ), bẫy lặp âm với invention'],
  ['footwear', '/ˈfʊt.wer/', 'giày dép các loại', 'protective footwear / footwear display', '\\bfootwear\\b', 'Thượng danh từ thay cho shoes, boots, sneakers'],
  ['headset', '/ˈhed.set/', 'tai nghe có kèm micro', 'wear a headset during customer calls', '\\bheadset\\b', 'Thường gặp trong bối cảnh trung tâm CSKH'],
  ['brochure', '/broʊˈʃʊr/', 'tờ rơi/sách quảng cáo gấp', 'hand out informational brochures', '\\bbrochure\\b', 'Đồng nghĩa với pamphlet, flyer'],
  ['container', '/kənˈteɪ.nɚ/', 'thùng/hộp/vật chứa', 'empty plastic containers', '\\bcontainer\\b', 'Thượng danh từ thay cho box, bottle, jar, tub'],
  ['equipment', '/ɪˈkwɪp.mənt/', 'trang thiết bị máy móc', 'inspect laboratory equipment', '\\bequipment\\b', 'Danh từ không đếm được, không thêm -s'],
  ['supplies', '/səˈplaɪz/', 'vật tư, nhu yếu phẩm công sở', 'order additional office supplies', '\\bsupplies\\b', 'Thường ở dạng số nhiều, thay cho paper, pens, toner'],

  // Group 2: Micro-Actions & Kinematics (26-50)
  ['tying up hair', '/ˈtaɪ.ɪŋ ʌp her/', 'buộc túm tóc lên', 'tying up her hair', 'tying up', 'Cử động vi mô tay đưa sau đầu'],
  ['reaching into/for', '/ˈriː.tʃɪŋ ˈɪn.tuː/', 'thò tay vào trong / với lấy', 'reaching into a bucket', 'reaching (?:into|for|toward)', 'Cánh tay vươn dài tới vật thể'],
  ['leaning against', '/ˈliː.nɪŋ əˈɡenst/', 'tựa người vào vật cố định', 'leaning against a railing', 'leaning against', 'Tư thế tiếp xúc tĩnh, không phải đang đi'],
  ['leaning over', '/ˈliː.nɪŋ ˈoʊ.vɚ/', 'nhoài/cúi người qua', 'leaning over a desk', 'leaning over', 'Cúi gập thân trên qua mặt phẳng'],
  ['shading', '/ˈʃeɪ.dɪŋ/', 'che bóng râm / che mắt', 'trees shading a picnic table', '\\bshading\\b', 'Mái hiên hoặc cây tỏa bóng râm'],
  ['propping open', '/ˈprɑː.pɪŋ ˈoʊ.pən/', 'chèn/giữ cửa mở', 'furniture propping open a door', 'propping open', 'Dùng vật chèn dưới chân cánh cửa'],
  ['pulling luggage', '/ˈpʊl.ɪŋ ˈlʌɡ.ɪdʒ/', 'kéo va li đi phía sau', 'pulling luggage behind her', 'pulling', 'Hành động di chuyển ở sân bay, nhà ga'],
  ['kneeling', '/ˈniː.lɪŋ/', 'quỳ gối trên sàn', 'kneeling down on a tile floor', '\\bkneeling\\b', 'Đầu gối tiếp xúc trực tiếp mặt đất'],
  ['shoveling', '/ˈʃʌv.əl.ɪŋ/', 'dùng xẻng xúc đất/tuyết', 'shoveling snow from a walkway', '\\bshoveling\\b', 'Thao tác tay cầm xẻng xúc dọn'],
  ['sweeping', '/ˈswiː.pɪŋ/', 'quét dọn rác/vỉa hè', 'sweeping debris off a walkway', '\\bsweeping\\b', 'Cầm chổi quét bụi bẩn'],
  ['holding a phone', '/ˈhoʊl.dɪŋ ə foʊn/', 'áp điện thoại vào tai', 'holding a phone up to her ear', 'holding.*phone', 'Đang nghe điện thoại, không phải đang chụp ảnh'],
  ['wiping off', '/ˈwaɪ.pɪŋ ɑːf/', 'lau sạch bề mặt', 'wiping off a bench / counter', '\\bwiping\\b', 'Tay cầm khăn lau qua lại'],
  ['lifting', '/ˈlɪf.tɪŋ/', 'nhấc/nâng vật từ dưới lên', 'lifting a bin / box', '\\blifting\\b', 'Hành động dùng lực nâng vật thể lên'],
  ['stacking', '/ˈstæk.ɪŋ/', 'xếp chồng lên nhau', 'stacking crates / boxes', '\\bstacking\\b', 'Đặt vật này lên trên vật kia'],
  ['pouring', '/ˈpɔːr.ɪŋ/', 'rót/chế chất lỏng', 'pouring a beverage into a glass', '\\bpouring\\b', 'Dòng chảy chất lỏng vào ly/tách'],
  ['folding', '/ˈfoʊl.dɪŋ/', 'gấp/xếp lại', 'folding a coat / chair', '\\bfolding\\b', 'Gấp gọn quần áo hoặc ghế xếp'],
  ['pushing', '/ˈpʊʃ.ɪŋ/', 'đẩy xe/vật về phía trước', 'pushing a cart towards an exit', '\\bpushing\\b', 'Tác động lực đẩy di chuyển'],
  ['hanging', '/ˈhæŋ.ɪŋ/', 'treo lơ lửng trên cao', 'hanging from the ceiling', '\\bhanging\\b', 'Vật treo cố định trên trần hoặc tường'],
  ['brushing', '/ˈbrʌʃ.ɪŋ/', 'dùng chổi cọ quét/phủi', 'brushing snow off a car', '\\bbrushing\\b', 'Cọ quét nhẹ bề mặt'],
  ['plugging in', '/ˈplʌɡ.ɪŋ ɪn/', 'cắm phích điện vào ổ cắm', 'plugging a cord into an outlet', '\\bplugging\\b', 'Thao tác tay cầm dây cắm vào tường'],
  ['climbing', '/ˈklaɪ.mɪŋ/', 'trèo thang / leo cầu thang', 'climbing a ladder / stairs', '\\bclimbing\\b', 'Âm /b/ câm, không phát âm âm b'],
  ['clearing away', '/ˈklɪr.ɪŋ əˈweɪ/', 'dọn dẹp giải phóng mặt bằng', 'clearing away snow / dishes', '\\bclearing\\b', 'Làm sạch khoảng không gian'],
  ['cleaning', '/ˈkliː.nɪŋ/', 'vệ sinh, lau chùi', 'cleaning some windows', '\\bcleaning\\b', 'Thao tác làm sạch kính hoặc sàn'],
  ['removing', '/rɪˈmuːv.ɪŋ/', 'tháo dỡ, cởi bỏ', 'removing a hat / tire', '\\bremoving\\b', 'Động thái thao tác, khác với wearing'],
  ['glancing at', '/ˈɡlæns.ɪŋ æt/', 'liếc nhìn nhanh', 'glancing at a monitor / document', '\\bglancing\\b', 'Nhìn lướt nhanh, không phải chăm chú đọc'],

  // Group 3: Construction & Logistics (51-75)
  ['repave', '/ˌriːˈpeɪv/', 'trải nhựa lại mặt đường', 'repave the parking area', '\\brepave\\b', 'Thường xuất hiện trong thông báo sửa chữa'],
  ['pallet', '/ˈpæl.ət/', 'kệ pallet kê hàng hóa', 'stacked on a wooden pallet', '\\bpallet\\b', 'Tránh nhầm với palette (bảng pha màu)'],
  ['planks', '/plæŋks/', 'tấm ván gỗ xây dựng', 'wooden planks piled up', '\\bplank', 'Vật liệu xây dựng sàn hoặc giàn'],
  ['cargo', '/ˈkɑːr.ɡoʊ/', 'hàng hóa vận chuyển bằng tàu/xe', 'cargo ship / cargo container', '\\bcargo\\b', 'Hàng tải trọng lớn, khác với personal luggage'],
  ['distribution facility', '/ˌdɪs.trɪˈbjuː.ʃən/', 'trung tâm phân phối kho vận', 'inspect the distribution facility', 'distribution', 'Đồng nghĩa với fulfillment center'],
  ['track repairs', '/træk rɪˈperz/', 'sửa chữa bảo trì đường ray', 'delayed due to track repairs', 'track', 'Nguyên nhân gây gián đoạn tàu hỏa'],
  ['warehouse', '/ˈwer.haʊs/', 'nhà kho chứa hàng', 'warehouse manager / inventory', '\\bwarehouse\\b', 'Bối cảnh xuất hiện ở Part 2 và Part 3'],
  ['inventory count', '/ˈɪn.vən.tɔːr.i kaʊnt/', 'đợt kiểm kê hàng tồn kho', 'conduct an inventory count', 'inventory', 'Công việc định kỳ của nhân viên kho'],
  ['loading dock', '/ˈloʊ.dɪŋ dɑːk/', 'bến bốc dỡ hàng', 'trucks parked at the loading dock', 'dock', 'Khu vực xe tải đậu để giao/nhận hàng'],
  ['contractor', '/ˈkɑːn.træk.tɚ/', 'nhà thầu thi công', 'hire an independent contractor', '\\bcontractor\\b', 'Người nhận thầu dự án xây dựng/sửa chữa'],
  ['renovation', '/ˌren.əˈveɪ.ʃən/', 'sự cải tạo, trùng tu công trình', 'undergoing extensive renovation', '\\brenovation\\b', 'Paraphrase cho remodel, make repairs'],
  ['demolition', '/ˌdem.əˈlɪʃ.ən/', 'sự phá dỡ công trình cũ', 'schedule a building demolition', '\\bdemolition\\b', 'Trước khi xây mới thường có demolition'],
  ['inspector', '/ɪnˈspek.tɚ/', 'thanh tra viên an toàn', 'safety inspector visiting the site', '\\binspector\\b', 'Người kiểm tra tiêu chuẩn xây dựng/vận hành'],
  ['safety goggles', '/ˈseɪf.ti ˌɡɑː.ɡəlz/', 'kính bảo hộ lao động', 'put on safety goggles', 'goggles', 'Đồ bảo hộ bắt buộc trong xưởng/phòng lab'],
  ['maintenance crew', '/ˈmeɪn.tən.əns kruː/', 'đội ngũ bảo trì cơ sở hạ tầng', 'call the maintenance crew', 'maintenance', 'Nhóm thợ phụ trách sửa chữa sự cố'],
  ['storage unit', '/ˈstɔːr.ɪdʒ ˌjuː.nɪt/', 'khoang/ngăn lưu trữ hàng', 'rent an additional storage unit', 'storage', 'Không gian chứa đồ dự trữ'],
  ['shipment tracking', '/ˈʃɪp.mənt ˈtræk.ɪŋ/', 'theo dõi hành trình đơn hàng', 'check shipment tracking online', 'tracking', 'Kiểm tra mã vận đơn xem hàng đến đâu'],
  ['damaged goods', '/ˈdæm.ɪdʒd ɡʊdz/', 'hàng hóa bị móp méo hư hại', 'report damaged goods upon arrival', 'damaged', 'Lý do khiếu nại hoặc yêu cầu bồi thường'],
  ['wheelbarrow', '/ˈwiːlˌber.oʊ/', 'xe cút kít chở đất cát', 'pile rocks in a wheelbarrow', '\\bwheelbarrow\\b', 'Xe 1 bánh đẩy tay công trường'],
  ['machinery', '/məˈʃiː.nɚ.i/', 'máy móc thiết bị công nghiệp', 'heavy industrial machinery', '\\bmachinery\\b', 'Danh từ không đếm được'],
  ['assembly line', '/əˈsem.bli laɪn/', 'dây chuyền lắp ráp nhà máy', 'work on the assembly line', 'assembly', 'Mô hình sản xuất công nghiệp hàng loạt'],
  ['technician', '/tekˈnɪʃ.ən/', 'kỹ thuật viên chuyên trách', 'scheduled visit from a technician', '\\btechnician\\b', 'Người sửa chữa máy tính, máy in, điều hòa'],
  ['materials', '/məˈtɪr.i.əlz/', 'vật liệu xây dựng / tài liệu', 'building materials / promotional materials', '\\bmaterials\\b', 'Đa nghĩa: vừa là vật tư vừa là tài liệu'],
  ['lumber', '/ˈlʌm.bɚ/', 'gỗ xẻ thương phẩm', 'deliver a shipment of lumber', '\\blumber\\b', 'Gỗ đã cưa thành phiến xây nhà'],
  ['delivery van', '/dɪˈlɪv.ɚ.i væn/', 'xe tải nhỏ giao hàng', 'load packages into a delivery van', '\\bvan\\b', 'Phương tiện giao hàng chặng cuối'],

  // Group 4: Hospitality & Dining (76-100)
  ['patio', '/ˈpæt̬.i.oʊ/', 'sân hiên ngoài trời có bàn ăn', 'outdoor patio seating', '\\bpatio\\b', 'Khu vực ăn uống lộ thiên có mái che/dù'],
  ['reservation', '/ˌrez.ɚˈveɪ.ʃən/', 'sự đặt bàn / đặt phòng trước', 'confirm a dinner reservation', '\\breservation\\b', 'Đồng nghĩa với booking'],
  ['complimentary', '/ˌkɑːm.pləˈmen.t̬ɚ.i/', 'miễn phí đi kèm dịch vụ', 'complimentary breakfast / Wi-Fi', '\\bcomplimentary\\b', 'Đồng nghĩa với free of charge'],
  ['food truck', '/ˈfuːd ˌtrʌk/', 'xe bán đồ ăn lưu động', 'order lunch from a food truck', 'food truck', 'Quầy ăn lưu động trên phố'],
  ['banquet', '/ˈbæŋ.kwət/', 'tiệc chiêu đãi trang trọng', 'annual company awards banquet', '\\bbanquet\\b', 'Tiệc tối lớn có nghi thức'],
  ['catering service', '/ˈkeɪ.t̬ɚ.ɪŋ ˈsɝː.vɪs/', 'dịch vụ nấu tiệc trọn gói', 'hire a professional catering service', '\\bcatering\\b', 'Cung cấp đồ ăn tận nơi cho sự kiện'],
  ['culinary', '/ˈkʌl.ə.ner.i/', 'thuộc về nghệ thuật ẩm thực', 'renowned culinary institute / chef', '\\bculinary\\b', 'Trọng âm rơi âm 1'],
  ['beverage', '/ˈbev.ɚ.ɪdʒ/', 'thức uống đóng chai/pha chế', 'complimentary hot beverages', '\\bbeverage\\b', 'Thượng danh từ cho drinks'],
  ['refreshments', '/rɪˈfreʃ.mənts/', 'tiệc trà bánh nhẹ giải lao', 'light refreshments served at break', '\\brefreshment', 'Trà, cà phê, bánh ngọt giữa giờ'],
  ['chef', '/ʃef/', 'bếp trưởng điều hành', 'executive chef preparing specialties', '\\bchef\\b', 'Phát âm âm đầu là /ʃ/, không đọc /tʃ/'],
  ['counter', '/ˈkaʊn.t̬ɚ/', 'quầy phục vụ / tính tiền', 'order at the front counter', '\\bcounter\\b', 'Nơi giao dịch giữa khách và nhân viên'],
  ['menu', '/ˈmen.juː/', 'thực đơn món ăn', 'browse the seasonal dinner menu', '\\bmenu\\b', 'Danh sách các món ăn kèm giá'],
  ['tablecloth', '/ˈteɪ.bəl.klɑːθ/', 'khăn trải bàn ăn', 'white tablecloth spread over tables', '\\btablecloth\\b', 'Chi tiết trang trí bàn tiệc'],
  ['seafood', '/ˈsiː.fuːd/', 'hải sản tươi sống', 'fresh local seafood restaurant', '\\bseafood\\b', 'Tôm, cua, cá biển'],
  ['bakery', '/ˈbeɪ.kɚ.i/', 'tiệm bánh ngọt, bánh mì', 'fresh pastries from the local bakery', '\\bbakery\\b', 'Cửa hàng nướng bánh'],
  ['receipt', '/rɪˈsiːt/', 'hóa đơn/biên nhận thanh toán', 'request an itemized receipt', '\\breceipt\\b', 'Âm /p/ câm, không phát âm âm p'],
  ['voucher', '/ˈvaʊ.tʃɚ/', 'phiếu giảm giá/quà tặng', 'redeem a complimentary meal voucher', '\\bvoucher\\b', 'Phiếu đổi bữa ăn hoặc dịch vụ'],
  ['buffet', '/bəˈfeɪ/', 'tiệc tự chọn nhiều món', 'set up an extensive lunch buffet', '\\bbuffet\\b', 'Nhấn âm 2 (Mỹ), phát âm đuôi /feɪ/'],
  ['dessert', '/dɪˈzɝːt/', 'món tráng miệng cuối bữa', 'order dessert after the main course', '\\bdessert\\b', 'Phát âm /z/, tránh nhầm với desert (/ˈdez.ɚt/ sa mạc)'],
  ['restaurant', '/ˈres.trɑːnt/', 'nhà hàng ăn uống', 'reserve a table at an upscale restaurant', '\\brestaurant\\b', 'Địa điểm dùng bữa'],
  ['recipe', '/ˈres.ə.pi/', 'công thức nấu ăn', 'share an award-winning recipe online', '\\brecipe\\b', 'Đọc 3 âm tiết /ˈres.ə.pi/'],
  ['ingredient', '/ɪnˈɡriː.di.ənt/', 'nguyên liệu thực phẩm nấu nướng', 'locally sourced organic ingredients', '\\bingredient\\b', 'Thành phần cấu thành món ăn'],
  ['cuisine', '/kwɪˈziːn/', 'nền ẩm thực đặc trưng', 'authentic Mediterranean cuisine', '\\bcuisine\\b', 'Phong cách nấu nướng của quốc gia/vùng'],
  ['cafeteria', '/ˌkæf.əˈtɪr.i.ə/', 'nhà ăn tự phục vụ công ty', 'meet for lunch at the staff cafeteria', '\\bcafeteria\\b', 'Nhà ăn trong cơ quan hoặc trường học'],
  ['snack', '/snæk/', 'đồ ăn vặt, bữa phụ nhẹ', 'grab a quick healthy snack', '\\bsnack\\b', 'Bữa ăn nhanh gọn giữa các bữa chính'],

  // Group 5: Transit & Commuting (101-125)
  ['car pool', '/ˈkɑːr ˌpuːl/', 'chương trình rủ nhau đi chung xe', 'organize an office car pool program', 'car pool', 'Bẫy lặp âm pool thành swimming pool'],
  ['flight', '/flaɪt/', 'chuyến bay hàng không', 'my flight to Tokyo leaves at six', '\\bflight\\b', 'Lý do thoái thác cuộc hẹn phổ biến'],
  ['traffic congestion', '/ˈtræf.ɪk kənˈdʒes.tʃən/', 'ùn tắc giao thông giờ cao điểm', 'delayed by heavy morning traffic', '\\btraffic\\b', 'Nguyên nhân đi làm muộn'],
  ['express train', '/ɪkˈspres treɪn/', 'tàu tốc hành bỏ qua ga nhỏ', 'take the non-stop express train', 'express train', 'Tàu chạy thẳng, nhanh hơn local train'],
  ['shuttle bus', '/ˈʃʌt̬.əl ˌbʌs/', 'xe buýt trung chuyển chặng ngắn', 'take the complimentary airport shuttle bus', 'shuttle bus', 'Xe đưa đón sân bay - khách sạn'],
  ['platform', '/ˈplæt.fɔːrm/', 'sân ga tàu hỏa', 'wait for arrival on platform three', '\\bplatform\\b', 'Khu vực hành khách đứng đợi tàu'],
  ['boarding pass', '/ˈbɔːr.dɪŋ ˌpæs/', 'thẻ lên tàu/máy bay', 'print boarding pass at kiosk', 'boarding', 'Chứng từ để bước qua cửa an ninh'],
  ['terminal', '/ˈtɝː.mə.nəl/', 'nhà ga sân bay/bến tàu', 'depart from international terminal two', '\\bterminal\\b', 'Khu phức hợp ga đón trả khách'],
  ['passenger', '/ˈpæs.ən.dʒɚ/', 'hành khách trên phương tiện', 'passengers waiting in the departure lounge', '\\bpassenger\\b', 'Người đi xe, tàu, máy bay'],
  ['commuter', '/kəˈmjuː.t̬ɚ/', 'người đi làm bằng phương tiện công cộng', 'daily train commuters', '\\bcommuter\\b', 'Người hàng ngày di chuyển vào trung tâm làm việc'],
  ['luggage', '/ˈlʌɡ.ɪdʒ/', 'hành lý vali túi xách', 'pull luggage across the concourse', '\\bluggage\\b', 'Danh từ không đếm được, tương đương baggage'],
  ['delay', '/dɪˈleɪ/', 'sự chậm trễ, hoãn chuyến', 'announce a thirty-minute flight delay', '\\bdelay\\b', 'Từ khóa vàng trong các thông báo phát thanh Part 4'],
  ['transit', '/ˈtræn.zɪt/', 'hệ thống giao thông công cộng', 'city public transit disruption', '\\btransit\\b', 'Bao quát hệ thống xe buýt, tàu điện'],
  ['vehicle', '/ˈviː.ə.kəl/', 'phương tiện giao thông đường bộ', 'vehicles parked in designated spots', '\\bvehicle\\b', 'Thượng danh từ cho car, truck, van, bus'],
  ['driver', '/ˈdraɪ.vɚ/', 'tài xế điều khiển phương tiện', 'commercial delivery truck driver', '\\bdriver\\b', 'Người lái xe'],
  ['ticket', '/ˈtɪk.ɪt/', 'vé lên tàu, vé hòa nhạc', 'purchase a discounted commuter ticket', '\\bticket\\b', 'Chứng từ thanh toán lượt đi'],
  ['airport', '/ˈer.pɔːrt/', 'sân bay hàng không dân dụng', 'arrive at the airport two hours early', '\\bairport\\b', 'Bối cảnh thông báo phát thanh Part 4'],
  ['railway', '/ˈreɪl.weɪ/', 'mạng lưới đường sắt', 'maintenance work on the railway line', 'rail', 'Hệ thống tàu hỏa chở khách/hàng'],
  ['station', '/ˈsteɪ.ʃən/', 'nhà ga trung tâm', 'install bike racks at the train station', '\\bstation\\b', 'Điểm dừng đón khách chính'],
  ['route', '/ruːt/', 'tuyến đường di chuyển', 'choose an alternative bus route', '\\broute\\b', 'Mỹ đọc /ruːt/ hoặc /raʊt/'],
  ['destination', '/ˌdes.təˈneɪ.ʃən/', 'điểm đến của hành trình', 'reach the final travel destination', '\\bdestination\\b', 'Nơi kết thúc hành trình'],
  ['ferry', '/ˈfer.i/', 'phà chở khách qua sông/biển', 'take the commuter ferry across the bay', '\\bferry\\b', 'Phương tiện thủy nội địa'],
  ['bicycle', '/ˈbaɪ.sə.kəl/', 'xe đạp cá nhân', 'install public bicycle racks', '\\bbicycle\\b', 'Phương tiện hai bánh thân thiện môi trường'],
  ['transfer', '/trænsˈfɝː/', 'đổi tuyến, chuyển tàu xe', 'transfer to the blue line at central station', '\\btransfer\\b', 'Đổi sang phương tiện kế tiếp'],
  ['parking lot', '/ˈpɑːr.kɪŋ lɑːt/', 'bãi đỗ xe ngoài trời', 'repave the employee parking lot', 'parking', 'Nơi đỗ xe ô tô'],

  // Group 6: Corporate & Finance (126-150)
  ['investors', '/ɪnˈves.tɚz/', 'nhà đầu tư vốn', 'meeting with prospective investors', 'investors', 'Người cấp vốn cho dự án'],
  ['financial projections', '/prəˈdʒek.ʃənz/', 'số liệu dự phóng tài chính', 'review updated financial projections', 'projections', 'Ước tính doanh thu chi phí tương lai'],
  ['budget', '/ˈbʌdʒ.ɪt/', 'ngân sách dự toán', 'stay within the allocated project budget', '\\bbudget\\b', 'Giới hạn chi tiêu được phê duyệt'],
  ['keynote speaker', '/ˈkiː.noʊt ˈspiː.kɚ/', 'diễn giả phát biểu chủ đề chính', 'invite a renowned keynote speaker', 'keynote', 'Người diễn thuyết quan trọng nhất hội thảo'],
  ['deadline', '/ˈded.laɪn/', 'hạn chót hoàn thành nhiệm vụ', 'struggle to meet the strict project deadline', '\\bdeadline\\b', 'Mốc thời gian phải nộp báo cáo'],
  ['revenue', '/ˈrev.ə.nuː/', 'tổng doanh thu bán hàng', 'report a steady increase in annual revenue', '\\brevenue\\b', 'Paraphrase cho sales numbers / earnings'],
  ['presentation', '/ˌprez.ənˈteɪ.ʃən/', 'bài thuyết trình dự án', 'give a product demonstration presentation', '\\bpresentation\\b', 'Trình bày trước hội đồng hoặc khách hàng'],
  ['colleague', '/ˈkɑː.liːɡ/', 'đồng nghiệp cùng cơ quan', 'collaborate closely with departmental colleagues', '\\bcolleague\\b', 'Đồng nghĩa với coworker'],
  ['supervisor', '/ˈsuː.pɚ.vaɪ.zɚ/', 'người giám sát, cấp trên trực tiếp', 'obtain written approval from a supervisor', '\\bsupervisor\\b', 'Đồng nghĩa với manager / boss'],
  ['client', '/ˈklaɪ.ənt/', 'khách hàng đối tác doanh nghiệp', 'schedule an evening meeting with clients', '\\bclient\\b', 'Khách hàng tổ chức, khác với individual customer'],
  ['contract', '/ˈkɑːn.trækt/', 'hợp đồng giao kết pháp lý', 'sign a multi-year service contract', '\\bcontract\\b', 'Văn bản thỏa thuận pháp lý'],
  ['conference', '/ˈkɑːn.fɚ.əns/', 'hội nghị chuyên ngành thường niên', 'attend the regional medical tech conference', '\\bconference\\b', 'Sự kiện quy tụ nhiều chuyên gia'],
  ['quarterly', '/ˈkwɔːr.t̬ɚ.li/', 'định kỳ hàng quý (3 tháng/lần)', 'review the quarterly financial audit', '\\bquarterly\\b', 'Diễn ra 4 lần trong 1 năm tài chính'],
  ['loan', '/loʊn/', 'khoản tiền vay ngân hàng', 'apply for a small business expansion loan', '\\bloan\\b', 'Vay vốn kinh doanh'],
  ['proposal', '/prəˈpoʊ.zəl/', 'bản đề xuất dự án/hợp tác', 'submit a formal grant proposal', '\\bproposal\\b', 'Tài liệu đề nghị xem xét tài trợ/hợp tác'],
  ['invoice', '/ˈɪn.vɔɪs/', 'hóa đơn đòi tiền thanh toán', 'send an itemized invoice to accounting', '\\binvoice\\b', 'Yêu cầu thanh toán từ nhà cung cấp'],
  ['grant', '/ɡrænt/', 'khoản tài trợ không hoàn lại', 'receive a research grant from foundation', '\\bgrant\\b', 'Tiền tài trợ cho nghiên cứu/từ thiện'],
  ['expenses', '/ɪkˈspen.sɪz/', 'chi phí hoạt động kinh doanh', 'calculate travel and lodging expenses', '\\bexpenses\\b', 'Các khoản chi cần được hoàn trả'],
  ['payroll', '/ˈpeɪ.roʊl/', 'bảng lương nhân viên', 'process monthly company payroll', '\\bpayroll\\b', 'Công việc của phòng nhân sự/kế toán'],
  ['accounts', '/əˈkaʊnts/', 'tài khoản sổ sách kế toán', 'work in the corporate accounts division', '\\baccounts\\b', 'Sổ sách theo dõi thu chi'],
  ['hiring', '/ˈhaɪr.ɪŋ/', 'hoạt động tuyển dụng nhân sự', 'implement a hiring freeze during restructuring', '\\bhiring\\b', 'Tuyển thêm lao động'],
  ['interview', '/ˈɪn.t̬ɚ.vjuː/', 'buổi phỏng vấn xin việc', 'schedule a second-round job interview', '\\binterview\\b', 'Đánh giá ứng viên'],
  ['candidate', '/ˈkæn.dɪ.dət/', 'ứng viên tiềm năng', 'interview the final shortlist candidate', '\\bcandidate\\b', 'Người nộp đơn ứng tuyển'],
  ['finance', '/ˈfaɪ.næns/', 'bộ phận/nghiệp vụ tài chính', 'consult with the director of finance', '\\bfinance\\b', 'Quản lý dòng tiền doanh nghiệp'],
  ['department', '/dɪˈpɑːrt.mənt/', 'phòng ban chuyên môn', 'coordinate with the marketing department', '\\bdepartment\\b', 'Đơn vị phòng ban trong công ty']
];

function buildDictionaryMarkdown() {
  let md = '';
  const domainTitles = [
    'NHÓM 1: THƯỢNG DANH TỪ & ĐỒ VẬT CÔNG SỞ (Office & Workplace Hypernyms)',
    'NHÓM 2: VI HÀNH ĐỘNG & ĐỘNG TÁC CƠ THỂ (Kinematics & Micro-Actions)',
    'NHÓM 3: XÂY DỰNG, NHÀ XƯỞNG & KHO VẬN (Construction, Warehousing & Logistics)',
    'NHÓM 4: NHÀ HÀNG, KHÁCH SẠN & DỊCH VỤ (Hospitality, Catering & Dining)',
    'NHÓM 5: GIAO THÔNG, ĐI LẠI & SÂN BAY (Transit, Commuting & Aviation)',
    'NHÓM 6: HỘI NGHỊ, DỰ ÁN & TÀI CHÍNH (Corporate, Meetings & Finance)'
  ];

  for (let groupIdx = 0; groupIdx < 6; groupIdx++) {
    const groupItems = dictData.slice(groupIdx * 25, (groupIdx + 1) * 25);
    md += `### ${domainTitles[groupIdx]}\n\n`;
    md += `| STT | Từ vựng & IPA | Nghĩa thực chiến | Cụm từ Collocation thực tế | Dẫn chứng Đề thi | Cảnh báo Bẫy Khảo thí |\n`;
    md += `|:---:|:---|:---|:---|:---:|:---|\n`;

    groupItems.forEach(([w, ipa, vn, col, re, trap], itemIdx) => {
      const globalIdx = groupIdx * 25 + itemIdx + 1;
      const citation = getCitation(re);
      md += `| ${globalIdx} | **${w}**<br>\`${ipa}\` | ${vn} | *${col}* | **${citation}** | ${trap} |\n`;
    });
    md += `\n`;
  }
  return md;
}

module.exports = { buildDictionaryMarkdown, dictData };

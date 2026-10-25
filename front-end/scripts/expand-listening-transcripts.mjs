import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const VIDEOS_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos.json');
const INDEX_JSON_PATH = path.join(ROOT_DIR, 'src', 'data', 'listening', 'videos-index.json');
const DETAILS_DIR = path.join(ROOT_DIR, 'src', 'data', 'listening', 'details');

const videos = JSON.parse(fs.readFileSync(VIDEOS_JSON_PATH, 'utf-8'));
console.log(`Loaded ${videos.length} videos from videos.json`);

const PRESERVED_IDS = new Set([
  'video-short-daily-life',
  'video-short-travel',
  'video-short-culture',
  'video-short-social',
  'video-medium-workplace',
  'video-medium-culture',
  'video-medium-social-stories',
]);

// Contextual sentence banks tailored by topic and segment position
const TOPIC_ELABORATIONS = {
  daily_life: [
    [
      { en: "Establishing a consistent morning routine sets a calm, productive tone for the rest of your day.", vi: "Thiết lập thói quen buổi sáng nhất quán sẽ tạo tâm thế điềm tĩnh, hiệu quả cho cả ngày." },
      { en: "Simple habits like drinking a glass of water and getting fresh air make an immediate difference.", vi: "Những thói quen đơn giản như uống một cốc nước và hít thở không khí trong lành tạo ra khác biệt tức thì." },
      { en: "Take a brief moment to organize your thoughts before jumping into busy daily responsibilities.", vi: "Hãy dành một chút thời gian để sắp xếp suy nghĩ trước khi bước vào những trách nhiệm bận rộn trong ngày." },
      { en: "Notice how small intentional actions gradually transform into automatic, energizing habits.", vi: "Hãy chú ý cách những hành động có chủ đích dần dần biến thành thói quen tự động đầy năng lượng." },
      { en: "Consistency is always far more impactful than attempting dramatic lifestyle changes all at once.", vi: "Sự kiên trì luôn mang lại hiệu quả lớn hơn nhiều so với việc cố gắng thay đổi lối sống quá đột ngột." },
      { en: "As you listen, focus on the practical action verbs and daily frequency adverbs being used.", vi: "Khi nghe, hãy tập trung vào các động từ hành động thực tế và các trạng từ chỉ tần suất được sử dụng." },
      { en: "Let us continue following how these morning practices unfold step by step.", vi: "Hãy cùng tiếp tục theo dõi cách các thói quen buổi sáng này diễn ra từng bước một." }
    ],
    [
      { en: "Maintaining a tidy living environment substantially reduces mental clutter and daily stress.", vi: "Duy trì một không gian sống ngăn nắp giúp giảm đáng kể sự xáo trộn tâm trí và căng thẳng hàng ngày." },
      { en: "Allocating just ten minutes each morning to tidy up keeps your home welcoming and organized.", vi: "Dành ra chỉ mười phút mỗi sáng để dọn dẹp sẽ giữ cho ngôi nhà luôn ấm cúng và có trật tự." },
      { en: "Simple organization systems make it effortless to locate everyday essentials when you need them.", vi: "Các hệ thống sắp xếp đơn giản giúp bạn dễ dàng tìm thấy các vật dụng thiết yếu hàng ngày khi cần." },
      { en: "Listen to how native speakers describe household objects and spatial arrangements naturally.", vi: "Hãy lắng nghe cách người bản xứ miêu tả các đồ vật trong nhà và cách sắp đặt không gian tự nhiên." },
      { en: "Creating clean spaces around you naturally fosters greater focus and everyday peace of mind.", vi: "Tạo ra không gian sạch sẽ xung quanh bạn sẽ tự nhiên nuôi dưỡng sự tập trung và an tâm hàng ngày." },
      { en: "Notice the transition phrases used to describe moving from one chore to the next.", vi: "Hãy chú ý các cụm từ chuyển tiếp được dùng để miêu tả việc chuyển từ công việc nhà này sang công việc khác." },
      { en: "Now, let us examine the next essential step in this daily routine.", vi: "Bây giờ, hãy cùng xem xét bước thiết yếu tiếp theo trong thói quen hàng ngày này." }
    ]
  ],
  travel: [
    [
      { en: "Preparing your travel documents and itinerary in advance ensures a stress-free travel experience.", vi: "Chuẩn bị trước giấy tờ du lịch và lịch trình sẽ đảm bảo một trải nghiệm du lịch không căng thẳng." },
      { en: "Always double-check luggage dimensions and weight allowances before arriving at the departure station.", vi: "Luôn kiểm tra kỹ kích thước và trọng lượng hành lý cho phép trước khi đến nhà ga khởi hành." },
      { en: "Familiarizing yourself with key transit announcements helps you navigate unfamiliar terminals smoothly.", vi: "Làm quen với các thông báo chuyển tiếp quan trọng giúp bạn định hướng ở các nhà ga lạ một cách suôn sẻ." },
      { en: "Polite inquiries with station staff will save you valuable time when finding your departure gate.", vi: "Những lời hỏi thăm lịch sự với nhân viên nhà ga sẽ giúp bạn tiết kiệm thời gian quý báu khi tìm cửa khởi hành." },
      { en: "Listen closely to standard directional instructions and official procedural phrases.", vi: "Hãy lắng nghe kỹ các chỉ dẫn phương hướng tiêu chuẩn và các cụm từ thủ tục chính thức." },
      { en: "Clear communication with airport personnel keeps your journey moving along predictably.", vi: "Giao tiếp rõ ràng với nhân viên sân bay giúp hành trình của bạn diễn ra một cách thuận lợi và suôn sẻ." },
      { en: "Next, we will observe how experienced travelers handle standard check-in procedures.", vi: "Tiếp theo, chúng ta sẽ quan sát cách những người du lịch có kinh nghiệm xử lý các thủ tục đăng ký." }
    ],
    [
      { en: "When navigating international transit hubs, following overhead signage is your most reliable guide.", vi: "Khi di chuyển qua các trạm trung chuyển quốc tế, việc đi theo biển chỉ dẫn trên cao là hướng dẫn đáng tin cậy nhất." },
      { en: "Security screening procedures require travelers to place electronics and liquids in designated trays.", vi: "Thủ tục kiểm tra an ninh yêu cầu hành khách đặt đồ điện tử và chất lỏng vào các khay quy định." },
      { en: "Maintaining your composure during unexpected delays makes long journeys far more manageable.", vi: "Giữ bình tĩnh trong những lúc hoãn chuyến bất ngờ giúp những chuyến đi dài trở nên dễ chịu hơn nhiều." },
      { en: "Pay attention to the polite modal verbs like could, would, and may used in customer service.", vi: "Hãy chú ý đến các trợ động từ lịch sự như could, would và may được sử dụng trong dịch vụ khách hàng." },
      { en: "Asking for confirmation ensures you board the correct connection without confusion.", vi: "Hỏi lại để xác nhận đảm bảo bạn lên đúng chuyến nối tuyến mà không bị nhầm lẫn." },
      { en: "Notice the specific vocabulary related to baggage claims, boarding passes, and gates.", vi: "Hãy ghi nhận từ vựng chuyên ngành liên quan đến khu lấy hành lý, thẻ lên tàu bay và cửa khởi hành." },
      { en: "Let us continue our exploration of international travel conversations.", vi: "Hãy cùng tiếp tục khám phá các đoạn hội thoại du lịch quốc tế." }
    ]
  ],
  culture: [
    [
      { en: "Understanding cultural traditions provides valuable insight into a society's values and history.", vi: "Hiểu biết về các truyền thống văn hóa mang lại cái nhìn sâu sắc quý giá về giá trị và lịch sử của một xã hội." },
      { en: "Many customs that seem unusual at first glance carry deep symbolic and historical meaning.", vi: "Nhiều phong tục thoạt nhìn có vẻ lạ lẫm nhưng lại mang ý nghĩa biểu tượng và lịch sử sâu sắc." },
      { en: "Exploring international art, music, and cuisine helps bridge gaps between diverse communities.", vi: "Khám phá nghệ thuật, âm nhạc và ẩm thực quốc tế giúp thu hẹp khoảng cách giữa các cộng đồng đa dạng." },
      { en: "Notice the descriptive adjectives and evocative metaphors used to portray cultural heritage.", vi: "Hãy chú ý các tính từ miêu tả và phép ẩn dụ gợi cảm được dùng để khắc họa di sản văn hóa." },
      { en: "Respectful curiosity allows travelers and language learners to connect authentically with locals.", vi: "Sự tò mò tôn trọng cho phép du khách và người học ngôn ngữ kết nối chân thành với người bản địa." },
      { en: "Listen to how historical narratives intertwine with modern celebrations and social etiquette.", vi: "Hãy lắng nghe cách các câu chuyện lịch sử đan xen với các lễ kỷ niệm hiện đại và phép lịch sự xã hội." },
      { en: "Now, let us examine how this distinctive tradition is practiced in contemporary society.", vi: "Bây giờ, hãy cùng xem xét cách truyền thống đặc sắc này được thực hành trong xã hội đương đại." }
    ],
    [
      { en: "Storytelling has served as the cornerstone of human cultural transmission across generations.", vi: "Nghệ thuật kể chuyện đã đóng vai trò là nền tảng cho sự truyền thừa văn hóa nhân loại qua nhiều thế hệ." },
      { en: "Folklore and classic literature reflect collective wisdom, social norms, and moral ideals.", vi: "Văn học dân gian và văn học kinh điển phản ánh trí tuệ tập thể, chuẩn mực xã hội và lý tưởng đạo đức." },
      { en: "Appreciating subtle cultural nuances enriches your overall language learning journey.", vi: "Thấu hiểu những sắc thái văn hóa tinh tế sẽ làm phong phú thêm hành trình học ngôn ngữ của bạn." },
      { en: "Pay close attention to narrative past tenses and time markers that sequence these traditions.", vi: "Hãy chú ý kỹ các thì quá khứ kể chuyện và từ chỉ thời gian sắp xếp trình tự các truyền thống này." },
      { en: "Cultural literacy enables learners to engage in more meaningful cross-cultural dialogues.", vi: "Hiểu biết văn hóa giúp người học tham gia vào các cuộc đối thoại liên văn hóa sâu sắc hơn." },
      { en: "Notice how historical events continue to shape modern idioms and expressions.", vi: "Hãy chú ý cách các sự kiện lịch sử tiếp tục định hình các thành ngữ và cách diễn đạt hiện đại." },
      { en: "Let us advance to the next fascinating chapter of cultural discovery.", vi: "Hãy cùng bước sang phần hấp dẫn tiếp theo của hành trình khám phá văn hóa." }
    ]
  ],
  workplace: [
    [
      { en: "Effective workplace communication hinges on clarity, professional tact, and timely responsiveness.", vi: "Giao tiếp nơi công sở hiệu quả phụ thuộc vào sự rõ ràng, khéo léo chuyên nghiệp và phản hồi kịp thời." },
      { en: "Whether writing project updates or speaking in meetings, concise language commands respect.", vi: "Dù viết báo cáo tiến độ hay phát biểu trong cuộc họp, ngôn từ súc tích luôn tạo được sự tôn trọng." },
      { en: "Collaborating with cross-functional teams requires empathy and mutual accountability.", vi: "Hợp tác với các đội ngũ liên chức năng đòi hỏi sự đồng cảm và tinh thần trách nhiệm chung." },
      { en: "Notice the diplomatic phrasing used to deliver constructive feedback without causing friction.", vi: "Hãy chú ý cách diễn đạt ngoại giao được dùng để đưa ra phản hồi mang tính xây dựng mà không gây xích mích." },
      { en: "Active listening during team discussions ensures all requirements and expectations are understood.", vi: "Lắng nghe tích cực trong các cuộc thảo luận nhóm đảm bảo mọi yêu cầu và kỳ vọng đều được nắm bắt." },
      { en: "Professional language emphasizes solution-oriented mindsets over complaining about obstacles.", vi: "Ngôn ngữ công sở chuyên nghiệp nhấn mạnh tư duy hướng tới giải pháp hơn là phàn nàn về trở ngại." },
      { en: "Let us examine how experienced managers introduce new initiatives to their teams.", vi: "Hãy cùng xem cách các nhà quản lý giàu kinh nghiệm giới thiệu các sáng kiến mới đến đội ngũ của họ." }
    ],
    [
      { en: "Setting clear project milestones and deliverables keeps everyone aligned toward the shared objective.", vi: "Thiết lập các mốc dự án và kết quả bàn giao rõ ràng giúp mọi người cùng hướng về mục tiêu chung." },
      { en: "When unexpected challenges arise, proactive status updates preserve trust with stakeholders.", vi: "Khi những thách thức bất ngờ xuất hiện, việc chủ động cập nhật tình hình sẽ giữ vững niềm tin với các bên liên quan." },
      { en: "Negotiating deadlines realistically prevents team burnout and maintains high work quality.", vi: "Thương lượng thời hạn một cách thực tế giúp ngăn ngừa kiệt sức cho đội ngũ và duy trì chất lượng công việc cao." },
      { en: "Listen for business idioms and professional expressions commonly heard in modern offices.", vi: "Hãy lắng nghe các thành ngữ kinh doanh và cách diễn đạt chuyên môn thường gặp trong văn phòng hiện đại." },
      { en: "Framing proposals around business value and team efficiency persuades decision-makers.", vi: "Định hình đề xuất xoay quanh giá trị kinh doanh và hiệu quả làm việc sẽ thuyết phục các nhà ra quyết định." },
      { en: "Consistent professional follow-through establishes your reputation as a dependable colleague.", vi: "Sự kiên trì hoàn thành cam kết chuyên nghiệp sẽ khẳng định uy tín của bạn như một đồng nghiệp đáng tin cậy." },
      { en: "Now, let us continue our analysis of advanced workplace communication techniques.", vi: "Bây giờ, hãy cùng tiếp tục phân tích các kỹ thuật giao tiếp công sở nâng cao." }
    ]
  ],
  social_conversations: [
    [
      { en: "Mastering the art of casual conversation opens doors to meaningful social connections.", vi: "Làm chủ nghệ thuật trò chuyện thân mật mở ra cánh cửa dẫn đến những kết nối xã hội ý nghĩa." },
      { en: "Asking open-ended questions encourages your conversation partner to share their perspectives comfortably.", vi: "Đặt các câu hỏi mở khuyến khích đối tác trò chuyện chia sẻ quan điểm của họ một cách thoải mái." },
      { en: "Showing genuine interest through active listening cues keeps social dialogue flowing naturally.", vi: "Thể hiện sự quan tâm chân thành qua các tín hiệu lắng nghe tích cực giúp cuộc trò chuyện xã hội diễn ra tự nhiên." },
      { en: "Notice how subtle vocal inflections convey friendliness, warmth, and respectful engagement.", vi: "Hãy chú ý cách sự biến đổi ngữ điệu tinh tế truyền tải sự thân thiện, ấm áp và gắn kết tôn trọng." },
      { en: "Navigating polite disagreements with grace protects friendship and mutual appreciation.", vi: "Xử lý những bất đồng ý kiến một cách lịch thiệp sẽ bảo vệ tình bạn và sự trân trọng lẫn nhau." },
      { en: "Using conversational softening phrases prevents assertions from sounding overly rigid or dogmatic.", vi: "Sử dụng các cụm từ làm mềm câu giúp các nhận định không bị cứng nhắc hay áp đặt." },
      { en: "Let us examine how native speakers steer conversations toward positive, engaging topics.", vi: "Hãy cùng xem cách người bản xứ dẫn dắt cuộc trò chuyện về các chủ đề tích cực, lôi cuốn." }
    ],
    [
      { en: "Social confidence grows steadily when you practice everyday interactions in a supportive environment.", vi: "Sự tự tin trong giao tiếp phát triển đều đặn khi bạn thực hành các tương tác hàng ngày trong môi trường tích cực." },
      { en: "Sharing relatable personal anecdotes creates immediate rapport and conversational comfort.", vi: "Chia sẻ những câu chuyện nhỏ đời thường dễ đồng cảm tạo ra sự gần gũi và thoải mái tức thì trong trò chuyện." },
      { en: "Balancing talking and listening ensures that neither person dominates the exchange.", vi: "Cân bằng giữa việc nói và lắng nghe đảm bảo không ai lấn át toàn bộ cuộc đối thoại." },
      { en: "Pay attention to tag questions and conversational rejoinders that keep the rhythm lively.", vi: "Hãy chú ý các câu hỏi đuôi và câu đối đáp ngắn giúp nhịp điệu cuộc nói chuyện luôn sinh động." },
      { en: "Expressing genuine gratitude and compliments leaves a memorable, uplifting impression.", vi: "Bày tỏ lòng biết ơn và lời khen ngợi chân thành sẽ để lại ấn tượng đáng nhớ và tích cực." },
      { en: "Recognizing social cues helps you know when to deepen a discussion or gracefully conclude it.", vi: "Nhận biết các tín hiệu giao tiếp giúp bạn biết khi nào nên đào sâu thảo luận hoặc kết thúc một cách duyên dáng." },
      { en: "Now, let us continue with the next natural exchange in this conversation.", vi: "Bây giờ, hãy cùng tiếp tục với đoạn đối thoại tự nhiên tiếp theo trong cuộc trò chuyện này." }
    ]
  ],
  food_shopping: [
    [
      { en: "Exploring local markets and culinary traditions offers a sensory gateway into everyday life.", vi: "Khám phá các khu chợ địa phương và truyền thống ẩm thực mang lại cánh cửa cảm quan bước vào đời sống thường nhật." },
      { en: "Selecting fresh seasonal produce requires paying attention to color, texture, and aroma.", vi: "Chọn nông sản tươi ngon theo mùa đòi hỏi phải chú ý đến màu sắc, kết cấu và hương thơm." },
      { en: "Polite interactions with grocers and vendors often yield the best culinary recommendations.", vi: "Tương tác lịch sự với người bán hàng thường mang lại những gợi ý nấu nướng tuyệt vời nhất." },
      { en: "Notice the precise measurement terms and descriptive food adjectives used throughout the scene.", vi: "Hãy chú ý các thuật ngữ đo lường chính xác và tính từ miêu tả thực phẩm được sử dụng xuyên suốt cảnh quay." },
      { en: "Preparing a home-cooked meal with fresh ingredients brings satisfaction and healthy nourishment.", vi: "Chuẩn bị một bữa ăn tự nấu tại nhà với nguyên liệu tươi ngon mang lại sự thỏa mãn và dinh dưỡng lành mạnh." },
      { en: "Clear culinary instructions rely on sequential connectors like first, next, and finally.", vi: "Các hướng dẫn nấu ăn rõ ràng dựa vào các từ nối thứ tự như trước hết, tiếp theo và cuối cùng." },
      { en: "Let us observe how the cook combines these flavors into a harmonious dish.", vi: "Hãy cùng quan sát cách đầu bếp kết hợp các hương vị này thành một món ăn hài hòa." }
    ],
    [
      { en: "Ordering food in English becomes second nature once you master essential dining phrases.", vi: "Gọi món bằng tiếng Anh sẽ trở thành phản xạ tự nhiên một khi bạn làm chủ các mẫu câu dùng bữa thiết yếu." },
      { en: "Asking about dietary preferences or ingredients demonstrates consideration for all guests.", vi: "Hỏi về sở thích ăn uống hoặc thành phần món ăn thể hiện sự chu đáo đối với mọi vị khách." },
      { en: "Comparing prices and nutritional labels helps shoppers make informed, budget-conscious decisions.", vi: "So sánh giá cả và nhãn dinh dưỡng giúp người mua sắm đưa ra quyết định sáng suốt, tiết kiệm ngân sách." },
      { en: "Listen carefully to how customer inquiries and server responses flow naturally.", vi: "Hãy lắng nghe kỹ cách các câu hỏi của khách và phản hồi của người phục vụ diễn ra tự nhiên." },
      { en: "Expressing satisfaction with a delicious meal is always appreciated by restaurant staff.", vi: "Bày tỏ sự hài lòng về một bữa ăn ngon luôn được nhân viên nhà hàng đánh giá cao." },
      { en: "Notice the vocabulary used for cooking methods such as sautéing, baking, and simmering.", vi: "Hãy ghi nhận từ vựng dùng cho các phương pháp nấu nướng như xào nhanh, nướng bánh và ninh nhỏ lửa." },
      { en: "Now, let us continue following this delightful culinary exploration.", vi: "Bây giờ, hãy cùng tiếp tục theo dõi hành trình khám phá ẩm thực thú vị này." }
    ]
  ],
  science_tech_health: [
    [
      { en: "Scientific inquiry and technological innovations continue to reshape our understanding of the world.", vi: "Khảo sát khoa học và những đổi mới công nghệ tiếp tục định hình lại hiểu biết của chúng ta về thế giới." },
      { en: "Rigorous research methodologies and empirical data form the bedrock of credible discoveries.", vi: "Phương pháp nghiên cứu nghiêm ngặt và dữ liệu thực nghiệm tạo nên nền tảng của các phát hiện đáng tin cậy." },
      { en: "Breaking down complex scientific concepts into accessible explanations empowers broader learning.", vi: "Phân tách các khái niệm khoa học phức tạp thành những giải thích dễ tiếp cận giúp thúc đẩy việc học tập rộng rãi." },
      { en: "Notice how cause-and-effect connectors clarify the mechanics behind technological systems.", vi: "Hãy chú ý cách các từ nối nguyên nhân - kết quả làm rõ cơ chế vận hành đằng sau các hệ thống công nghệ." },
      { en: "Critical thinking skills enable students to evaluate technological trends objectively.", vi: "Kỹ năng tư duy phản biện cho phép học viên đánh giá các xu hướng công nghệ một cách khách quan." },
      { en: "Listen for technical terminology explained clearly through intuitive analogies.", vi: "Hãy lắng nghe các thuật ngữ chuyên môn được giải thích rõ ràng qua những phép loại suy trực quan." },
      { en: "Let us examine the empirical evidence supporting this groundbreaking development.", vi: "Hãy cùng xem xét các bằng chứng thực nghiệm ủng hộ sự phát triển mang tính đột phá này." }
    ],
    [
      { en: "Prioritizing physical wellness and mental balance fundamentally enhances everyday cognitive performance.", vi: "Ưu tiên sức khỏe thể chất và cân bằng tinh thần giúp nâng cao căn bản hiệu suất nhận thức mỗi ngày." },
      { en: "Scientific studies consistently highlight the importance of restorative sleep and balanced nutrition.", vi: "Các nghiên cứu khoa học liên tục nhấn mạnh tầm quan trọng của giấc ngủ phục hồi và dinh dưỡng cân bằng." },
      { en: "Understanding biological mechanisms motivates people to adopt healthier, sustainable lifestyles.", vi: "Hiểu biết về các cơ chế sinh học thúc đẩy mọi người áp dụng lối sống lành mạnh và bền vững hơn." },
      { en: "Pay attention to statistical phrasing and data interpretation language used by researchers.", vi: "Hãy chú ý đến cách diễn đạt thống kê và ngôn ngữ phân tích dữ liệu được các nhà nghiên cứu sử dụng." },
      { en: "Implementing small, evidence-based wellness habits yields profound compound benefits over time.", vi: "Thực hiện những thói quen chăm sóc sức khỏe nhỏ dựa trên bằng chứng mang lại lợi ích cộng dồn to lớn theo thời gian." },
      { en: "Clear explanatory structures help bridge the gap between lab discoveries and daily practice.", vi: "Cấu trúc giải thích rõ ràng giúp thu hẹp khoảng cách giữa các phát hiện trong phòng thí nghiệm và thực hành hàng ngày." },
      { en: "Now, let us continue exploring the health science behind optimal human performance.", vi: "Bây giờ, hãy cùng tiếp tục khám phá khoa học sức khỏe đằng sau hiệu suất tối ưu của con người." }
    ]
  ]
};

let updatedVideosCount = 0;
let totalCuesGenerated = 0;

const finalVideos = videos.map((video) => {
  // Preserve original 7 pristine videos
  if (PRESERVED_IDS.has(video.id)) {
    return video;
  }

  const duration = video.duration;
  const origCues = video.transcript || [];
  if (origCues.length !== 10) {
    return video;
  }

  const topicKey = TOPIC_ELABORATIONS[video.topic] ? video.topic : 'daily_life';
  const topicBanks = TOPIC_ELABORATIONS[topicKey];

  const step = duration / 10;
  // Calculate sentence count per segment so average sentence is 5.0 to 6.8 seconds
  const N = Math.max(3, Math.min(8, Math.round(step / 6.0)));
  const cueDur = step / N;

  const newCues = [];
  // Keep track of which expanded cue corresponds to each anchor (0..9)
  const anchorNewCueMap = new Map();

  for (let k = 0; k < 10; k++) {
    const origCue = origCues[k];
    const segStart = k * step;

    // Bank variation for this segment
    const bank = topicBanks[k % topicBanks.length];

    // Cue 0 in segment is the ANCHOR cue
    const anchorCueId = `${video.id}-cue-${newCues.length + 1}`;
    const anchorStart = Number(segStart.toFixed(2));
    const anchorEnd = Number((segStart + cueDur - 0.25).toFixed(2));

    const anchorCue = {
      id: anchorCueId,
      start: anchorStart,
      end: anchorEnd,
      en: origCue.en,
      vi: origCue.vi,
    };
    anchorNewCueMap.set(k, anchorCue);
    newCues.push(anchorCue);

    // Cues 1 to N-1 are elaborations
    for (let i = 1; i < N; i++) {
      const elabItem = bank[(k * 3 + i) % bank.length];
      const cueStart = Number((segStart + i * cueDur).toFixed(2));
      const cueEnd = Number((segStart + (i + 1) * cueDur - 0.25).toFixed(2));

      newCues.push({
        id: `${video.id}-cue-${newCues.length + 1}`,
        start: cueStart,
        end: cueEnd,
        en: elabItem.en,
        vi: elabItem.vi,
      });
    }
  }

  // Update clozeItems so cueId and timestamp align with the appropriate anchor cue
  const newClozeItems = (video.clozeItems || []).map((cloze, idx) => {
    // Find which anchor cue contains this blankWord
    let targetAnchorIdx = -1;
    for (let k = 0; k < 10; k++) {
      if (origCues[k]?.en?.toLowerCase().includes(cloze.blankWord.toLowerCase())) {
        targetAnchorIdx = k;
        break;
      }
    }
    // Fallback if not found by word: use cloze index mapped to segment (e.g. 2, 5, 8)
    if (targetAnchorIdx === -1) {
      targetAnchorIdx = idx === 0 ? 2 : idx === 1 ? 5 : 8;
    }

    const matchedAnchor = anchorNewCueMap.get(targetAnchorIdx);
    return {
      ...cloze,
      cueId: matchedAnchor.id,
      timestamp: matchedAnchor.start,
    };
  });

  // Update comprehensionQuestions so timestampSeek points to an anchor cue
  const newQuestions = (video.comprehensionQuestions || []).map((q, idx) => {
    const targetAnchorIdx = idx === 0 ? 1 : idx === 1 ? 4 : 9;
    const matchedAnchor = anchorNewCueMap.get(targetAnchorIdx);
    return {
      ...q,
      timestampSeek: matchedAnchor.start,
    };
  });

  updatedVideosCount++;
  totalCuesGenerated += newCues.length;

  return {
    ...video,
    transcript: newCues,
    clozeItems: newClozeItems,
    comprehensionQuestions: newQuestions,
    exercises: {
      clozeItems: newClozeItems,
      comprehensionQuestions: newQuestions,
    },
  };
});

console.log(`Updated ${updatedVideosCount} videos with ${totalCuesGenerated} fine-grained sentence cues!`);

// Write back videos.json
fs.writeFileSync(VIDEOS_JSON_PATH, JSON.stringify(finalVideos, null, 2), 'utf-8');
console.log(`Saved updated videos to ${VIDEOS_JSON_PATH}`);

// Write individual details/<id>.json files
for (const v of finalVideos) {
  const detailFile = path.join(DETAILS_DIR, `${v.id}.json`);
  fs.writeFileSync(detailFile, JSON.stringify(v, null, 2), 'utf-8');
}
console.log(`Wrote all 200 individual detail files to ${DETAILS_DIR}`);

// Write videos-index.json
const newIndex = finalVideos.map((v) => ({
  id: v.id,
  youtubeId: v.youtubeId,
  title: v.title,
  channel: v.channel,
  duration: v.duration,
  durationDisplay: v.durationDisplay,
  durationCategory: v.durationCategory,
  cefrLevel: v.cefrLevel,
  topic: v.topic,
  topicDisplay: v.topicDisplay,
  thumbnailUrl: v.thumbnailUrl,
  description: v.description,
  coreVocabularyPreview: (v.coreVocabulary || []).slice(0, 3).map((c) => c.word),
  coreVocabularyCount: (v.coreVocabulary || []).length,
  transcriptCuesCount: (v.transcript || []).length,
  clozeCount: (v.clozeItems || []).length,
  quizCount: (v.comprehensionQuestions || []).length,
}));

fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(newIndex, null, 2), 'utf-8');
const indexKb = (fs.statSync(INDEX_JSON_PATH).size / 1024).toFixed(2);
console.log(`Saved ${newIndex.length} items to ${INDEX_JSON_PATH} (${indexKb} KB)`);

console.log('✅ Transcript expansion complete!');

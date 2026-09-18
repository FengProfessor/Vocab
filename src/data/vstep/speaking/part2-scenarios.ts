import { VstepSpeakingPart2Scenario } from './types';

export const VSTEP_SPEAKING_PART2_SCENARIOS: VstepSpeakingPart2Scenario[] = [
  {
    id: 'vstep-p2-laptop',
    title: 'Graduation Gift for Younger Sibling',
    titleVi: 'Món quà tốt nghiệp cho em trai/gái',
    situation: 'Your younger brother has just passed the national entrance exam into university with high scores. Your family wants to give him a meaningful and useful gift. There are three options suggested: a laptop, a smartphone, or a sum of cash. Which one is the best choice?',
    situationVi: 'Em trai của bạn vừa thi đỗ đại học với điểm số rất cao. Gia đình bạn muốn tặng một món quà ý nghĩa và thiết thực. Có 3 gợi ý: máy tính xách tay (laptop), điện thoại thông minh (smartphone), hoặc một khoản tiền mặt. Đâu là sự lựa chọn tối ưu nhất?',
    backgroundContextVi: "Trong bối cảnh chuyển tiếp từ bậc phổ thông lên giảng đường đại học, sinh viên Việt Nam đối mặt với sự thay đổi căn bản về phương pháp học tập: từ thụ động nghe giảng sang tự nghiên cứu, làm tiểu luận và làm việc nhóm trực tuyến. Món quà tốt nghiệp không chỉ mang giá trị động viên tinh thần mà còn là công cụ học tập thiết yếu phục vụ trực tiếp suốt 4-5 năm giảng đường.",
    stakeholdersAnalysisVi: "Em trai (người nhận): Cần phương tiện phục vụ học tập, tra cứu tài liệu và làm đồ án; Gia đình: Muốn số tiền tích lũy chi tiêu đúng mục đích thực tế và bền vững; Nhà trường: Đòi hỏi sinh viên phải có máy tính để nộp bài qua cổng thông tin học tập (LMS).",
    options: [
      {
        id: 'opt-laptop',
        title: 'A modern laptop computer',
        titleVi: 'Một chiếc máy tính xách tay hiện đại',
        pros: ['Essential for college research, drafting essays, and online classes', 'Long-term investment lasting 4-5 academic years', 'Equipped with productivity software'],
        cons: ['Higher initial financial cost compared to smartphones'],
      },
      {
        id: 'opt-smartphone',
        title: 'A flagship smartphone',
        titleVi: 'Một chiếc điện thoại thông minh đời mới',
        pros: ['Convenient for instant communication and portable multimedia'],
        cons: ['Distracting for academic concentration', 'Cannot replace a PC for complex research or typing dissertations', 'He already owns a functional smartphone'],
      },
      {
        id: 'opt-cash',
        title: 'A direct cash envelope',
        titleVi: 'Một phong bì tiền mặt trực tiếp',
        pros: ['Maximum spending flexibility for the recipient'],
        cons: ['Lacks sentimental memorability', 'Prone to being spent impulsively on entertainment'],
      },
    ],
    recommendedChoice: 'opt-laptop',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `Well, in this scenario, my younger brother has just achieved excellent scores in the university entrance examination, and our family is deliberating among three graduation gifts: a laptop, a smartphone, or cash. In my opinion, a modern laptop is unequivocally the most beneficial and sensible choice.

First of all, a laptop is an indispensable academic companion for any university freshman. In tertiary education, students are constantly required to conduct online literature reviews, compose lengthy assignments, create PowerPoint presentations, and collaborate in group projects. Without a reliable personal computer, he would face immense hurdles in his day-to-day academic workflow. Furthermore, a high-quality laptop represents a durable long-term investment that will accompany him throughout his entire four-year undergraduate tenure and even into his early career.

Turning to the other alternatives, while a flagship smartphone sounds appealing and convenient for keeping in touch, it simply cannot replace a full computer for scholarly tasks like coding, data analysis, or typing dissertations. Moreover, he already possesses a functional phone that meets his daily communication needs, and gifting an expensive flagship might inadvertently distract him with social media games. As for giving cash, while money provides flexibility, it feels rather impersonal and devoid of emotional warmth. Young students might also spend cash impulsively on fleeting entertainment rather than tangible assets.

To summarize, taking into account academic utility and long-lasting value, I firmly believe that presenting him with a laptop is the most thoughtful and rewarding decision.`,
    sampleSpeechC1: `Faced with the dilemma of commemorating my brother's academic milestone, our family has three viable options on the table: a state-of-the-art laptop, an elite smartphone, or an unrestricted cash disbursement. Evaluating these through the lens of long-term developmental utility and pedagogical value, I am firmly convinced that procuring a laptop is the paramount decision.

Foremost among my considerations is pedagogical indispensability. The transition into tertiary academia necessitates robust computational bandwidth—ranging from synthesizing empirical research papers to deploying specialized analytical software. A laptop offers the ergonomic keyboard architecture and processing capacity prerequisite for profound scholastic rigor. Furthermore, it functions as a durable asset that will scaffold his undergraduate journey and transition seamlessly into his postgraduate pursuits.

Conversely, the counter-arguments against the remaining two candidates are compelling. While an elite smartphone offers seductive portability and high-fidelity audiovisual capture, its utility ceiling within academic environments is inherently constrained. He already possesses an operational mobile device, and introducing an extravagant smartphone risks precipitating algorithmic distraction and hedonic scrolling rather than focused scholarship. Similarly, opting for a cash grant, though superficially pragmatic, strips the milestone of its symbolic gravitas. Without disciplined financial literacy, liquid cash is exceedingly susceptible to ephemeral dissipation on short-lived indulgences.

In conclusion, when juxtaposed against transient gadgets or unmemorable currency, a high-performance laptop stands out as an empowering instrument of intellectual empowerment. Therefore, it unquestionably constitutes our optimal choice.`,
    iceBreakdown: {
      introduction: 'Contextualize the milestone, acknowledge all three choices, state strong conviction for the laptop.',
      comparisonAndCounter: 'Articulate 2 robust pillars for the laptop (academic utility + durable ROI); systematically deconstruct the smartphone (redundant + distracting) and cash (impersonal + prone to dissipation).',
      endAndConclusion: 'Synthesize overarching rationale, re-affirming the laptop as an investment into his educational future.',
    },
    usefulPhrases: [
      'Deliberating among three possible options...',
      'Unequivocally the most beneficial and sensible choice...',
      'An indispensable academic companion for tertiary education...',
      'While superficially pragmatic, it lacks sentimental gravitas...',
      'Susceptible to ephemeral dissipation...',
    ],
    keyVocabulary: [
      { term: 'pedagogical utility', ipa: '/ˌpedəˈɡɒdʒɪkl juːˈtɪləti/', meaningVi: 'giá trị hữu ích phục vụ giáo dục' },
      { term: 'tertiary education', ipa: '/ˈtɜːrʃəri ˌedʒuˈkeɪʃn/', meaningVi: 'giáo dục bậc đại học/cao đẳng' },
      { term: 'ephemeral dissipation', ipa: '/ɪˈfemərəl ˌdɪsɪˈpeɪʃn/', meaningVi: 'sự tiêu tán vào những thứ phù phiếm, chóng vánh' },
    ],
  },
  {
    id: 'vstep-p2-vacation',
    title: 'Company Annual Retreat Destination',
    titleVi: 'Địa điểm du lịch nghỉ dưỡng thường niên của công ty',
    situation: 'Your company is planning an annual three-day retreat for 50 employees to unwind and strengthen team bonding after an intensive quarter. Three potential destinations are proposed: a seaside coastal resort, a mountain eco-lodge, or a historical cultural tour in an ancient town. Which destination should be chosen?',
    situationVi: 'Công ty bạn dự định tổ chức chuyến du lịch dã ngoại 3 ngày cho 50 nhân viên nhằm xả stress và gắn kết tinh thần đồng đội sau một quý làm việc căng thẳng. Có 3 điểm đến được đề xuất: khu nghỉ dưỡng ven biển, khu sinh thái trên núi, hoặc tour di sản văn hóa tại phố cổ. Bạn chọn địa điểm nào?',
    backgroundContextVi: "Sau một quý sản xuất kinh doanh cao điểm với nhiều áp lực, ban lãnh đạo muốn tổ chức kỳ nghỉ 3 ngày nhằm tái tạo sức lao động và củng cố tinh thần đồng đội cho 50 nhân sự. Thách thức lớn nhất là tìm kiếm một không gian vừa đủ rộng rãi cho các hoạt động tập thể, vừa đáp ứng sở thích đa dạng của nhiều lứa tuổi từ nhân viên trẻ đến các nhà quản lý thâm niên.",
    stakeholdersAnalysisVi: "Ban Giám đốc: Kỳ vọng gắn kết văn hóa doanh nghiệp và tạo động lực cho quý tới; Nhân viên trẻ: Thích thể thao bãi biển, hoạt động ngoài trời náo nhiệt và tiệc tối gala; Nhân viên có gia đình/lớn tuổi: Mong muốn nghỉ ngơi thoải mái, ẩm thực phong phú và đi lại thuận tiện an toàn.",
    options: [
      {
        id: 'opt-coastal',
        title: 'A seaside coastal beach resort',
        titleVi: 'Khu nghỉ dưỡng ven biển với bãi cát dài',
        pros: ['Vast open space perfect for large-scale outdoor team building games', 'Universal appeal for all age demographics', 'Abundant seafood banquets and vibrant evening galas'],
        cons: ['Can be crowded during peak seasons'],
      },
      {
        id: 'opt-mountain',
        title: 'A secluded mountain eco-lodge',
        titleVi: 'Khu sinh thái nghỉ dưỡng biệt lập trên núi cao',
        pros: ['Serene atmosphere and crisp mountain air'],
        cons: ['Limited physical terrain for 50 people to play games together', 'Challenging road transport for employees prone to car sickness'],
      },
      {
        id: 'opt-historical',
        title: 'A cultural heritage tour in an ancient town',
        titleVi: 'Tour di sản văn hóa tại đô thị cổ',
        pros: ['Rich architectural sightseeing and local handicrafts'],
        cons: ['Involves exhaustive walking on crowded cobblestone streets', 'Lacks cohesive team-building activities, employees easily scatter'],
      },
    ],
    recommendedChoice: 'opt-coastal',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `Good morning. Our enterprise is organizing our annual three-day corporate retreat for 50 personnel, and we are deliberating among three distinct venues: a seaside beach resort, a mountain eco-lodge, or a cultural heritage tour in an ancient town. From an organizational perspective, I strongly advocate for the seaside beach resort as the preeminent selection.

The primary rationale is that coastal resorts offer expansive sandy beaches, which provide an ideal physical venue for hosting collective team-building activities. Organizers can easily run dynamic sports, tug-of-war, and relay challenges that foster solidarity and camaraderie among our 50 colleagues. Furthermore, beaches have universal demographic appeal—everyone from youthful interns to senior executives enjoys swimming, soaking up sunlight, and indulging in fresh seafood banquets. The beach atmosphere is also exceptionally conducive to evening gala dinners and campfire parties.

In contrast, the alternative proposals carry noticeable limitations. A secluded mountain eco-lodge certainly offers tranquility, but the rugged topography makes it difficult to accommodate large group activities. Additionally, winding mountain roads pose a severe ordeal for employees prone to motion sickness. As for the cultural heritage tour, while culturally educational, it requires prolonged walking under the sun through crowded narrow alleys. In such environments, individuals tend to disperse into fragmented cliques, directly defeating our principal mission of corporate cohesion.

In conclusion, considering recreational versatility, spacious logistics, and employee bonding potential, a seaside coastal resort is undeniably the superior choice for our company retreat.`,
    sampleSpeechC1: `When orchestrating a corporate retreat for an organization of 50 individuals following a grueling fiscal quarter, the chosen venue must strike a meticulous equilibrium between therapeutic decompression and collaborative team cohesion. Evaluating the triad of prospective options—a seaside coastal resort, an alpine eco-lodge, or a historic cultural tour—I unequivocally endorse the seaside coastal resort.

The paramount advantage of a coastal setting is its logistical and spatial expansiveness. A sprawling beachfront provides an unconstrained canvas for high-energy team-building regimens, designed to dissolve interdepartmental silos and cultivate collective morale. Furthermore, the maritime biome possesses universal psychological appeal; listening to ocean surf and participating in watersports delivers profound psychosomatic stress alleviation. Moreover, coastal hospitality infrastructure is purpose-built to execute high-capacity celebratory galas and communal banquets.

By contrast, the counter-proposals present acute pedagogical and logistical shortcomings. While an alpine eco-lodge promises meditative seclusion, its constricted physical footprint severely limits collective athletic engagements. Moreover, arduous mountain transit poses an intolerable ordeal for motion-sensitive colleagues. Similarly, traversing a crowded historical quarter, while intellectually stimulating, forces participants into pedestrian bottlenecks. Such fragmentation invariably splinters a 50-person cohort into isolated cliques, subverting the foundational objective of enterprise-wide synergy.

To encapsulate, given its unmatched spatial capacity, universal demographic resonance, and peerless capacity to foster corporate solidarity, the seaside coastal resort emerges as the definitive recommendation.`,
    iceBreakdown: {
      introduction: 'Establish company context (50 staff post-crunch), present the 3 candidates, firmly back the seaside beach resort.',
      comparisonAndCounter: 'Demonstrate beach strengths (unconstrained team-building, universal appeal, gala facilities); critique alpine lodge (topographical constraints, transit sickness) and heritage tour (pedestrian bottleneck, group fragmentation).',
      endAndConclusion: 'Reassert that beach resort best fulfills organizational cohesion and restorative morale.',
    },
    usefulPhrases: [
      'Striking a meticulous equilibrium between decompression and team cohesion...',
      'Dissolve interdepartmental silos and cultivate collective morale...',
      'Constricted physical footprint severely limits collective engagements...',
      'Splinters a 50-person cohort into isolated cliques...',
      'Emerges as the definitive recommendation...',
    ],
    keyVocabulary: [
      { term: 'interdepartmental silos', ipa: '/ˌɪntərdɪˌpɑːrtˈmentl ˈsaɪloʊz/', meaningVi: 'sự ngăn cách, thiếu kết nối giữa các phòng ban' },
      { term: 'psychosomatic alleviation', ipa: '/ˌsaɪkoʊsoʊˈmætɪk əˌliːviˈeɪʃn/', meaningVi: 'sự xoa dịu cả về thể chất lẫn tinh thần' },
      { term: 'pedestrian bottleneck', ipa: '/pəˈdestriən ˈbɒtlnek/', meaningVi: 'nút thắt cổ chai, ùn ứ người đi bộ' },
    ],
  },
  {
    id: 'vstep-p2-language',
    title: 'Effective Foreign Language Acquisition',
    titleVi: 'Phương pháp học ngoại ngữ hiệu quả nhất',
    situation: 'A friend wants to achieve fluent English communication within six months to prepare for working in an international environment. She is considering three avenues: attending intensive offline language academy classes, using self-study mobile applications daily, or participating in an overseas immersion homestay program. What is the most viable path?',
    situationVi: 'Một người bạn muốn đạt sự lưu loát khi giao tiếp tiếng Anh trong vòng 6 tháng để làm việc tại môi trường quốc tế. Cô ấy đang cân nhắc 3 con đường: đăng ký trung tâm Anh ngữ trực tiếp cường độ cao, tự học hàng ngày qua ứng dụng điện thoại, hoặc tham gia chương trình du học trải nghiệm bản xứ ngắn hạn. Đâu là hướng đi khả thi nhất?',
    backgroundContextVi: "Yêu cầu sử dụng tiếng Anh giao tiếp lưu loát trong môi trường doanh nghiệp toàn cầu ngày càng khắt khe. Thời hạn 6 tháng là một áp lực thời gian tương đối gấp, đòi hỏi người học phải có lộ trình kỷ luật nghiêm ngặt, tương tác phản xạ hai chiều và được sửa lỗi kịp thời thay vì chỉ nạp kiến thức một chiều.",
    stakeholdersAnalysisVi: "Người học: Cần sự tiến bộ đo lường được để vượt qua phỏng vấn, dễ nản chí nếu thiếu người đồng hành; Nhà tuyển dụng: Đánh giá cao khả năng phản biện, thuyết trình và đối thoại tự nhiên; Giảng viên: Đóng vai trò uốn nắn ngữ âm, kiểm tra ngữ pháp và tạo áp lực học tập tích cực.",
    options: [
      {
        id: 'opt-academy',
        title: 'Intensive offline language academy classes',
        titleVi: 'Lớp học trực tiếp cường độ cao tại trung tâm uy tín',
        pros: ['Direct teacher feedback and error correction', 'Peer interaction with interactive speech drills', 'Structured pedagogical curriculum and accountability'],
        cons: ['Requires scheduled commuting time'],
      },
      {
        id: 'opt-app',
        title: 'Daily self-study mobile apps',
        titleVi: 'Tự học hàng ngày qua ứng dụng di động',
        pros: ['Inexpensive and highly flexible schedule'],
        cons: ['Lacks spontaneous conversational interaction', 'High dropout rate due to lack of external discipline', 'Cannot simulate real-time workplace debate'],
      },
      {
        id: 'opt-overseas',
        title: 'Short-term overseas immersion program',
        titleVi: 'Chương trình du học ngôn ngữ trải nghiệm ngắn hạn ở nước ngoài',
        pros: ['24/7 authentic native-speaker environment'],
        cons: ['Extremely exorbitant financial tuition and living cost', 'Complicated visa protocols with high rejection risk'],
      },
    ],
    recommendedChoice: 'opt-academy',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `When seeking to attain communicative English proficiency within a six-month window for international employment, our candidate has three distinct strategies: enrolling in an intensive offline academy, relying on self-paced mobile software, or embarking on an overseas immersion journey. In my assessment, committing to an intensive offline language academy is by far the most balanced and dependable approach.

First and foremost, an intensive brick-and-mortar course provides structured accountability and direct teacher mentorship. In language acquisition, having certified instructors to instantly diagnose pronunciation blunders and grammatical inconsistencies is invaluable. Furthermore, physical classroom environments facilitate real-time pair discussions, group debates, and simulated business role-plays, which faithfully replicate actual workplace dynamics. The camaraderie of driven peers also keeps motivation high across the entire half-year period.

Looking at the other options, while mobile applications offer commendable flexibility and low financial overhead, their conversational efficacy is fundamentally limited. Apps rely primarily on rote multiple-choice drills and pre-recorded prompts, failing to cultivate spontaneous verbal fluency. Furthermore, without external discipline, the overwhelming majority of learners succumb to procrastination. On the opposite extreme, going overseas offers immersive exposure, but the financial burden of foreign tuition and living expenses is astronomical. Moreover, securing visas within a tight six-month timeline is fraught with bureaucratic uncertainties.

Therefore, balancing educational rigor, real-world conversational simulation, and practical feasibility, an intensive offline academy is unequivocally the superior recommendation.`,
    sampleSpeechC1: `Navigating the imperative of achieving business-level linguistic fluency within an acute six-month timeline necessitates selecting a methodology that harmonizes pedagogical rigor, interactive feedback loops, and pragmatic accessibility. Scrutinizing the three contenders—an intensive physical language institute, autonomous mobile software, and an overseas linguistic immersion—I contend that matriculating at a premier intensive academy is the optimal strategy.

The paramount merit of an intensive academy resides in the presence of real-time didactic intervention. Fluent communication is forged through continuous feedback; having expert pedagogues actively interrogate lexical inaccuracies and remediate phonological shortcomings accelerates linguistic internalization. Moreover, the kinetic immediacy of a classroom fosters spontaneous interpersonal discourse, extemporaneous debates, and professional simulations that cultivate authentic communicative poise. Structured syllabi and milestone assessments enforce vital behavioral accountability.

In contrast, the alternative pathways harbor fatal compromises. Autonomous mobile applications, despite their algorithmic gamification and logistical convenience, cultivate passive recognition rather than productive oral eloquence. They lack the nuanced semantic elasticity needed for complex negotiations, and self-directed learners notoriously suffer high attrition rates. Conversely, an overseas immersion represents a cost-prohibitive overkill. Beyond its exorbitant financial liabilities, navigating complex visa bureaucracies consumes precious time out of an already compressed six-month runway.

To summarize, by delivering immediate corrective feedback, authentic communicative friction, and sustained accountability without fiscal extremity, the intensive language academy stands as the definitive choice.`,
    iceBreakdown: {
      introduction: 'Frame the 6-month international workplace objective, introduce the 3 options, firmly select the intensive offline academy.',
      comparisonAndCounter: 'Praise academy attributes (didactic intervention, interpersonal debate simulation, rigorous accountability); debunk mobile apps (passive recognition, lack of spontaneous eloquence) and overseas study (cost-prohibitive, visa bureaucracy).',
      endAndConclusion: 'Reiterate that structured physical coaching offers the highest ROI for real-world fluency.',
    },
    usefulPhrases: [
      'Harmonizes pedagogical rigor and pragmatic accessibility...',
      'Real-time didactic intervention and phonological remediation...',
      'Cultivate authentic communicative poise...',
      'Cultivate passive recognition rather than productive eloquence...',
      'Cost-prohibitive overkill with high bureaucratic friction...',
    ],
    keyVocabulary: [
      { term: 'didactic intervention', ipa: '/daɪˈdæktɪk ˌɪntərˈvenʃn/', meaningVi: 'sự can thiệp, uốn nắn sư phạm' },
      { term: 'phonological remediation', ipa: '/ˌfɒnəˈlɒdʒɪkl rɪˌmiːdiˈeɪʃn/', meaningVi: 'sửa chữa các lỗi phát âm/ngữ âm' },
      { term: 'communicative poise', ipa: '/kəˈmjuːnɪkətɪv pɔɪz/', meaningVi: 'phong thái giao tiếp tự tin, đĩnh đạc' },
    ],
  },
  {
    id: 'vstep-p2-housing',
    title: 'Freshman Accommodation Choice',
    titleVi: 'Lựa chọn chỗ ở cho tân sinh viên',
    situation: 'A high school graduate from the countryside is moving to Hanoi to start his university education. His parents are considering three living arrangements: an on-campus university dormitory, a shared private rental apartment with friends, or living with an aunt and uncle who reside in the city. Which living arrangement is best?',
    situationVi: 'Một học sinh vừa tốt nghiệp cấp ba từ nông thôn chuẩn bị lên Hà Nội học đại học. Bố mẹ đang cân nhắc 3 phương án cư trú: ký túc xá trong khuôn viên trường, thuê chung căn hộ tư nhân với bạn bè, hoặc ở nhờ nhà cô chú ruột tại thành phố. Phương án nào tối ưu nhất?',
    backgroundContextVi: "Sự dịch chuyển từ nông thôn lên các trung tâm đô thị lớn như Hà Nội hay TP.HCM đặt tân sinh viên trước bài toán tự lập đầu đời. Nơi ở không chỉ là chỗ ngủ nghỉ mà còn quyết định sự an toàn cá nhân, ngân sách chi tiêu hàng tháng và khả năng hòa nhập môi trường học tập mới.",
    stakeholdersAnalysisVi: "Tân sinh viên: Cần môi trường an toàn, gần thư viện/giảng đường để tiết kiệm thời gian đi lại; Phụ huynh: Đặt nặng yếu tố an ninh, chi phí vừa sức với điều kiện kinh tế gia đình ở quê; Nhà trường: Quản lý sinh viên nội trú qua quy chế kỷ luật giờ giấc nề nếp.",
    options: [
      {
        id: 'opt-dorm',
        title: 'An on-campus university dormitory',
        titleVi: 'Ký túc xá trong khuôn viên trường đại học',
        pros: ['Extremely economical living cost', 'Proximity to lecture halls and campus library', 'Safe gated security with curfew regulations', 'Instantly build friendships with peers'],
        cons: ['Shared bathroom facilities with modest privacy'],
      },
      {
        id: 'opt-apartment',
        title: 'A shared private rental apartment',
        titleVi: 'Thuê chung căn hộ ngoài cùng nhóm bạn',
        pros: ['Complete freedom and private cooking space'],
        cons: ['Substantially higher rental fees and utilities', 'Demands maturity to manage household budgets and conflict'],
      },
      {
        id: 'opt-relatives',
        title: 'Living with an aunt and uncle in the city',
        titleVi: 'Ở nhờ nhà cô chú họ hàng trong thành phố',
        pros: ['Free or low-cost accommodation with home-cooked meals'],
        cons: ['Loss of personal autonomy and independence', 'Often far from campus resulting in exhausting daily transit', 'Emotional discomfort from relying on relatives'],
      },
    ],
    recommendedChoice: 'opt-dorm',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `Moving from a rural province to a buzzing capital city for tertiary education is a monumental transition, and choosing suitable accommodation is crucial. The student and his parents are deliberating among three options: an on-campus dormitory, a private shared apartment, or lodging with local relatives. Taking everything into consideration, I firmly recommend the on-campus dormitory.

First of all, an on-campus dormitory provides unparalleled safety, financial affordability, and convenience. Living inside the campus grounds means the student can walk to lecture halls and libraries within minutes, completely avoiding Hanoi's infamous traffic jams. Furthermore, dormitory fees are heavily subsidized, which alleviates the financial burden on rural parents. Living alongside fellow undergraduates also cultivates valuable teamwork, adaptability, and lifelong friendships, providing a supportive community during his transitional first year.

Conversely, the other two options carry substantial drawbacks. Renting an off-campus private apartment is significantly more expensive once security deposits, electricity tariffs, and water bills are factored in. Moreover, an 18-year-old freshman may struggle to manage household responsibilities and budget finances independently. On the other hand, staying with relatives often breeds emotional awkwardness and resentment. Relatives’ houses are frequently situated far from the university, requiring exhausting daily commutes. Most importantly, living under the scrutiny of extended family stifles personal autonomy and delays the development of self-reliance.

To conclude, for the vital first year of college, the university dormitory is the safest, most economical, and socially enriching environment.`,
    sampleSpeechC1: `Navigating the spatial and emotional dislocation of transitioning from a rural province to a metropolitan university represents a pivotal threshold for a freshman. In deliberating across the residential triad—an on-campus collegiate dormitory, an autonomous shared apartment, or familial cohabitation with relatives—I argue decisively in favor of the on-campus dormitory.

The fundamental rationale centers on socioeconomic pragmatism and institutional integration. Subsidized collegiate dormitories minimize parental fiscal strain while offering turnkey physical security and immediate proximity to academic infrastructure—eliminating the grueling cognitive drain of urban traffic. More profoundly, communal dormitory living acts as a social incubator. Navigating diverse roommates fosters emotional intelligence, interpersonal negotiation, and institutional belonging, laying the foundation for holistic personal maturity.

In contrast, the competing options exhibit critical vulnerabilities. An off-campus private tenancy imposes excessive financial overhead, compounded by landlord negotiations and maintenance responsibilities that can distract an unseasoned student from academic benchmarks. Conversely, lodging with relatives imposes subtle psychological vassalage. The burden of reciprocal obligation, restrictive familial curfews, and geographical dissonance between suburban residences and central university campuses severely impairs both collegiate engagement and the emergence of authentic independence.

Ultimately, by optimizing logistical efficiency, economic prudence, and socio-emotional maturation, the on-campus dormitory stands out as the definitive living arrangement.`,
    iceBreakdown: {
      introduction: 'Highlight the rural-to-urban college transition, present the 3 housing options, champion the on-campus dormitory.',
      comparisonAndCounter: 'Praise dormitory strengths (subsidized economics, zero-commute efficiency, social incubator); dismantle private rentals (financial overhead, domestic distraction) and living with relatives (subtle psychological vassalage, long commutes, stifled independence).',
      endAndConclusion: 'Conclude that the dorm best safeguards student well-being and fosters mature self-reliance.',
    },
    usefulPhrases: [
      'Pivotal threshold for a freshman navigating spatial dislocation...',
      'Socioeconomic pragmatism and institutional integration...',
      'Acts as an irreplaceable social incubator...',
      'Imposes subtle psychological vassalage and reciprocal obligation...',
      'Optimizing logistical efficiency and economic prudence...',
    ],
    keyVocabulary: [
      { term: 'spatial dislocation', ipa: '/ˈspeɪʃl ˌdɪsləʊˈkeɪʃn/', meaningVi: 'sự bỡ ngỡ, xáo trộn về không gian sống' },
      { term: 'social incubator', ipa: '/ˈsoʊʃl ˈɪŋkjubeɪtər/', meaningVi: 'vườn ươm kỹ năng xã hội' },
      { term: 'psychological vassalage', ipa: '/ˌsaɪkəˈlɒdʒɪkl ˈvæsəlɪdʒ/', meaningVi: 'cảm giác phụ thuộc, mang ơn tâm lý gò bó' },
    ],
  },
  {
    id: 'vstep-p2-job-offer',
    title: 'Fresh Graduate Career Dilemma',
    titleVi: 'Lựa chọn công việc đầu đời cho sinh viên mới tốt nghiệp',
    situation: 'A freshly graduated software engineer has received three employment offers: a lucrative position at an established but rigid multinational corporation, a moderate-salary role at an innovative high-growth startup, or a stable entry-level post in a government public agency. Which career launchpad should she select?',
    situationVi: 'Một kỹ sư phần mềm vừa tốt nghiệp nhận được 3 lời mời làm việc: mức lương hấp dẫn tại một tập đoàn đa quốc gia lâu năm nhưng cơ chế cứng nhắc, mức lương trung bình tại một công ty khởi nghiệp đổi mới sáng tạo tăng trưởng nhanh, hoặc một vị trí ổn định trong cơ quan hành chính sự nghiệp nhà nước. Cô ấy nên chọn bệ phóng nào?',
    backgroundContextVi: "Giai đoạn khởi nghiệp nghề nghiệp đầu đời của sinh viên kỹ thuật công nghệ thường đứng trước ngã ba đường giữa mức lương hấp dẫn ban đầu, cơ hội phát triển kỹ năng toàn diện và tính ổn định lâu dài trong một thị trường lao động biến động không ngừng.",
    stakeholdersAnalysisVi: "Kỹ sư mới tốt nghiệp: Cần tích lũy kinh nghiệm thực chiến đa mảng và xây dựng thương hiệu năng lực cá nhân; Doanh nghiệp Startup: Trao quyền tự chủ cao và cơ hội thăng tiến nhanh nhưng đòi hỏi sự xông xáo; Gia đình: Thường mong muốn sự an toàn hoặc danh tiếng từ các tập đoàn lớn.",
    options: [
      {
        id: 'opt-startup',
        title: 'An innovative high-growth tech startup',
        titleVi: 'Công ty khởi nghiệp công nghệ đổi mới và tăng trưởng nhanh',
        pros: ['Broad hands-on responsibilities touching the entire software stack', 'Rapid career progression based on meritocracy', 'Agile, empowering, and innovative culture'],
        cons: ['Longer working hours and potential financial instability of early ventures'],
      },
      {
        id: 'opt-corporate',
        title: 'A rigid multinational conglomerate',
        titleVi: 'Tập đoàn đa quốc gia quy mô lớn nhưng quy trình cứng nhắc',
        pros: ['High starting compensation and prestigious brand name'],
        cons: ['Hyper-specialized narrow tasks like a small cog in a machine', 'Bureaucratic hierarchies slow down creative innovation'],
      },
      {
        id: 'opt-public',
        title: 'A stable government public agency',
        titleVi: 'Cơ quan hành chính sự nghiệp nhà nước ổn định',
        pros: ['Job security and low stress work-life balance'],
        cons: ['Lowest remuneration package', 'Slow promotion based on seniority rather than technological merit'],
      },
    ],
    recommendedChoice: 'opt-startup',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `Embarking on one's professional career is a foundational decision. Our graduate engineer has three distinct employment offers: a lucrative role in a rigid multinational corporate, an innovative position at a high-growth startup, or a stable position in a public agency. In my evaluation, the innovative tech startup is the most empowering and fruitful launchpad.

The paramount advantage of joining a high-growth startup at the inception of one's career is the exponential learning trajectory. In a startup environment, young engineers are not confined to narrow, repetitive tasks; rather, they gain end-to-end exposure across system architecture, customer deployment, and product strategy. This broad versatility accelerates technological problem-solving and fosters entrepreneurial resilience. Furthermore, startups operate on meritocracy—exceptional talent is rewarded with rapid promotions and equity stakes, rather than waiting for bureaucratic promotion ladders.

Conversely, the competing offers present severe drawbacks for early-career growth. While the multinational corporation provides an enticing paycheck and brand prestige, fresh graduates are often treated as minor cogs in massive bureaucratic machines, relegated to maintaining legacy codebases with minimal creative autonomy. Over time, this breeds complacency. As for the public agency, while it provides unassailable job security and predictable working hours, its technological ecosystem often lags behind industry frontiers. Furthermore, advancement is tied to institutional seniority rather than technical brilliance, which stifles the ambition of an eager software engineer.

Therefore, prioritizing rapid skill acquisition and professional autonomy, the dynamic tech startup is the definitive choice.`,
    sampleSpeechC1: `The inaugural employment selection of an ambitious software engineer establishes the foundational velocity of her professional trajectory. In assessing the triad of opportunities—a lucrative yet ossified multinational conglomerate, a nimble high-velocity tech startup, or a secure public bureaucracy—I advocate unequivocally for the high-growth startup.

The core thesis favoring the startup is the maximization of steep cognitive acquisition and horizontal agency. At the dawn of an engineering career, optimizing for immediate cash compensation is fundamentally suboptimal compared to optimizing for skill density. Startups operate on unconstrained operational breadth: an engineer actively architects infrastructure, iterates features, and interfaces directly with business strategy. This crucible forges adaptive problem-solving and full-stack fluency. Furthermore, meritocratic cultures accelerate leadership responsibilities unencumbered by artificial seniority ceilings.

By contrast, the counter-options exhibit profound strategic limitations. The multinational enterprise, despite its seductive brand equity and premium compensation, inevitably imposes hyper-specialization. Young talents are relegated to maintaining peripheral legacy codebases, trapped in bureaucratic siloing that atrophies entrepreneurial dynamism. Meanwhile, the public sector alternative represents premature professional ossification. While offering absolute job security, its technological infrastructure is chronically antiquated, and promotion paradigms favor bureaucratic longevity over computational brilliance.

In conclusion, optimizing for aggressive human capital appreciation and creative impact, the dynamic startup constitutes the definitive career launchpad.`,
    iceBreakdown: {
      introduction: 'Define career inaugural launchpad, juxtapose the 3 pathways, firmly back the agile startup.',
      comparisonAndCounter: 'Articulate startup strengths (rapid cognitive acquisition, horizontal agency, meritocracy); expose corporate pitfalls (hyper-specialization, legacy code maintenance, bureaucratic siloing) and public sector flaws (technological obsolescence, seniority ceilings).',
      endAndConclusion: 'Conclude that investing in human capital velocity far outweighs premature complacency.',
    },
    usefulPhrases: [
      'Establishes the foundational velocity of her professional trajectory...',
      'Maximization of steep cognitive acquisition and horizontal agency...',
      'Crucible that forges adaptive problem-solving...',
      'Trapped in bureaucratic siloing that atrophies dynamism...',
      'Aggressive human capital appreciation and creative impact...',
    ],
    keyVocabulary: [
      { term: 'horizontal agency', ipa: '/ˌhɒrɪˈzɒntl ˈeɪdʒənsi/', meaningVi: 'quyền tự chủ mở rộng đa lĩnh vực' },
      { term: 'crucible', ipa: '/ˈkruːsɪbl/', meaningVi: 'lò luyện, nơi tôi rèn bản lĩnh' },
      { term: 'human capital appreciation', ipa: '/ˈhjuːmən ˈkæpɪtl əˌpriːʃiˈeɪʃn/', meaningVi: 'sự gia tăng giá trị năng lực con người' },
    ],
  },
  {
    id: 'vstep-p2-fitness',
    title: 'Fitness Regimen for Busy Professional',
    titleVi: 'Chế độ rèn luyện thể chất cho người đi làm bận rộn',
    situation: 'A 28-year-old corporate accountant works 10 hours daily at a desk and feels chronically fatigued. He wants to adopt a consistent fitness regimen. Three options are proposed: buying a premium gym membership with a personal trainer, practicing home yoga routines via online videos, or jogging every evening in a neighborhood park. Which option is best suited for him?',
    situationVi: 'Một kế toán viên doanh nghiệp 28 tuổi làm việc 10 tiếng mỗi ngày ngồi bàn giấy và cảm thấy mệt mỏi kinh niên. Anh ấy muốn bắt đầu chế độ tập thể dục bền bỉ. Ba phương án: mua gói tập gym cao cấp có huấn luyện viên riêng (PT), tập yoga tại nhà theo video hướng dẫn trực tuyến, hoặc chạy bộ mỗi buổi tối ở công viên gần nhà. Phương án nào tối ưu nhất?',
    backgroundContextVi: "Lối sống ít vận động (sedentary lifestyle) và áp lực công việc văn phòng kéo dài 10 tiếng mỗi ngày khiến tình trạng mệt mỏi thể chất và sai lệch tư thế cột sống trở thành vấn nạn phổ biến. Rào cản lớn nhất khi bắt đầu luyện tập thể thao chính là sự kiệt sức sau giờ làm và thiếu tính kỷ luật tự thân.",
    stakeholdersAnalysisVi: "Người đi làm (kế toán viên): Mong muốn phục hồi năng lượng và chữa lành đau lưng nhưng dễ bỏ cuộc vì mệt mỏi; Huấn luyện viên cá nhân (PT): Cung cấp giáo án chỉnh sửa tư thế chuẩn xác và tạo cam kết kỷ luật buổi tập; Cơ sở tập luyện: Đảm bảo trang thiết bị trợ lực an toàn và không khí luyện tập tích cực.",
    options: [
      {
        id: 'opt-gym-pt',
        title: 'Premium gym membership with a personal trainer',
        titleVi: 'Gói tập gym cao cấp có huấn luyện viên cá nhân (PT)',
        pros: ['Customized corrective posture routines for desk workers', 'High personal accountability ensures he doesn’t skip sessions', 'Modern strength equipment'],
        cons: ['Expensive recurring cost', 'Requires commuting to the fitness center'],
      },
      {
        id: 'opt-home-yoga',
        title: 'Home yoga routines via online videos',
        titleVi: 'Tự tập yoga tại nhà qua video bài giảng trực tuyến',
        pros: ['Extreme time flexibility, zero travel required', 'Low cost'],
        cons: ['Lack of external accountability leads to quitting within weeks', 'No qualified coach to correct improper poses, risking spinal injury'],
      },
      {
        id: 'opt-park-jogging',
        title: 'Evening outdoor jogging in a local park',
        titleVi: 'Chạy bộ ngoài trời buổi tối ở công viên',
        pros: ['Free and connects with fresh air'],
        cons: ['Vulnerable to rain, humidity, and dark lighting', 'Does not address muscle imbalances or lower back pain caused by sitting'],
      },
    ],
    recommendedChoice: 'opt-gym-pt',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `In today’s sedentary corporate culture, finding a sustainable physical exercise routine is essential for long-term health. Our accountant faces chronic fatigue from working 10 hours at a desk, and is deciding among three fitness options: hiring a personal trainer at a gym, practicing home yoga, or jogging in a park. I strongly advocate for the premium gym membership with a personal trainer.

The most critical factor here is accountability and posture correction. Sedentary office workers typically suffer from postural issues like rounded shoulders and lower back strain. A certified personal trainer can design a scientifically tailored resistance regimen to strengthen his core and spinal muscles. More importantly, having scheduled appointments with a coach creates an external commitment, preventing him from collapsing onto the sofa after an exhausting workday. The structured progression ensures rapid physical results, which rebuilds his stamina.

On the other hand, the competing alternatives present distinct limitations. While home yoga offers scheduling flexibility and negligible cost, working out alone at home suffers from a notoriously high abandonment rate. Without a coach, beginners also risk misaligning their spine during complex poses. Meanwhile, outdoor jogging in the evening, though refreshing, is heavily hostage to adverse weather conditions such as heavy downpours or suffocating heat. Furthermore, repetitive cardiovascular pounding does not rectify the severe muscular imbalances created by ten hours of continuous sitting.

In conclusion, for a tired corporate professional who needs structured discipline and physical rehabilitation, investing in a gym personal trainer is the definitive choice.`,
    sampleSpeechC1: `Addressing chronic somatic lethargy induced by ten-hour sedentary desk confinement requires an intervention that blends mechanical efficacy, postural rehabilitation, and behavioral accountability. In weighing the three modalities—a bespoke gym regimen with a personal coach, autonomous home yoga via digital streams, or nocturnal park jogging—I argue unequivocally that investing in a dedicated personal trainer is the paramount decision.

The primary rationale resides in ergonomic remediation and behavioral adherence. Prolonged sitting causes profound musculoskeletal deficits: anterior pelvic tilt, thoracic kyphosis, and severe core atrophy. An expert trainer formulates targeted kinetic therapy—incorporating posterior chain reinforcement to counteract sedentary damage safely. Crucially, a human trainer provides external psychological scaffolding; when cognitive reserves are depleted post-work, pre-booked appointments defeat executive dysfunction and enforce unwavering attendance.

Conversely, the alternative modalities are fundamentally deficient for this demographic. Home yoga, while theoretically restorative, relies entirely on intrinsic willpower—a resource chronically depleted in overworked corporate accountants. Without tactile alignment cues, unsupervised novice practitioners invariably develop deleterious compensatory movements. Concurrently, nocturnal park jogging, beyond its vulnerability to meteorological disruptions and ambient urban pollution, exerts unidirectional high-impact stress on tight hip flexors while neglecting upper-body musculature entirely.

To encapsulate, by delivering personalized biomechanical rehabilitation and inviolable behavioral compliance, a certified personal trainer constitutes the definitive physical remedy.`,
    iceBreakdown: {
      introduction: 'Contextualize desk-bound chronic fatigue, review the 3 modalities, decisively pick gym with personal trainer.',
      comparisonAndCounter: 'Highlight gym PT benefits (targeted musculoskeletal rehabilitation, behavioral scaffolding against executive burnout); critique autonomous yoga (depleted willpower, lack of tactile feedback) and jogging (weather-dependent, ignores posture imbalances).',
      endAndConclusion: 'Summarize that personal coaching guarantees both structural rehabilitation and lasting consistency.',
    },
    usefulPhrases: [
      'Chronic somatic lethargy induced by desk confinement...',
      'Targeted kinetic therapy and posterior chain reinforcement...',
      'External psychological scaffolding defeats executive dysfunction...',
      'Unsupervised novices develop deleterious compensatory movements...',
      'Delivers personalized biomechanical rehabilitation and compliance...',
    ],
    keyVocabulary: [
      { term: 'somatic lethargy', ipa: '/səˈmætɪk ˈleθərdʒi/', meaningVi: 'sự uể oải, rệu rã về thể chất' },
      { term: 'kinetic therapy', ipa: '/kɪˈnetɪk ˈθerəpi/', meaningVi: 'liệu pháp vận động cơ học' },
      { term: 'deleterious compensation', ipa: '/ˌdeləˈtɪəriəs ˌkɒmpenˈseɪʃn/', meaningVi: 'sự bù trừ sai tư thế gây hại cho khớp' },
    ],
  },
  {
    id: 'vstep-p2-roommate',
    title: 'Resolving Cohabitation Friction',
    titleVi: 'Giải quyết bất đồng với bạn cùng phòng',
    situation: 'Two university students share a two-bedroom rented apartment. One roommate consistently leaves dirty dishes in the sink, plays loud music late at night, and neglects communal cleaning duties. The other roommate wants to resolve this issue peacefully. Three actions are considered: scheduling a calm face-to-face house meeting with a written chore agreement, packing up and moving out to find another flat immediately, or filing a direct complaint with the landlord. What should he do?',
    situationVi: 'Hai sinh viên đại học thuê chung một căn hộ hai phòng ngủ. Một người liên tục để bát đĩa bẩn trong bồn rửa, bật nhạc ồn ào lúc nửa đêm và trốn tránh việc dọn dẹp không gian chung. Người bạn còn lại muốn giải quyết êm thấm. Ba hướng hành động: tổ chức một buổi nói chuyện trực tiếp thẳng thắn và lập bản cam kết phân chia việc nhà bằng văn bản, dọn đồ chuyển đi tìm phòng khác ngay lập tức, hoặc làm đơn khiếu nại lên chủ nhà. Anh ấy nên làm gì?',
    backgroundContextVi: "Sống chung căn hộ thuê là trải nghiệm phổ biến của sinh viên đại học, nhưng sự khác biệt về thói quen sinh hoạt, ý thức vệ sinh và không gian riêng tư rất dễ bùng phát thành mâu thuẫn kéo dài. Kỹ năng giao tiếp trực tiếp và đàm phán ôn hòa là bài học quan trọng về sự trưởng thành trong ứng xử xã hội.",
    stakeholdersAnalysisVi: "Bản thân sinh viên: Cần không gian nghỉ ngơi yên tĩnh và giữ vững hòa khí tình bạn; Người bạn cùng phòng vô ý: Cần được nhắc nhở thẳng thắn nhưng tế nhị để nhận diện tác động của hành vi; Chủ nhà trọ: Không muốn can thiệp vào xích mích nội bộ miễn là đóng tiền nhà đúng hạn.",
    options: [
      {
        id: 'opt-dialogue',
        title: 'A calm face-to-face meeting with a written chore agreement',
        titleVi: 'Buổi nói chuyện trực tiếp ôn hòa và lập quy ước việc nhà bằng văn bản',
        pros: ['Demonstrates mature communication and gives a fair chance to improve', 'Establishes clear objective boundaries without bitterness', 'Saves moving costs'],
        cons: ['Requires patience and assertiveness'],
      },
      {
        id: 'opt-move-out',
        title: 'Packing up and relocating immediately',
        titleVi: 'Dọn đồ và chuyển đi tìm chỗ ở khác ngay lập tức',
        pros: ['Instant escape from uncomfortable atmosphere'],
        cons: ['Heavy financial penalty from breaking the lease deposit', 'Stressful search for new accommodation during the academic term'],
      },
      {
        id: 'opt-landlord',
        title: 'Filing a formal complaint with the landlord',
        titleVi: 'Làm đơn khiếu nại thẳng lên chủ trọ',
        pros: ['Avoids direct emotional confrontation'],
        cons: ['Landlords rarely mediate domestic cleaning squabbles', 'Creates toxic animosity and retaliation between roommates under the same roof'],
      },
    ],
    recommendedChoice: 'opt-dialogue',
    prepTimeSeconds: 60,
    speakTimeSeconds: 180,
    sampleSpeechB2: `Cohabitation friction is an almost inevitable hurdle in student life. In this scenario, one roommate is negligent regarding cleanliness and quiet hours, creating acute distress for the other. Three potential courses of action are on the table: initiating an honest face-to-face dialogue with a written chore contract, abruptly relocating to a new flat, or lodging a complaint with the landlord. Without question, scheduling a direct, constructive conversation is the most sensible first step.

The primary merit of direct interpersonal communication is maturity and conflict resolution. Oftentimes, thoughtless roommates may not realize how severely their habits impact others, or they may lack organizational structure. By convening a calm discussion over coffee and jointly codifying an objective cleaning schedule with explicit quiet hours, both parties can reset expectations without hostility. This preserves the friendship, saves considerable financial expenditure, and fosters emotional adult problem-solving.

Conversely, the alternative reactions are reactionary and counterproductive. Abruptly vacating the premises forfeits a substantial security deposit and plunges the student into the stressful chaos of apartment hunting mid-semester. On the other hand, running to the landlord is juvenile and provocative. Property owners view their mandate as collecting rent and maintaining brickwork, not arbitrating domestic dish-washing disputes. Involving a third-party landlord will only embarrass the offending roommate, triggering poisonous resentment and passive-aggressive retaliation under the same roof.

In conclusion, exercising mature assertiveness through an honest, contractual face-to-face dialogue is unequivocally the best remedy.`,
    sampleSpeechC1: `Domestic discord arising from divergent hygiene thresholds and acoustic consideration represents a classic crucible of collegiate independence. When evaluating the three potential courses of recourse—orchestrating an assertive, empathetic dialogue paired with a codified charter, summarily breaking the lease to relocate, or petitioning the landlord—I unequivocally endorse the direct communicative intervention.

The foundational justification rests on emotional intelligence and proportional escalation. Conflict resolution in cohabitation requires establishing transparent behavioral baselines before resorting to punitive measures. A structured, non-accusatory dialogue allows the aggrieved party to articulate boundaries objectively. Drafting an explicit operational charter—delineating dish sanitation rotations and nocturnal acoustic curfews—depersonalizes the friction, transforming subjective irritation into institutional accountability while preserving fiscal equilibrium.

In stark contrast, the alternate proposals represent disastrous overreactions. Unilaterally terminating tenancy incurs severe financial forfeitures through sacrificed lease indemnities, alongside the grueling logistical friction of locating alternative dwellings during active academic semesters. Concurrently, appealing to the property lessor represents a profound misjudgment of contractual boundaries. Landlords possess neither the pedagogical inclination nor the legal mandate to referee domestic housekeeping skirmishes; triangulating an external authority merely breeds subterranean hostility, cementing a toxic domestic war of attrition.

Ultimately, by embodying collegiate maturity, preserving capital, and addressing the root cause constructively, a direct contractual dialogue stands as the only defensible course of action.`,
    iceBreakdown: {
      introduction: 'Frame cohabitation discord, outline the 3 response options, champion direct communication with a charter.',
      comparisonAndCounter: 'Praise direct dialogue (depersonalizes friction, establishes objective accountability, saves lease capital); expose moving out (lease forfeiture, logistical turbulence) and landlord mediation (boundary misjudgment, breeds toxic retaliation).',
      endAndConclusion: 'Affirm that assertive interpersonal engagement is the hallmark of mature conflict resolution.',
    },
    usefulPhrases: [
      'Domestic discord arising from divergent hygiene thresholds...',
      'Proportional escalation and emotional intelligence...',
      'Depersonalizes the friction into institutional accountability...',
      'Triangulating an external authority merely breeds subterranean hostility...',
      'Stands as the only defensible course of action...',
    ],
    keyVocabulary: [
      { term: 'proportional escalation', ipa: '/prəˈpɔːrʃənl ˌeskəˈleɪʃn/', meaningVi: 'sự leo thang mức độ phản ứng tương xứng' },
      { term: 'subterranean hostility', ipa: '/ˌsʌbtəˈreɪniən hɒˈstɪləti/', meaningVi: 'sự thù địch ngấm ngầm, âm ỉ' },
      { term: 'war of attrition', ipa: '/wɔːr əv əˈtrɪʃn/', meaningVi: 'cuộc chiến tiêu hao thể lực và tinh thần' },
    ],
  },
];

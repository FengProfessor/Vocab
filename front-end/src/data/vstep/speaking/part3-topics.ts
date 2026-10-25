import { VstepSpeakingPart3Topic } from './types';

export const VSTEP_SPEAKING_PART3_TOPICS: VstepSpeakingPart3Topic[] = [
  {
    id: 'vstep-p3-online-learning',
    topicTitle: 'The Ascendance of Online Learning in Modern Education',
    topicVi: 'Sự phát triển mạnh mẽ của học trực tuyến trong giáo dục hiện đại',
    category: 'education',
    socioEconomicContextVi: 'Sự bùng nổ của hạ tầng internet băng thông rộng và các nền tảng công nghệ giáo dục (EdTech) thời kỳ hậu đại dịch đã tái định hình nền giáo dục toàn cầu, mở ra cơ hội tiếp cận tri thức cho hàng triệu người học nhưng cũng đặt ra thách thức về khoảng cách số và tính kỷ luật tự thân.',
    academicCitationsVi: [
      'UNESCO Global Education Monitoring Report: Nền tảng học tập số đã mở rộng cơ hội học tập suốt đời cho hơn 220 triệu người học trưởng thành tại các quốc gia đang phát triển.',
      'World Bank EdTech Policy Paper: Mô hình giáo dục kết hợp (Blended Learning) mang lại hiệu quả tiếp thu cao hơn 18% so với phương pháp giảng dạy truyền thống hoàn toàn thụ động.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Benefits of Online Learning',
      givenBranches: [
        'Flexibility in scheduling and geographic mobility',
        'Unrestricted access to global educational resources',
        'Significant cost-effectiveness for learners',
      ],
      customBranchPlaceholder: 'Personalized pacing through AI-driven adaptive curricula',
    },
    sampleSpeechB2: `Good morning, examiner. Today I would like to talk about the profound merits of online education in modern society. Over the past decade, digital learning platforms have transformed from an optional novelty into a cornerstone of contemporary academia, driven by four pivotal advantages: flexibility, global accessibility, financial affordability, and personalized pacing.

To begin with, the foremost benefit is remarkable scheduling flexibility and geographic mobility. In conventional brick-and-mortar institutions, students are constrained by fixed timetables and exhausting daily commutes. Online learning liberates learners from these spatial and temporal barriers. Whether an undergraduate is working a part-time job or living in a remote rural province, they can access lecture modules at their own convenience.

Secondly, digital platforms democratize access to world-class educational archives. Decades ago, attending lectures from Ivy League institutions was a privilege reserved for an elite few. Today, through platforms like Coursera and edX, any motivated individual with an internet connection can study computer science from Harvard or literature from Oxford, leveling the educational playing field globally.

Thirdly, online education delivers substantial economic savings. Traditional campus degrees involve exorbitant expenditures on student housing, daily transit, and printed textbooks. Digital education eliminates these auxiliary costs and offers courses at a fraction of the tuition, allowing learners from modest financial backgrounds to acquire valuable credentials.

In addition to the three provided points, I would like to propose an equally crucial fourth dimension: personalized learning pace empowered by adaptive technology. Unlike a traditional lecture hall where a professor teaches at an average speed, online software allows learners to pause complex explanations, rewatch recordings, and utilize AI tutors to resolve specific knowledge gaps instantly.

In conclusion, by delivering spatial flexibility, egalitarian resource access, financial efficiency, and individualized learning trajectories, online education represents an indispensable paradigm shift in global schooling. Thank you for your attention.`,
    sampleSpeechC1: `Distinguished examiner, I am privileged to present an analytical exploration of how digital pedagogy is redefining contemporary educational paradigms. The ubiquity of high-speed broadband and algorithmic learning systems has catalyzed an irreversible transition towards digital education, underpinned by four synergistic pillars: chronological autonomy, egalitarian resource access, fiscal democratization, and AI-mediated pedagogical personalization.

Foremost among these advantages is the liberation of temporal and spatial constraints. The traditional industrial model of education tethered learning to rigid schedules and physical confinement. E-learning disrupts this archaic bottleneck, granting students chronological agency. Working professionals and geographically marginalized scholars can orchestrate their cognitive absorption around their peak circadian focus, eliminating transit friction and optimizing knowledge retention.

Furthermore, online education spearheads the unprecedented democratization of intellectual capital. Elite pedagogical content, historically sequestered behind the ivory towers of prestigious universities, is now globally accessible via open-access platforms. An aspiring developer in rural Southeast Asia can engage with the identical advanced quantum computing curriculum taught at MIT, dismantling geographical monopolies on intellectual excellence.

Equally compelling is the economic efficiency inherent in digital delivery models. By shedding the astronomical overhead of physical campus real estate and printed administrative collateral, online institutions deliver high-caliber instruction at a marginal fraction of legacy tuition fees, mitigating student debt crises worldwide.

Crucially, as my own independent contribution to this framework, I would highlight algorithmic adaptive learning. Legacy classrooms are fundamentally compromised by a 'one-size-fits-all' pedagogical velocity. Digital ecosystems, powered by intelligent machine learning systems, dynamically calibrate problem complexity in real-time, offering bespoke remediation for cognitive blind spots while propelling gifted students forward unencumbered.

To summarize, digital pedagogy transcends mere convenience; it constitutes a profound structural democratization of human capital development across the globe.`,
    speechOutline: {
      opening: 'Introduce the theme of digital pedagogical evolution and announce the 4 core pillars.',
      bodyPoint1: 'Chronological and geographic autonomy: removing rigid physical bottlenecks.',
      bodyPoint2: 'Democratization of global intellectual capital: equal access to elite curricula.',
      bodyPoint3: 'Economic democratization: eliminating campus real-estate overhead and lowering tuition.',
      bodyPointCustom: 'Candidate’s custom contribution: Algorithmic adaptive learning tailoring pace to the individual.',
      closing: 'Conclude with a synthesizing statement on how e-learning revolutionizes global human capital.',
    },
    followUpQuestions: [
      {
        question: "Does online learning risk eroding students' social and interpersonal communication skills?",
        questionVi: 'Học trực tuyến có nguy cơ làm xói mòn kỹ năng giao tiếp và tương tác xã hội của học sinh không?',
        contextNoteVi: 'Giám khảo muốn kiểm tra tư duy phản biện hai chiều về tác động tâm lý - xã hội của công nghệ.',
        sampleAnswer: 'Undoubtedly, an exclusively virtual curriculum risks atrophying spontaneous interpersonal empathy and conflict resolution. Physical classrooms provide visceral non-verbal cues and informal camaraderie that cannot be fully replicated via digital screens; hence, a hybrid model incorporating collaborative physical workshops remains optimal.',
      },
      {
        question: 'How can educators ensure academic integrity and prevent cheating during unproctored online examinations?',
        questionVi: 'Làm thế nào để các nhà giáo dục đảm bảo tính trung thực học thuật và ngăn ngừa gian lận trong các kỳ thi trực tuyến?',
        contextNoteVi: 'Câu hỏi xoay quanh bài toán quản trị khảo thí và liêm chính học thuật trong kỷ nguyên số.',
        sampleAnswer: 'Institutions must transition away from rote memorization assessments toward open-book, analytical synthesis problems. Additionally, deploying AI-driven biometric proctoring and conducting oral defense vivas ensures that grades reflect genuine individual intellectual competence.',
      },
      {
        question: 'Will traditional brick-and-mortar universities eventually be rendered obsolete by virtual learning platforms?',
        questionVi: 'Liệu các trường đại học truyền thống có dần trở nên lỗi thời trước các nền tảng học tập ảo không?',
        contextNoteVi: 'Giám khảo kiểm tra tầm nhìn chiến lược về tương lai của các định chế học thuật cổ điển.',
        sampleAnswer: 'Universities will not vanish, but will metamorphose into collaborative hubs for advanced scientific research, tactile mentorship, and deep human networking. While factual lectures move online, hands-on laboratory experimentation and character incubation remain irreplaceable on physical campuses.',
      },
    ],
    keyVocabulary: [
      { term: 'pedagogical paradigm', ipa: '/ˌpedəˈɡɒdʒɪkl ˈpærədaɪm/', meaningVi: 'mô hình phương pháp giáo dục' },
      { term: 'chronological agency', ipa: '/ˌkrɒnəˈlɒdʒɪkl ˈeɪdʒənsi/', meaningVi: 'quyền tự chủ về mặt thời gian' },
      { term: 'democratization of knowledge', ipa: '/dɪˌmɒkrətaɪˈzeɪʃn əv ˈnɒlɪdʒ/', meaningVi: 'sự bình đẳng hóa cơ hội tiếp cận tri thức' },
    ],
  },
  {
    id: 'vstep-p3-urbanization',
    topicTitle: 'Challenges of Rapid Urbanization in Developing Nations',
    topicVi: 'Những thách thức của đô thị hóa nhanh chóng tại các quốc gia đang phát triển',
    category: 'society_culture',
    socioEconomicContextVi: 'Làn sóng di cư từ nông thôn ra các đô thị lớn tại Đông Nam Á và Nam Á tạo áp lực nghẹt thở lên cơ sở hạ tầng giao thông, hệ thống xử lý chất thải và thị trường nhà ở xã hội, đe dọa sự phát triển bền vững của các siêu đô thị.',
    academicCitationsVi: [
      'UN-Habitat World Cities Report: Dự báo đến năm 2050, 68% dân số thế giới sẽ sống ở khu vực thành thị, đặt các đô thị đang phát triển trước nguy cơ thiếu hụt nhà ở giá rẻ trầm trọng.',
      'World Bank Sustainable Cities Assessment: Ùn tắc giao thông và ô nhiễm không khí tại các đô thị loại một làm hao hụt từ 2% đến 5% GDP hàng năm của các nền kinh tế đang phát triển.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Severe Urbanization Challenges',
      givenBranches: [
        'Chronic vehicular gridlock and infrastructure strain',
        'Severe air and acoustic pollution damaging public health',
        'Acute housing shortages and informal slums',
      ],
      customBranchPlaceholder: 'Socioeconomic disparity and weakening of communal social fabric',
    },
    sampleSpeechB2: `Good morning. Rapid urbanization has become one of the most pressing dilemmas facing developing economies worldwide. While metropolitan growth drives industrial productivity, it simultaneously unleashes severe systemic complications: chronic traffic gridlock, catastrophic environmental degradation, acute housing crises, and deep socioeconomic inequality.

To begin with, the most visible manifestation of rapid urban influx is severe traffic congestion. Cities like Hanoi, Manila, or Jakarta were originally designed for modest populations. The sudden influx of millions of private motorbikes and cars completely overwhelms urban roads, resulting in hours of gridlock, economic loss, and immense frustration for commuters every single day.

Secondly, environmental contamination poses a lethal threat to urban inhabitants. Massive emissions from exhaust pipes, combined with unchecked industrial discharge and municipal waste, degrade air quality to hazardous levels. Urban residents frequently suffer from chronic respiratory illnesses, cardiovascular complications, and severe noise pollution that disrupts sleep and mental well-being.

Thirdly, explosive population influx triggers an acute affordable housing deficit. As real-estate prices soar beyond the reach of average workers, low-income laborers are pushed into cramped, unregulated informal dwellings and slums lacking clean sanitation, potable water, and fire safety protocols.

Furthermore, as my own additional observation, rapid urbanization exacerbates socioeconomic alienation. Traditional communal solidarity found in rural villages is replaced by an individualistic, atomized urban culture, where vulnerable citizens suffer from isolation and widening wealth inequality.

In conclusion, addressing the multifaceted challenges of urbanization requires aggressive investments in public mass transit, green urban zoning, and social housing initiatives to ensure that cities remain liveable for future generations.`,
    sampleSpeechC1: `Distinguished examiner, I welcome the opportunity to examine the acute systemic ramifications precipitated by precipitous urban expansion across developing nations. While urban aggregation serves as an undeniable catalyst for macroeconomic productivity and foreign direct investment, unmitigated demographic influx generates severe systemic dysfunctions across four critical dimensions: infrastructural asphyxiation, ecological degradation, real-estate hyper-inflation, and socio-spatial fragmentation.

Foremost among these structural crises is infrastructural asphyxiation. Developing metropolises consistently suffer from severe spatial hysteresis; civil infrastructure expansion lags decades behind demographic migration. Consequently, arterial transit networks experience chronic gridlock, draining billions of dollars in lost labor productivity and petroleum wastage annually.

Concurrently, unchecked metropolitan density unleashes profound ecological degradation. Atmospheric concentrations of PM2.5 particulates routinely breach critical safety thresholds, inflicting severe respiratory and cardiovascular morbidity on urban populations. The proliferation of impermeable concrete surfaces amplifies the urban heat island effect, while inadequate wastewater management systems contaminate municipal aquifers.

Equally destabilizing is the acute housing deficit. The monetization of urban land assets precipitates real-estate hyper-inflation, pricing blue-collar laborers out of formal housing markets. This fosters the proliferation of precarious informal settlements characterized by squalor, absent municipal utilities, and acute vulnerability to climate catastrophes.

Crucially, as my independent fourth consideration, I emphasize socio-spatial fragmentation. Rapid urbanization dismantles organic communal safety nets, replacing them with atomized hyper-competitiveness and pronounced socio-economic stratification, cultivating acute alienation among disenfranchised working-class populations.

To encapsulate, mitigating the deleterious externalities of urbanization demands holistic metropolitan decentralization, massive capital allocation into clean rapid transit networks, and aggressive social housing subsidies.`,
    speechOutline: {
      opening: 'Acknowledge urbanization as an economic catalyst but highlight its severe systemic fallout across 4 dimensions.',
      bodyPoint1: 'Infrastructural asphyxiation: traffic gridlock and lagging transport arteries.',
      bodyPoint2: 'Ecological degradation: hazardous PM2.5 air pollution and urban heat island effects.',
      bodyPoint3: 'Affordable housing deficit: soaring real-estate prices forcing workers into informal slums.',
      bodyPointCustom: 'Candidate’s custom contribution: Socio-spatial fragmentation and alienation of the urban working class.',
      closing: 'Conclude with policy directives: decentralization, green mass transit, and subsidized public housing.',
    },
    followUpQuestions: [
      {
        question: 'Should governments implement policies to actively discourage rural-to-urban migration?',
        questionVi: 'Chính phủ có nên thực hiện các chính sách chủ động hạn chế làn sóng di cư từ nông thôn ra thành thị không?',
        contextNoteVi: 'Giám khảo đánh giá khả năng nhìn nhận chính sách vĩ mô về quyền tự do cư trú và cân bằng vùng miền.',
        sampleAnswer: 'Direct restriction of internal mobility is counterproductive and infringes on basic economic liberties. Instead, state authorities should decentralize economic opportunities by subsidizing rural infrastructure, industrial parks, and high-quality educational institutions in secondary satellite towns.',
      },
      {
        question: 'What role does public mass rapid transit play in solving metropolitan traffic congestion?',
        questionVi: 'Hệ thống giao thông công cộng khối lượng lớn đóng vai trò gì trong việc giải quyết ùn tắc giao thông đô thị?',
        contextNoteVi: 'Câu hỏi phân tích giải pháp kỹ thuật hạ tầng đô thị bền vững.',
        sampleAnswer: 'Mass rapid transit, such as urban metro systems and bus rapid transit networks, is the indispensable silver bullet. By offering reliable, high-speed, and low-cost alternatives to private motor vehicles, metro systems drastically reduce road congestion and vehicular carbon emissions.',
      },
      {
        question: 'How can urban planners balance modern high-rise development with the preservation of historical heritage quarters?',
        questionVi: 'Các nhà quy hoạch đô thị làm thế nào để cân bằng giữa xây dựng cao ốc hiện đại và bảo tồn các khu phố di sản lịch sử?',
        contextNoteVi: 'Giám khảo khảo sát tư duy dung hòa giữa hiện đại hóa và bảo tồn bản sắc văn hóa đô thị.',
        sampleAnswer: 'Urban authorities must implement strict zoning bylaws. Modern skyscrapers and financial centers should be designated to peripheral business districts, while historical city cores are preserved as pedestrian-friendly cultural corridors with strict architectural height ceilings.',
      },
    ],
    keyVocabulary: [
      { term: 'infrastructural asphyxiation', ipa: '/ˌɪnfrəˈstrʌktʃərəl æsˌfɪksiˈeɪʃn/', meaningVi: 'sự nghẹt thở, quá tải của cơ sở hạ tầng' },
      { term: 'ecological degradation', ipa: '/ˌiːkəˈlɒdʒɪkl ˌdeɡrəˈdeɪʃn/', meaningVi: 'sự suy thoái hệ sinh thái' },
      { term: 'socio-spatial fragmentation', ipa: '/ˌsoʊʃioʊ ˈspeɪʃl ˌfræɡmənˈteɪʃn/', meaningVi: 'sự phân mảnh không gian - xã hội' },
    ],
  },
  {
    id: 'vstep-p3-remote-work',
    topicTitle: 'The Paradigm Shift Toward Remote and Flexible Work',
    topicVi: 'Sự chuyển dịch mô hình làm việc từ xa và linh hoạt',
    category: 'technology',
    socioEconomicContextVi: 'Sự phổ cập của các công cụ làm việc cộng tác qua điện toán đám mây và hội nghị truyền hình đã giải phóng hàng triệu lao động trí óc khỏi văn phòng cố định, tái cấu trúc khái niệm cân bằng cuộc sống và định hình lại bản đồ bất động sản văn phòng thương mại.',
    academicCitationsVi: [
      'Stanford Institute for Economic Policy Research (Nicholas Bloom): Mô hình làm việc Hybrid tăng 3% đến 5% năng suất lao động thực tế và giảm 35% tỷ lệ nghỉ việc tự nguyện.',
      'International Labour Organization (ILO) Working Time Report: Làm việc từ xa giúp tiết kiệm trung bình 72 phút di chuyển mỗi ngày cho người lao động, góp phần giảm đáng kể lượng phát thải carbon giao thông cá nhân.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Pillars of Remote Work Evolution',
      givenBranches: [
        'Enhanced personal autonomy and eradication of daily commutes',
        'Significant operational expenditure savings for corporate firms',
        'Unrestricted access to global, geographically agnostic talent pools',
      ],
      customBranchPlaceholder: 'Erosion of workplace boundaries and risks of professional isolation',
    },
    sampleSpeechB2: `Good morning, examiner. The global transition toward remote and hybrid work models represents one of the most revolutionary socioeconomic shifts of the twenty-first century. Enabled by collaborative cloud platforms, telecommuting delivers extraordinary benefits across three key areas: personal lifestyle autonomy, institutional overhead savings, and global talent acquisition, alongside an important challenge regarding work-life balance.

First of all, from an individual perspective, remote employment grants unparalleled flexibility and eliminates grueling daily commutes. Instead of wasting two hours navigating stressful traffic jams, professionals can reallocate that time to personal wellness, family care, and deep focused work. This chronological autonomy significantly reduces burnout and boosts overall life satisfaction.

Secondly, for corporate enterprises, remote operations yield dramatic reductions in fixed operational expenditures. Maintaining prime commercial real-estate offices in expensive metropolitan centers incurs astronomical expenses in rent, electricity, maintenance, and facility management. By embracing remote policies, organizations can drastically downsize physical footprints and redirect capital into research and employee benefits.

Thirdly, telecommuting eliminates geographical barriers in recruitment. Employers are no longer constrained to hiring talent within a thirty-kilometer radius of their headquarters; they can recruit elite programmers, designers, and financial analysts globally, fostering a diverse and highly capable international workforce.

Nevertheless, as my own independent reflection, remote work introduces the dangerous blurring of professional and private boundaries. When homes become offices, workers often feel pressured to respond to digital messages around the clock, leading to digital fatigue and psychological isolation.

In conclusion, while organizations must intentionally manage the risks of isolation and blurred boundaries, the remote work revolution undeniably provides tremendous advantages for modern workforce productivity and lifestyle autonomy.`,
    sampleSpeechC1: `Distinguished examiner, I welcome this analytical discourse on the profound paradigm shift transforming the contemporary labor landscape: the decentralization of work through telecommuting. Accelerated by enterprise cloud architectures and digital collaborative tooling, the transition away from monolithic office environments is underpinned by four synergistic dimensions: chronological self-determination, corporate real-estate rationalization, global talent democratization, and the precarious dissolution of professional boundaries.

Foremost among these merits is the reclamation of individual temporal sovereignty. The traditional industrial commute represents an egregious drain on cognitive reserves, characterized by chronic transit friction and environmental stress. Telecommuting eradicates this daily taxation, enabling knowledge workers to synchronize their intellectual output with their peak physiological circadian rhythms, markedly enhancing cognitive productivity and psychosomatic well-being.

Furthermore, remote models deliver profound structural cost rationalization for modern enterprises. The capital allocation required to lease and maintain commercial real estate within metropolitan central business districts constitutes an immense balance-sheet liability. Transitioning to distributed frameworks allows enterprises to dramatically compress overhead expenditures, liberating venture capital to fund technological innovation and meritocratic compensation schemes.

Equally transformative is the geographic decoupling of talent acquisition. Restricting recruitment to contiguous municipal radii severely bottlenecks innovation. Distributed enterprise frameworks enable organizations to source apex intellectual capital agnostically across continents, dismantling geographic monopolies on corporate talent.

Crucially, as my independent fourth axis, I must articulate the profound socio-psychological vulnerability of boundary dissolution. The collapse of physical compartmentalization between domestic and professional domains frequently precipitates subterranean hyper-connectivity. Remote professionals struggle to disconnect from asynchronous notifications, resulting in chronic cognitive exhaustion and professional alienation.

To encapsulate, telecommuting is an irreversible evolution in human labor orchestration. Mastering this paradigm requires institutions to proactively foster intentional digital hygiene alongside decentralized operational autonomy.`,
    speechOutline: {
      opening: 'Introduce the decentralization of labor via telecommuting as an irreversible industrial revolution.',
      bodyPoint1: 'Temporal sovereignty: eliminating commute friction and optimizing circadian focus.',
      bodyPoint2: 'Corporate cost rationalization: compressing metropolitan real-estate overhead.',
      bodyPoint3: 'Global talent decoupling: hiring apex minds without geographic limitations.',
      bodyPointCustom: 'Candidate’s custom contribution: Boundary dissolution, digital fatigue, and subterranean hyper-connectivity.',
      closing: 'Conclude that intentional digital hygiene must accompany decentralized autonomy for sustainable growth.',
    },
    followUpQuestions: [
      {
        question: 'How can corporate managers effectively evaluate employee performance in a purely remote environment?',
        questionVi: 'Làm thế nào các nhà quản lý doanh nghiệp có thể đánh giá hiệu quả làm việc của nhân viên một cách công bằng trong môi trường làm việc từ xa?',
        contextNoteVi: 'Giám khảo muốn khảo sát năng lực quản trị dựa trên kết quả đầu ra thay vì giám sát thời gian cơ học.',
        sampleAnswer: 'Management must abandon archaic surveillance metrics like keystroke tracking and presenteeism. Instead, leadership must institute objective, milestone-driven Key Performance Indicators (KPIs) and Objectives and Key Results (OKRs), evaluating staff strictly on the quality and timeliness of deliverables.',
      },
      {
        question: 'Does remote work hinder informal brainstorming and corporate cultural cohesion?',
        questionVi: 'Làm việc từ xa có cản trở hoạt động sáng tạo tự phát và sự gắn kết văn hóa doanh nghiệp không?',
        contextNoteVi: 'Câu hỏi phân tích sự hao hụt của những cuộc trò chuyện bất ngờ (watercooler moments) nơi công sở.',
        sampleAnswer: 'Undeniably, spontaneous creative serendipity is harder to cultivate over structured Zoom calls. Forward-thinking enterprises counteract this by adopting a hybrid rhythm: reserving remote days for deep individual focus and orchestrating periodic in-person sprints for collective ideation and social cohesion.',
      },
      {
        question: 'What are the implications of the remote work revolution on commercial city center real estate?',
        questionVi: 'Cuộc cách mạng làm việc từ xa có tác động như thế nào đối với thị trường bất động sản thương mại tại các trung tâm thành phố?',
        contextNoteVi: 'Giám khảo kiểm tra kiến thức về tác động kinh tế lan tỏa đối với hạ tầng dịch vụ đô thị.',
        sampleAnswer: 'It triggers a structural urban transformation. Plummeting demand for legacy office towers forces city developers to repurpose commercial real estate into mixed-use residential complexes, green communal spaces, and cultural arts incubators, decentralizing urban hubs.',
      },
    ],
    keyVocabulary: [
      { term: 'temporal sovereignty', ipa: '/ˈtempərəl ˈsɒvrənti/', meaningVi: 'quyền tự chủ tuyệt đối về thời gian cá nhân' },
      { term: 'cost rationalization', ipa: '/kɒst ˌræʃnəlaɪˈzeɪʃn/', meaningVi: 'sự tối ưu hóa và hợp lý hóa chi phí' },
      { term: 'hyper-connectivity', ipa: '/ˌhaɪpər kəˌnektɪˈvɪti/', meaningVi: 'trạng thái luôn luôn kết nối mạng không ngơi nghỉ' },
    ],
  },
  {
    id: 'vstep-p3-fast-food',
    topicTitle: 'The Expansion of Fast Food & the Global Public Health Crisis',
    topicVi: 'Sự bành trướng của thức ăn nhanh và cuộc khủng hoảng sức khỏe cộng đồng toàn cầu',
    category: 'health_wellness',
    socioEconomicContextVi: 'Sự gia tăng đột biến của chuỗi thức ăn nhanh công nghiệp và thực phẩm chế biến sẵn giàu đường, muối và chất béo bão hòa tại các đô thị đang biến các bệnh không lây nhiễm (NCDs) như béo phì, tiểu đường tuýp 2 và tim mạch thành gánh nặng kinh tế - y tế khổng lồ.',
    academicCitationsVi: [
      'WHO Global Health Observatory: Các bệnh không lây nhiễm chiếm 74% các ca tử vong toàn cầu; chế độ dinh dưỡng thiếu cân bằng là yếu tố nguy cơ hàng đầu.',
      'The Lancet Commission on Global Obesity: Chi phí kinh tế gián tiếp và trực tiếp từ béo phì và tiểu đường ước tính vượt 1.200 tỷ USD mỗi năm.',
      'World Bank Policy Research: Chính sách đánh thuế đồ uống có đường (Sugary Drink Tax) tại hơn 50 quốc gia giúp giảm 15% lượng tiêu thụ đồ ngọt ở thanh thiếu niên.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Fast Food Health Impacts & Drivers',
      givenBranches: [
        'Extreme convenience and hyper-palatable industrial processing',
        'Aggressive commercial marketing targeting children and adolescents',
        'Alarming escalation of cardiovascular disease and type-2 diabetes',
      ],
      customBranchPlaceholder: 'The urgent necessity of fiscal sugar taxes and mandatory warning labels',
    },
    sampleSpeechB2: `Good morning, examiner. Today I would like to examine the alarming expansion of fast food and its profound repercussions on global public health. Over recent decades, ultra-processed convenience food has evolved into a major public health hazard, driven by convenience, predatory commercial marketing, catastrophic chronic diseases, and the necessity of state regulatory interventions.

To begin with, the foremost driver of fast food popularity is its supreme convenience and engineered flavor. In hectic modern societies where working adults have minimal time for culinary preparation, fast food provides an instantaneous, inexpensive meal. Food manufacturers deliberately formulate recipes high in refined sugars, sodium, and saturated fats to stimulate neural reward pathways, making these products exceptionally addictive.

Secondly, aggressive marketing campaigns deliberately target vulnerable younger generations. Fast-food corporations spend billions annually on vibrant advertisements, toy giveaways, and social media influencer sponsorships. Children and adolescents who lack mature nutritional awareness develop early dietary habits that prioritize sugary sodas and fried snacks over nutrient-dense whole foods.

Thirdly, the physiological consequences are catastrophic. Prolonged fast food consumption is directly correlated with the skyrocketing rates of childhood obesity, early-onset type-2 diabetes, hypertension, and arterial blockages. This medical crisis not only diminishes the quality of life for millions of citizens, but also imposes an overwhelming financial burden on national public healthcare systems.

In addition to these points, I strongly propose an indispensable fourth measure: aggressive government intervention through sugar taxes and front-of-pack warning labels. Voluntary corporate self-regulation has failed. Just as with tobacco, states must tax sugary items and mandate clear nutritional warnings on fast-food packaging to fund public health campaigns.

In conclusion, curbing the fast-food health crisis requires a concerted effort combining consumer nutritional literacy with decisive state taxation to safeguard the well-being of future generations.`,
    sampleSpeechC1: `Distinguished examiner, I am privileged to deliver an analytical treatise on the escalating epidemiological crisis precipitated by the unfettered proliferation of ultra-processed fast food. The industrialization of dietary consumption has precipitated a silent global pandemic of non-communicable diseases, underpinned by four structural dimensions: neurobiological hyper-palatability, predatory demographic marketing, catastrophic chronic disease burdens, and the imperative for decisive fiscal regulation.

Foremost among the drivers of consumption is the deliberate engineering of neurochemical addiction. Industrial food conglomerates systematically formulate products to hit what food scientists term the 'bliss point'—an optimal triangulation of refined carbohydrates, trans-fats, and sodium designed to override somatic satiety cues and hijack dopamine pathways. This engineered hyper-palatability, coupled with immediate spatial accessibility, displaces traditional nutrient-dense gastronomic traditions.

Furthermore, corporate marketing strategies exhibit an overtly predatory character toward pediatric demographics. Capitalizing on cognitive vulnerabilities, multinational food franchises leverage gamified digital media, celebrity endorsements, and ubiquitous retail positioning to cultivate early brand loyalty, locking adolescents into lifetime consumption cycles of hyper-caloric, nutritionally bankrupt provisions.

Equally devastating is the macro-epidemiological fallout. Diets dominated by ultra-processed foods are the primary etiologic drivers behind the meteoric surge in pediatric obesity, juvenile metabolic syndrome, cardiovascular pathologies, and oncological risks. Beyond personal suffering, this epidemic generates crushing socioeconomic externalities, threatening to bankrupt national healthcare infrastructures under the weight of long-term palliative care for preventable metabolic disorders.

Crucially, as my independent fourth pillar, I advocate for structural fiscal interventions: mandatory statutory taxation on high-fructose corn syrups and graphic front-of-package nutritional warning seals. Relying on corporate voluntary restraint is an exercise in futility. Only punitive fiscal disincentives alongside statutory bans on junk-food marketing to minors can alter consumption behaviors at population scale.

To encapsulate, dismantling the hegemony of fast food requires treating nutritional security as an urgent matter of state public health governance and regulatory accountability.`,
    speechOutline: {
      opening: 'Introduce the global expansion of fast food as a systemic public health and epidemiological emergency.',
      bodyPoint1: 'Neurobiological addiction: engineered bliss point of sugars, trans-fats, and sodium overriding satiety cues.',
      bodyPoint2: 'Predatory marketing: aggressive advertising campaigns targeting vulnerable pediatric and adolescent cohorts.',
      bodyPoint3: 'Epidemiological devastation: skyrocketing obesity, type-2 diabetes, and systemic strain on healthcare budgets.',
      bodyPointCustom: 'Candidate’s custom contribution: Fiscal state intervention through sugar taxes and mandatory graphic warning labels.',
      closing: 'Conclude with a synthesizing call for robust regulatory accountability to safeguard population health.',
    },
    followUpQuestions: [
      {
        question: 'Should governments ban fast-food outlets within close proximity of primary and secondary schools?',
        questionVi: 'Chính phủ có nên cấm các cửa hàng thức ăn nhanh hoạt động trong bán kính gần các trường học không?',
        contextNoteVi: 'Giám khảo đánh giá giải pháp quy hoạch đô thị để bảo vệ sức khỏe học đường.',
        sampleAnswer: 'Absolutely. Implementing designated healthy-food buffer zones around educational institutions is an effective spatial policy. Restricting junk-food accessibility shields impressionable schoolchildren from impulsive purchases and encourages the patronage of nutritious school cafeterias.',
      },
      {
        question: 'Do sugar and junk-food taxes unfairly penalize low-income households who rely on cheap calories?',
        questionVi: 'Liệu thuế đánh vào đường và thức ăn nhanh có vô tình tạo thêm gánh nặng cho các gia đình thu nhập thấp không?',
        contextNoteVi: 'Câu hỏi phân tích sự công bằng xã hội (social equity) trong chính sách thuế y tế.',
        sampleAnswer: 'While seemingly regressive on paper, low-income demographics actually suffer the highest rates of preventable diabetes and stroke. The key is revenue recycling: taxes collected from sugary beverages must be directly earmarked to subsidize fresh vegetables, fruits, and subsidized school meal programs for underprivileged communities.',
      },
      {
        question: 'Can modern food-delivery mobile apps be held accountable for encouraging sedentary and unhealthy eating habits?',
        questionVi: 'Các ứng dụng giao đồ ăn có phải chịu trách nhiệm về việc khuyến khích thói quen ăn uống kém lành mạnh không?',
        contextNoteVi: 'Giám khảo khảo sát mối liên hệ giữa chuyển đổi số (delivery platforms) và sức khỏe dinh dưỡng.',
        sampleAnswer: 'While delivery apps offer logistical convenience, their algorithmic recommendation engines frequently push high-margin junk food. Regulatory bodies should mandate algorithmic transparency, requiring platforms to display calorie totals prominently and incentivize wholesome dietary selections through lower commission fees.',
      },
    ],
    keyVocabulary: [
      { term: 'hyper-palatable', ipa: '/ˌhaɪpər ˈpælətəbl/', meaningVi: 'kích thích vị giác tột độ, dễ gây nghiện' },
      { term: 'predatory marketing', ipa: '/ˈpredətɔːri ˈmɑːrkɪtɪŋ/', meaningVi: 'chiến lược tiếp thị nhắm vào đối tượng dễ bị tổn thương' },
      { term: 'fiscal disincentive', ipa: '/ˈfɪskl ˌdɪsɪnˈsentɪv/', meaningVi: 'biện pháp răn đe thông qua chính sách thuế' },
    ],
  },
  {
    id: 'vstep-p3-ecotourism',
    topicTitle: 'Sustainable Ecotourism vs Preservation of Indigenous Heritage',
    topicVi: 'Du lịch sinh thái bền vững và bảo tồn di sản văn hóa bản địa',
    category: 'environment',
    socioEconomicContextVi: 'Ngành du lịch trải nghiệm thiên nhiên và khám phá văn hóa bản địa tại các khu bảo tồn sinh thái mang lại sinh kế mới cho các cộng đồng thiểu số, nhưng đồng thời tiềm ẩn rủi ro phá vỡ cấu trúc sinh thái và biến các nghi lễ thiêng liêng thành sản phẩm giải trí thương mại.',
    academicCitationsVi: [
      'UNESCO Convention for the Safeguarding of the Intangible Cultural Heritage: Bảo tồn văn hóa bản địa đòi hỏi quyền làm chủ và sự đồng thuận có hiểu biết của chính cộng đồng địa phương.',
      'UN Tourism (UNWTO) Global Ecotourism Report: Mô hình du lịch sinh thái dựa vào cộng đồng (Community-Based Ecotourism) giúp giữ lại trên 65% nguồn thu tại địa bàn, vượt xa mức 20% của các khu nghỉ dưỡng khép kín.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Ecotourism Dimensions & Tensions',
      givenBranches: [
        'Economic diversification and poverty reduction for indigenous communities',
        'Environmental education and conservation funding for pristine biomes',
        'Vulnerability to commercial commodification of sacred cultural traditions',
      ],
      customBranchPlaceholder: 'Strict visitor carrying capacity caps and indigenous community governance',
    },
    sampleSpeechB2: `Good morning. Today I would like to examine the delicate equilibrium between developing sustainable ecotourism and preserving pristine natural environments and indigenous cultural integrity. Ecotourism has emerged as a promising developmental vehicle, characterized by economic empowerment, ecological conservation, cultural risks, and the imperative for community-led governance.

First of all, ecotourism provides vital economic diversification for remote indigenous populations. In mountainous and forested territories, local communities often have limited income opportunities, which historically led to deforestation or wildlife poaching. By establishing eco-lodges, guiding trekking expeditions, and selling traditional handicrafts, indigenous families secure sustainable livelihoods that celebrate their cultural roots.

Secondly, responsible ecotourism generates direct financial resources for biodiversity conservation. Entrance fees and tourist contributions can be reinvested into national park ranger patrols, anti-poaching surveillance, and reforestation projects. Furthermore, interacting with pristine ecosystems educates urban visitors on environmental stewardship, inspiring broader ecological consciousness.

However, unmanaged tourism introduces profound risks of cultural commercialization. When sacred rituals, traditional dances, and architectural motifs are mass-marketed to thrill-seeking sightseers, they often lose their spiritual sanctity and become superficial commercial spectacles. Furthermore, careless tourist foot-traffic can degrade fragile wilderness trails and generate plastic waste.

Therefore, as my own essential fourth proposal, I advocate for strict carrying-capacity quotas and indigenous community leadership. Instead of allowing external mega-corporations to exploit rural sites, ecotourism cooperatives must be owned and governed directly by local village elders who have the authority to limit visitor numbers and protect their cultural heritage.

In conclusion, ecotourism can serve as a powerful force for good, provided that economic exploitation is strictly subordinated to ecological conservation and indigenous cultural respect.`,
    sampleSpeechC1: `Distinguished examiner, I am privileged to deliver an analytical inquiry into the intricate dialectic between sustainable ecotourism expansion and the preservation of indigenous anthropological and ecological integrity. While ecotourism is celebrated as a transformative paradigm for green economic growth, it embodies profound tensions across four structural dimensions: socioeconomic emancipation, ecological capital reinvestment, cultural commodification, and the imperative for sovereign indigenous stewardship.

Foremost among the positive vectors is socioeconomic emancipation for historically marginalized communities. Rural biomes frequently lack diversified economic engines, rendering inhabitants susceptible to poverty and incentivizing ecologically destructive extractive practices such as slash-and-burn agriculture. Community-based ecotourism interrupts this cycle, monetizing the preservation of biodiversity and traditional knowledge, thereby fostering dignified local livelihoods.

Concurrently, enlightened ecotourism acts as a mechanism for ecological capital reinvestment. Revenue generated through conservation levies provides essential fiscal liquidity for anti-poaching operations, scientific habitat monitoring, and wildlife corridor restoration. Moreover, experiential engagement with pristine biomes dismantles urban anthropocentrism, cultivating profound ecological consciousness among visitors.

Nonetheless, unchecked tourist incursions harbor insidious perils of cultural commodification and ecological erosion. The intrusion of mass consumerism frequently reduces sacrosanct spiritual rituals into kitsch theatrical performances packaged for foreign consumption. This anthropological degradation fractures intergenerational cultural transmission, while infrastructure development inflicts severe ecological fragmentation upon vulnerable ecosystems.

Crucially, as my independent fourth pillar, I champion the institutionalization of sovereign carrying-capacity thresholds and indigenous co-management frameworks. Tourism quotas must be governed not by short-term commercial returns, but by biological carrying limits established by environmental scientists and indigenous councils endowed with legal veto power over developmental projects.

To encapsulate, ecotourism fulfills its noble promise only when it ceases to be an extractive industry and instead functions as a collaborative partnership rooted in sovereign environmental stewardship and cultural reverence.`,
    speechOutline: {
      opening: 'Frame ecotourism as a double-edged sword between green socioeconomic growth and indigenous preservation.',
      bodyPoint1: 'Socioeconomic emancipation: converting conservation into sustainable livelihoods and ending extractive poverty.',
      bodyPoint2: 'Ecological capital reinvestment: visitor revenues funding habitat protection and ranger patrols.',
      bodyPoint3: 'Cultural commodification risks: debasement of sacred ceremonies into kitsch tourist spectacles.',
      bodyPointCustom: 'Candidate’s custom contribution: Enforcing strict ecological carrying capacities and indigenous governance.',
      closing: 'Synthesize that ecotourism must transcend extractive commercialism to respect ecological and cultural sovereignty.',
    },
    followUpQuestions: [
      {
        question: 'How can authorities prevent indigenous youth from abandoning their traditional heritage in tourist destinations?',
        questionVi: 'Làm thế nào để nhà chức trách ngăn chặn tình trạng thanh niên bản địa bỏ bê di sản truyền thống tại các vùng du lịch?',
        contextNoteVi: 'Giám khảo khảo sát phương thức bảo tồn văn hóa sống (living heritage) cho thế hệ trẻ.',
        sampleAnswer: 'Authorities must ensure that traditional heritage possesses genuine economic and social prestige. Incorporating indigenous linguistics, ancestral crafts, and botanical knowledge into local school curricula, while guaranteeing fair wages for cultural custodians, demonstrates to youth that their ancestral identity is a dignified, economically viable path.',
      },
      {
        question: 'Should fragile ecological zones, such as deep-cave systems, be completely closed to leisure tourism?',
        questionVi: 'Liệu các vùng sinh thái đặc biệt nhạy cảm, như hang động sâu, có nên đóng cửa hoàn toàn đối với du lịch không?',
        contextNoteVi: 'Câu hỏi bàn về sự đánh đổi giữa bảo tồn tuyệt đối và khai thác du lịch bền vững.',
        sampleAnswer: 'In hyper-vulnerable biomes where human respiration alters fragile microclimates, total preservation must take precedence over recreational profit. Only specialized scientific research teams should be granted access, while public appreciation can be achieved through non-invasive high-fidelity virtual reality simulations.',
      },
      {
        question: 'What constitutes the difference between authentic ecotourism and superficial corporate greenwashing?',
        questionVi: 'Đâu là sự khác biệt giữa du lịch sinh thái đích thực và hành vi đánh bóng thương hiệu xanh (greenwashing)?',
        contextNoteVi: 'Giám khảo kiểm tra khả năng phân biệt giữa du lịch bền vững thực chất và chiêu trò truyền thông.',
        sampleAnswer: 'Authentic ecotourism features verified community equity ownership, measurable waste-recycling protocols, and direct financial contributions to conservation trusts. Conversely, greenwashing merely pastes eco-labels onto luxury resorts that consume exorbitant water resources and repatriate profits to offshore corporate conglomerates.',
      },
    ],
    keyVocabulary: [
      { term: 'socioeconomic emancipation', ipa: '/ˌsoʊʃioʊˌekəˈnɒmɪk ɪˌmænsɪˈpeɪʃn/', meaningVi: 'sự giải phóng và tự chủ về kinh tế - xã hội' },
      { term: 'cultural commodification', ipa: '/ˈkʌltʃərəl kəˌmɒdɪfɪˈkeɪʃn/', meaningVi: 'thương mại hóa di sản văn hóa một cách thô thiển' },
      { term: 'carrying-capacity threshold', ipa: '/ˈkæriɪŋ kəˌpæsəti ˈθreʃhoʊld/', meaningVi: 'ngưỡng giới hạn sức chứa của môi trường sinh thái' },
    ],
  },
  {
    id: 'vstep-p3-generative-ai',
    topicTitle: 'Generative AI & the Future of White-Collar Labor',
    topicVi: 'Trí tuệ nhân tạo tạo sinh và tương lai của lực lượng lao động trí thức',
    category: 'technology',
    socioEconomicContextVi: 'Sự xuất hiện của các mô hình ngôn ngữ lớn (LLMs) và công cụ AI tạo sinh đang phá vỡ thế độc quyền của con người trong các hoạt động trí tuệ như viết code, phân tích dữ liệu, dịch thuật và thiết kế, đặt ra bài toán cấp bách về định nghĩa lại giá trị lao động và chính sách đào tạo lại nhân lực.',
    academicCitationsVi: [
      'World Economic Forum (WEF) Future of Jobs Report: Ước tính 44% kỹ năng cốt lõi của người lao động sẽ bị biến đổi hoặc thay thế bởi AI trong vòng 5 năm tới.',
      'International Labour Organization (ILO) Study: AI tạo sinh có xu hướng bổ trợ công việc (task augmentation) hơn là tiêu diệt hoàn toàn nghề nghiệp, với tác động lớn nhất tập trung vào khối văn phòng.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Generative AI Labor Dimensions',
      givenBranches: [
        'Dramatic acceleration of cognitive productivity and rapid prototyping',
        'Mass displacement of entry-level knowledge workers and junior analysts',
        'Ethical predicaments regarding algorithmic bias and intellectual property theft',
      ],
      customBranchPlaceholder: 'Mandatory workforce reskilling and transition toward critical meta-cognitive oversight',
    },
    sampleSpeechB2: `Good morning. The explosive emergence of Generative Artificial Intelligence represents a seismic technological watershed, transforming the landscape of white-collar labor. For the first time in human history, automation is displacing intellectual and creative tasks rather than manual labor. This disruption unfolds across four critical dimensions: cognitive productivity leaps, workforce displacement fears, intellectual property dilemmas, and the urgent necessity for workforce reskilling.

First of all, generative AI delivers unprecedented productivity multipliers for knowledge professionals. Software engineers, financial analysts, and corporate marketers can now automate boilerplate code, summarize thousands of research documents, and synthesize data in seconds. By offloading monotonous clerical tasks to AI, professionals can devote their cognitive energy to high-level strategy and creative problem-solving.

Secondly, however, AI automation unleashes severe risks of labor displacement, particularly for entry-level professionals. Tasks historically assigned to junior associates—such as basic legal document review, introductory programming, and routine copywriting—can now be performed faster and cheaper by algorithms. If corporations drastically reduce junior hiring, young graduates will struggle to enter the professional workforce and develop foundational career skills.

Thirdly, generative AI introduces profound legal and ethical dilemmas. Massive models are trained on billions of copyrighted texts, source code, and artworks without explicit creator consent, sparking contentious intellectual property lawsuits. Furthermore, algorithmic hallucination and embedded biases can lead to discriminatory hiring decisions or flawed financial projections if left unchecked.

Consequently, as my own essential fourth dimension, I argue that societies must prioritize mandatory workforce reskilling and meta-cognitive oversight. Humans must evolve from task executors into critical supervisors who prompt, verify, and orchestrate AI tools ethically. Educational curricula must pivot from rote memorization toward ethical reasoning and complex emotional intelligence.

In conclusion, generative AI is neither an apocalyptic curse nor an effortless panacea; it is a profound amplifier of human intellect that demands proactive governance and lifelong skill adaptation.`,
    sampleSpeechC1: `Distinguished examiner, I welcome this opportunity to deliver an analytical evaluation of the tectonic disruption being wrought upon white-collar labor by Generative Artificial Intelligence. The transition from rule-based computational algorithms to large multimodal models capable of synthesized cognition represents an unprecedented inflection point in economic history, characterized by four dialectical axes: cognitive productivity hyper-scaling, structural junior displacement, algorithmic intellectual property violations, and the imperative for meta-cognitive reskilling.

Foremost among the transformative benefits is the exponential acceleration of intellectual productivity. Generative tooling collapses the friction of ideation and prototyping. In disciplines such as software architecture, pharmaceutical discovery, and financial modeling, neural networks execute combinatorial searches and synthesize vast corpora of literature within seconds. This operational velocity democratizes high-tier cognitive capabilities, transforming solitary analysts into multifaceted operational units.

In stark contrast, this velocity precipitates severe structural fractures in professional apprenticeship pipelines. Historically, novice professionals cultivated domain mastery through executing routine foundational labor—drafting briefs, debugging syntax, and conducting market reconnaissance. By automating these baseline competencies, enterprise algorithms threaten to decapitate the junior workforce, eradicating traditional onboarding gateways and widening intergenerational inequality.

Concurrently, generative architectures provoke acute legal and epistemic vulnerabilities. Large models ingest colossal proprietary repositories without transparent licensing, precipitating systemic intellectual property crises. Moreover, the propensity of neural networks to generate plausible hallucinations alongside unvetted sociological biases introduces systemic perils into legal, medical, and algorithmic underwriting workflows.

Crucially, as my independent fourth consideration, I emphasize the strategic imperative of meta-cognitive adaptation. As procedural execution becomes commoditized, human competitive advantage must relocate to higher-order cognitive faculties: normative ethical arbitration, cross-domain contextual synthesis, and empathetic interpersonal leadership. Governments and corporations must forge co-financed reskilling compacts to prevent technological redundancy.

To summarize, navigating the generative AI epoch requires society to move beyond techno-fatalism and deliberately sculpt institutional frameworks that elevate human agency alongside algorithmic efficiency.`,
    speechOutline: {
      opening: 'Frame Generative AI as an unprecedented historic inflection point automating cognitive and creative labor.',
      bodyPoint1: 'Hyper-scaling intellectual productivity: collapsing prototyping friction and democratizing expertise.',
      bodyPoint2: 'Structural labor vulnerability: decapitating junior apprenticeship pipelines and entry-level jobs.',
      bodyPoint3: 'Epistemic and legal perils: unvetted algorithmic hallucination, inherent bias, and intellectual property theft.',
      bodyPointCustom: 'Candidate’s custom contribution: Cultivating meta-cognitive oversight, ethical arbitration, and institutional reskilling.',
      closing: 'Conclude with a synthesizing call for proactive governance to align algorithmic power with human agency.',
    },
    followUpQuestions: [
      {
        question: 'Will generative AI exacerbate global inequality between technologically dominant nations and developing economies?',
        questionVi: 'Trí tuệ nhân tạo tạo sinh có làm trầm trọng thêm khoảng cách giàu nghèo giữa các cường quốc công nghệ và các nước đang phát triển không?',
        contextNoteVi: 'Giám khảo đánh giá tầm nhìn địa chính trị và khoảng cách số toàn cầu (global AI divide).',
        sampleAnswer: 'Undoubtedly, without proactive international intervention. Advanced AI requires astronomical capital expenditures in proprietary chip design and supercomputing data centers, concentrating wealth within a handful of Silicon Valley monopolies. Developing nations must invest aggressively in open-source AI frameworks and national sovereign compute to avoid technological vassalage.',
      },
      {
        question: 'Should governments establish universal basic income (UBI) to support citizens displaced by artificial intelligence?',
        questionVi: 'Chính phủ có nên thiết lập thu nhập cơ bản phổ quát (UBI) để hỗ trợ những người lao động bị mất việc làm do AI không?',
        contextNoteVi: 'Câu hỏi kiểm tra kiến thức về chính sách phúc lợi xã hội và thuế tự động hóa (robot tax).',
        sampleAnswer: 'As algorithmic automation decouples economic productivity from human labor hours, traditional income structures will destabilize. A targeted Universal Basic Income, financed through corporate automation windfall levies, will be essential to provide a baseline social safety net while workers retrain for newly emerging industries.',
      },
      {
        question: 'Which human capabilities will remain permanently insulated from algorithmic replacement?',
        questionVi: 'Những năng lực nào của con người sẽ không bao giờ bị thay thế hoàn toàn bởi các thuật toán AI?',
        contextNoteVi: 'Giám khảo khảo sát nhận thức về bản chất độc bản của trí tuệ và cảm xúc con người.',
        sampleAnswer: 'Deep somatic empathy, spontaneous emotional resonance, moral courage, and authentic artistic vulnerability will remain uniquely human. An algorithm can simulate clinical diagnoses or compose pleasant verses, but the visceral human capacity to comfort a grieving patient or make moral sacrifices in the face of ambiguity remains irreducibly human.',
      },
    ],
    keyVocabulary: [
      { term: 'cognitive productivity', ipa: '/ˈkɒɡnətɪv ˌprɒdʌkˈtɪvəti/', meaningVi: 'năng suất lao động trí tuệ' },
      { term: 'meta-cognitive oversight', ipa: '/ˌmetə ˈkɒɡnətɪv ˈoʊvərsaɪt/', meaningVi: 'năng lực giám sát và điều hướng tư duy bậc cao' },
      { term: 'epistemic vulnerability', ipa: '/ˌepɪˈstiːmɪk ˌvʌlnərəˈbɪləti/', meaningVi: 'lỗ hổng về tính xác thực của tri thức' },
    ],
  },
  {
    id: 'vstep-p3-renewable-energy',
    topicTitle: 'The Renewable Energy Transition & Grid Modernization',
    topicVi: 'Chuyển dịch năng lượng tái tạo và hiện đại hóa lưới điện quốc gia',
    category: 'environment',
    socioEconomicContextVi: 'Trước tác động khốc liệt của biến đổi khí hậu toàn cầu và cam kết Net-Zero vào năm 2050 (COP26), quá trình thay thế nhiên liệu hóa thạch bằng năng lượng mặt trời và gió đang là ưu tiên chiến lược hàng đầu, đòi hỏi nguồn vốn khổng lồ để nâng cấp lưới điện truyền tải.',
    academicCitationsVi: [
      'IPCC Sixth Assessment Report (AR6): Cần cắt giảm tối thiểu 43% lượng phát thải khí nhà kính trước năm 2030 để duy trì mục tiêu kiềm chế nhiệt độ toàn cầu không vượt quá 1.5°C.',
      'International Energy Agency (IEA) World Energy Outlook: Chi phí sản xuất điện mặt trời quy mô lớn hiện đã thấp hơn 30% so với nhà máy nhiệt điện than mới, nhưng nút thắt nghẽn nằm ở hệ thống pin lưu trữ và truyền tải điện.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Energy Transition Vectors',
      givenBranches: [
        'Drastic decarbonization to achieve net-zero climate commitments',
        'Economic energy independence from volatile imported fossil fuels',
        'Intermittent supply volatility destabilizing legacy electrical grids',
      ],
      customBranchPlaceholder: 'Strategic investment in grid-scale battery storage and smart grid transmission',
    },
    sampleSpeechB2: `Good morning. Today I would like to analyze the indispensable global transition from fossil fuels to renewable energy sources. Facing severe climate emergencies, nations worldwide are racing to modernize their energy infrastructures. This profound transformation unfolds across four major dimensions: climate decarbonization, energy sovereignty, grid stability challenges, and modern energy storage solutions.

First of all, the primary imperative driving renewable adoption is the urgent need to mitigate catastrophic climate change. Burning coal, natural gas, and petroleum for electricity generation is the largest single contributor to global carbon emissions. By replacing thermal power stations with solar arrays, wind turbines, and hydroelectricity, countries can drastically cut emissions to achieve their Net-Zero commitments under international climate treaties.

Secondly, renewable energy secures national economic sovereignty and shields economies from global geopolitical shocks. Fossil fuels are concentrated in specific volatile geographic regions, leaving importing nations vulnerable to international oil price spikes and supply disruptions. Harnessing domestic sunlight and offshore wind ensures long-term, stable, and cost-predictable energy independence.

However, renewable energy faces a severe technical hurdle: meteorological intermittency. Solar panels generate zero power at night, and wind turbines halt during calm weather. When fed into legacy electrical grids designed for steady baseload power, sudden fluctuations risk destabilizing transmission lines and causing widespread blackouts.

Therefore, as my own essential fourth pillar, I propose massive capital investment into smart grid modernizations and industrial-scale battery storage. Developing high-capacity lithium and flow batteries, coupled with automated smart grids that dynamically balance supply and demand, is the definitive solution to conquer intermittency and guarantee reliable clean power.

In conclusion, while overcoming technical bottlenecks requires substantial capital investment, transitioning to clean renewable energy is an unnegotiable moral and economic duty to safeguard our planet.`,
    sampleSpeechC1: `Distinguished examiner, I am privileged to present an analytical exploration of the complex macroeconomic and technological dynamics governing the global renewable energy transition. The imperative to dismantle fossil-fuel dependencies while ensuring uninterrupted industrial baseload power constitutes the supreme engineering and geopolitical challenge of our era, articulated through four interconnected vectors: decarbonization imperatives, geopolitical energy sovereignty, infrastructural grid volatility, and the decisive deployment of advanced energy storage architectures.

Foremost among these vectors is the non-negotiable imperative of atmospheric decarbonization. Anthropogenic greenhouse gas emissions from conventional hydrocarbon combustion have propelled planetary biomes toward critical climate tipping points. Transitioning to zero-marginal-cost renewable generation—principally solar photovoltaic and offshore wind kinetic harvesting—is the cornerstone prerequisite for fulfilling multilateral Net-Zero commitments and averting irreversible environmental catastrophes.

Concurrently, the transition constitutes a vital geopolitical hedge for economic sovereignty. Reliance on imported fossil fuels exposes national economies to the vagaries of international commodity cartels, shipping bottleneck vulnerabilities, and petro-state weaponization of supply corridors. Decentralized renewable harvesting liberates sovereign states from external geopolitical coercion, establishing insulated domestic energy reserves with predictable long-term marginal costs.

Conversely, the integration of renewables introduces formidable technical frictions centered on atmospheric stochasticity. Unlike legacy coal or combined-cycle gas turbines that provide steady synchronous baseload inertia, solar and wind assets are inherently intermittent. Injecting unbuffered, variable renewable energy into legacy transmission grids induces severe frequency instability, voltage fluctuations, and curtailment losses.

Crucially, as my independent fourth pillar, I emphasize that the renewable revolution is fundamentally a grid-storage revolution. Overcoming intermittency necessitates the deployment of utility-scale electrochemical battery reserves, pumped-storage hydroelectric assets, and automated smart-grid architectures. Deploying advanced algorithmic load-balancing transforms intermittent green generation into reliable, dispatchable power.

To summarize, achieving a decarbonized economic future demands that policymakers look beyond merely erecting wind turbines, and aggressively commit the capital required to build resilient, smart, and storage-augmented transmission backbones.`,
    speechOutline: {
      opening: 'Frame the clean energy transition as the paramount macroeconomic and civilizational challenge of the twenty-first century.',
      bodyPoint1: 'Atmospheric decarbonization: replacing hydrocarbon combustion to avert catastrophic climate tipping points.',
      bodyPoint2: 'Geopolitical energy sovereignty: insulating domestic economies from volatile global fossil-fuel cartels.',
      bodyPoint3: 'Infrastructural volatility: inherent intermittency of solar and wind destabilizing legacy synchronous grids.',
      bodyPointCustom: 'Candidate’s custom contribution: Utility-scale battery storage and algorithmic smart-grid transmission modernization.',
      closing: 'Synthesize that clean power generation and advanced storage must advance synchronously to guarantee resilient prosperity.',
    },
    followUpQuestions: [
      {
        question: 'Does the mining of rare earth minerals for batteries and solar panels contradict the environmental mission of green energy?',
        questionVi: 'Việc khai thác khoáng sản đất hiếm cho pin và tấm pin mặt trời có mâu thuẫn với sứ mệnh bảo vệ môi trường không?',
        contextNoteVi: 'Giám khảo kiểm tra góc nhìn toàn diện về chuỗi cung ứng vật liệu sạch và tác động vòng đời sản phẩm (Life Cycle Assessment).',
        sampleAnswer: 'While mineral extraction undoubtedly incurs local ecological friction, its lifetime ecological impact is orders of magnitude smaller than continuous hydrocarbon extraction and carbon atmospheric pollution. The solution lies in establishing circular supply chains: implementing strict environmental mining standards alongside mandatory industrial-scale recycling of solar panels and lithium-ion batteries.',
      },
      {
        question: 'Should nuclear energy be considered a core pillar alongside renewables to maintain steady baseload power?',
        questionVi: 'Liệu năng lượng hạt nhân có nên được coi là một trụ cột then chốt cùng với năng lượng tái tạo để duy trì điện nền ổn định không?',
        contextNoteVi: 'Câu hỏi phân tích vai trò của điện hạt nhân thế hệ mới trong chiến lược giảm phát thải carbon.',
        sampleAnswer: 'Nuclear power, particularly modern Small Modular Reactors (SMRs), represents an indispensable carbon-free baseload partner. Unlike weather-dependent renewables, nuclear plants operate with capacity factors exceeding ninety percent, providing the reliable synchronous grid inertia needed to anchor intermittent solar and wind generation.',
      },
      {
        question: 'How can developing nations finance the astronomical upfront capital costs of renewable grid modernization?',
        questionVi: 'Làm thế nào các quốc gia đang phát triển có thể huy động nguồn vốn khổng lồ để hiện đại hóa lưới điện xanh?',
        contextNoteVi: 'Giám khảo khảo sát cơ chế tài chính khí hậu quốc tế (Climate Finance) và chuyển giao công nghệ.',
        sampleAnswer: 'Developing economies cannot shoulder this fiscal burden alone. Wealthy industrialized nations must honor their climate financing pledges through concessional loans and technology transfer compacts, such as the Just Energy Transition Partnership (JETP), mitigating investment risks to attract private international capital.',
      },
    ],
    keyVocabulary: [
      { term: 'atmospheric decarbonization', ipa: '/ˌætməsˈferɪk diːˌkɑːrbənaɪˈzeɪʃn/', meaningVi: 'giảm phát thải carbon vào bầu khí quyển' },
      { term: 'stochasticity', ipa: '/ˌstɒkæˈstɪsɪti/', meaningVi: 'tính bất định, ngẫu nhiên theo thời tiết' },
      { term: 'grid-scale storage', ipa: '/ɡrɪd skeɪl ˈstɔːrɪdʒ/', meaningVi: 'hệ thống lưu trữ điện quy mô lưới quốc gia' },
    ],
  },
  {
    id: 'vstep-p3-folk-culture',
    topicTitle: 'Digital Preservation of Intangible Folk Arts & Traditional Crafts',
    topicVi: 'Bảo tồn số hóa nghệ thuật dân gian và làng nghề truyền thống',
    category: 'society_culture',
    socioEconomicContextVi: 'Làn sóng toàn cầu hóa và sự bùng nổ của văn hóa giải trí số khiến các loại hình nghệ thuật diễn xướng dân gian (Ca trù, Chèo, Quan họ) và các làng nghề thủ công mỹ nghệ đứng trước nguy cơ mai một thế hệ truyền thừa, đòi hỏi các giải pháp số hóa di sản và tích hợp học đường sáng tạo.',
    academicCitationsVi: [
      'UNESCO Convention for the Safeguarding of the Intangible Cultural Heritage: Di sản phi vật thể chỉ có thể được bảo tồn bền vững khi nó tiếp tục được thực hành và trao truyền sống động trong lòng cộng đồng.',
      'Bộ Văn hóa, Thể thao & Du lịch Việt Nam: Đề án số hóa 100% di sản phi vật thể quốc gia giai đoạn 2021-2030 là nền tảng kết nối người trẻ với cội nguồn văn hóa.',
    ],
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Folk Heritage Preservation Dimensions',
      givenBranches: [
        'Safeguarding unique national identity against cultural homogenization',
        'Severe vulnerability to generational attrition among master artisans',
        'Commercial struggles in competing with algorithmic digital entertainment',
      ],
      customBranchPlaceholder: 'Digital archival through immersive VR/AR and incorporation into formal education',
    },
    sampleSpeechB2: `Good morning, examiner. In today’s interconnected global village, the preservation of intangible folk arts and ancestral craftsmanship has become an urgent cultural challenge. Traditional performing arts like Ca tru, Tuong, or Quan ho singing, alongside ancient ceramic and weaving villages, face severe risks in the digital age. This topic explores four vital aspects: protecting cultural identity, generational artisan loss, commercial viability, and digital technological innovation.

First of all, folk traditions are the bedrock of our national identity and historical memory. In an era where global movies, pop music, and social media homogenize youth culture, distinct folk arts serve as living anchors. They encapsulate centuries of philosophical wisdom, indigenous mythology, and communal pride, distinguishing our national culture from the rest of the world.

Secondly, the foremost crisis confronting traditional crafts is generational attrition. Master artisans and folk performers who hold irreplaceable ancestral techniques are aging rapidly. Meanwhile, young generations gravitate toward lucrative modern careers, leaving very few apprentices willing to dedicate years to mastering time-consuming craft traditions. Without successors, these arts face imminent extinction.

Thirdly, traditional arts struggle severely to maintain commercial viability. In a market dominated by instantaneous streaming and short-form video algorithms, slow-paced folk theater and handmade pottery struggle to compete for consumer attention and financial patronage, threatening the livelihoods of dedicated practitioners.

Consequently, as my own essential fourth solution, I advocate for digital preservation and school curriculum integration. Governments must leverage high-definition audio recordings, motion-capture 3D modeling, and immersive Virtual Reality to digitally archive endangered performances. Furthermore, introducing hands-on folk music and craft workshops into primary and secondary schools will nurture cultural appreciation in youth from an early age.

In conclusion, preserving our folk heritage requires bridging ancient wisdom with contemporary digital technology, ensuring our ancestral treasures thrive in the modern world.`,
    sampleSpeechC1: `Distinguished examiner, I welcome this opportunity to present an analytical thesis on the imperative of safeguarding and revitalizing intangible cultural heritage within our contemporary digital landscape. As global cultural homogenization accelerates under the pressure of transnational media conglomerates, preserving indigenous performing arts and artisan craftsmanship constitutes an existential cultural priority, delineated across four pivotal axes: national ontological sovereignty, master-artisan generational attrition, commercial marginalization, and the transformative potential of immersive digital remediation.

Foremost among the imperatives is the defense of national ontological sovereignty. Intangible folk traditions—embodied in lyrical forms like Quan ho, epics like Ca tru, and artisanal guilds—are not mere nostalgic artifacts; they are the living repositories of collective ancestral memory, linguistic richness, and civilizational ethos. In the face of ubiquitous algorithmic entertainment that flattens cultural variance, these ancestral forms provide an irreplaceable cognitive and emotional anchor for societal coherence.

Conversely, traditional culture faces acute vulnerability through biological generational attrition. Intangible heritage exists exclusively through human transmission; its complex nuances, vocal inflections, and tactile guild proficiencies are passed down orally and viscerally. As venerable master artisans reach biological mortality without viable economic incentives to retain young apprentices, ancestral lineages of tacit knowledge stand on the precipice of permanent extinction.

Concurrently, traditional mediums suffer profound commercial marginalization. Contemporary attention economies prioritize rapid dopamine cycles engineered by streaming algorithms. The reflective, contemplative rhythms of folk theater and artisanal craftsmanship struggle to achieve market viability, plunging historical cultural practitioners into economic precarity.

Crucially, as my independent fourth pillar, I propose a dual strategy of immersive digital archiving and compulsory pedagogical embedding. Cultural ministries must deploy volumetric video capture, spatial audio engineering, and virtual reality simulations to preserve masters' performances in immutable digital archives. Concurrently, traditional performing arts must be woven organically into the core educational curriculum, transforming youth from passive spectators into active, prideful custodians of their ancestral inheritance.

To encapsulate, safeguarding our folk heritage demands that we move beyond passive museum conservation and actively deploy cutting-edge digital technologies to revitalize ancient traditions for contemporary and future generations.`,
    speechOutline: {
      opening: 'Frame the preservation of intangible folk arts as an existential defense of national identity against global cultural homogenization.',
      bodyPoint1: 'Ontological sovereignty: folk heritage as the living repository of collective ancestral wisdom and societal distinctiveness.',
      bodyPoint2: 'Biological artisan attrition: aging masters without young apprentices threatening tacit knowledge with permanent extinction.',
      bodyPoint3: 'Attention-economy marginalization: traditional arts struggling to compete against fast algorithmic digital media.',
      bodyPointCustom: 'Candidate’s custom contribution: Immersive digital preservation (VR/AR volumetric capture) and core pedagogical integration in schools.',
      closing: 'Conclude with a synthesizing vision of marrying ancestral heritage with cutting-edge digital technology to ensure living continuity.',
    },
    followUpQuestions: [
      {
        question: 'Is it acceptable to modernize traditional folk music by blending it with modern pop or hip-hop rhythms?',
        questionVi: 'Việc hiện đại hóa âm nhạc dân gian bằng cách kết hợp với nhạc pop hay hip-hop hiện đại có được coi là chấp nhận được không?',
        contextNoteVi: 'Giám khảo khảo sát quan điểm về ranh giới giữa sáng tạo cách tân (hybridization) và làm biến chất di sản.',
        sampleAnswer: 'Not only is it acceptable, it is vital for cultural longevity. Cultures that refuse to evolve become frozen museum relics. As long as the philosophical soul and melodic essence of the tradition are honored, synthesizing folk instruments with contemporary genres creates an exciting gateway that inspires modern youth to explore original roots.',
      },
      {
        question: 'Should the state provide life-long government stipends to recognized national folk artisans?',
        questionVi: 'Nhà nước có nên cấp trợ cấp sinh hoạt suốt đời cho các nghệ nhân dân gian tiêu biểu được công nhận không?',
        contextNoteVi: 'Câu hỏi phân tích chính sách đãi ngộ nhân tài văn hóa và danh hiệu Nghệ nhân Nhân dân / Nghệ nhân Ưu tú.',
        sampleAnswer: 'Unquestionably yes. Master artisans are living national treasures who preserve priceless tacit knowledge that no textbook can replicate. Providing dignified state stipends, health insurance, and paid teaching apprenticeships frees them from poverty and ensures they can devote their remaining years to training the next generation.',
      },
      {
        question: 'How can modern technology aid in combatting counterfeit handmade traditional crafts in tourist markets?',
        questionVi: 'Công nghệ hiện đại có thể hỗ trợ chống lại hàng thủ công truyền thống giả mạo tại các điểm du lịch bằng cách nào?',
        contextNoteVi: 'Giám khảo khảo sát ứng dụng truy xuất nguồn gốc (blockchain / QR verification) để bảo vệ làng nghề.',
        sampleAnswer: 'Deploying cryptographic verification, such as blockchain-backed authenticity certificates and serialized tamper-proof QR tags, allows buyers to verify the exact artisan guild and geographical origin of each piece, protecting authentic craftspeople from cheap mass-produced industrial counterfeits.',
      },
    ],
    keyVocabulary: [
      { term: 'ontological sovereignty', ipa: '/ˌɒntəˈlɒdʒɪkl ˈsɒvrənti/', meaningVi: 'chủ quyền về bản sắc tồn tại của dân tộc' },
      { term: 'generational attrition', ipa: '/ˌdʒenəˈreɪʃənl əˈtrɪʃn/', meaningVi: 'sự hao hụt dần theo thế hệ tuổi tác' },
      { term: 'volumetric capture', ipa: '/ˌvɒljʊˈmetrɪk ˈkæptʃər/', meaningVi: 'công nghệ ghi hình không gian 3 chiều' },
    ],
  },
];

export function getVstepPart3TopicById(id: string): VstepSpeakingPart3Topic | undefined {
  return VSTEP_SPEAKING_PART3_TOPICS.find((t) => t.id === id);
}

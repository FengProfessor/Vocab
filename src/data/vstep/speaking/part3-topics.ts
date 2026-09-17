import { VstepSpeakingPart3Topic } from './types';

export const VSTEP_SPEAKING_PART3_TOPICS: VstepSpeakingPart3Topic[] = [
  {
    id: 'vstep-p3-online-learning',
    topicTitle: 'The Ascendance of Online Learning in Modern Education',
    topicVi: 'Sự phát triển mạnh mẽ của học trực tuyến trong giáo dục hiện đại',
    category: 'education',
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
        question: 'Does online learning risk eroding students\' social and interpersonal communication skills?',
        questionVi: 'Học trực tuyến có nguy cơ làm xói mòn kỹ năng giao tiếp và tương tác xã hội của học sinh không?',
        sampleAnswer: 'Undoubtedly, an exclusively virtual curriculum risks atrophying spontaneous interpersonal empathy and conflict resolution. Physical classrooms provide visceral non-verbal cues and informal camaraderie that cannot be fully replicated via digital screens; hence, a hybrid model incorporating collaborative physical workshops remains optimal.',
      },
      {
        question: 'How can educators ensure academic integrity and prevent cheating during unproctored online examinations?',
        questionVi: 'Làm thế nào để các nhà giáo dục đảm bảo tính trung thực học thuật và ngăn ngừa gian lận trong các kỳ thi trực tuyến?',
        sampleAnswer: 'Institutions must transition away from rote memorization assessments toward open-book, analytical synthesis problems. Additionally, deploying AI-driven biometric proctoring and conducting oral defense vivas ensures that grades reflect genuine individual intellectual competence.',
      },
      {
        question: 'Will traditional physical universities become completely obsolete in the next two decades?',
        questionVi: 'Liệu các trường đại học truyền thống có trở nên hoàn toàn lỗi thời trong vòng hai thập kỷ tới không?',
        sampleAnswer: 'I do not foresee outright obsolescence, but rather a profound metamorphosis. Universities will evolve from lecturing halls into collaborative research hubs, experimental laboratories, and incubation centers for high-touch human networking and entrepreneurship.',
      },
    ],
    keyVocabulary: [
      { term: 'chronological agency', ipa: '/ˌkrɒnəˈlɒdʒɪkl ˈeɪdʒənsi/', meaningVi: 'quyền tự chủ linh hoạt về thời gian' },
      { term: 'intellectual capital', ipa: '/ˌɪntəˈlektʃuəl ˈkæpɪtl/', meaningVi: 'vốn tri thức, nguồn lực trí tuệ' },
      { term: 'algorithmic adaptive learning', ipa: '/ˌælɡəˈrɪðmɪk əˈdæptɪv ˈlɜːrnɪŋ/', meaningVi: 'học tập thích ứng điều khiển bởi thuật toán' },
    ],
  },
  {
    id: 'vstep-p3-urbanization',
    topicTitle: 'Acute Societal Challenges Posed by Rapid Urbanization',
    topicVi: 'Những thách thức xã hội gay gắt từ quá trình đô thị hóa nhanh',
    category: 'society_culture',
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Negative Impacts of Rapid Urbanization',
      givenBranches: [
        'Severe vehicular gridlock and atmospheric pollution',
        'Acute crisis in affordable housing and escalating slums',
        'Overburdened public healthcare and educational facilities',
      ],
      customBranchPlaceholder: 'Erosion of traditional community solidarity and psychological isolation',
    },
    sampleSpeechB2: `Good morning, respected examiner. Today I wish to address the pressing socioeconomic and ecological strains precipitated by rapid urban expansion. While cities undeniably drive economic growth, unchecked migration from rural peripheries into major metropolitan centers has unleashed severe repercussions across environmental, housing, public infrastructure, and sociological dimensions.

First and foremost is the acute deterioration of urban transportation and environmental quality. Millions of private motorbikes and automobiles overwhelm obsolete roadway layouts, causing perpetual traffic jams. Exhaust emissions, combined with construction dust, generate alarming concentrations of PM2.5 particulate matter, triggering widespread respiratory ailments among urbanites.

Secondly, rapid influxes of migrant laborers precipitate an acute housing shortage. As speculative real estate markets inflate apartment prices beyond the reach of average wage earners, informal settlements and cramped micro-apartments proliferate. Living in substandard conditions lacking basic fire safety and sanitation directly threatens public welfare.

Thirdly, municipal social infrastructure is chronically overextended. Public hospitals consistently operate at 150 percent capacity with multiple patients sharing single beds, while state schools struggle with bloated class sizes exceeding 50 pupils per room. Public funding simply cannot keep pace with exponential population swells.

Beyond these tangible infrastructural bottlenecks, I would like to introduce a profound sociological consequence: the fracturing of communal solidarity and rising alienation. In traditional rural villages, close-knit communal bonds provided emotional safety nets. In stark contrast, hyper-competitive urban life breeds atomized individualism, loneliness, and clinical depression among youths.

In conclusion, unchecked urban migration carries grave consequences for environmental health, housing equity, public services, and mental wellbeing. Sustainable metropolitan master-planning is an urgent imperative. Thank you.`,
    sampleSpeechC1: `Honorable examiner, I welcome the opportunity to critically dissect the multifaceted ramifications of rapid, unplanned urbanization. While urban centers have historically operated as engines of technological innovation and capital accumulation, the sheer velocity of modern megacity expansion has outpaced municipal governance, generating systemic crises across ecological, spatial, infrastructural, and psychosocial domains.

The initial manifestation is severe environmental entropy. Densely packed metropolises suffer from atmospheric toxicity and paralyzing traffic gridlock. Anthropogenic emissions and asphalt heat-island effects trap hazardous fine particulate matter, precipitating long-term pulmonary crises and exacting enormous economic tolls through lost productivity.

Concurrently, unchecked demographic migration fuels acute spatial inequality and shelter precarity. As commercial speculative capital gentrifies metropolitan cores, affordable residential stock is decimated. This pushes the working-class precariat into peri-urban informal settlements or subterranean tenements, cultivating entrenched socioeconomic stratification and catastrophic fire vulnerabilities.

Furthermore, public institutional capacity faces near-total exhaustion. Essential public goods—most acutely primary healthcare and public pedagogy—buckle under exponential load. Pediatric wards operate at critical overcapacity, while educator-to-pupil ratios deteriorate, fundamentally compromising the quality of formative human development.

Crucially, I argue that the most insidious toll of hyper-urbanization is psychosocial alienation. The transition from organic communal mutualism into frantic corporate urbanism dissolves the social fabric. High-density residential towers foster physical proximity paired with acute emotional estrangement, exacerbating unprecedented epidemics of chronic loneliness and affective disorders.

To conclude, addressing the urban crisis demands transcending superficial infrastructure patches; it necessitates systemic regional decentralization and humancentric urban design.`,
    speechOutline: {
      opening: 'Contextualize the velocity of urban expansion versus municipal governance capacity.',
      bodyPoint1: 'Environmental entropy: heat-island effect, atmospheric toxicity, traffic paralysis.',
      bodyPoint2: 'Spatial inequality: affordable housing decimation, peri-urban informal settlements.',
      bodyPoint3: 'Institutional strain: public healthcare buckling, bloated pupil ratios.',
      bodyPointCustom: 'Candidate’s custom contribution: Psychosocial alienation and erosion of communal mutualism.',
      closing: 'Call for comprehensive regional decentralization and human-centric urban design.',
    },
    followUpQuestions: [
      {
        question: 'How can governments encourage young graduates to remain in rural provinces instead of migrating to metropolises?',
        questionVi: 'Làm thế nào để chính phủ khuyến khích sinh viên tốt nghiệp ở lại các tỉnh nông thôn thay vì đổ xô về đô thị?',
        sampleAnswer: 'Governments must implement targeted tax incentives, low-interest startup loans, and robust high-speed digital infrastructure in secondary cities. By decentralizing high-tech manufacturing and offering subsidized housing for rural civil servants, economic gravity can be redistributed effectively.',
      },
      {
        question: 'Is satellite city development a genuine cure for megacity congestion?',
        questionVi: 'Liệu việc xây dựng các đô thị vệ tinh có phải là giải pháp thực sự giải quyết tình trạng quá tải siêu đô thị?',
        sampleAnswer: 'Satellite townships are only viable if they incorporate autonomous commercial ecosystems and rapid rail corridors. If they merely become bedroom dormitories where residents must still commute into the metropolitan core daily, they exacerbate highway gridlock rather than curing it.',
      },
      {
        question: 'Should private automobile ownership be heavily restricted in dense central business districts?',
        questionVi: 'Có nên hạn chế nghiêm ngặt việc sở hữu ô tô cá nhân tại các khu trung tâm tài chính đông đúc không?',
        sampleAnswer: 'Unequivocally yes. Progressive cities must implement aggressive congestion tolling, curb street parking allocations, and repurpose vehicular lanes into dedicated bus rapid transit and pedestrian plazas to discourage gas-guzzling private vehicles.',
      },
    ],
    keyVocabulary: [
      { term: 'environmental entropy', ipa: '/ɪnˌvaɪrənˈmentl ˈentrəpi/', meaningVi: 'sự hỗn loạn, suy thoái môi trường' },
      { term: 'spatial inequality', ipa: '/ˈspeɪʃl ˌɪnɪˈkwɒləti/', meaningVi: 'sự bất bình đẳng về không gian sinh sống' },
      { term: 'psychosocial alienation', ipa: '/ˌsaɪkoʊˈsoʊʃl ˌeɪliəˈneɪʃn/', meaningVi: 'sự tha hóa và cô lập về mặt tâm lý xã hội' },
    ],
  },
  {
    id: 'vstep-p3-remote-work',
    topicTitle: 'The Transformation Towards Remote and Hybrid Work',
    topicVi: 'Sự chuyển dịch sang mô hình làm việc từ xa và làm việc linh hoạt',
    category: 'technology',
    prepTimeSeconds: 60,
    speakTimeSeconds: 240,
    mindmap: {
      centerIdea: 'Advantages of Remote Working',
      givenBranches: [
        'Eradication of stressful and unproductive daily commuting',
        'Enhanced work-life integration and flexible scheduling',
        'Massive reduction in corporate real-estate and administrative overhead',
      ],
      customBranchPlaceholder: 'Geographic decentralization enabling professionals to live in affordable natural locales',
    },
    sampleSpeechB2: `Good morning, examiner. Today I am delighted to discuss the profound advantages of remote and hybrid working frameworks in our post-pandemic knowledge economy. Propelled by digital collaboration software, telecommuting has evolved into a sustainable model supported by four major strengths: commute elimination, work-life autonomy, corporate operational savings, and geographic decentralization.

First and foremost, eliminating the daily commute confers immediate psychological and physiological dividends. In major metropolitan centers, white-collar employees spend between one to two hours daily navigating hazardous traffic and suffocating pollution. Reclaiming these unproductive hours allows professionals to sleep adequately, exercise, and begin their workday in a calm, energized mental state.

Secondly, remote work affords workers autonomy over their schedule and domestic lives. Rather than enduring rigid office surveillance, employees can structure their day around personal productivity peaks. They can prepare wholesome home meals, attend to child-care obligations, and run necessary errands without compromising professional output, thereby achieving true work-life balance.

Thirdly, telecommuting delivers immense fiscal savings for corporate enterprises. Maintaining lavish multi-story headquarters in commercial hubs requires millions of dollars in lease agreements, utility bills, and security services. Transitioning to hybrid setups enables firms to downsize physical offices, redirecting capital into higher employee salaries and technological innovation.

As my own contribution to this discourse, I wish to spotlight geographic decentralization. Remote work breaks the golden handcuffs that previously forced knowledge workers to reside within overpriced megacities. Today, software developers and writers can relocate to coastal towns or mountain communities with cheaper real estate and cleaner air, revitalizing provincial economies.

In conclusion, remote working represents an evolutionary advancement in organizational management, benefiting individual health, corporate balance sheets, and regional economic distribution. Thank you.`,
    sampleSpeechC1: `Distinguished examiner, I welcome the opportunity to examine the paradigm shift toward telecommuting and asynchronous labor architectures. The decentralization of white-collar employment constitutes one of the most transformative socioeconomic developments of the 21st century, anchored by four compelling rationales: the elimination of kinetic transit waste, autonomous temporal sovereignty, corporate capital rationalization, and macroeconomic demographic decentralization.

The paramount individual benefit is the eradication of commuting friction. Commuting is empirically proven to be one of the most detrimental daily activities for human psychosomatic equilibrium. By expunging the grueling gauntlet of congested highways and transit delays, professionals reclaim vital cognitive bandwidth, translating directly into heightened focus, diminished burnout, and improved biological sleep hygiene.

Concurrently, remote work restores temporal sovereignty. The archaic industrial assumption that physical presence equates to productivity has been resoundingly debunked. Asynchronous autonomy empowers knowledge workers to align deep-work sessions with their individual ultradian rhythms, while effortlessly harmonizing domestic duties, thereby redefining holistic work-life integration.

From an organizational standpoint, telework catalyzes decisive fiscal optimization. Downsizing bloated commercial real estate holdings liberates substantial capital reserves previously tied up in exorbitant urban leases, enabling strategic reinvestment in cybersecurity and cross-border talent acquisition.

Crucially, I contend that the most profound structural impact is macroeconomic geographic leveling. Historically, talent was coerced into agglomerating within hyper-expensive, suffocating metropolises. Telecommuting uncouples geographic residence from economic livelihood, sparking an exodus toward provincial locales, curbing urban real-estate bubbles, and rejuvenating peripheral economies.

To encapsulate, remote work is not an ephemeral anomaly; it is an irrevocable emancipation of human productivity from archaic geographic constraints.`,
    speechOutline: {
      opening: 'Introduce telecommuting as an epochal labor paradigm shift with 4 core pillars.',
      bodyPoint1: 'Eradication of kinetic transit waste: reclaiming psychosomatic bandwidth.',
      bodyPoint2: 'Temporal sovereignty: aligning deep work with individual ultradian rhythms.',
      bodyPoint3: 'Corporate fiscal rationalization: shedding bloated commercial real-estate overhead.',
      bodyPointCustom: 'Candidate’s custom contribution: Macroeconomic geographic leveling and provincial rejuvenation.',
      closing: 'Affirm remote work as an irrevocable emancipation from obsolete industrial constraints.',
    },
    followUpQuestions: [
      {
        question: 'Does remote work hinder organizational innovation and serendipitous creative collaboration?',
        questionVi: 'Liệu làm việc từ xa có cản trở sự sáng tạo đổi mới và tinh thần gắn kết tập thể của tổ chức không?',
        sampleAnswer: 'There is legitimate empirical risk that spontaneous hallway brainstorming atrophies in purely isolated environments. To counteract this, forward-looking enterprises should adopt structured hybrid models—reserving digital channels for deep execution while convening periodic in-person hackathons and strategic summits for creative ideation.',
      },
      {
        question: 'How can managers effectively evaluate employee performance without physical office oversight?',
        questionVi: 'Làm thế nào để nhà quản lý đánh giá hiệu quả làm việc của nhân viên khi không có sự giám sát trực tiếp tại văn phòng?',
        sampleAnswer: 'Management must pivot from archaic input-based metrics—such as hours seated at a desk—toward objective, outcome-based Key Performance Indicators (KPIs) and deliverable milestones, using transparent project management platforms.',
      },
      {
        question: 'Could the rise of remote work lead to increased isolation and blurred boundaries between work and personal life?',
        questionVi: 'Sự gia tăng của làm việc từ xa có dẫn đến tình trạng cô lập và ranh giới bị xóa nhòa giữa công việc và đời sống cá nhân không?',
        sampleAnswer: 'Yes, when the home becomes the workplace, professionals frequently suffer from the "always-on" syndrome. Organizations must codify a legal "right to disconnect" outside standard working hours, and individuals must establish rigorous spatial boundaries within their living spaces.',
      },
    ],
    keyVocabulary: [
      { term: 'temporal sovereignty', ipa: '/ˈtempərəl ˈsɒvrənti/', meaningVi: 'quyền làm chủ tối cao về thời gian cá nhân' },
      { term: 'kinetic transit waste', ipa: '/kɪˈnetɪk ˈtrænzɪt weɪst/', meaningVi: 'sự lãng phí năng lượng vào việc di chuyển đi lại' },
      { term: 'macroeconomic leveling', ipa: '/ˌmækroʊˌiːkəˈnɒmɪk ˈlevəlɪŋ/', meaningVi: 'sự cân bằng, san phẳng cơ hội kinh tế vĩ mô' },
    ],
  },
];

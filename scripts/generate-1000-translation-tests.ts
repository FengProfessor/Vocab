import fs from 'fs';
import path from 'path';

export interface TranslationBenchmarkItem {
  id: number;
  category: 'business_idioms' | 'daily_slang' | 'complex_syntax' | 'toeic_academic' | 'polysemy_context';
  categoryLabel: string;
  level: 'A2' | 'B1' | 'B2' | 'C1';
  english: string;
  expectedMeaningVi: string;
  keyNuance: string;
  badTranslationTrap: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. NHÓM THÀNH NGỮ & CÔNG SỞ (BUSINESS & CORPORATE IDIOMS) - 200 CÂU
// ─────────────────────────────────────────────────────────────────────────────
const BUSINESS_PATTERNS = [
  {
    template: (p: string, o: string) => `Let's take ${p} offline and discuss ${o} during our one-on-one.`,
    expected: 'trao đổi riêng về việc này sau',
    nuance: 'take offline = trao đổi riêng sau cuộc họp',
    trap: 'mang ra ngoại tuyến / ngắt kết nối',
    vars: [
      ['this pricing issue', 'the revised budget'],
      ['this technical dispute', 'the architecture draft'],
      ['this personnel conflict', 'the re-allocation plan'],
      ['this contract clause', 'the legal implications'],
      ['this rollout timeline', 'the feature milestones'],
    ],
  },
  {
    template: (p: string, o: string) => `We should park ${p} for now and focus our resources on ${o}.`,
    expected: 'tạm gác lại để bàn sau',
    nuance: 'park = tạm hoãn, cất sang một bên',
    trap: 'đỗ xe / bãi đỗ xe',
    vars: [
      ['this ambitious proposal', 'core product stability'],
      ['this marketing redesign', 'the upcoming product launch'],
      ['this feature request', 'the critical security bug fix'],
      ['this secondary idea', 'customer onboarding bottlenecks'],
      ['the expansion plan', 'retaining our existing user base'],
    ],
  },
  {
    template: (p: string, o: string) => `The committee agreed to circle back to ${p} once ${o} is verified.`,
    expected: 'quay lại trao đổi về vấn đề này sau',
    nuance: 'circle back = quay lại thảo luận sau',
    trap: 'vòng tròn quay lại / đi quanh vòng tròn',
    vars: [
      ['the third-quarter projection', 'the audit report'],
      ['the vendor partnership proposal', 'the compliance checklist'],
      ['the software license agreement', 'the legal clearance'],
      ['the proposed salary adjustments', 'the quarterly revenue figures'],
      ['the infrastructure upgrade', 'server load testing'],
    ],
  },
  {
    template: (p: string, o: string) => `The management decided to table ${p} until ${o}.`,
    expected: 'tạm gác cuộc thảo luận lại',
    nuance: 'table = tạm gác lại, hoãn thảo luận (chuẩn US)',
    trap: 'đặt lên bàn / thảo luận cái bàn',
    vars: [
      ['this acquisition proposal', 'the next annual general meeting'],
      ['the compensation review', 'market conditions stabilize'],
      ['this controversial policy', 'we gather more empirical data'],
      ['the office relocation debate', 'the end of the fiscal year'],
      ['the reorganization plan', 'the board delivers its verdict'],
    ],
  },
  {
    template: (p: string, o: string) => `I will touch base with ${p} to ensure ${o}.`,
    expected: 'liên hệ nhanh để cập nhật tình hình',
    nuance: 'touch base = kết nối/liên lạc nhanh',
    trap: 'chạm vào căn cứ / sờ vào điểm tựa',
    vars: [
      ['the client relations manager', 'the deliverables are aligned with expectations'],
      ['our logistics partners', 'the international shipment clears customs on time'],
      ['the QA engineering team', 'all regression tests pass before release'],
      ['our key stakeholders', 'everyone supports the revised schedule'],
      ['the prospective investors', 'the due diligence dossier is received'],
    ],
  },
  {
    template: (p: string, o: string) => `Please keep ${p} in the loop regarding ${o}.`,
    expected: 'cập nhật thông tin liên tục',
    nuance: 'in the loop = nằm trong luồng thông tin',
    trap: 'giữ trong vòng lặp / trong cái thòng lọng',
    vars: [
      ['the executive director', 'any substantial revisions to the project scope'],
      ['the entire product team', 'customer feedback from the pilot phase'],
      ['our legal counsel', 'any disputes arising during the contract talks'],
      ['the head of operations', 'inventory depletion rates at our warehouses'],
      ['all regional sales heads', 'promotional discount authorizations'],
    ],
  },
  {
    template: (p: string, o: string) => `Before the meeting concludes, let's verify we are all on the same page regarding ${p} and ${o}.`,
    expected: 'thống nhất quan điểm, cùng hiểu nhau',
    nuance: 'on the same page = cùng chung nhận thức, thống nhất',
    trap: 'ở cùng một trang giấy / cùng số trang',
    vars: [
      ['the deployment checklist', 'the rollback protocols'],
      ['the quarterly target numbers', 'individual KPI allocation'],
      ['the customer support SLA', 'escalation pathways'],
      ['the hiring budget limits', 'interview evaluation criteria'],
      ['the brand identity revamp', 'social media guidelines'],
    ],
  },
  {
    template: (p: string, o: string) => `It has been an exhausting sprint, so let's call it a day and resume ${p} on ${o}.`,
    expected: 'kết thúc ngày làm việc, nghỉ ngơi',
    nuance: 'call it a day = dừng làm việc nghỉ ngơi',
    trap: 'gọi nó là một ngày / coi đó là một ngày',
    vars: [
      ['our brainstorming session', 'Monday morning'],
      ['the performance reviews', 'Wednesday afternoon'],
      ['this contract negotiation', 'tomorrow at 9 AM'],
      ['debugging this tricky memory leak', 'the next workday'],
      ['drafting the annual report', 'Friday before noon'],
    ],
  },
  {
    template: (p: string, o: string) => `The launch schedule is still up in the air due to ${p} and ${o}.`,
    expected: 'chưa được quyết định, còn bỏ ngỏ',
    nuance: 'up in the air = lơ lửng, chưa ngã ngũ',
    trap: 'ở trên không khí / bay lơ lửng trên trời',
    vars: [
      ['unexpected regulatory hurdles', 'licensing delays'],
      ['unresolved software security vulnerabilities', 'server capacity limits'],
      ['pending supplier negotiations', 'currency exchange fluctuations'],
      ['conflicting feedback from beta testers', 'budget re-allocations'],
      ['critical supply chain bottlenecks', 'raw material shortages'],
    ],
  },
  {
    template: (p: string, o: string) => `Remember that everything disclosed in this briefing is strictly off the record, especially ${p} and ${o}.`,
    expected: 'giữ kín, không ghi biên bản chính thức',
    nuance: 'off the record = nói riêng tư, không công khai trích dẫn',
    trap: 'ngoài hồ sơ / không có đĩa hát',
    vars: [
      ['the potential merger rumors', 'the projected staff reductions'],
      ['the internal audit findings', 'the proprietary algorithm adjustments'],
      ['the preliminary revenue estimations', 'the executive leadership transition'],
      ['the confidential customer settlement', 'the security breach details'],
      ['the unannounced partnership talks', 'the patent dispute strategies'],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 2. NHÓM KHẨU NGỮ & ĐỜI SỐNG (DAILY SLANG & CONVERSATIONAL) - 200 CÂU
// ─────────────────────────────────────────────────────────────────────────────
const DAILY_PATTERNS = [
  {
    template: (p: string, o: string) => `I am really into ${p} lately, especially after learning about ${o}.`,
    expected: 'rất mê, rất thích, say mê',
    nuance: 'be into = say mê, có hứng thú sâu sắc',
    trap: 'tôi đang vào trong / tham gia vào',
    vars: [
      ['specialty pour-over coffee', 'single-origin Ethiopian roasting techniques'],
      ['analog film photography', 'darkroom color chemistry development'],
      ['indoor bouldering and rock climbing', 'core strength training routines'],
      ['mechanical keyboard customization', 'hand-lubricated linear switches'],
      ['learning conversational Spanish', 'Latin American cinema and folk music'],
    ],
  },
  {
    template: (p: string, o: string) => `Don't rush yourself; just take your time when ${p} or ${o}.`,
    expected: 'cứ thong thả, từ từ',
    nuance: 'take your time = không cần vội vàng',
    trap: 'lấy thời gian của bạn / cầm lấy giờ',
    vars: [
      ['evaluating the job offers', 'comparing the compensation benefits'],
      ['filling out the visa application', 'gathering official stamp certificates'],
      ['inspecting the rented apartment', 'reviewing the lease clauses'],
      ['choosing your college major', 'speaking with academic career advisors'],
      ['writing your personal statement', 'polishing your resume portfolio'],
    ],
  },
  {
    template: (p: string, o: string) => `I completely forgot about our dinner date; it totally slipped my mind because of ${p} and ${o}.`,
    expected: 'quên khuấy đi mất',
    nuance: 'slipped my mind = quên bẵng đi mất',
    trap: 'trượt khỏi tâm trí / rơi não',
    vars: [
      ['the sudden deadline crunch', 'back-to-back emergency client calls'],
      ['my migraine headache', 'the chaotic office relocation'],
      ['the heavy traffic jam on Highway 1', 'my smartphone battery dying'],
      ['family medical appointments', 'urgent tax return filing duties'],
      ['a sudden server outage at work', 'endless troubleshooting sessions'],
    ],
  },
  {
    template: (p: string, o: string) => `Whenever you feel under the weather, remember to ${p} and ${o}.`,
    expected: 'cảm thấy trong người khó ở, hơi mệt',
    nuance: 'under the weather = ốm nhẹ, mệt mỏi',
    trap: 'dưới thời tiết / ở dưới khí hậu',
    vars: [
      ['drink plenty of warm herbal tea', 'get at least eight hours of sleep'],
      ['take vitamin C supplements', 'stay away from cold air-conditioned rooms'],
      ['eat hot chicken noodle soup', 'take a warm relaxing shower'],
      ['rest your voice completely', 'avoid strenuous physical workouts'],
      ['stay well hydrated with electrolytes', 'consult a doctor if fever persists'],
    ],
  },
  {
    template: (p: string, o: string) => `A: "Who will pay for the feast?" — B: "Put your wallet away; it is on me because of ${p} and ${o}!"`,
    expected: 'tôi bao, tôi đãi',
    nuance: 'it is on me = chầu này tôi thanh toán',
    trap: 'nó ở trên người tôi / đè lên tôi',
    vars: [
      ['my recent job promotion', 'our long-awaited reunion after graduation'],
      ['winning the annual sales contest', 'closing our first enterprise account'],
      ['my birthday celebration today', 'all the support you gave me this year'],
      ['passing my master defense exam', 'surviving this tough examination season'],
      ['signing my dream book deal', 'your unwavering friendship over the years'],
    ],
  },
  {
    template: (p: string, o: string) => `You hit the nail on the head when you remarked that ${p} causes ${o}.`,
    expected: 'nói trúng phóc, chỉ đúng mấu chốt',
    nuance: 'hit the nail on the head = nói trúng tim đen',
    trap: 'đóng đinh vào đầu / gõ cây đinh',
    vars: [
      ['poor internal communication', 'widespread employee disengagement'],
      ['unrealistic project milestones', 'chronic developer burnout across squads'],
      ['a lack of user feedback loops', 'stagnant mobile app retention rates'],
      ['overly complex pricing structures', 'customer drop-offs at checkout'],
      ['inadequate onboarding documentation', 'prolonged junior developer ramp-up time'],
    ],
  },
  {
    template: (p: string, o: string) => `Buying that luxury imported sedan cost him an arm and a leg, forcing him to ${p} and ${o}.`,
    expected: 'cực kỳ đắt đỏ, tốn kém tiền bạc',
    nuance: 'cost an arm and a leg = tốn cả gia tài',
    trap: 'tốn một cánh tay và cái chân',
    vars: [
      ['cut down on weekend restaurant outings', 'cancel his European vacation'],
      ['take on an additional freelance gig', 'cook meals strictly at home'],
      ['refinance his personal bank loans', 'sell off part of his stock portfolio'],
      ['postpone his house renovation plans', 'switch to public transit commutes'],
      ['work overtime night shifts', 'tighten his family entertainment budget'],
    ],
  },
  {
    template: (p: string, o: string) => `She only visits her hometown once in a blue moon because ${p} and ${o}.`,
    expected: 'năm thì mười họa, rất hiếm khi',
    nuance: 'once in a blue moon = rất hiếm khi xảy ra',
    trap: 'một lần dưới trăng xanh',
    vars: [
      ['plane tickets are outrageously expensive', 'her demanding residency schedule'],
      ['she lives across the Pacific Ocean', 'visa renewals take many months'],
      ['her grueling consulting shifts leave no leisure', 'flight connections are scarce'],
      ['she manages three overseas branch offices', 'holidays are booked with conferences'],
      ['her remote research expedition requires constant presence', 'travel logistics are tough'],
    ],
  },
  {
    template: (p: string, o: string) => `After the prototype melted during testing, the engineering squad was back to the drawing board to fix ${p} and ${o}.`,
    expected: 'làm lại từ đầu, bắt đầu lại từ vạch xuất phát',
    nuance: 'back to the drawing board = làm lại từ đầu',
    trap: 'quay lại bảng vẽ / trở về cái bàn vẽ',
    vars: [
      ['the overheating lithium battery pack', 'the unshielded wiring harness'],
      ['the fragile plastic casing', 'the faulty heat dissipation vents'],
      ['the unstable firmware logic', 'intermittent sensor calibration errors'],
      ['the high electric resistance', 'the inefficient power converter module'],
      ['the inadequate cooling system', 'excessive acoustic vibration levels'],
    ],
  },
  {
    template: (p: string, o: string) => `A: "Can I try some of your homemade cookies?" — B: "Sure, help yourself to ${p} or ${o}!"`,
    expected: 'cứ tự nhiên lấy',
    nuance: 'help yourself = xin mời tự nhiên dùng',
    trap: 'hãy tự giúp chính mình',
    vars: [
      ['the chocolate fudge brownies', 'the freshly brewed iced jasmine tea'],
      ['the cinnamon oatmeal scones', 'the organic whole-milk yogurt'],
      ['the pistachio almond cookies', 'the cold brew coffee in the fridge'],
      ['the savory cheese crackers', 'the hot honey chamomile infusion'],
      ['the raspberry fruit tarts', 'the sparkling lemonade on the counter'],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. NHÓM NGỮ PHÁP PHỨC TẠP & ĐẢO NGỮ (COMPLEX SYNTAX & INVERSIONS) - 200 CÂU
// ─────────────────────────────────────────────────────────────────────────────
const SYNTAX_PATTERNS = [
  {
    template: (p: string, o: string) => `Hardly had ${p} arrived at the auditorium when ${o} broke out.`,
    expected: 'vừa mới... thì ngay lập tức...',
    nuance: 'Hardly had S + V3 when... = vừa mới... thì...',
    trap: 'hiếm khi đã đến / khó khăn khi đến',
    vars: [
      ['the keynote speaker', 'tumultuous applause across the grand hall'],
      ['the foreign diplomat', 'intense questioning from international journalists'],
      ['the orchestra conductor', 'thunderous cheers from classical music enthusiasts'],
      ['the championship football team', 'chants and fireworks from passionate supporters'],
      ['the distinguished guest of honor', 'a sudden flurry of camera camera flashes'],
    ],
  },
  {
    template: (p: string, o: string) => `Were it not for ${p}, our organization could never have achieved ${o}.`,
    expected: 'nếu không nhờ có...',
    nuance: 'Were it not for = Nếu không nhờ vào (đảo ngữ câu điều kiện loại 2/3)',
    trap: 'nếu nó không ở cho / có phải nó không vì',
    vars: [
      ['your tireless technical guidance', 'such rapid market expansion this quarter'],
      ['the generous alumni endowment fund', 'the completion of the state-of-the-art laboratory'],
      ['the unflagging dedication of our volunteers', 'record-breaking charity relief distribution'],
      ['our early venture capital backers', 'surviving the severe economic downturn'],
      ['the prompt intervention of medical staff', 'a complete recovery for all injured passengers'],
    ],
  },
  {
    template: (p: string, o: string) => `Had we known that ${p}, we would have taken measures to prevent ${o}.`,
    expected: 'giá như chúng tôi biết rằng...',
    nuance: 'Had we known = Nếu chúng tôi biết (đảo ngữ điều kiện loại 3)',
    trap: 'đã chúng tôi biết rằng',
    vars: [
      ['the server infrastructure lacked redundancy', 'the catastrophic four-hour outage'],
      ['the supplier was facing bankruptcy', 'the sudden disruption to our retail supply chain'],
      ['counterfeit components were in circulation', 'the widespread customer product recalls'],
      ['the tropical storm would make landfall early', 'costly damage to the harbor warehouses'],
      ['the competitor was planning an aggressive price cut', 'our sudden loss of retail market share'],
    ],
  },
  {
    template: (p: string, o: string) => `Not only did ${p} exceed all quarterly benchmarks, but it also ${o}.`,
    expected: 'không những... mà còn...',
    nuance: 'Not only did S + V but also... = Đảo ngữ không những mà còn',
    trap: 'không chỉ đã làm',
    vars: [
      ['the newly launched subscription tier', 'boosted average customer lifetime value by forty percent'],
      ['the redesigned customer checkout flow', 'slashed cart abandonment rates to historic lows'],
      ['the bilingual customer support squad', 'elevated our international customer satisfaction rating'],
      ['the proprietary AI search algorithm', 'reduced server computational costs substantially'],
      ['the automated email engagement campaign', 'revived thousands of inactive registered users'],
    ],
  },
  {
    template: (p: string, o: string) => `The more thoroughly you examine ${p}, the more apparent ${o} becomes.`,
    expected: 'càng... thì lại càng...',
    nuance: 'The more... the more... = Càng... càng...',
    trap: 'nhiều hơn bạn kiểm tra nhiều hơn xuất hiện',
    vars: [
      ['the quarterly balance sheet discrepancies', 'the necessity for an independent forensic audit'],
      ['the customer churn telemetry data', 'the flaw in our tier-one onboarding experience'],
      ['the historical climate temperature records', 'the undeniable impact of industrial emissions'],
      ['the source code repository changes', 'the origin of the intermittent memory leak'],
      ['the competitor marketing campaigns', 'their aggressive push into Southeast Asian markets'],
    ],
  },
  {
    template: (p: string, o: string) => `Under no circumstances should ${p} be disclosed to ${o} without prior authorization.`,
    expected: 'trong bất kỳ hoàn cảnh nào cũng tuyệt đối không được...',
    nuance: 'Under no circumstances should = Tuyệt đối không được',
    trap: 'dưới không hoàn cảnh nào',
    vars: [
      ['these internal source code repositories', 'unauthorized third-party software auditors'],
      ['unencrypted customer biometric database backups', 'external cloud vendor support engineers'],
      ['confidential employee compensation spreadsheets', 'personnel outside the executive human resources board'],
      ['pre-release benchmark test evaluations', 'press outlets or social media influencers'],
      ['proprietary semiconductor patent blueprints', 'foreign commercial manufacturing partners'],
    ],
  },
  {
    template: (p: string, o: string) => `Only after ${p} was the management committee willing to approve ${o}.`,
    expected: 'chỉ sau khi... thì... mới...',
    nuance: 'Only after + S + V + đảo ngữ = Chỉ sau khi',
    trap: 'chỉ sau khi đã là',
    vars: [
      ['the thorough penetration test was completed', 'the national deployment of the banking app'],
      ['exhaustive legal compliance reviews were finalized', 'the multimillion-dollar corporate merger agreement'],
      ['unbiased clinical safety trials were published', 'the prescription drug for nationwide pharmacy distribution'],
      ['all union representatives ratified the contract', 'the updated employee shift and overtime schedule'],
      ['structural stress tests satisfied building codes', 'the grand opening of the municipal suspension bridge'],
    ],
  },
  {
    template: (p: string, o: string) => `Scarcely had ${p} initiated the database migration when ${o} caused an abrupt halt.`,
    expected: 'vừa mới... thì ngay lập tức xảy ra...',
    nuance: 'Scarcely had S + V3 when = Vừa mới thì',
    trap: 'khan hiếm đã bắt đầu',
    vars: [
      ['the senior DevOps engineer', 'an unexpected network packet timeout on the primary database replica'],
      ['the cloud operations squad', 'a sudden power fluctuation at the regional data center'],
      ['the security administration system', 'an automated firewall alert triggered by unusual traffic'],
      ['the automated deployment pipeline', 'a corrupted checksum verification error in the build artifact'],
      ['the system telemetry daemon', 'a critical disk storage saturation threshold warning'],
    ],
  },
  {
    template: (p: string, o: string) => `No sooner had ${p} finalized the investment term sheet than ${o} demanded revisions.`,
    expected: 'vừa mới xong thì đã...',
    nuance: 'No sooner had S + V3 than = Vừa mới... thì đã',
    trap: 'không sớm hơn đã hoàn tất',
    vars: [
      ['the venture capital associates', 'the startup founder legal team'],
      ['the commercial banking consortium', 'the municipal infrastructure committee'],
      ['the angel investor network', 'the lead technical architect'],
      ['the private equity partners', 'the institutional pension fund advisers'],
      ['the joint venture representatives', 'the state regulatory authority'],
    ],
  },
  {
    template: (p: string, o: string) => `So impressive was ${p} that ${o} agreed to invest immediately.`,
    expected: 'quá đỗi ấn tượng đến mức mà...',
    nuance: 'So + Adj + was S + that = Quá... đến nỗi mà (đảo ngữ nhấn mạnh)',
    trap: 'rất ấn tượng là cái đó',
    vars: [
      ['the live demonstration of the language translation engine', 'the foreign investment syndicate'],
      ['the prototype battery energy density benchmark', 'the electric vehicle manufacturer consortium'],
      ['the quarterly financial earnings turnaround', 'the notoriously conservative Wall Street analyst panel'],
      ['the keynote pitch delivered by the young entrepreneur', 'the prominent Silicon Valley venture syndicate'],
      ['the breakthrough efficacy demonstrated in preclinical trials', 'the international pharmaceutical conglomerate'],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 4. NHÓM ĐỀ THI TOEIC & CHUYÊN NGÀNH (TOEIC & ACADEMIC) - 200 CÂU
// ─────────────────────────────────────────────────────────────────────────────
const TOEIC_PATTERNS = [
  {
    template: (p: string, o: string) => `In compliance with ${p}, all employees are mandated to ${o}.`,
    expected: 'tuân thủ theo quy định / tiêu chuẩn',
    nuance: 'in compliance with = tuân thủ theo',
    trap: 'trong sự tuân theo',
    vars: [
      ['international fire safety regulations', 'participate in quarterly evacuation drills'],
      ['strict data privacy legislation', 'complete annual cybersecurity awareness training'],
      ['federal environmental protection guidelines', 'dispose of chemical waste in certified industrial containers'],
      ['revised occupational health protocols', 'wear certified personal protective equipment in testing zones'],
      ['corporate financial transparency rules', 'disclose all outside advisory and consulting relationships'],
    ],
  },
  {
    template: (p: string, o: string) => `Due to ${p}, the delivery of your consignment has been rescheduled to ${o}.`,
    expected: 'do nguyên nhân... nên việc giao hàng được dời sang...',
    nuance: 'due to = do, bởi vì; consignment = lô hàng',
    trap: 'đến hạn của cái gì',
    vars: [
      ['unforeseen severe weather conditions along the maritime route', 'next Tuesday afternoon'],
      ['unprecedented congestion at the regional container terminal', 'the following business day'],
      ['temporary customs clearance system maintenance', 'Friday morning at 10 AM'],
      ['an acute shortage of certified heavy-vehicle operators', 'early next week'],
      ['a sudden technical malfunction aboard the cargo freighter', 'the end of this calendar month'],
    ],
  },
  {
    template: (p: string, o: string) => `All travel expense reimbursement requests must be accompanied by ${p} and submitted before ${o}.`,
    expected: 'phải đi kèm với hóa đơn chứng từ gốc',
    nuance: 'accompanied by original receipts = đính kèm hóa đơn gốc',
    trap: 'phải được đi cùng bởi',
    vars: [
      ['original itemized commercial receipts', 'the final business day of the current fiscal month'],
      ['official boarding passes and lodging invoices', 'the upcoming quarterly budgetary review deadline'],
      ['approved electronic purchase orders', 'Friday afternoon at 5 PM sharp'],
      ['manager-signed travel authorization vouchers', 'the finance department monthly audit cutoff'],
      ['validated ground transportation slips', 'two weeks following the conclusion of the conference'],
    ],
  },
  {
    template: (p: string, o: string) => `The human resources department offers a highly competitive compensation package in order to ${p} and ${o}.`,
    expected: 'gói đãi ngộ mang tính cạnh tranh cao',
    nuance: 'competitive compensation package = chế độ đãi ngộ cạnh tranh',
    trap: 'gói bồi thường chiến đấu',
    vars: [
      ['attract world-class software engineering talent', 'reduce annual voluntary turnover rates'],
      ['incentivize high-performing sales directors', 'expand regional market share across APAC'],
      ['recruit seasoned bilingual product managers', 'foster long-term executive leadership stability'],
      ['secure distinguished machine learning researchers', 'accelerate our proprietary AI model roadmap'],
      ['retain critical biomedical laboratory specialists', 'ensure regulatory submission schedules remain intact'],
    ],
  },
  {
    template: (p: string, o: string) => `Submissions received after ${p} are subject to ${o} without prior notice.`,
    expected: 'phải chịu / tuân theo quy định',
    nuance: 'subject to = phải chịu sự thẩm tra, phụ thuộc vào',
    trap: 'là chủ ngữ của / chủ đề của',
    vars: [
      ['the midnight submission deadline', 'immediate disqualification from the scholarship evaluation'],
      ['the specified tender submission cutoff', 'a mandatory ten percent financial penalty deduction'],
      ['the registration closing date', 'automatic cancellation and allocation to the waiting list'],
      ['the scheduled vendor bidding deadline', 'unconditional return without evaluation by the committee'],
      ['the public consultation window', 'exclusion from the official town hall environmental report'],
    ],
  },
  {
    template: (p: string, o: string) => `We are deeply committed to meeting ${p} while maintaining ${o}.`,
    expected: 'cam kết đáp ứng các yêu cầu khắt khe',
    nuance: 'committed to meeting = cam kết đáp ứng',
    trap: 'cam kết gặp gỡ',
    vars: [
      ['all rigorous regulatory requirements', 'impeccable manufacturing quality standards'],
      ['the demanding delivery schedules of our clients', 'the highest workplace occupational safety standards'],
      ['dynamic consumer expectations across the globe', 'competitive retail pricing margins'],
      ['ambitious environmental sustainability benchmarks', 'robust long-term shareholder dividend returns'],
      ['strict international clinical drug trials criteria', 'patient safety and ethical transparency'],
    ],
  },
  {
    template: (p: string, o: string) => `Please find attached ${p} for your review, and feel free to reach out if ${o}.`,
    expected: 'xin vui lòng xem tệp đính kèm',
    nuance: 'please find attached = xin vui lòng xem tệp đính kèm',
    trap: 'làm ơn tìm thấy đính kèm',
    vars: [
      ['the finalized master service contract agreement', 'you require any clarifying revisions to section four'],
      ['the preliminary engineering design blueprint', 'your municipal planning board has questions'],
      ['the quarterly consolidated earnings report', 'you need access to raw spreadsheet telemetry'],
      ['the detailed user acceptance test protocol', 'your technical leads uncover blocking defects'],
      ['the vendor evaluation scoring matrix', 'additional stakeholder endorsements are required'],
    ],
  },
  {
    template: (p: string, o: string) => `The technician reported that ${p} is completely out of order and must be ${o}.`,
    expected: 'bị hỏng hóc, ngừng hoạt động',
    nuance: 'out of order = bị hỏng (thiết bị máy móc)',
    trap: 'hết trật tự / không theo thứ tự',
    vars: [
      ['the primary high-speed office photocopier', 'replaced under our existing warranty agreement'],
      ['the freight elevator servicing the third-floor warehouse', 'serviced by specialized hydraulic engineers'],
      ['the backup diesel emergency generator', 'inspected by municipal electrical safety inspectors'],
      ['the automated industrial packing conveyor system', 'shut down immediately for emergency recalibration'],
      ['the central heating and air conditioning chiller', 'repaired before the start of the summer heatwave'],
    ],
  },
  {
    template: (p: string, o: string) => `Who is currently in charge of ${p} during ${o}?`,
    expected: 'chịu trách nhiệm, phụ trách',
    nuance: 'in charge of = phụ trách, chịu trách nhiệm',
    trap: 'đang sạc điện cho / nạp điện',
    vars: [
      ['organizing the regional medical technology conference', 'the executive director’s sabbatical leave'],
      ['coordinating crisis communications with national media outlets', 'the ongoing product recall inquiry'],
      ['managing high-priority enterprise customer accounts', 'the holiday seasonal staffing transition'],
      ['overseeing chemical safety protocols in the central laboratory', 'the annual regulatory audit inspection'],
      ['approving budget variances exceeding fifty thousand dollars', 'the quarterly financial closing period'],
    ],
  },
  {
    template: (p: string, o: string) => `The keynote speaker is running behind schedule because ${p} caused ${o}.`,
    expected: 'bị chậm hơn so với lịch trình',
    nuance: 'running behind schedule = bị trễ giờ so với kế hoạch',
    trap: 'chạy phía sau thời gian biểu',
    vars: [
      ['a sudden ground stop at O’Hare International Airport', 'a two-hour connection delay'],
      ['unusually heavy morning commuter gridlock along the interstate', 'her missing the scheduled opening remarks'],
      ['a mechanical malfunction on the high-speed regional rail train', 'an unexpected detour through rural junctions'],
      ['prolonged passport verification checks at border control', 'the symposium committee postponing the first session'],
      ['a flash flood warning closing primary municipal roadways', 'the entire executive delegation arriving late'],
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. NHÓM TỪ ĐA NGHĨA & NGỮ CẢNH ĐẶC BIỆT (POLYSEMY & CONTEXT TRIGGERS) - 200 CÂU
// ─────────────────────────────────────────────────────────────────────────────
const POLYSEMY_PATTERNS = [
  {
    template: (p: string, o: string) => `The mayor pledged to address ${p} before ${o}.`,
    expected: 'giải quyết, xử lý (vấn đề)',
    nuance: 'address = giải quyết vấn đề (không phải ghi địa chỉ nhà)',
    trap: 'ghi địa chỉ / gửi thư đến',
    vars: [
      ['the chronic public transit congestion across downtown', 'the upcoming municipal elections'],
      ['the rising homelessness crisis in suburban districts', 'winter temperatures arrive next month'],
      ['the deteriorating public school infrastructure', 'allocating the new infrastructure bond proceeds'],
      ['the severe industrial water pollution concerns along the river', 'signing the regional environmental pact'],
      ['the growing shortage of affordable healthcare clinics', 'finalizing the city annual operating budget'],
    ],
  },
  {
    template: (p: string, o: string) => `The law firm was hired to execute ${p} in accordance with ${o}.`,
    expected: 'thực thi, ký kết, hoàn tất (hợp đồng/thủ tục)',
    nuance: 'execute = ký kết/thực thi (không phải tử hình/hành quyết)',
    trap: 'hành quyết / tử hình hợp đồng',
    vars: [
      ['the commercial real estate purchase agreement', 'the estate probate court rulings'],
      ['the international patent cross-licensing pact', 'statutory antitrust trade regulations'],
      ['the corporate restructuring and asset liquidation plan', 'creditor committee stipulations'],
      ['the cross-border technology transfer agreement', 'export control compliance standards'],
      ['the bilateral joint venture shareholder pact', 'international arbitration forum rules'],
    ],
  },
  {
    template: (p: string, o: string) => `The court imposed a heavy fine on ${p} for ${o}.`,
    expected: 'tiền phạt, xử phạt tài chính',
    nuance: 'fine = tiền phạt (không phải ổn, khỏe, tốt đẹp)',
    trap: 'khoản tiền tốt đẹp / tiền khỏe khoắn',
    vars: [
      ['the chemical manufacturing conglomerate', 'repeatedly discharging untreated toxic effluent into the lake'],
      ['the multinational commercial bank', 'failing to maintain adequate anti-money laundering verification controls'],
      ['the pharmaceutical advertising agency', 'disseminating misleading health benefit claims to consumers'],
      ['the residential construction contractor', 'flagrantly violating municipal worker safety scaffolding codes'],
      ['the telecom network operator', 'unlawfully sharing customer location metadata with third-party brokers'],
    ],
  },
  {
    template: (p: string, o: string) => `He decided to bank on ${p} to finance ${o}.`,
    expected: 'trông cậy, đặt niềm tin và kỳ vọng vào',
    nuance: 'bank on = trông cậy, tin chắc vào (không phải gửi tiền ngân hàng)',
    trap: 'ngân hàng trên / gửi tiền vào cái gì',
    vars: [
      ['an expected annual performance bonus from his employer', 'his daughter’s Ivy League university tuition'],
      ['substantial revenue from his latest mobile app release', 'opening his own boutique design studio downtown'],
      ['a favorable commercial settlement in the patent lawsuit', 'expanding factory assembly operations overseas'],
      ['the rapid appreciation of his downtown real estate holdings', 'securing early retirement in the countryside'],
      ['federal renewable energy subsidy grants', 'constructing the utility-scale solar farm'],
    ],
  },
  {
    template: (p: string, o: string) => `The government took decisive action to balance the budget, but ${p} led to ${o}.`,
    expected: 'cân bằng cán cân ngân sách',
    nuance: 'balance the budget = cân đối thu chi tài chính',
    trap: 'giữ thăng bằng cái túi tiền',
    vars: [
      ['severe spending cutbacks on regional healthcare programs', 'widespread public protests across the province'],
      ['sharp tax increases on small family-owned businesses', 'an unexpected slowdown in retail economic activity'],
      ['deferring maintenance on critical highway infrastructure', 'costly emergency repair bills three years later'],
      ['reducing funding for scientific research institutions', 'a notable brain drain of top domestic scholars'],
      ['canceling subsidized student loan interest relief', 'surging default rates among young university graduates'],
    ],
  },
  {
    template: (p: string, o: string) => `She decided to resign from ${p} in order to champion ${o}.`,
    expected: 'đấu tranh ủng hộ, bảo vệ (lý tưởng/quyền lợi)',
    nuance: 'champion = bảo vệ, lên tiếng ủng hộ (không phải là nhà vô địch)',
    trap: 'trở thành nhà vô địch của',
    vars: [
      ['her lucrative partner position at the corporate law firm', 'indigent civil rights and tenant protection cases'],
      ['her tenured university professorship', 'climate change awareness and oceanic conservation efforts'],
      ['the pharmaceutical advisory board', 'affordable generic medicine accessibility across developing nations'],
      ['her executive seat at the commercial bank', 'financial literacy programs for underprivileged youth'],
      ['the federal government task force', 'wildlife habitat preservation across the Rocky Mountains'],
    ],
  },
  {
    template: (p: string, o: string) => `The company operates on a very thin margin, meaning ${p} could easily trigger ${o}.`,
    expected: 'biên lợi nhuận mỏng/thấp',
    nuance: 'thin margin = biên lợi nhuận thấp (không phải lề giấy mỏng)',
    trap: 'lề trang giấy mỏng manh',
    vars: [
      ['even a modest increase in wholesale fuel transport tariffs', 'immediate net operational losses this quarter'],
      ['a slight dip in retail consumer foot traffic during the holidays', 'severe cash flow liquidity shortages'],
      ['a minor depreciation in the local currency exchange rate', 'insurmountable import cost increases for raw materials'],
      ['an unexpected increase in supplier warehouse holding fees', 'defaulting on short-term revolving credit lines'],
      ['a competitive price war instigated by rival retail discount chains', 'slashing employee benefit packages'],
    ],
  },
  {
    template: (p: string, o: string) => `The diplomat tried to weather ${p} by forging ${o}.`,
    expected: 'vượt qua, chịu đựng qua cơn sóng gió',
    nuance: 'weather the storm = vượt qua nghịch cảnh (không phải thời tiết khí hậu)',
    trap: 'thời tiết hóa / làm mưa làm gió',
    vars: [
      ['the severe political crisis surrounding the border dispute', 'a fragile bipartisan ceasefire agreement'],
      ['the international trade embargo sanctions', 'new bilateral commercial pacts with neutral neighbors'],
      ['the hostile public relations controversy', 'transparent open-door town hall discussions with civic leaders'],
      ['the acute currency devaluation storm', 'emergency credit agreements with regional monetary funds'],
      ['the fallout from the espionage scandal', 'quiet multilateral reconciliation channels with historic allies'],
    ],
  },
  {
    template: (p: string, o: string) => `The company managed to file ${p} right before ${o}.`,
    expected: 'nộp đơn, nộp hồ sơ chính thức',
    nuance: 'file = nộp hồ sơ/đơn từ (không phải tệp tin máy tính hay cái giũa)',
    trap: 'lưu tệp / giũa móng tay',
    vars: [
      ['its provisional artificial intelligence patent application', 'the competing startup made an identical public announcement'],
      ['its audited annual financial disclosures with the securities commission', 'the mandatory Friday afternoon statutory cutoff'],
      ['its Chapter 11 reorganization petition with the bankruptcy court', 'commercial lenders initiated asset seizure proceedings'],
      ['its comprehensive trademark registration application', 'foreign counterfeiters flooded the market with imitation goods'],
      ['its formal appeal against the regulatory antitrust decision', 'the judicial thirty-day filing window lapsed'],
    ],
  },
  {
    template: (p: string, o: string) => `The lead architect had to table ${p} and instead champion ${o}.`,
    expected: 'tạm gác lại một kế hoạch và ủng hộ phương án khác',
    nuance: 'kết hợp cả 2 từ đa nghĩa: table (tạm gác) + champion (ủng hộ bảo vệ)',
    trap: 'đặt bàn và trở thành nhà vô địch',
    vars: [
      ['the extravagant glass atrium facade plan', 'sustainable energy-efficient geothermal heating designs'],
      ['the expensive imported Italian marble flooring', 'locally sourced recycled timber materials'],
      ['the multi-story underground parking garage', 'dedicated bicycle transit paths and pedestrian plazas'],
      ['the high-maintenance rooftop infinity pool', 'a community rooftop organic vegetable garden'],
      ['the decorative non-functional exterior spire', 'integrated solar photovoltaic panel arrays'],
    ],
  },
];

// Helper to expand templates into exactly N items
function expandPatterns(
  patterns: Array<{
    template: (p: string, o: string) => string;
    expected: string;
    nuance: string;
    trap: string;
    vars: Array<[string, string]>;
  }>,
  category: TranslationBenchmarkItem['category'],
  categoryLabel: string,
  targetCount: number,
  startId: number
): TranslationBenchmarkItem[] {
  const items: TranslationBenchmarkItem[] = [];
  const levels: TranslationBenchmarkItem['level'][] = ['B1', 'B2', 'C1', 'B2'];
  let currentId = startId;

  // Modifiers to produce authentic, diverse sentence variants
  const timeContexts = [
    '',
    'According to the senior committee, ',
    'In yesterday’s emergency staff assembly, ',
    'As reported in the internal memorandum, ',
  ];

  let patternIdx = 0;
  let varIdx = 0;
  let contextIdx = 0;

  while (items.length < targetCount) {
    const p = patterns[patternIdx % patterns.length];
    const pair = p.vars[varIdx % p.vars.length];
    const prefix = timeContexts[contextIdx % timeContexts.length];

    let sentence = p.template(pair[0], pair[1]);
    if (prefix && !sentence.startsWith('A:')) {
      // Capitalize first letter of sentence after prefix if needed
      sentence = prefix + sentence.charAt(0).toLowerCase() + sentence.slice(1);
    }

    const level = levels[items.length % levels.length];

    items.push({
      id: currentId++,
      category,
      categoryLabel,
      level,
      english: sentence,
      expectedMeaningVi: p.expected,
      keyNuance: p.nuance,
      badTranslationTrap: p.trap,
    });

    varIdx++;
    if (varIdx >= p.vars.length) {
      varIdx = 0;
      patternIdx++;
      contextIdx++;
    }
  }

  return items;
}

export function generate1000TranslationBenchmark(): TranslationBenchmarkItem[] {
  console.log('Generating 1,000 translation benchmark items...');

  const part1 = expandPatterns(BUSINESS_PATTERNS, 'business_idioms', 'Thành ngữ công sở', 200, 1);
  const part2 = expandPatterns(DAILY_PATTERNS, 'daily_slang', 'Giao tiếp đời sống & Khẩu ngữ', 200, 201);
  const part3 = expandPatterns(SYNTAX_PATTERNS, 'complex_syntax', 'Ngữ pháp phức tạp & Đảo ngữ', 200, 401);
  const part4 = expandPatterns(TOEIC_PATTERNS, 'toeic_academic', 'Học thuật & Đề thi TOEIC', 200, 601);
  const part5 = expandPatterns(POLYSEMY_PATTERNS, 'polysemy_context', 'Từ đa nghĩa theo ngữ cảnh', 200, 801);

  const allItems = [...part1, ...part2, ...part3, ...part4, ...part5];
  console.log(`Successfully compiled ${allItems.length} benchmark items across 5 categories.`);

  return allItems;
}

// Write to file if executed directly
if (require.main === module) {
  const dataset = generate1000TranslationBenchmark();
  const outDir = path.resolve(process.cwd(), 'data', 'benchmarks');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'translation-1000-test-suite.json');
  fs.writeFileSync(outPath, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log(`Saved benchmark dataset to: ${outPath}`);
  console.log(`Total count: ${dataset.length} sentences.`);
}

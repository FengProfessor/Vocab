/**
 * Fresh practice banks batch 4 — Error items for 29 error-thin topics + spot topics.
 * Every topic gets ≥4 quality error correction items.
 */
const err = (q, opts, answer, fb, case_id) => ({ type: 'error', q, opts, answer, fb, case_id });
const mcq = (q, opts, answer, fb, case_id) => ({ type: 'mcq', q, opts, answer, fb, case_id });
const fill = (q, opts, answer, fb, case_id) => ({ type: 'fill', q, opts, answer, fb, case_id });
const tf = (q, answer, fb, case_id) => ({ type: 'tf', q, answer, fb, case_id });

// ── 1. EMPHASIS STRUCTURES (4 error items) ────────────────────────────────
export const EMPHASIS_ERRORS = [
  err('Find the error: She did completed the assignment before leaving.', ['She did complete the assignment before leaving.', 'She did completed the assignment before leaving.', 'She does completed the assignment before leaving.'], 'She did complete the assignment before leaving.', 'Nhấn mạnh với did + động từ nguyên thể (did complete)', 'err_emph_did_v1'),
  err('Find the error: The weather was such cold that we stayed indoors.', ['The weather was so cold that we stayed indoors.', 'The weather was such cold that we stayed indoors.', 'The weather was such a cold that we stayed indoors.'], 'The weather was so cold that we stayed indoors.', 'so + tính từ + that (nhấn mạnh mức độ)', 'err_emph_so_such'),
  err('Find the error: It was a such difficult exam that many failed.', ['It was such a difficult exam that many failed.', 'It was a such difficult exam that many failed.', 'It was so difficult exam that many failed.'], 'It was such a difficult exam that many failed.', 'such a + adj + noun + that', 'err_emph_such_a'),
  err('Find the error: What I need most are a quiet place to work.', ['What I need most is a quiet place to work.', 'What I need most are a quiet place to work.', 'What I need most were a quiet place to work.'], 'What I need most is a quiet place to work.', 'Wh-cleft với mệnh đề danh ngữ làm chủ ngữ + is', 'err_emph_cleft_is'),
];

// ── 2. GRAMMATICAL COLLOCATIONS (4 error items) ───────────────────────────
export const GRAMMATICAL_COLLOCATIONS_ERRORS = [
  err('Find the error: She is very interested on learning new languages.', ['She is very interested in learning new languages.', 'She is very interested on learning new languages.', 'She is very interested at learning new languages.'], 'She is very interested in learning new languages.', 'interested + in + V-ing', 'err_gcoll_interested_in'),
  err('Find the error: He apologized for to be late to the meeting.', ['He apologized for being late to the meeting.', 'He apologized for to be late to the meeting.', 'He apologized for be late to the meeting.'], 'He apologized for being late to the meeting.', 'Giới từ for + V-ing (being late)', 'err_gcoll_apologize_for'),
  err('Find the error: They succeeded at passing the final exam.', ['They succeeded in passing the final exam.', 'They succeeded at passing the final exam.', 'They succeeded on passing the final exam.'], 'They succeeded in passing the final exam.', 'succeed + in + V-ing', 'err_gcoll_succeed_in'),
  err('Find the error: She is capable to solve complex logic puzzles.', ['She is capable of solving complex logic puzzles.', 'She is capable to solve complex logic puzzles.', 'She is capable for solving complex logic puzzles.'], 'She is capable of solving complex logic puzzles.', 'capable + of + V-ing', 'err_gcoll_capable_of'),
];

// ── 3. MODALS PERMISSION (4 error items) ──────────────────────────────────
export const MODALS_PERMISSION_ERRORS = [
  err('Find the error: May I to ask a personal question?', ['May I ask a personal question?', 'May I to ask a personal question?', 'Can I to ask a personal question?'], 'May I ask a personal question.', 'May + S + V_base (không có to)', 'err_mperm_may_to'),
  err('Find the error: You may not to park your bicycle here.', ['You may not park your bicycle here.', 'You may not to park your bicycle here.', 'You can not to park your bicycle here.'], 'You may not park your bicycle here.', 'may not + V_base', 'err_mperm_maynot_to'),
  err('Find the error: Could I borrows your dictionary for ten minutes?', ['Could I borrow your dictionary for ten minutes?', 'Could I borrows your dictionary for ten minutes?', 'Could I to borrow your dictionary for ten minutes?'], 'Could I borrow your dictionary for ten minutes.', 'Could + S + V_base (borrow)', 'err_mperm_could_s'),
  err('Find the error: Students may uses the library computers freely.', ['Students may use the library computers freely.', 'Students may uses the library computers freely.', 'Students may to use the library computers freely.'], 'Students may use the library computers freely.', 'modal verb + V_base', 'err_mperm_may_uses'),
];

// ── 4. CONJUNCTIONS LINKING (4 error items) ───────────────────────────────
export const CONJUNCTIONS_LINKING_ERRORS = [
  err('Find the error: Although it rained heavily, but they played football.', ['Although it rained heavily, they played football.', 'Although it rained heavily, but they played football.', 'Because it rained heavily, but they played football.'], 'Although it rained heavily, they played football.', 'Không dùng cả Although và but trong cùng một câu', 'err_conj_although_but'),
  err('Find the error: Despite he was exhausted, he completed the race.', ['Despite being exhausted, he completed the race. / Although he was exhausted...', 'Despite he was exhausted, he completed the race.', 'In spite he was exhausted, he completed the race.'], 'Despite being exhausted, he completed the race. / Although he was exhausted...', 'Despite + V-ing / N (không đi với mệnh đề S + V)', 'err_conj_despite_clause'),
  err('Find the error: He arrived early in order for catch the bus.', ['He arrived early in order to catch the bus.', 'He arrived early in order for catch the bus.', 'He arrived early in order that catch the bus.'], 'He arrived early in order to catch the bus.', 'in order to + V_base', 'err_conj_in_order_to'),
  err('Find the error: Because of the train was delayed, we missed our meeting.', ['Because the train was delayed, we missed our meeting.', 'Because of the train was delayed, we missed our meeting.', 'Because of the train delayed, we missed our meeting.'], 'Because the train was delayed, we missed our meeting.', 'Because + mệnh đề S + V (Because of + N/V-ing)', 'err_conj_because_of'),
];

// ── 5. CAUSATIVE (4 error items) ──────────────────────────────────────────
export const CAUSATIVE_ERRORS = [
  err('Find the error: I had the mechanic to repair my car yesterday.', ['I had the mechanic repair my car yesterday.', 'I had the mechanic to repair my car yesterday.', 'I had the mechanic repaired my car yesterday.'], 'I had the mechanic repair my car yesterday.', 'Have somebody DO something (V_base)', 'err_caus_have_do'),
  err('Find the error: She got her brother wash her motorcycle.', ['She got her brother to wash her motorcycle.', 'She got her brother wash her motorcycle.', 'She got her brother washed her motorcycle.'], 'She got her brother to wash her motorcycle.', 'Get somebody TO DO something', 'err_caus_get_to_do'),
  err('Find the error: He had his roof repair after the violent storm.', ['He had his roof repaired after the violent storm.', 'He had his roof repair after the violent storm.', 'He had his roof to repair after the violent storm.'], 'He had his roof repaired after the violent storm.', 'Have something DONE (V3 bị động)', 'err_caus_have_done'),
  err('Find the error: I am going to get my hair cutted tomorrow morning.', ['I am going to get my hair cut tomorrow morning.', 'I am going to get my hair cutted tomorrow morning.', 'I am going to get my hair to cut tomorrow morning.'], 'I am going to get my hair cut tomorrow morning.', 'V3 của cut là cut (không có cutted)', 'err_caus_cutted'),
  err('Find the error: We had the plumber fixes the kitchen tap.', ['We had the plumber fix the kitchen tap.', 'We had the plumber fixes the kitchen tap.', 'We had the plumber to fix the kitchen tap.'], 'We had the plumber fix the kitchen tap.', 'have somebody fix (V_base)', 'err_caus_fix'),
  err('Find the error: She gets her assistant to sent emails every morning.', ['She gets her assistant to send emails every morning.', 'She gets her assistant to sent emails every morning.', 'She gets her assistant send emails every morning.'], 'She gets her assistant to send emails every morning.', 'get somebody to send (to V_base)', 'err_caus_send'),
];

// ── 6. CLEFT SENTENCES (4 error items) ────────────────────────────────────
export const CLEFT_SENTENCES_ERRORS = [
  err('Find the error: It was in Rome where they first met.', ['It was in Rome that they first met.', 'It was in Rome where they first met.', 'It is in Rome which they first met.'], 'It was in Rome that they first met.', 'Cleft sentence: It was [trạng ngữ] THAT...', 'err_cleft_where_that'),
  err('Find the error: What I really want are a long peaceful vacation.', ['What I really want is a long peaceful vacation.', 'What I really want are a long peaceful vacation.', 'What I really want were a long peaceful vacation.'], 'What I really want is a long peaceful vacation.', 'Wh-cleft bổ nghĩa số ít dùng is', 'err_cleft_what_is'),
  err('Find the error: It is my teacher which encouraged me to apply.', ['It is my teacher who encouraged me to apply.', 'It is my teacher which encouraged me to apply.', 'It is my teacher whom encouraged me to apply.'], 'It is my teacher who encouraged me to apply.', 'Chỉ người làm chủ ngữ dùng who', 'err_cleft_who_which'),
  err('Find the error: All she need is a small hot cup of tea.', ['All she needs is a small hot cup of tea.', 'All she need is a small hot cup of tea.', 'All she needed is a small hot cup of tea.'], 'All she needs is a small hot cup of tea.', 'she + needs', 'err_cleft_she_needs'),
];

// ── 7. SUBJUNCTIVE (4 error items) ────────────────────────────────────────
export const SUBJUNCTIVE_ERRORS = [
  err('Find the error: The doctor insisted that he stays in bed.', ['The doctor insisted that he stay in bed.', 'The doctor insisted that he stays in bed.', 'The doctor insisted that he stayed in bed.'], 'The doctor insisted that he stay in bed.', 'Giả định thức: insist that + S + V_base (stay)', 'err_subj_insist_base'),
  err('Find the error: It is essential that she is present at the meeting.', ['It is essential that she be present at the meeting.', 'It is essential that she is present at the meeting.', 'It is essential that she was present at the meeting.'], 'It is essential that she be present at the meeting.', 'It is essential that + S + BE (nguyên thể)', 'err_subj_be'),
  err('Find the error: The manager recommended that the report is submitted.', ['The manager recommended that the report be submitted.', 'The manager recommended that the report is submitted.', 'The manager recommended that the report was submitted.'], 'The manager recommended that the report be submitted.', 'Bị động giả định thức: be + V3', 'err_subj_be_v3'),
  err('Find the error: It is important that he not to forget his passport.', ['It is important that he not forget his passport.', 'It is important that he not to forget his passport.', 'It is important that he doesn\'t forget his passport.'], 'It is important that he not forget his passport.', 'Phủ định giả định thức: NOT + V_base (không có to)', 'err_subj_not_base'),
];

// ── 8. ADVANCED RELATIVE CLAUSES (4 error items) ──────────────────────────
export const ADVANCED_RELATIVE_CLAUSES_ERRORS = [
  err('Find the error: The building, the roof of where collapsed, was abandoned.', ['The building, the roof of which collapsed, was abandoned.', 'The building, the roof of where collapsed, was abandoned.', 'The building, the roof of that collapsed, was abandoned.'], 'The building, the roof of which collapsed, was abandoned.', 'the roof of which (chỉ sự vật)', 'err_arc_roof_which'),
  err('Find the error: She interviewed ten applicants, all of who had degrees.', ['She interviewed ten applicants, all of whom had degrees.', 'She interviewed ten applicants, all of who had degrees.', 'She interviewed ten applicants, all of that had degrees.'], 'She interviewed ten applicants, all of whom had degrees.', 'Sau giới từ (of) dùng whom cho người', 'err_arc_of_whom'),
  err('Find the error: This is the report about that I told you yesterday.', ['This is the report about which I told you yesterday.', 'This is the report about that I told you yesterday.', 'This is the report about who I told you yesterday.'], 'This is the report about which I told you yesterday.', 'Cấm dùng that trực tiếp sau giới từ (about which)', 'err_arc_about_which'),
  err('Find the error: He resigned suddenly, what surprised all his colleagues.', ['He resigned suddenly, which surprised all his colleagues.', 'He resigned suddenly, what surprised all his colleagues.', 'He resigned suddenly, that surprised all his colleagues.'], 'He resigned suddenly, which surprised all his colleagues.', 'which thay thế cho cả mệnh đề phía trước', 'err_arc_which_clause'),
];

// ── 9. PAST PERFECT (4 error items) ───────────────────────────────────────
export const PAST_PERFECT_ERRORS = [
  err('Find the error: When we arrived at the hall, the speech already started.', ['When we arrived at the hall, the speech had already started.', 'When we arrived at the hall, the speech already started.', 'When we arrived at the hall, the speech has already started.'], 'When we arrived at the hall, the speech had already started.', 'Hành động xảy ra trước quá khứ dùng Had V3', 'err_pp_had_started'),
  err('Find the error: She had never saw such a grand monument before.', ['She had never seen such a grand monument before.', 'She had never saw such a grand monument before.', 'She has never seen such a grand monument before.'], 'She had never seen such a grand monument before.', 'had + V3 (seen)', 'err_pp_had_seen'),
  err('Find the error: After he had finish his dinner, he went out for a walk.', ['After he had finished his dinner, he went out for a walk.', 'After he had finish his dinner, he went out for a walk.', 'After he has finished his dinner, he went out for a walk.'], 'After he had finished his dinner, he went out for a walk.', 'had + V3 (finished)', 'err_pp_had_finished'),
  err('Find the error: By the time the train came, all tickets had sold out.', ['By the time the train came, all tickets had been sold out.', 'By the time the train came, all tickets had sold out.', 'By the time the train came, all tickets have been sold out.'], 'By the time the train came, all tickets had been sold out.', 'Bị động quá khứ hoàn thành: had been sold', 'err_pp_had_been_sold'),
];

// ── 10. WH-QUESTIONS (4 error items) ──────────────────────────────────────
export const WH_QUESTIONS_ERRORS = [
  err('Find the error: Where did you bought that stylish jacket?', ['Where did you buy that stylish jacket?', 'Where did you bought that stylish jacket?', 'Where do you bought that stylish jacket?'], 'Where did you buy that stylish jacket.', 'Did + S + V_base (buy)', 'err_wh_did_buy'),
  err('Find the error: Why the train is so crowded this morning?', ['Why is the train so crowded this morning?', 'Why the train is so crowded this morning?', 'Why does the train so crowded this morning?'], 'Why is the train so crowded this morning.', 'Wh- + be + S + adj?', 'err_wh_is_train'),
  err('Find the error: Who did break the front window yesterday?', ['Who broke the front window yesterday?', 'Who did break the front window yesterday?', 'Who does break the front window yesterday?'], 'Who broke the front window yesterday.', 'Who làm chủ ngữ không cần trợ động từ did', 'err_wh_who_broke'),
  err('Find the error: How often does you exercise at the gym?', ['How often do you exercise at the gym?', 'How often does you exercise at the gym?', 'How often are you exercise at the gym?'], 'How often do you exercise at the gym.', 'you -> do', 'err_wh_how_often_do'),
];

// ── 11. FUTURE PERFECT (4 error items) ────────────────────────────────────
export const FUTURE_PERFECT_ERRORS = [
  err('Find the error: By next June, she will has graduated from college.', ['By next June, she will have graduated from college.', 'By next June, she will has graduated from college.', 'By next June, she has graduated from college.'], 'By next June, she will have graduated from college.', 'will + HAVE + V3 (không dùng has)', 'err_fp_will_have'),
  err('Find the error: By 8 p.m., we will have finish all our tasks.', ['By 8 p.m., we will have finished all our tasks.', 'By 8 p.m., we will have finish all our tasks.', 'By 8 p.m., we will finished all our tasks.'], 'By 8 p.m., we will have finished all our tasks.', 'will have + V3 (finished)', 'err_fp_finished'),
  err('Find the error: They will have lived here for 10 years by next month.', ['They will have lived here for 10 years by next month.', 'They will live here for 10 years by next month.', 'They had lived here for 10 years by next month.'], 'They will have lived here for 10 years by next month.', 'By + mốc tương lai dùng Future Perfect', 'err_fp_by_time'),
  err('Find the error: Will you have complete the project before Friday?', ['Will you have completed the project before Friday?', 'Will you have complete the project before Friday?', 'Will you completed the project before Friday?'], 'Will you have completed the project before Friday.', 'Will + S + have + V3 (completed)', 'err_fp_completed'),
  err('Find the error: By the end of this year, I will have learn two languages.', ['By the end of this year, I will have learned two languages.', 'By the end of this year, I will have learn two languages.', 'By the end of this year, I will learned two languages.'], 'By the end of this year, I will have learned two languages.', 'will have + V3 (learned)', 'err_fp_learned'),
  err('Find the error: Before December, the developers will had released the app.', ['Before December, the developers will have released the app.', 'Before December, the developers will had released the app.', 'Before December, the developers had released the app.'], 'Before December, the developers will have released the app.', 'will HAVE released (không dùng had)', 'err_fp_released'),
];

// ── 12. ADJECTIVES BASIC (4 error items) ──────────────────────────────────
export const ADJECTIVES_BASIC_ERRORS = [
  err('Find the error: She bought a wooden old round table.', ['She bought an old round wooden table.', 'She bought a wooden old round table.', 'She bought a round old wooden table.'], 'She bought an old round wooden table.', 'Trật tự tính từ OSASCOMP: age (old) -> shape (round) -> material (wooden)', 'err_adj_osascomp'),
  err('Find the error: The vegetable soup smells freshly.', ['The vegetable soup smells fresh.', 'The vegetable soup smells freshly.', 'The vegetable soup smell fresh.'], 'The vegetable soup smells fresh.', 'Động từ cảm giác (smell) đi với tính từ (fresh)', 'err_adj_smell_fresh'),
  err('Find the error: He felt tiredly after walking for ten miles.', ['He felt tired after walking for ten miles.', 'He felt tiredly after walking for ten miles.', 'He feels tiredly after walking for ten miles.'], 'He felt tired after walking for ten miles.', 'feel + tính từ (tired)', 'err_adj_feel_tired'),
  err('Find the error: This is an useful tool for gardeners.', ['This is a useful tool for gardeners.', 'This is an useful tool for gardeners.', 'This is the useful tool for gardeners always.'], 'This is a useful tool for gardeners.', 'useful phát âm là /j/ nên dùng a (a useful tool)', 'err_adj_a_useful'),
];

// ── 13. MODALS DEDUCTION (4 error items) ──────────────────────────────────
export const MODALS_DEDUCTION_ERRORS = [
  err('Find the error: She must to be at home because her car is parked outside.', ['She must be at home because her car is parked outside.', 'She must to be at home because her car is parked outside.', 'She must is at home because her car is parked outside.'], 'She must be at home because her car is parked outside.', 'Must + V_base (be, không có to)', 'err_mded_must_be'),
  err('Find the error: He can\'t is the thief; he was with me all night.', ['He can\'t be the thief; he was with me all night.', 'He can\'t is the thief; he was with me all night.', 'He doesn\'t be the thief; he was with me all night.'], 'He can\'t be the thief; he was with me all night.', 'can\'t + BE (nguyên thể)', 'err_mded_cant_be'),
  err('Find the error: They might to be resting after their flight.', ['They might be resting after their flight.', 'They might to be resting after their flight.', 'They might are resting after their flight.'], 'They might be resting after their flight.', 'might + BE', 'err_mded_might_be'),
  err('Find the error: That man looks lost; he may needing some help.', ['That man looks lost; he may need some help.', 'That man looks lost; he may needing some help.', 'That man looks lost; he may needs some help.'], 'That man looks lost; he may need some help.', 'may + V_base (need)', 'err_mded_may_need'),
  err('Find the error: The lights are on, so they must being awake.', ['The lights are on, so they must be awake.', 'The lights are on, so they must being awake.', 'The lights are on, so they must are awake.'], 'The lights are on, so they must be awake.', 'must + BE (awake)', 'err_mded_must_awake'),
  err('Find the error: It can\'t to be true that he failed the exam.', ['It can\'t be true that he failed the exam.', 'It can\'t to be true that he failed the exam.', 'It isn\'t true can\'t that he failed the exam.'], 'It can\'t be true that he failed the exam.', 'can\'t + V_base (be)', 'err_mded_cant_true'),
];

// ── 14. FUTURE IN THE PAST (4 error items) ────────────────────────────────
export const FUTURE_IN_THE_PAST_ERRORS = [
  err('Find the error: I knew that she is going to pass the exam.', ['I knew that she was going to pass the exam.', 'I knew that she is going to pass the exam.', 'I knew that she will pass the exam.'], 'I knew that she was going to pass the exam.', 'Lùi thì: is going to -> was going to', 'err_fip_was_going'),
  err('Find the error: They were about to left when the phone rang.', ['They were about to leave when the phone rang.', 'They were about to left when the phone rang.', 'They were about leaving when the phone rang.'], 'They were about to leave when the phone rang.', 'be about to + V_base (leave)', 'err_fip_about_to_leave'),
  err('Find the error: She promised she will call me the next day.', ['She promised she would call me the next day.', 'She promised she will call me the next day.', 'She promised she calls me the next day.'], 'She promised she would call me the next day.', 'Lùi thì: will -> would', 'err_fip_would_call'),
  err('Find the error: I thought the trip was to be easy and fast.', ['I thought the trip would be easy and fast.', 'I thought the trip was to be easy and fast.', 'I thought the trip is going to be easy.'], 'I thought the trip would be easy and fast.', 'thought + would + V', 'err_fip_thought_would'),
];

// ── 15. FUTURE CONTINUOUS (4 error items) ─────────────────────────────────
export const FUTURE_CONTINUOUS_ERRORS = [
  err('Find the error: At 10 a.m. tomorrow, I will taking an exam.', ['At 10 a.m. tomorrow, I will be taking an exam.', 'At 10 a.m. tomorrow, I will taking an exam.', 'At 10 a.m. tomorrow, I am taking an exam.'], 'At 10 a.m. tomorrow, I will be taking an exam.', 'Future Continuous formula: will BE V-ing', 'err_fc_will_be_taking'),
  err('Find the error: Don\'t call at 8 p.m. because we will having dinner.', ['Don\'t call at 8 p.m. because we will be having dinner.', 'Don\'t call at 8 p.m. because we will having dinner.', 'Don\'t call at 8 p.m. because we are have dinner.'], 'Don\'t call at 8 p.m. because we will be having dinner.', 'will + BE + having', 'err_fc_will_be_having'),
  err('Find the error: This time next week, she will sunbathing in Bali.', ['This time next week, she will be sunbathing in Bali.', 'This time next week, she will sunbathing in Bali.', 'This time next week, she is sunbathing in Bali.'], 'This time next week, she will be sunbathing in Bali.', 'will be + V-ing', 'err_fc_sunbathing'),
  err('Find the error: Will you using your laptop tonight?', ['Will you be using your laptop tonight?', 'Will you using your laptop tonight?', 'Do you be using your laptop tonight?'], 'Will you be using your laptop tonight.', 'Will + S + BE + V-ing', 'err_fc_q_be'),
];

// ── 16. PHRASAL VERBS (4 error items) ─────────────────────────────────────
export const PHRASAL_VERBS_ERRORS = [
  err('Find the error: Please turn out the lights before you leave.', ['Please turn off the lights before you leave.', 'Please turn out the lights before you leave.', 'Please turn away the lights before you leave.'], 'Please turn off the lights before you leave.', 'Tắt đèn dùng turn off', 'err_pv_turn_off'),
  err('Find the error: I am looking forward to meet you next week.', ['I am looking forward to meeting you next week.', 'I am looking forward to meet you next week.', 'I am looking forward meeting you next week.'], 'I am looking forward to meeting you next week.', 'look forward to + V-ing (meeting)', 'err_pv_look_forward'),
  err('Find the error: He gave out smoking two years ago for his health.', ['He gave up smoking two years ago for his health.', 'He gave out smoking two years ago for his health.', 'He gave off smoking two years ago for his health.'], 'He gave up smoking two years ago for his health.', 'Từ bỏ thói quen dùng give up', 'err_pv_give_up'),
  err('Find the error: She grew in a small coastal town in Vietnam.', ['She grew up in a small coastal town in Vietnam.', 'She grew in a small coastal town in Vietnam.', 'She grew on in a small coastal town in Vietnam.'], 'She grew up in a small coastal town in Vietnam.', 'Lớn lên dùng grow up (grew up)', 'err_pv_grew_up'),
];

// ── 17. ELLIPSIS & SUBSTITUTION (4 error items) ───────────────────────────
export const ELLIPSIS_SUBSTITUTION_ERRORS = [
  err('Find the error: He promised to attend the party, but he didn\'t attended.', ['He promised to attend the party, but he didn\'t.', 'He promised to attend the party, but he didn\'t attended.', 'He promised to attend the party, but he isn\'t.'], 'He promised to attend the party, but he didn\'t.', 'Lược bỏ mệnh đề lặp lại sau trợ động từ (didn\'t)', 'err_es_ellipsis_didnt'),
  err('Find the error: Do you think it will rain? — I hope not so.', ['Do you think it will rain? — I hope not.', 'Do you think it will rain? — I hope not so.', 'Do you think it will rain? — I hope no.'], 'Do you think it will rain? — I hope not.', 'Trả lời thay thế: I hope not (không nói I hope not so)', 'err_es_hope_not'),
  err('Find the error: I bought a red apple and she chose a green ones.', ['I bought a red apple and she chose a green one.', 'I bought a red apple and she chose a green ones.', 'I bought a red apple and she chose green one.'], 'I bought a red apple and she chose a green one.', 'Danh từ số ít apple thay bằng one (không dùng ones)', 'err_es_green_one'),
  err('Find the error: Some students like math, while another prefer history.', ['Some students like math, while others prefer history.', 'Some students like math, while another prefer history.', 'Some students like math, while other prefer history.'], 'Some students like math, while others prefer history.', 'Thay cho số nhiều (other students) dùng others', 'err_es_others'),
];

// ── 18. ADVANCED PASSIVE (4 error items) ──────────────────────────────────
export const ADVANCED_PASSIVE_ERRORS = [
  err('Find the error: It is report that the economic situation is improving.', ['It is reported that the economic situation is improving.', 'It is report that the economic situation is improving.', 'It reported that the economic situation is improving.'], 'It is reported that the economic situation is improving.', 'Bị động chủ ngữ giả: It is reported that...', 'err_ap_is_reported'),
  err('Find the error: He is believed to had left the country yesterday.', ['He is believed to have left the country yesterday.', 'He is believed to had left the country yesterday.', 'He is believed having left the country yesterday.'], 'He is believed to have left the country yesterday.', 'is believed + to HAVE V3', 'err_ap_to_have_v3'),
  err('Find the error: The broken engine needs to repair immediately.', ['The broken engine needs repairing immediately. / needs to be repaired', 'The broken engine needs to repair immediately.', 'The broken engine needs repairment immediately.'], 'The broken engine needs repairing immediately. / needs to be repaired', 'need + V-ing / need to be V3', 'err_ap_needs_repairing'),
  err('Find the error: She dislikes to be treated like a child.', ['She dislikes being treated like a child.', 'She dislikes to be treated like a child.', 'She dislikes be treated like a child.'], 'She dislikes being treated like a child.', 'dislike + V-ing bị động (being treated)', 'err_ap_dislikes_being'),
];

// ── 19. DISCOURSE MARKERS (4 error items) ─────────────────────────────────
export const DISCOURSE_MARKERS_ERRORS = [
  err('Find the error: Furthermore the new software, it speeds up processing time.', ['Furthermore, the new software speeds up processing time.', 'Furthermore the new software, it speeds up processing time.', 'Furthermore of the new software, it speeds up.'], 'Furthermore, the new software speeds up processing time.', 'Furthermore đứng làm trạng từ liên kết + dấu phẩy', 'err_dm_furthermore'),
  err('Find the error: On the one hand, remote work saves time; on other hand, it reduces social contact.', ['On the one hand, remote work saves time; on the other hand, it reduces social contact.', 'On the one hand, remote work saves time; on other hand, it reduces social contact.', 'On one hand, remote work saves time; on other hand, it reduces.'], 'On the one hand, remote work saves time; on the other hand, it reduces social contact.', 'Cụm từ chuẩn: on the other hand', 'err_dm_other_hand'),
  err('Find the error: In the conclusion, we must take immediate action to protect nature.', ['In conclusion, we must take immediate action to protect nature.', 'In the conclusion, we must take immediate action to protect nature.', 'At conclusion, we must take immediate action.'], 'In conclusion, we must take immediate action to protect nature.', 'Cụm kết luận chuẩn: In conclusion (không có the)', 'err_dm_in_conclusion'),
  err('Find the error: Nevertheless the heavy rain, the match went ahead as planned.', ['Nevertheless, despite the heavy rain, the match went ahead as planned. / Despite the heavy rain...', 'Nevertheless the heavy rain, the match went ahead as planned.', 'Nevertheless of heavy rain, the match went ahead.'], 'Nevertheless, despite the heavy rain, the match went ahead as planned. / Despite the heavy rain...', 'Nevertheless là trạng từ (không đứng trực trước danh từ như giới từ)', 'err_dm_nevertheless'),
];

// ── 20. NOMINALISATION (4 error items) ────────────────────────────────────
export const NOMINALISATION_ERRORS = [
  err('Find the error: The rapid destroy of the ancient forest caused severe soil erosion.', ['The rapid destruction of the ancient forest caused severe soil erosion.', 'The rapid destroy of the ancient forest caused severe soil erosion.', 'The rapid destroying of the ancient forest caused.'], 'The rapid destruction of the ancient forest caused severe soil erosion.', 'Danh từ hóa của destroy là destruction', 'err_nom_destruction'),
  err('Find the error: His sudden decide to resign shocked the board of directors.', ['His sudden decision to resign shocked the board of directors.', 'His sudden decide to resign shocked the board of directors.', 'His sudden decisement to resign shocked.'], 'His sudden decision to resign shocked the board of directors.', 'Danh từ hóa của decide là decision', 'err_nom_decision'),
  err('Find the error: The implement of the new policy will start next month.', ['The implementation of the new policy will start next month.', 'The implement of the new policy will start next month.', 'The implementing of the new policy will start.'], 'The implementation of the new policy will start next month.', 'Danh từ hóa của implement là implementation', 'err_nom_implementation'),
  err('Find the error: Clear communicate is key to team success.', ['Clear communication is key to team success.', 'Clear communicate is key to team success.', 'Clear communicating is key to team success.'], 'Clear communication is key to team success.', 'Danh từ hóa của communicate là communication', 'err_nom_communication'),
];

// ── 21. MODALS ADVICE (4 error items) ─────────────────────────────────────
export const MODALS_ADVICE_ERRORS = [
  err('Find the error: You had better to check the contract before signing.', ['You had better check the contract before signing.', 'You had better to check the contract before signing.', 'You have better check the contract before signing.'], 'You had better check the contract before signing.', 'had better + V_base (không có to)', 'err_madv_had_better'),
  err('Find the error: You ought consult your doctor about these symptoms.', ['You ought to consult your doctor about these symptoms.', 'You ought consult your doctor about these symptoms.', 'You ought to consulting your doctor about these.'], 'You ought to consult your doctor about these symptoms.', 'ought TO + V_base', 'err_madv_ought_to'),
  err('Find the error: He should not to eat so much junk food.', ['He should not eat so much junk food.', 'He should not to eat so much junk food.', 'He should to not eat so much junk food.'], 'He should not eat so much junk food.', 'should not + V_base', 'err_madv_should_not'),
  err('Find the error: You had not better walk alone late at night.', ['You had better not walk alone late at night.', 'You had not better walk alone late at night.', 'You haven\'t better walk alone late at night.'], 'You had better not walk alone late at night.', 'Phủ định: had better NOT + V_base', 'err_madv_had_better_not'),
];

// ── 22. PARTICIPLE CLAUSES (4 error items) ────────────────────────────────
export const PARTICIPLE_CLAUSES_ERRORS = [
  err('Find the error: Feel exhausted after the long walk, she sat down on a bench.', ['Feeling exhausted after the long walk, she sat down on a bench.', 'Feel exhausted after the long walk, she sat down on a bench.', 'Felt exhausted after the long walk, she sat down.'], 'Feeling exhausted after the long walk, she sat down on a bench.', 'Hiện tại phân tử V-ing (Feeling) ở đầu câu chỉ nguyên nhân', 'err_part_feeling'),
  err('Find the error: Build in the 18th century, the castle attracts thousands of visitors.', ['Built in the 18th century, the castle attracts thousands of visitors.', 'Build in the 18th century, the castle attracts thousands of visitors.', 'Building in the 18th century, the castle attracts.'], 'Built in the 18th century, the castle attracts thousands of visitors.', 'Quá khứ phân tử V3 (Built) chỉ nghĩa bị động', 'err_part_built'),
  err('Find the error: Having finish all his homework, he went out to play.', ['Having finished all his homework, he went out to play.', 'Having finish all his homework, he went out to play.', 'Have finished all his homework, he went out.'], 'Having finished all his homework, he went out to play.', 'Hoàn thành phân tử: Having + V3 (finished)', 'err_part_having_finished'),
  err('Find the error: Not know what to say, she kept quiet.', ['Not knowing what to say, she kept quiet.', 'Not know what to say, she kept quiet.', 'Not known what to say, she kept quiet.'], 'Not knowing what to say, she kept quiet.', 'Phủ định phân tử: Not + V-ing (Not knowing)', 'err_part_not_knowing'),
];

// ── 23. QUESTION TAGS (4 error items) ─────────────────────────────────────
export const QUESTION_TAGS_ERRORS = [
  err('Find the error: You are a student, don\'t you?', ['You are a student, aren\'t you?', 'You are a student, don\'t you?', 'You are a student, isn\'t you?'], 'You are a student, aren\'t you?', 'Động từ be (are) -> tag aren\'t you', 'err_qtag_be'),
  err('Find the error: She doesn\'t like spicy food, doesn\'t she?', ['She doesn\'t like spicy food, does she?', 'She doesn\'t like spicy food, doesn\'t she?', 'She doesn\'t like spicy food, isn\'t she?'], 'She doesn\'t like spicy food, does she?', 'Vế trước phủ định (doesn\'t) -> tag khẳng định (does she)', 'err_qtag_neg_pos'),
  err('Find the error: They went to the concert, don\'t they?', ['They went to the concert, didn\'t they?', 'They went to the concert, don\'t they?', 'They went to the concert, haven\'t they?'], 'They went to the concert, didn\'t they?', 'Quá khứ đơn (went) -> tag didn\'t they', 'err_qtag_past'),
  err('Find the error: Let\'s go for a walk, don\'t we?', ['Let\'s go for a walk, shall we?', 'Let\'s go for a walk, don\'t we?', 'Let\'s go for a walk, will we?'], 'Let\'s go for a walk, shall we?', 'Mệnh lệnh Let\'s -> tag shall we', 'err_qtag_lets'),
];

// ── 24. HEDGING LANGUAGE (4 error items) ──────────────────────────────────
export const HEDGING_LANGUAGE_ERRORS = [
  err('Find the error: The data seems to suggests a slight economic recovery.', ['The data seems to suggest a slight economic recovery.', 'The data seems to suggests a slight economic recovery.', 'The data seem to suggesting a slight economic.'], 'The data seems to suggest a slight economic recovery.', 'seem to + V_base (suggest)', 'err_hedge_seem_to'),
  err('Find the error: It is generally believe that exercise reduces stress.', ['It is generally believed that exercise reduces stress.', 'It is generally believe that exercise reduces stress.', 'It is generally believing that exercise reduces.'], 'It is generally believed that exercise reduces stress.', 'It is generally believed that...', 'err_hedge_believed'),
  err('Find the error: The results tends to indicate a positive outcome.', ['The results tend to indicate a positive outcome.', 'The results tends to indicate a positive outcome.', 'The results tends to indicating a positive.'], 'The results tend to indicate a positive outcome.', 'Chủ ngữ số nhiều results -> tend (không có -s)', 'err_hedge_tend_plural'),
  err('Find the error: Arguable, this is one of the most effective solutions.', ['Arguably, this is one of the most effective solutions.', 'Arguable, this is one of the most effective solutions.', 'Arguing, this is one of the most effective.'], 'Arguably, this is one of the most effective solutions.', 'Trạng từ làm mềm nhận định: Arguably', 'err_hedge_arguably'),
];

// ── 25. PREPOSITIONS PLACE (4 error items) ────────────────────────────────
export const PREPOSITIONS_PLACE_ERRORS = [
  err('Find the error: The painting is hanging at the living room wall.', ['The painting is hanging on the living room wall.', 'The painting is hanging at the living room wall.', 'The painting is hanging in the living room wall.'], 'The painting is hanging on the living room wall.', 'Treo trên bề mặt dùng on', 'err_pplace_on_wall'),
  err('Find the error: There is a small coffee shop behind of our office.', ['There is a small coffee shop behind our office.', 'There is a small coffee shop behind of our office.', 'There is a small coffee shop behind to our office.'], 'There is a small coffee shop behind our office.', 'Behind không có of (behind our office)', 'err_pplace_behind'),
  err('Find the error: Please sit between your brother or your sister.', ['Please sit between your brother and your sister.', 'Please sit between your brother or your sister.', 'Please sit between your brother with your sister.'], 'Please sit between your brother and your sister.', 'Cấu trúc: between A and B', 'err_pplace_between_and'),
  err('Find the error: She works at a large bank in the city center.', ['She works in a large bank at the city center. / She works at a bank in the city center.', 'She works at a large bank in the city center.', 'She works on a bank in the city center.'], 'She works at a bank in the city center.', 'Ngân hàng cụ thể dùng at, trung tâm thành phố dùng in', 'err_pplace_at_in'),
];

// ── 26. IMPERATIVES (4 error items) ───────────────────────────────────────
export const IMPERATIVES_ERRORS = [
  err('Find the error: Don\'t to touch that hot stove!', ['Don\'t touch that hot stove!', 'Don\'t to touch that hot stove!', 'Not touch that hot stove!'], 'Don\'t touch that hot stove!', 'Don\'t + V_base (không có to)', 'err_imp_dont_to'),
  err('Find the error: Always to check the oil level before a long drive.', ['Always check the oil level before a long drive.', 'Always to check the oil level before a long drive.', 'Always checking the oil level before a long drive.'], 'Always check the oil level before a long drive.', 'Always + V_base', 'err_imp_always_to'),
  err('Find the error: Never leaves small children unattended near water.', ['Never leave small children unattended near water.', 'Never leaves small children unattended near water.', 'Never leaving small children unattended near water.'], 'Never leave small children unattended near water.', 'Mệnh lệnh cấm đoán với Never + V_base (leave)', 'err_imp_never_s'),
  err('Find the error: Let\'s not to make any noise while the baby sleeps.', ['Let\'s not make any noise while the baby sleeps.', 'Let\'s not to make any noise while the baby sleeps.', 'Let\'s don\'t make any noise while the baby sleeps.'], 'Let\'s not make any noise while the baby sleeps.', 'Let\'s not + V_base', 'err_imp_lets_not_to'),
];

// ── 27. COMPARATIVES SUPERLATIVES (4 error items) ─────────────────────────
export const COMPARATIVES_SUPERLATIVES_ERRORS = [
  err('Find the error: This new laptop is much more faster than my old one.', ['This new laptop is much faster than my old one.', 'This new laptop is much more faster than my old one.', 'This new laptop is much fast than my old one.'], 'This new laptop is much faster than my old one.', 'Không dùng cả more và -er (much faster)', 'err_cs_double_comp'),
  err('Find the error: Tokyo is one of the most expensive city in the world.', ['Tokyo is one of the most expensive cities in the world.', 'Tokyo is one of the most expensive city in the world.', 'Tokyo is one of most expensive cities in the world.'], 'Tokyo is one of the most expensive cities in the world.', 'one of the most + danh từ số nhiều (cities)', 'err_cs_one_of_plural'),
  err('Find the error: His test score is gooder than mine.', ['His test score is better than mine.', 'His test score is gooder than mine.', 'His test score is more good than mine.'], 'His test score is better than mine.', 'Bất quy tắc: good -> better (không có gooder)', 'err_cs_gooder'),
  err('Find the error: Learning Japanese is more difficult as learning Spanish.', ['Learning Japanese is more difficult than learning Spanish.', 'Learning Japanese is more difficult as learning Spanish.', 'Learning Japanese is more difficult from learning Spanish.'], 'Learning Japanese is more difficult than learning Spanish.', 'So sánh hơn: more ... THAN (không dùng as)', 'err_cs_than_as'),
];

// ── 28. PRESENT PERFECT CONTINUOUS (4 error items) ────────────────────────
export const PRESENT_PERFECT_CONTINUOUS_ERRORS = [
  err('Find the error: He has been work on this project since morning.', ['He has been working on this project since morning.', 'He has been work on this project since morning.', 'He has worked on this project since morning continuously.'], 'He has been working on this project since morning.', 'has been + V-ing (working)', 'err_ppc_been_working'),
  err('Find the error: Why are your hands dirty? — I have been paint the wall.', ['Why are your hands dirty? — I have been painting the wall.', 'Why are your hands dirty? — I have been paint the wall.', 'Why are your hands dirty? — I have paint the wall.'], 'Why are your hands dirty? — I have been painting the wall.', 'have been + V-ing (painting)', 'err_ppc_been_painting'),
  err('Find the error: How long has you been waiting for the bus?', ['How long have you been waiting for the bus?', 'How long has you been waiting for the bus?', 'How long are you waiting for the bus?'], 'How long have you been waiting for the bus?', 'you -> have', 'err_ppc_have_you'),
  err('Find the error: It has been raining continuous all morning.', ['It has been raining continuously all morning.', 'It has been raining continuous all morning.', 'It has continuous been raining all morning.'], 'It has been raining continuously all morning.', 'Trạng từ continuously bổ nghĩa cho raining', 'err_ppc_continuously'),
];

// ── 29. MODALS ABILITY (4 error items) ────────────────────────────────────
export const MODALS_ABILITY_ERRORS = [
  err('Find the error: She could to swim across the river when she was ten.', ['She could swim across the river when she was ten.', 'She could to swim across the river when she was ten.', 'She can to swim across the river when she was ten.'], 'She could swim across the river when she was ten.', 'could + V_base (không có to)', 'err_mabil_could_to'),
  err('Find the error: I will be able to speaking French fluently next year.', ['I will be able to speak French fluently next year.', 'I will be able to speaking French fluently next year.', 'I will can speak French fluently next year.'], 'I will be able to speak French fluently next year.', 'be able to + V_base (speak)', 'err_mabil_able_to_speak'),
  err('Find the error: He managed to fixing the leaking roof despite the storm.', ['He managed to fix the leaking roof despite the storm.', 'He managed to fixing the leaking roof despite the storm.', 'He managed fix the leaking roof despite the storm.'], 'He managed to fix the leaking roof despite the storm.', 'manage TO + V_base (fix)', 'err_mabil_manage_to_fix'),
  err('Find the error: Can you to lift this heavy box by yourself?', ['Can you lift this heavy box by yourself?', 'Can you to lift this heavy box by yourself?', 'Could you to lift this heavy box by yourself?'], 'Can you lift this heavy box by yourself?', 'Can + S + V_base', 'err_mabil_can_to_lift'),
];

// Export mapping for batch4
export const FRESH_BATCH4 = {
  'emphasis-structures': EMPHASIS_ERRORS,
  'grammatical-collocations': GRAMMATICAL_COLLOCATIONS_ERRORS,
  'modals-permission': MODALS_PERMISSION_ERRORS,
  'conjunctions-linking': CONJUNCTIONS_LINKING_ERRORS,
  causative: CAUSATIVE_ERRORS,
  'cleft-sentences': CLEFT_SENTENCES_ERRORS,
  subjunctive: SUBJUNCTIVE_ERRORS,
  'advanced-relative-clauses': ADVANCED_RELATIVE_CLAUSES_ERRORS,
  'past-perfect': PAST_PERFECT_ERRORS,
  'wh-questions': WH_QUESTIONS_ERRORS,
  'future-perfect': FUTURE_PERFECT_ERRORS,
  'adjectives-basic': ADJECTIVES_BASIC_ERRORS,
  'modals-deduction': MODALS_DEDUCTION_ERRORS,
  'future-in-the-past': FUTURE_IN_THE_PAST_ERRORS,
  'future-continuous': FUTURE_CONTINUOUS_ERRORS,
  'phrasal-verbs': PHRASAL_VERBS_ERRORS,
  'ellipsis-substitution': ELLIPSIS_SUBSTITUTION_ERRORS,
  'advanced-passive': ADVANCED_PASSIVE_ERRORS,
  'discourse-markers': DISCOURSE_MARKERS_ERRORS,
  nominalisation: NOMINALISATION_ERRORS,
  'modals-advice': MODALS_ADVICE_ERRORS,
  'participle-clauses': PARTICIPLE_CLAUSES_ERRORS,
  'question-tags': QUESTION_TAGS_ERRORS,
  'hedging-language': HEDGING_LANGUAGE_ERRORS,
  'prepositions-place': PREPOSITIONS_PLACE_ERRORS,
  imperatives: IMPERATIVES_ERRORS,
  'comparatives-superlatives': COMPARATIVES_SUPERLATIVES_ERRORS,
  'present-perfect-continuous': PRESENT_PERFECT_CONTINUOUS_ERRORS,
  'modals-ability': MODALS_ABILITY_ERRORS,
};

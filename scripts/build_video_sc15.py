import json
import os

RAW_CUES_PATH = 'tmp/raw-cues.json'
TARGET_DETAIL_PATH = 'src/data/listening/details/video-sc-15.json'
INDEX_PATH = 'src/data/listening/videos-index.json'
VIDEOS_PATH = 'src/data/listening/videos.json'

with open(RAW_CUES_PATH, 'r', encoding='utf-8') as f:
    raw_cues = json.load(f)

# High quality, natural Vietnamese translations for all 117 verbatim cues
vi_translations = [
    "Xin chào, tôi là Savannah. Chào mừng các bạn đến với Oxford Online English!",
    "Bạn biết đấy, tôi nghĩ nên cho phép hút thuốc ở nơi công cộng khắp mọi nơi, kể cả trên máy bay.",
    "Cái gì cơ? Tôi không đồng ý đâu.",
    "Tôi nghĩ trẻ em nên nghỉ học từ năm 13 tuổi. Giáo dục bậc cao chỉ tốn thời gian.",
    "Tôi không đồng ý.",
    "Mọi người ngày nay làm việc chưa đủ chăm chỉ. Mọi người nên làm việc nhiều giờ hơn.",
    "Tôi không đồng ý. Còn bạn thì sao? Bạn có đồng ý với các 'quan điểm' của chúng tôi không?",
    "Tất nhiên đó không phải là quan điểm thật sự của chúng tôi rồi!",
    "Nếu bạn không đồng ý, làm thế nào để diễn đạt điều này? Tất nhiên bạn có thể nói 'Tôi không đồng ý',",
    "nhưng nếu bạn muốn thẳng thắn hơn, hoặc khéo léo hơn, hoặc khi bạn không",
    "chắc chắn 100%? Ngay cả với tình huống đơn giản như phản bác, có rất nhiều cách diễn đạt khác nhau bạn có thể dùng.",
    "Video này nằm trong chuỗi bài học 'Level Up', nơi bạn có thể học đa dạng ngôn ngữ để nâng tầm",
    "tiếng Anh giao tiếp hàng ngày của mình! Đừng quên xem thêm các video khác trong chuỗi bài này nhé.",
    "Ngoài ra, bạn có muốn thêm bài học tiếng Anh miễn phí không? Hãy truy cập website của chúng tôi: Oxford",
    "Online English chấm com. Bạn cũng có thể đặt lịch học với các giáo viên có chứng chỉ chuyên môn, những người có thể",
    "giúp bạn luyện nói, luyện viết tiếng Anh, luyện thi IELTS hoặc bất kỳ nhu cầu nào khác.",
    "Nào, cùng bắt đầu thôi!",
    "Oa! Bộ phim thật tuyệt vời! Thật sao? Tôi không nghĩ vậy đâu.",
    "Bạn không thích à? Sao thế? Tôi thấy nó nhàm chán lắm, tiết tấu chậm ơi là chậm.",
    "Tôi phải phản bác bạn rồi. Tôi thấy phim cực kỳ cuốn hút đấy chứ.",
    "Một cách đơn giản để không đồng tình là nói 'I don't think so'. Đây là cách nói trung tính – nó",
    "không quá gay gắt, không quá trực diện – bạn có thể dùng trong rất nhiều ngữ cảnh.",
    "Tất nhiên, bạn cũng có thể phản bác đơn giản: nói 'I disagree' hoặc 'I disagree with you'.",
    "Tuy nhiên, nếu chỉ nói mỗi 'I disagree' thì nghe có vẻ cộc lốc, nên không phải lúc nào",
    "cũng phù hợp. Câu 'I have to disagree with you' là một lựa chọn nhẹ nhàng, gián tiếp hơn một chút.",
    "Bạn cũng có thể thêm trạng từ vào các cụm từ này để nhấn mạnh. Ví dụ, thay vì nói 'I disagree with",
    "you', bạn có thể nói 'I completely disagree with you' hoặc 'I totally disagree with you'.",
    "Đừng quên kiểm tra quy định thị thực nhé. Bạn cần xin visa trước đấy.",
    "Chưa chắc đâu. Tôi cũng từng nghĩ vậy, nhưng họ vừa đổi quy định năm ngoái rồi.",
    "Thật á? Tôi cứ tưởng ai cũng cần visa chứ.",
    "Không hẳn. Nếu bạn ở lại dưới mười ngày thì diện du lịch không cần visa nữa đâu.",
    "'Not necessarily' và 'not quite' đều là những cách bất đồng ý kiến rất hữu ích.",
    "Tại sao chúng lại hữu ích đến vậy? Có hai lý do chính.",
    "Thứ nhất, bạn không cần dùng trợ động từ. Vì thế,",
    "bạn không phải bận tâm về dạng động từ mà người đối diện vừa nói. Bạn có thể dùng",
    "các cụm này để phản bác các câu ở bất kỳ thì nào mà không cần lo lắng về ngữ pháp.",
    "Thứ hai, đây là những cách phản bác vừa trung tính vừa lịch sự.",
    "'Not necessarily' và 'not quite' đều gợi ý rằng người đối diện không hoàn toàn sai.",
    "Bạn cũng có thể nói 'not exactly', cụm này cũng mang ý nghĩa tương tự.",
    "Tôi nên chọn cái nào đây? Cái màu đỏ nhỉ? Tôi thấy",
    "chúng đẹp hơn nhiều. Hừm… tôi không chắc lắm đâu.",
    "Tôi thấy cái màu xanh hợp với bạn hơn. Thật sao? Chúng hơi trang trọng quá so với tôi.",
    "Tôi không nghĩ vậy đâu. Tôi thấy bạn có thể mặc cùng quần jeans mà.",
    "Đôi khi, bạn muốn phản bác một cách gián tiếp hơn, để lịch sự hoặc tránh làm tổn thương",
    "cảm xúc của người khác. Hoặc có thể bạn muốn thể hiện rằng mình chưa chắc chắn 100% về ý kiến của mình.",
    "Những cụm như 'I'm not so sure' hoặc 'I wouldn't say so' thể hiện sự bất đồng gián tiếp hơn.",
    "Chúng hàm chứa sự dè dặt, chưa hoàn toàn chắc chắn.",
    "Sydney là thủ đô của Úc. Bạn sai rồi, Canberra mới đúng.",
    "Canberra á? Chưa nghe bao giờ. Là Sydney cơ. Bạn chẳng biết mình đang nói gì cả!",
    "Ở đây, bạn vừa thấy một số cách phản bác thẳng thắn, trực diện hơn!",
    "Nói 'you're wrong' thì cực kỳ thẳng thừng cộc lốc, nhưng bạn có thể dùng trong trò chuyện thân mật,",
    "hoặc để biểu lộ cảm xúc bức xúc. Sử dụng cách nói trực diện",
    "như thế này có thể thể hiện rằng bạn đang cảm thấy bực mình hoặc khó chịu.",
    "Câu 'You don't know what you're talking about' cũng tương tự – nó rất thẳng thừng.",
    "Bạn có thể dùng với bạn bè thân thiết, hoặc nói đùa, nhưng trong ngữ cảnh khác có thể bị coi là thô lỗ.",
    "Mê giai điệu này quá! Hay tuyệt! Bạn nói nghiêm túc đấy à? Nó như rác rưởi vậy!",
    "Chắc là do gu âm nhạc của bạn kém thôi.",
    "Biết nói sao đây? Gu của *tôi* kém cơ đấy…",
    "Chà, biết nói sao nhỉ? Chín người mười ý, mỗi người một sở thích mà.",
    "'Are you serious?' là một cách phản bác trực tiếp khác – có thể hơi khiếm nhã. Nếu bạn",
    "muốn thứ gì đó còn gay gắt hơn, bạn có thể nói 'Are you crazy?' hoặc 'Are you drunk?'",
    "Ở cuối đoạn hội thoại, bạn nghe thấy cụm từ: different strokes for different folks.",
    "Cụm từ này có nghĩa là gì?",
    "Cụm này có nghĩa là mỗi người có sở thích, quan điểm khác nhau, và điều đó hoàn toàn ổn. Khi dùng cụm này,",
    "bạn đang ngụ ý rằng mình không đồng tình, nhưng cũng không muốn tranh cãi sâu thêm nữa.",
    "Đây là một câu giao tiếp khẩu ngữ, nên thường chỉ dùng trong các tình huống thân mật thường ngày.",
    "Trong đoạn đối thoại tiếp theo, bạn sẽ nghe thấy một cụm từ mang ý nghĩa tương tự. Hãy thử tìm xem nhé!",
    "Bạn lại mua điện thoại Android nữa à? Sao thế? Tôi tưởng bạn định mua iPhone chứ.",
    "Ừ… Cuối cùng tôi thấy nó không đáng số tiền chênh lệch thêm.",
    "Tôi thì thấy hoàn toàn trái ngược đấy. iPhone đáng giá đến từng đồng!",
    "Thôi thì, chắc là tôi có quan điểm khác.",
    "Đáng lẽ bạn nên mua điện thoại Apple. Những tính năng bạn có được…",
    "Này, có lẽ chúng ta nên chấp nhận bất đồng ý kiến thôi, được chứ?",
    "Bạn có nghe thấy cụm từ nào mang nghĩa tương tự như",
    "'different strokes for different folks' không?",
    "Đó chính là câu 'We should just agree to disagree'. Một lần nữa, câu này ngụ ý bạn và người đối diện",
    "có góc nhìn khác nhau, và chẳng ích gì khi tiếp tục tranh luận thêm nữa.",
    "Bạn có thể dùng câu này theo nhiều cách khác nhau. Ví dụ,",
    "bạn có thể nói 'Let's just agree to disagree', hoặc 'Why don't we agree to disagree?'",
    "Còn một cụm từ nữa trong đoạn hội thoại dùng để bày tỏ sự bất đồng. Bạn có nhớ không?",
    "Đó là câu 'I'd say the exact opposite'.",
    "Cách nói này rất hữu ích, vì nó thể hiện sự phản đối mạnh mẽ nhưng vẫn giữ được sự lịch thiệp.",
    "Bạn sẽ nghe một cụm từ lịch sự khác trong đoạn hội thoại tới. Hãy chú ý lắng nghe nhé!",
    "Bạn đã xem trung tâm thương mại mới mà họ đang xây chưa?",
    "Rồi, trông gớm ghiếc thật đấy nhỉ? Không hiểu họ đang nghĩ cái gì nữa?",
    "Bạn nghĩ vậy sao? Tôi xin phép được phản bác nhé. Tôi nghĩ khi hoàn thành nó sẽ đẹp hơn đấy.",
    "Nó chẳng ăn nhập gì với kiến trúc xung quanh cả, trông quá hiện đại.",
    "Tôi hiểu ý bạn, nhưng bạn đâu thể xây dựng mọi thứ theo một phong cách mãi mãi được.",
    "Bạn có tìm thấy cụm từ đó chưa?",
    "'I beg to differ' là một cách nói trang trọng, rất lịch sự để bày tỏ sự bất đồng. Bạn thường",
    "dùng trong các tình huống trang trọng. Trong trò chuyện suồng sã, nghe nó có vẻ hơi kỳ cục.",
    "Thông thường, bạn bày tỏ sự không đồng tình bằng cách dùng cụm từ thể hiện mình đồng cảm/lắng nghe,",
    "và sau đó thêm từ 'but' (nhưng).",
    "Trong đoạn đối thoại, bạn đã nghe 'I take your point, but...'.",
    "Bạn có thể làm vậy nếu bạn đồng ý một phần với ý kiến của họ, nhưng không đồng tình các phần khác. Hoặc,",
    "bạn có thể dùng cách này để giữ lịch sự, hoặc tránh dùng ngôn từ quá trực diện.",
    "Bạn có thể dùng các động từ khác thay cho 'take' ở đây.",
    "Bạn có thể nói 'I see your point, but...' hoặc 'I understand your point, but...'.",
    "Bạn sẽ thấy thêm nhiều ví dụ như thế này trong đoạn đối thoại tiếp theo. Hãy thử tìm nhé!",
    "Vậy chọn cái nào? Tôi nghĩ chúng ta nên lấy chiếc ghế sofa hình chữ L. Nó thoải mái hơn nhiều.",
    "Tôi hiểu bạn đang nói gì, nhưng tôi nghĩ nó quá to so với phòng khách của chúng ta.",
    "Chúng ta sẽ chẳng còn chỗ cho thứ gì khác. Tôi nghĩ sẽ vừa mà. Thế bạn nghĩ",
    "chúng ta nên chọn cái nào? Đừng nói là cái màu xanh lá nhé… À thì… giá tốt mà dáng sofa cũng đẹp.",
    "Được rồi, nhưng màu sắc nhìn phát gớm! Tôi không muốn ngày nào cũng phải nhìn thấy nó đâu.",
    "Bạn có nghe thấy chúng không?",
    "Bạn vừa nghe thấy 'I get what you're saying, but...' và 'OK, but...'.",
    "Những cách này rất hữu ích khi phản bác; bạn thể hiện rằng mình thấu hiểu",
    "góc nhìn của người kia, nhưng quan điểm của bạn thì khác.",
    "Như vậy, bạn vừa được học rất nhiều cách diễn đạt khác nhau để bày tỏ sự bất đồng.",
    "Hãy xem bạn ghi nhớ được những gì nhé! Cố gắng hoàn thành các câu trong bài học nào.",
    "Hãy tạm dừng video và thử điền đủ các cụm từ nhé. Bạn có trả lời đúng cả 8 câu không?",
    "Bạn làm bài thế nào? Cùng xem đáp án nhé.",
    "Bạn có đúng hết không? Lần tới khi trò chuyện bằng tiếng Anh và muốn bày tỏ sự bất đồng,",
    "hãy nhớ áp dụng các cụm từ này nhé. Ngay cả cho một mục đích đơn giản như nói 'Tôi không đồng ý',",
    "vẫn có rất nhiều cách diễn đạt phong phú mà bạn có thể lựa chọn.",
    "Hy vọng bạn thích bài học này. Cảm ơn bạn đã theo dõi!",
    "Hẹn gặp lại các bạn lần sau!"
]

assert len(vi_translations) == len(raw_cues), f"Mismatch: {len(vi_translations)} translations vs {len(raw_cues)} cues"

transcript = []
for i, cue in enumerate(raw_cues):
    transcript.append({
        "id": f"video-sc-15-cue-{i + 1}",
        "start": round(cue["start"], 2),
        "end": round(cue["end"], 2),
        "en": cue["text"],
        "vi": vi_translations[i]
    })

core_vocabulary = [
    {
        "word": "diplomatic",
        "phonetic": "/ˌdɪp.ləˈmæt.ɪk/",
        "viDefinition": "khéo léo, mang tính ngoại giao, tránh gây mất lòng",
        "contextSentence": "If you want to disagree diplomatically, soften your tone with polite introductory phrases."
    },
    {
        "word": "disagree",
        "phonetic": "/ˌdɪs.əˈɡriː/",
        "viDefinition": "bất đồng quan điểm, không đồng ý",
        "contextSentence": "Even for simple functions like disagreeing, there is a lot of different language you can use."
    },
    {
        "word": "viewpoint",
        "phonetic": "/ˈvjuː.pɔɪnt/",
        "viDefinition": "quan điểm, góc nhìn cá nhân",
        "contextSentence": "I respect your viewpoint, though I arrived at a different conclusion after reviewing the data."
    },
    {
        "word": "opposite",
        "phonetic": "/ˈɒp.ə.zɪt/",
        "viDefinition": "đối lập, hoàn toàn trái ngược",
        "contextSentence": "I would say the exact opposite: this investment will yield substantial long-term value."
    }
]

cloze_items = [
    {
        "id": "video-sc-15-cloze-1",
        "cueId": "video-sc-15-cue-10",
        "sentence": "but what if you want to be more direct, or more {{blank}}, or if you aren’t",
        "blankWord": "diplomatic",
        "hintVi": "Nghĩa gợi ý: khéo léo, mang tính ngoại giao, tránh mất lòng",
        "timestamp": 43.12,
        "options": ["diplomatic", "aggressive", "confused", "careless"]
    },
    {
        "id": "video-sc-15-cloze-2",
        "cueId": "video-sc-15-cue-59",
        "sentence": "Well, what can I say? Different {{blank}} for different folks, I suppose.",
        "blankWord": "strokes",
        "hintVi": "Nghĩa gợi ý: thành ngữ 'chín người mười ý, mỗi người một sở thích'",
        "timestamp": 296.56,
        "options": ["strokes", "habits", "people", "customs"]
    },
    {
        "id": "video-sc-15-cloze-3",
        "cueId": "video-sc-15-cue-81",
        "sentence": "It was ‘I’d say the exact {{blank}}.’",
        "blankWord": "opposite",
        "hintVi": "Nghĩa gợi ý: hoàn toàn trái ngược, đối lập",
        "timestamp": 406.96,
        "options": ["opposite", "identical", "standard", "problem"]
    },
    {
        "id": "video-sc-15-cloze-4",
        "cueId": "video-sc-15-cue-90",
        "sentence": "‘I beg to {{blank}}’ is a formal, very polite phrase to express disagreement.",
        "blankWord": "differ",
        "hintVi": "Nghĩa gợi ý: xin phép được bất đồng ý kiến (thành ngữ trang trọng)",
        "timestamp": 446.32,
        "options": ["differ", "agree", "argue", "listen"]
    }
]

comprehension_questions = [
    {
        "id": "video-sc-15-q1",
        "question": "Why does Savannah say phrases like 'Not necessarily' and 'Not quite' are so useful when disagreeing?",
        "options": [
            "They do not require an auxiliary verb and sound polite, neutral, and gentle.",
            "They force the conversation partner to immediately concede defeat in an argument.",
            "They require complex subjunctive grammar and past perfect auxiliary tenses.",
            "They should strictly only be used in academic written essays, not in conversation."
        ],
        "correctIndex": 0,
        "explanation": "Ở mốc 02:56 (cue 34-38), Savannah giải thích hai lý do: thứ nhất không cần bận tâm trợ động từ hay thì ngữ pháp, thứ hai chúng là cách phản bác trung tính và lịch sự.",
        "timestampSeek": 172.56
    },
    {
        "id": "video-sc-15-q2",
        "question": "What is the meaning of the conversational idiom 'Different strokes for different folks'?",
        "options": [
            "People naturally have different tastes and preferences, and that is completely fine.",
            "Athletes must perform identical swimming techniques to qualify for competition.",
            "The conversation has become hostile and the relationship is permanently broken.",
            "Both speakers agree 100% on every single topic being discussed."
        ],
        "correctIndex": 0,
        "explanation": "Ở mốc 05:23 (cue 64), diễn giả chỉ ra thành ngữ này có nghĩa là mỗi người có sở thích và quan điểm riêng, ngụ ý chấp nhận khác biệt mà không cần tiếp tục tranh luận.",
        "timestampSeek": 323.36
    },
    {
        "id": "video-sc-15-q3",
        "question": "When is it most appropriate to use the phrase 'Let's just agree to disagree'?",
        "options": [
            "When both people realize they have opposing viewpoints and continuing to debate is pointless.",
            "When you want to prove the other speaker factually wrong using numerical statistics.",
            "When introducing yourself for the very first time at a job interview.",
            "When you want to enthusiastically endorse everything the other person suggested."
        ],
        "correctIndex": 0,
        "explanation": "Ở mốc 06:16 (cue 76-77), diễn giả nêu rõ 'agree to disagree' được dùng khi hai bên chấp nhận sự khác biệt ý kiến và dừng tranh luận để giữ hòa khí.",
        "timestampSeek": 376.56
    },
    {
        "id": "video-sc-15-q4",
        "question": "In what communicative setting would you most naturally say 'I beg to differ'?",
        "options": [
            "In formal or respectful professional settings where you want to disagree with utmost politeness.",
            "In casual slang conversations with childhood friends while hanging out.",
            "When ordering groceries at a fast-paced supermarket checkout line.",
            "When you could not hear what the other speaker said and want them to repeat."
        ],
        "correctIndex": 0,
        "explanation": "Ở mốc 07:26 (cue 90-91), Savannah lưu ý 'I beg to differ' là cách nói trang trọng, rất lịch sự, phù hợp trong các tình huống trang trọng.",
        "timestampSeek": 446.32
    }
]

video_data = {
    "id": "video-sc-15",
    "youtubeId": "dJ4kPGdUShQ",
    "title": "Expressing Disagreement Without Being Rude",
    "channel": "Oxford Online English",
    "duration": 590,
    "durationDisplay": "09:50",
    "durationCategory": "short",
    "cefrLevel": "B1",
    "topic": "social_conversations",
    "topicDisplay": "Giao tiếp & Đời sống xã hội",
    "thumbnailUrl": "https://img.youtube.com/vi/dJ4kPGdUShQ/hqdefault.jpg",
    "description": "Học cách tranh luận và bày tỏ bất đồng quan điểm một cách lịch sự, tinh tế và văn minh qua các tình huống đối thoại thực tế từ Oxford Online English.",
    "coreVocabulary": core_vocabulary,
    "transcript": transcript,
    "exercises": {
        "clozeItems": cloze_items,
        "comprehensionQuestions": comprehension_questions
    },
    # Backwards compatibility fields
    "clozeItems": cloze_items,
    "comprehensionQuestions": comprehension_questions
}

# 1. Write detail file
with open(TARGET_DETAIL_PATH, 'w', encoding='utf-8') as f:
    json.dump(video_data, f, ensure_ascii=False, indent=2)
print(f"[OK] Updated {TARGET_DETAIL_PATH}")

# 2. Update videos-index.json
with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    index_data = json.load(f)

for item in index_data:
    if item['id'] == 'video-sc-15':
        item['youtubeId'] = video_data['youtubeId']
        item['title'] = video_data['title']
        item['channel'] = video_data['channel']
        item['duration'] = video_data['duration']
        item['durationDisplay'] = video_data['durationDisplay']
        item['durationCategory'] = video_data['durationCategory']
        item['thumbnailUrl'] = video_data['thumbnailUrl']
        item['description'] = video_data['description']
        item['coreVocabularyPreview'] = [c['word'] for c in core_vocabulary[:3]]
        item['coreVocabularyCount'] = len(core_vocabulary)
        item['transcriptCuesCount'] = len(transcript)
        item['clozeCount'] = len(cloze_items)
        item['quizCount'] = len(comprehension_questions)
        break

with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    json.dump(index_data, f, ensure_ascii=False, indent=2)
print(f"[OK] Updated {INDEX_PATH}")

# 3. Update videos.json
with open(VIDEOS_PATH, 'r', encoding='utf-8') as f:
    videos_list = json.load(f)

for i, item in enumerate(videos_list):
    if item['id'] == 'video-sc-15':
        videos_list[i] = video_data
        break

with open(VIDEOS_PATH, 'w', encoding='utf-8') as f:
    json.dump(videos_list, f, ensure_ascii=False, indent=2)
print(f"[OK] Updated {VIDEOS_PATH}")

print("[SUCCESS] Built and synchronized authentic video-sc-15 dataset!")


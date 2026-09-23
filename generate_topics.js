const fs = require('fs');
const path = require('path');

const baseDir = path.join('d:', 'Vibe', 'Vocab', 'web-app', 'src', 'data', 'speaking', 'topic-library', 'describing');
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true });
}

const filesData = {
    'objects-around-me.ts': {
        var_name: 'OBJECTS_AROUND_ME',
        category: 'describing',
        subcategory: 'objects-around-me',
        items: [
            {
                id: 'desc-obj-01',
                level: 'A1',
                titleEn: 'Things on my desk',
                titleVi: 'Những vật dụng trên bàn làm việc của tôi',
                icon: 'Monitor',
                situationVi: 'Bạn đang mô tả những vật dụng có trên bàn học/bàn làm việc của mình cho một người bạn. Bạn cần nói về tên của chúng, màu sắc và vị trí.',
                tags: ['objects', 'desk', 'work'],
                sampleDialogue: [
                    {speaker: 'A', text: 'What do you have on your desk?', textVi: 'Bạn có những gì trên bàn làm việc vậy?'},
                    {speaker: 'B', text: 'I have a laptop, a notebook, and some pens.', textVi: 'Tôi có một máy tính xách tay, một cuốn sổ và vài cây bút.'},
                    {speaker: 'A', text: 'Is it a messy desk?', textVi: 'Bàn của bạn có bừa bộn không?'},
                    {speaker: 'B', text: 'No, it is very clean and organized.', textVi: 'Không, nó rất sạch sẽ và gọn gàng.'}
                ],
                keyVocabulary: [
                    {term: 'laptop', ipa: '/ˈlæp.tɒp/', partOfSpeech: 'n.', meaningVi: 'máy tính xách tay', exampleEn: 'My laptop is on the desk.', exampleVi: 'Máy tính xách tay của tôi ở trên bàn.'},
                    {term: 'notebook', ipa: '/ˈnəʊt.bʊk/', partOfSpeech: 'n.', meaningVi: 'cuốn sổ', exampleEn: 'I write notes in my notebook.', exampleVi: 'Tôi viết ghi chú vào sổ của mình.'},
                    {term: 'pen', ipa: '/pen/', partOfSpeech: 'n.', meaningVi: 'cây bút', exampleEn: 'Can I borrow a pen?', exampleVi: 'Tôi có thể mượn một cây bút không?'},
                    {term: 'organized', ipa: '/ˈɔː.ɡən.aɪzd/', partOfSpeech: 'adj.', meaningVi: 'gọn gàng, có tổ chức', exampleEn: 'She is very organized.', exampleVi: 'Cô ấy rất gọn gàng.'},
                    {term: 'messy', ipa: '/ˈmes.i/', partOfSpeech: 'adj.', meaningVi: 'bừa bộn', exampleEn: 'His room is messy.', exampleVi: 'Phòng của anh ấy bừa bộn.'}
                ],
                usefulPhrases: [
                    {phrase: 'On the left/right side...', meaningVi: 'Ở bên trái/phải...'},
                    {phrase: 'Right in front of me...', meaningVi: 'Ngay trước mặt tôi...'},
                    {phrase: 'I keep my... here.', meaningVi: 'Tôi để... của mình ở đây.'},
                    {phrase: 'It helps me to...', meaningVi: 'Nó giúp tôi...'},
                    {phrase: 'I always have a... on my desk.', meaningVi: 'Tôi luôn có một... trên bàn.'}
                ],
                aiTutorPrompt: "You are a curious friend asking about the items on the user's desk. Ask simple questions about what they have, where things are placed, and what they use them for. Keep the language at A1 level."
            },
            {
                id: 'desc-obj-02',
                level: 'A1',
                titleEn: "What's in my bag/backpack",
                titleVi: 'Có gì trong túi/balo của tôi',
                icon: 'Briefcase',
                situationVi: 'Bạn vừa mua một chiếc balo mới và đang chỉ cho bạn bè xem bạn thường mang theo những gì. Bạn mô tả các món đồ thiết yếu hàng ngày.',
                tags: ['objects', 'bag', 'daily'],
                sampleDialogue: [
                    {speaker: 'A', text: 'Your new backpack looks nice. What is inside?', textVi: 'Balo mới của bạn trông đẹp đấy. Có gì bên trong vậy?'},
                    {speaker: 'B', text: 'Just my wallet, keys, and a water bottle.', textVi: 'Chỉ có ví, chìa khóa và một chai nước thôi.'},
                    {speaker: 'A', text: 'Do you carry an umbrella?', textVi: 'Bạn có mang theo ô không?'},
                    {speaker: 'B', text: 'Yes, I always keep a small umbrella in the side pocket.', textVi: 'Có, tôi luôn để một chiếc ô nhỏ ở ngăn bên hông.'}
                ],
                keyVocabulary: [
                    {term: 'wallet', ipa: '/ˈwɒl.ɪt/', partOfSpeech: 'n.', meaningVi: 'cái ví', exampleEn: 'I keep my money in my wallet.', exampleVi: 'Tôi để tiền trong ví.'},
                    {term: 'keys', ipa: '/kiːz/', partOfSpeech: 'n.', meaningVi: 'chìa khóa', exampleEn: "Don't forget your keys.", exampleVi: 'Đừng quên chìa khóa nhé.'},
                    {term: 'water bottle', ipa: '/ˈwɔː.tə ˌbɒt.əl/', partOfSpeech: 'n.', meaningVi: 'chai nước', exampleEn: 'I have a blue water bottle.', exampleVi: 'Tôi có một chai nước màu xanh.'},
                    {term: 'umbrella', ipa: '/ʌmˈbrel.ə/', partOfSpeech: 'n.', meaningVi: 'cái ô', exampleEn: 'Take an umbrella, it is raining.', exampleVi: 'Mang theo ô đi, trời đang mưa đấy.'},
                    {term: 'pocket', ipa: '/ˈpɒk.ɪt/', partOfSpeech: 'n.', meaningVi: 'ngăn, túi', exampleEn: 'Put it in your pocket.', exampleVi: 'Bỏ nó vào túi của bạn đi.'}
                ],
                usefulPhrases: [
                    {phrase: 'I usually carry...', meaningVi: 'Tôi thường mang theo...'},
                    {phrase: 'Inside my bag, there is...', meaningVi: 'Bên trong túi của tôi, có...'},
                    {phrase: 'I never leave home without...', meaningVi: 'Tôi không bao giờ ra khỏi nhà mà không có...'},
                    {phrase: 'It is very useful for...', meaningVi: 'Nó rất hữu ích cho việc...'},
                    {phrase: 'In the front pocket...', meaningVi: 'Ở ngăn trước...'}
                ],
                aiTutorPrompt: "You are a friend who wants to know what the user carries in their bag. Ask them to describe the items, their colors, and why they need them. Keep the language at A1 level."
            }
        ]
    },
    'rooms-spaces.ts': {
        var_name: 'ROOMS_SPACES',
        category: 'describing',
        subcategory: 'rooms-spaces',
        items: [
            {
                id: 'desc-room-01',
                level: 'A1',
                titleEn: 'My bedroom',
                titleVi: 'Phòng ngủ của tôi',
                icon: 'Bed',
                situationVi: 'Bạn đang mô tả phòng ngủ của mình cho một người bạn mới quen. Bạn nói về kích thước, màu sắc và những đồ nội thất chính.',
                tags: ['room', 'home', 'bedroom'],
                sampleDialogue: [
                    {speaker: 'A', text: 'Is your bedroom big?', textVi: 'Phòng ngủ của bạn có lớn không?'},
                    {speaker: 'B', text: 'No, it is quite small but very cozy.', textVi: 'Không, nó khá nhỏ nhưng rất ấm cúng.'},
                    {speaker: 'A', text: 'What color are the walls?', textVi: 'Tường màu gì?'},
                    {speaker: 'B', text: 'The walls are light blue, and I have a white bed.', textVi: 'Tường màu xanh nhạt, và tôi có một chiếc giường màu trắng.'}
                ],
                keyVocabulary: [
                    {term: 'cozy', ipa: '/ˈkəʊ.zi/', partOfSpeech: 'adj.', meaningVi: 'ấm cúng', exampleEn: 'My room is very cozy.', exampleVi: 'Phòng của tôi rất ấm cúng.'},
                    {term: 'bed', ipa: '/bed/', partOfSpeech: 'n.', meaningVi: 'giường', exampleEn: 'I sleep in a big bed.', exampleVi: 'Tôi ngủ trên một chiếc giường lớn.'},
                    {term: 'wardrobe', ipa: '/ˈwɔː.drəʊb/', partOfSpeech: 'n.', meaningVi: 'tủ quần áo', exampleEn: 'My clothes are in the wardrobe.', exampleVi: 'Quần áo của tôi ở trong tủ.'},
                    {term: 'curtain', ipa: '/ˈkɜː.tən/', partOfSpeech: 'n.', meaningVi: 'rèm cửa', exampleEn: 'Open the curtains, please.', exampleVi: 'Làm ơn mở rèm ra.'},
                    {term: 'pillow', ipa: '/ˈpɪl.əʊ/', partOfSpeech: 'n.', meaningVi: 'cái gối', exampleEn: 'I need a soft pillow.', exampleVi: 'Tôi cần một cái gối mềm.'}
                ],
                usefulPhrases: [
                    {phrase: 'My room is...', meaningVi: 'Phòng của tôi thì...'},
                    {phrase: 'There is a bed next to...', meaningVi: 'Có một cái giường bên cạnh...'},
                    {phrase: 'On the wall, I have...', meaningVi: 'Trên tường, tôi có...'},
                    {phrase: 'I like my room because...', meaningVi: 'Tôi thích phòng của mình vì...'},
                    {phrase: 'It is my favorite place to...', meaningVi: 'Đó là nơi yêu thích của tôi để...'}
                ],
                aiTutorPrompt: "You are asking the user about their bedroom. Ask them about the furniture, the colors, and if they like their room. Keep it simple (A1 level)."
            }
        ]
    },
    'people-appearance.ts': {
        var_name: 'PEOPLE_APPEARANCE',
        category: 'describing',
        subcategory: 'people-appearance',
        items: [
            {
                id: 'desc-ppl-01',
                level: 'A1',
                titleEn: 'Describing a family member',
                titleVi: 'Mô tả một thành viên trong gia đình',
                icon: 'User',
                situationVi: 'Bạn đang kể cho một người bạn nghe về một người thân trong gia đình mình, mô tả ngoại hình và tính cách cơ bản của họ.',
                tags: ['people', 'family', 'appearance'],
                sampleDialogue: [
                    {speaker: 'A', text: 'Who do you look like in your family?', textVi: 'Bạn trông giống ai trong gia đình?'},
                    {speaker: 'B', text: 'I look like my father. We both have brown eyes.', textVi: 'Tôi giống bố tôi. Chúng tôi đều có mắt nâu.'},
                    {speaker: 'A', text: 'Is he tall?', textVi: 'Ông ấy có cao không?'},
                    {speaker: 'B', text: 'Yes, he is very tall and has short black hair.', textVi: 'Có, ông ấy rất cao và có mái tóc đen ngắn.'}
                ],
                keyVocabulary: [
                    {term: 'tall', ipa: '/tɔːl/', partOfSpeech: 'adj.', meaningVi: 'cao', exampleEn: 'My brother is tall.', exampleVi: 'Anh trai tôi cao.'},
                    {term: 'short', ipa: '/ʃɔːt/', partOfSpeech: 'adj.', meaningVi: 'thấp, ngắn', exampleEn: 'She has short hair.', exampleVi: 'Cô ấy có mái tóc ngắn.'},
                    {term: 'handsome', ipa: '/ˈhæn.səm/', partOfSpeech: 'adj.', meaningVi: 'đẹp trai', exampleEn: 'He is a handsome man.', exampleVi: 'Anh ấy là một người đàn ông đẹp trai.'},
                    {term: 'beautiful', ipa: '/ˈbjuː.tɪ.fəl/', partOfSpeech: 'adj.', meaningVi: 'xinh đẹp', exampleEn: 'My mother is beautiful.', exampleVi: 'Mẹ tôi xinh đẹp.'},
                    {term: 'eyes', ipa: '/aɪz/', partOfSpeech: 'n.', meaningVi: 'đôi mắt', exampleEn: 'She has blue eyes.', exampleVi: 'Cô ấy có đôi mắt xanh dương.'}
                ],
                usefulPhrases: [
                    {phrase: 'He/She is quite tall.', meaningVi: 'Anh ấy/Cô ấy khá cao.'},
                    {phrase: 'He/She has brown eyes.', meaningVi: 'Anh ấy/Cô ấy có mắt nâu.'},
                    {phrase: 'We look similar.', meaningVi: 'Chúng tôi trông giống nhau.'},
                    {phrase: 'She is a very kind person.', meaningVi: 'Cô ấy là một người rất tốt bụng.'},
                    {phrase: 'He wears glasses.', meaningVi: 'Anh ấy đeo kính.'}
                ],
                aiTutorPrompt: "You are talking to the user about their family. Ask them to describe a family member's physical appearance. Keep it to A1 level."
            }
        ]
    },
    'pictures-photos.ts': {
        var_name: 'PICTURES_PHOTOS',
        category: 'describing',
        subcategory: 'pictures-photos',
        items: [
            {
                id: 'desc-pic-01',
                level: 'A1',
                titleEn: 'A street scene with people walking',
                titleVi: 'Cảnh đường phố với người đi bộ',
                icon: 'Image',
                situationVi: 'Bạn đang xem một bức ảnh chụp cảnh đường phố nhộn nhịp và mô tả những gì bạn thấy trong ảnh cho một người khác.',
                tags: ['picture', 'street', 'city'],
                sampleDialogue: [
                    {speaker: 'A', text: 'What can you see in this picture?', textVi: 'Bạn thấy gì trong bức ảnh này?'},
                    {speaker: 'B', text: 'I see many people walking on the street.', textVi: 'Tôi thấy nhiều người đang đi bộ trên phố.'},
                    {speaker: 'A', text: 'What is the weather like?', textVi: 'Thời tiết thế nào?'},
                    {speaker: 'B', text: 'It is sunny and the sky is blue.', textVi: 'Trời nắng và bầu trời trong xanh.'}
                ],
                keyVocabulary: [
                    {term: 'street', ipa: '/striːt/', partOfSpeech: 'n.', meaningVi: 'con đường', exampleEn: 'The street is very busy.', exampleVi: 'Con đường này rất đông đúc.'},
                    {term: 'walk', ipa: '/wɔːk/', partOfSpeech: 'v.', meaningVi: 'đi bộ', exampleEn: 'People are walking to work.', exampleVi: 'Mọi người đang đi bộ đi làm.'},
                    {term: 'building', ipa: '/ˈbɪl.dɪŋ/', partOfSpeech: 'n.', meaningVi: 'tòa nhà', exampleEn: 'There are tall buildings.', exampleVi: 'Có những tòa nhà cao tầng.'},
                    {term: 'busy', ipa: '/ˈbɪz.i/', partOfSpeech: 'adj.', meaningVi: 'đông đúc, bận rộn', exampleEn: 'It is a busy street.', exampleVi: 'Đó là một con đường đông đúc.'},
                    {term: 'sunny', ipa: '/ˈsʌn.i/', partOfSpeech: 'adj.', meaningVi: 'có nắng', exampleEn: 'It is a sunny day.', exampleVi: 'Đó là một ngày nắng.'}
                ],
                usefulPhrases: [
                    {phrase: 'In this picture, I can see...', meaningVi: 'Trong bức ảnh này, tôi có thể thấy...'},
                    {phrase: 'There are many people...', meaningVi: 'Có rất nhiều người...'},
                    {phrase: 'On the left side of the picture...', meaningVi: 'Ở bên trái bức ảnh...'},
                    {phrase: 'In the background...', meaningVi: 'Ở phía sau/nền...'},
                    {phrase: 'They seem to be...', meaningVi: 'Họ có vẻ như đang...'}
                ],
                aiTutorPrompt: "You are looking at a picture of a street scene with the user. Ask them basic questions about what they see in the picture (people, buildings, weather). Keep it at A1 level."
            }
        ]
    },
    'food-drinks.ts': {
        var_name: 'FOOD_DRINKS',
        category: 'describing',
        subcategory: 'food-drinks',
        items: [
            {
                id: 'desc-food-01',
                level: 'A1',
                titleEn: 'Describing a bowl of pho',
                titleVi: 'Mô tả một bát phở',
                icon: 'Coffee',
                situationVi: 'Bạn đang mô tả món Phở của Việt Nam cho một người bạn nước ngoài, bao gồm các thành phần và hương vị.',
                tags: ['food', 'pho', 'vietnamese'],
                sampleDialogue: [
                    {speaker: 'A', text: 'What is pho?', textVi: 'Phở là món gì vậy?'},
                    {speaker: 'B', text: 'It is a traditional Vietnamese noodle soup.', textVi: 'Nó là một món súp mì truyền thống của Việt Nam.'},
                    {speaker: 'A', text: 'What is in it?', textVi: 'Trong đó có những gì?'},
                    {speaker: 'B', text: 'It has beef, rice noodles, and hot soup.', textVi: 'Nó có thịt bò, bánh phở và nước dùng nóng.'}
                ],
                keyVocabulary: [
                    {term: 'noodles', ipa: '/ˈnuː.dəlz/', partOfSpeech: 'n.', meaningVi: 'mì, bún, phở', exampleEn: 'I like eating noodles.', exampleVi: 'Tôi thích ăn mì.'},
                    {term: 'beef', ipa: '/biːf/', partOfSpeech: 'n.', meaningVi: 'thịt bò', exampleEn: 'This pho has beef.', exampleVi: 'Bát phở này có thịt bò.'},
                    {term: 'soup', ipa: '/suːp/', partOfSpeech: 'n.', meaningVi: 'nước súp, canh', exampleEn: 'The soup is very hot.', exampleVi: 'Nước súp rất nóng.'},
                    {term: 'delicious', ipa: '/dɪˈlɪʃ.əs/', partOfSpeech: 'adj.', meaningVi: 'ngon miệng', exampleEn: 'Pho is delicious.', exampleVi: 'Phở rất ngon.'},
                    {term: 'bowl', ipa: '/bəʊl/', partOfSpeech: 'n.', meaningVi: 'cái bát, tô', exampleEn: 'I want a big bowl of pho.', exampleVi: 'Tôi muốn một tô phở lớn.'}
                ],
                usefulPhrases: [
                    {phrase: 'Pho is a famous dish in Vietnam.', meaningVi: 'Phở là một món ăn nổi tiếng ở Việt Nam.'},
                    {phrase: 'It tastes delicious.', meaningVi: 'Nó có vị rất ngon.'},
                    {phrase: 'You should try it with lime.', meaningVi: 'Bạn nên thử nó với chanh.'},
                    {phrase: 'It has a very nice smell.', meaningVi: 'Nó có mùi rất thơm.'},
                    {phrase: 'I usually eat pho for breakfast.', meaningVi: 'Tôi thường ăn phở vào bữa sáng.'}
                ],
                aiTutorPrompt: "You are a foreigner who has never tried pho. Ask the user about what it is, what is in it, and how it tastes. Use simple A1 English."
            }
        ]
    },
    'weather-nature.ts': {
        var_name: 'WEATHER_NATURE',
        category: 'describing',
        subcategory: 'weather-nature',
        items: [
            {
                id: 'desc-wea-01',
                level: 'A1',
                titleEn: 'Sunny day',
                titleVi: 'Ngày nắng',
                icon: 'Sun',
                situationVi: 'Bạn đang nói chuyện với bạn bè về một ngày thời tiết rất đẹp, có nắng và bạn muốn ra ngoài chơi.',
                tags: ['weather', 'sun', 'nature'],
                sampleDialogue: [
                    {speaker: 'A', text: 'The weather is great today!', textVi: 'Hôm nay thời tiết thật tuyệt!'},
                    {speaker: 'B', text: 'Yes, it is very sunny and warm.', textVi: 'Đúng vậy, trời rất nắng và ấm áp.'},
                    {speaker: 'A', text: 'Should we go to the park?', textVi: 'Chúng ta có nên đến công viên không?'},
                    {speaker: 'B', text: 'Good idea. I love sunny days.', textVi: 'Ý hay đấy. Tôi thích những ngày nắng.'}
                ],
                keyVocabulary: [
                    {term: 'sunny', ipa: '/ˈsʌn.i/', partOfSpeech: 'adj.', meaningVi: 'có nắng', exampleEn: 'It is a sunny day.', exampleVi: 'Đó là một ngày nắng.'},
                    {term: 'warm', ipa: '/wɔːm/', partOfSpeech: 'adj.', meaningVi: 'ấm áp', exampleEn: 'The weather is warm.', exampleVi: 'Thời tiết ấm áp.'},
                    {term: 'sky', ipa: '/skaɪ/', partOfSpeech: 'n.', meaningVi: 'bầu trời', exampleEn: 'The sky is blue.', exampleVi: 'Bầu trời trong xanh.'},
                    {term: 'bright', ipa: '/braɪt/', partOfSpeech: 'adj.', meaningVi: 'sáng sủa, chói', exampleEn: 'The sun is very bright.', exampleVi: 'Mặt trời rất chói.'},
                    {term: 'outside', ipa: '/ˌaʊtˈsaɪd/', partOfSpeech: 'adv.', meaningVi: 'bên ngoài', exampleEn: "Let's go outside.", exampleVi: 'Hãy ra ngoài nào.'}
                ],
                usefulPhrases: [
                    {phrase: 'The weather is beautiful today.', meaningVi: 'Hôm nay thời tiết rất đẹp.'},
                    {phrase: 'There are no clouds in the sky.', meaningVi: 'Không có đám mây nào trên trời.'},
                    {phrase: 'It is a perfect day for a walk.', meaningVi: 'Đây là một ngày hoàn hảo để đi dạo.'},
                    {phrase: 'The sun is shining brightly.', meaningVi: 'Mặt trời đang chiếu sáng chói lọi.'},
                    {phrase: 'I feel happy when it is sunny.', meaningVi: 'Tôi cảm thấy vui khi trời nắng.'}
                ],
                aiTutorPrompt: "You are a friend chatting with the user about the good weather today. Suggest doing an outdoor activity and ask what they like to do on sunny days."
            }
        ]
    },
    'animals-pets.ts': {
        var_name: 'ANIMALS_PETS',
        category: 'describing',
        subcategory: 'animals-pets',
        items: [
            {
                id: 'desc-ani-01',
                level: 'A1',
                titleEn: 'My pet dog',
                titleVi: 'Chó cưng của tôi',
                icon: 'Smile',
                situationVi: 'Bạn đang kể cho mọi người nghe về chú chó cưng của mình, mô tả bộ lông, kích thước và tính cách của nó.',
                tags: ['animal', 'pet', 'dog'],
                sampleDialogue: [
                    {speaker: 'A', text: 'Do you have any pets?', textVi: 'Bạn có nuôi thú cưng nào không?'},
                    {speaker: 'B', text: 'Yes, I have a small dog.', textVi: 'Có, tôi có một chú chó nhỏ.'},
                    {speaker: 'A', text: 'What color is it?', textVi: 'Nó màu gì?'},
                    {speaker: 'B', text: 'He is brown and white. He is very cute.', textVi: 'Nó có màu nâu và trắng. Nó rất dễ thương.'}
                ],
                keyVocabulary: [
                    {term: 'dog', ipa: '/dɒɡ/', partOfSpeech: 'n.', meaningVi: 'con chó', exampleEn: 'My dog loves to play.', exampleVi: 'Chó của tôi thích chơi đùa.'},
                    {term: 'cute', ipa: '/kjuːt/', partOfSpeech: 'adj.', meaningVi: 'dễ thương', exampleEn: 'Puppies are very cute.', exampleVi: 'Những chú chó con rất dễ thương.'},
                    {term: 'friendly', ipa: '/ˈfrend.li/', partOfSpeech: 'adj.', meaningVi: 'thân thiện', exampleEn: 'He is a friendly dog.', exampleVi: 'Nó là một chú chó thân thiện.'},
                    {term: 'tail', ipa: '/teɪl/', partOfSpeech: 'n.', meaningVi: 'cái đuôi', exampleEn: 'The dog is wagging its tail.', exampleVi: 'Con chó đang vẫy đuôi.'},
                    {term: 'fur', ipa: '/fɜːr/', partOfSpeech: 'n.', meaningVi: 'lông (thú)', exampleEn: 'It has soft fur.', exampleVi: 'Nó có bộ lông mềm mại.'}
                ],
                usefulPhrases: [
                    {phrase: 'I have a pet dog.', meaningVi: 'Tôi có một chú chó cưng.'},
                    {phrase: 'He is very playful.', meaningVi: 'Nó rất thích đùa giỡn.'},
                    {phrase: 'He loves going for a walk.', meaningVi: 'Nó thích đi dạo.'},
                    {phrase: 'His name is...', meaningVi: 'Tên của nó là...'},
                    {phrase: 'He is my best friend.', meaningVi: 'Nó là người bạn tốt nhất của tôi.'}
                ],
                aiTutorPrompt: "You are asking the user about their pet dog. Ask about the dog's name, color, and what it likes to do."
            }
        ]
    },
    'buildings-streets.ts': {
        var_name: 'BUILDINGS_STREETS',
        category: 'describing',
        subcategory: 'buildings-streets',
        items: [
            {
                id: 'desc-bld-01',
                level: 'A1',
                titleEn: 'My house/apartment',
                titleVi: 'Nhà/căn hộ của tôi',
                icon: 'Home',
                situationVi: 'Bạn đang giới thiệu về ngôi nhà hoặc căn hộ mà bạn đang sống, mô tả các phòng và khu vực xung quanh.',
                tags: ['building', 'home', 'house'],
                sampleDialogue: [
                    {speaker: 'A', text: 'Where do you live?', textVi: 'Bạn sống ở đâu?'},
                    {speaker: 'B', text: 'I live in a small apartment in the city.', textVi: 'Tôi sống trong một căn hộ nhỏ trong thành phố.'},
                    {speaker: 'A', text: 'How many rooms does it have?', textVi: 'Nó có bao nhiêu phòng?'},
                    {speaker: 'B', text: 'It has one bedroom, a living room, and a kitchen.', textVi: 'Nó có một phòng ngủ, một phòng khách và một nhà bếp.'}
                ],
                keyVocabulary: [
                    {term: 'apartment', ipa: '/əˈpɑːt.mənt/', partOfSpeech: 'n.', meaningVi: 'căn hộ', exampleEn: 'I live in an apartment.', exampleVi: 'Tôi sống trong một căn hộ.'},
                    {term: 'house', ipa: '/haʊs/', partOfSpeech: 'n.', meaningVi: 'ngôi nhà', exampleEn: 'My house has a garden.', exampleVi: 'Nhà tôi có một khu vườn.'},
                    {term: 'room', ipa: '/ruːm/', partOfSpeech: 'n.', meaningVi: 'căn phòng', exampleEn: 'This room is bright.', exampleVi: 'Căn phòng này sáng sủa.'},
                    {term: 'city', ipa: '/ˈsɪt.i/', partOfSpeech: 'n.', meaningVi: 'thành phố', exampleEn: 'I live in a big city.', exampleVi: 'Tôi sống ở một thành phố lớn.'},
                    {term: 'floor', ipa: '/flɔːr/', partOfSpeech: 'n.', meaningVi: 'tầng, sàn nhà', exampleEn: 'I live on the 5th floor.', exampleVi: 'Tôi sống ở tầng 5.'}
                ],
                usefulPhrases: [
                    {phrase: 'My apartment is on the... floor.', meaningVi: 'Căn hộ của tôi ở tầng...'},
                    {phrase: 'It is quite small but comfortable.', meaningVi: 'Nó khá nhỏ nhưng thoải mái.'},
                    {phrase: 'There are three rooms in my house.', meaningVi: 'Có ba căn phòng trong nhà tôi.'},
                    {phrase: 'I have a nice view from my window.', meaningVi: 'Tôi có một góc nhìn đẹp từ cửa sổ.'},
                    {phrase: 'I like my neighborhood.', meaningVi: 'Tôi thích khu phố của mình.'}
                ],
                aiTutorPrompt: "You are a new friend asking the user about where they live. Ask if they live in a house or apartment, and ask them to describe it."
            }
        ]
    },
    'charts-graphs.ts': {
        var_name: 'CHARTS_GRAPHS',
        category: 'describing',
        subcategory: 'charts-graphs',
        items: [
            {
                id: 'desc-chart-01',
                level: 'B1',
                titleEn: 'A simple bar chart',
                titleVi: 'Một biểu đồ cột đơn giản',
                icon: 'BarChart',
                situationVi: 'Bạn đang trình bày một biểu đồ cột cho đồng nghiệp, giải thích các số liệu và so sánh giữa các cột.',
                tags: ['chart', 'business', 'presentation'],
                sampleDialogue: [
                    {speaker: 'A', text: 'What does this bar chart show?', textVi: 'Biểu đồ cột này cho thấy điều gì?'},
                    {speaker: 'B', text: 'It illustrates our sales figures for the last four months.', textVi: 'Nó minh họa doanh số bán hàng của chúng ta trong 4 tháng qua.'},
                    {speaker: 'A', text: 'Which month had the highest sales?', textVi: 'Tháng nào có doanh số cao nhất?'},
                    {speaker: 'B', text: 'August was our best month. You can see the tallest bar here.', textVi: 'Tháng Tám là tháng tốt nhất. Bạn có thể thấy cột cao nhất ở đây.'}
                ],
                keyVocabulary: [
                    {term: 'bar chart', ipa: '/ˈbɑː ˌtʃɑːt/', partOfSpeech: 'n.', meaningVi: 'biểu đồ cột', exampleEn: 'Look at this bar chart.', exampleVi: 'Hãy nhìn vào biểu đồ cột này.'},
                    {term: 'illustrate', ipa: '/ˈɪl.ə.streɪt/', partOfSpeech: 'v.', meaningVi: 'minh họa', exampleEn: 'The graph illustrates the changes.', exampleVi: 'Biểu đồ minh họa những thay đổi.'},
                    {term: 'figure', ipa: '/ˈfɪɡ.ər/', partOfSpeech: 'n.', meaningVi: 'con số, số liệu', exampleEn: 'The sales figures are high.', exampleVi: 'Số liệu doanh số bán hàng đang cao.'},
                    {term: 'increase', ipa: '/ɪnˈkriːs/', partOfSpeech: 'v.', meaningVi: 'tăng lên', exampleEn: 'Profits will increase next year.', exampleVi: 'Lợi nhuận sẽ tăng vào năm tới.'},
                    {term: 'decrease', ipa: '/dɪˈkriːs/', partOfSpeech: 'v.', meaningVi: 'giảm xuống', exampleEn: 'The number decreased in July.', exampleVi: 'Con số đã giảm vào tháng Bảy.'}
                ],
                usefulPhrases: [
                    {phrase: 'This chart shows...', meaningVi: 'Biểu đồ này cho thấy...'},
                    {phrase: 'As we can see from the graph...', meaningVi: 'Như chúng ta có thể thấy từ biểu đồ...'},
                    {phrase: 'There was a slight increase in...', meaningVi: 'Có một sự gia tăng nhẹ trong...'},
                    {phrase: 'It reached a peak of...', meaningVi: 'Nó đã đạt đỉnh ở mức...'},
                    {phrase: 'Compared to last month...', meaningVi: 'So với tháng trước...'}
                ],
                aiTutorPrompt: "You are a colleague attending a presentation. The user is explaining a bar chart. Ask them what the chart represents and ask for specific details about the highest and lowest points."
            }
        ]
    }
};

const template = (category, subcategory, filename, varName, dataStr) => `/**
 * LingoPro Speaking Topic Library
 * Category: ${category}
 * Subcategory: ${subcategory}
 * File: src/data/speaking/topic-library/${category}/${filename}
 *
 * Sub-topics covering ${subcategory}.
 * CEFR Range: A1-B2
 * 100% bilingual English - Vietnamese, zero placeholders.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const ${varName}: TopicLibraryItem[] = ${dataStr};
`;

for (const [filename, data] of Object.entries(filesData)) {
    const filePath = path.join(baseDir, filename);
    const jsonStr = JSON.stringify(data.items, null, 2);
    const content = template(data.category, data.subcategory, filename, data.var_name, jsonStr);
    fs.writeFileSync(filePath, content, 'utf8');
}

const indexTemplate = `/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * File: src/data/speaking/topic-library/describing/index.ts
 *
 * Barrel export for describing topics.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

import { OBJECTS_AROUND_ME } from './objects-around-me';
import { ROOMS_SPACES } from './rooms-spaces';
import { PEOPLE_APPEARANCE } from './people-appearance';
import { PICTURES_PHOTOS } from './pictures-photos';
import { FOOD_DRINKS } from './food-drinks';
import { WEATHER_NATURE } from './weather-nature';
import { ANIMALS_PETS } from './animals-pets';
import { BUILDINGS_STREETS } from './buildings-streets';
import { CHARTS_GRAPHS } from './charts-graphs';

export const DESCRIBING_SUBCATEGORIES = [
  { id: 'objects-around-me', nameEn: 'Objects Around Me', nameVi: 'Đồ vật quanh tôi' },
  { id: 'rooms-spaces', nameEn: 'Rooms & Spaces', nameVi: 'Phòng & Không gian' },
  { id: 'people-appearance', nameEn: 'People & Appearance', nameVi: 'Con người & Ngoại hình' },
  { id: 'pictures-photos', nameEn: 'Pictures & Photos', nameVi: 'Tranh & Ảnh' },
  { id: 'food-drinks', nameEn: 'Food & Drinks', nameVi: 'Đồ ăn & Thức uống' },
  { id: 'weather-nature', nameEn: 'Weather & Nature', nameVi: 'Thời tiết & Thiên nhiên' },
  { id: 'animals-pets', nameEn: 'Animals & Pets', nameVi: 'Động vật & Thú cưng' },
  { id: 'buildings-streets', nameEn: 'Buildings & Streets', nameVi: 'Tòa nhà & Đường phố' },
  { id: 'charts-graphs', nameEn: 'Charts & Graphs', nameVi: 'Biểu đồ & Đồ thị' }
];

export const allDescribingTopics: TopicLibraryItem[] = [
  ...OBJECTS_AROUND_ME,
  ...ROOMS_SPACES,
  ...PEOPLE_APPEARANCE,
  ...PICTURES_PHOTOS,
  ...FOOD_DRINKS,
  ...WEATHER_NATURE,
  ...ANIMALS_PETS,
  ...BUILDINGS_STREETS,
  ...CHARTS_GRAPHS
];

export function getDescribingBySubcategory(slug: string): TopicLibraryItem[] {
  return allDescribingTopics.filter(topic => topic.id.startsWith(\`desc-\${slug.substring(0,3)}\`));
}
`;

fs.writeFileSync(path.join(baseDir, 'index.ts'), indexTemplate, 'utf8');

console.log('Files created successfully.');

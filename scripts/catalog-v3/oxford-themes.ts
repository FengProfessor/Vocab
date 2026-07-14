/**
 * Phân loại Oxford 3000 theo CHỦ ĐỀ (không A–Z).
 * Seed lemma + keyword match; từ còn lại → function / actions / descriptors / abstract.
 * Thứ tự topic = lộ trình học gợi ý (đời sống → trường/việc → thế giới → trừu tượng).
 */

export interface OxfordTheme {
  key: string;
  title: string;
  /** lemma seeds (exact match, lowercase) */
  seeds: string[];
  /** substring / token match trên multi-word */
  keywords: string[];
}

/** Ưu tiên match: theme đứng trước thắng khi overlap. */
export const OXFORD_THEMES: OxfordTheme[] = [
  {
    key: 'family',
    title: 'Gia đình & quan hệ',
    seeds: [
      'family', 'mother', 'father', 'mum', 'mom', 'dad', 'parent', 'parents', 'brother', 'sister',
      'son', 'daughter', 'baby', 'child', 'children', 'kid', 'wife', 'husband', 'married', 'marry',
      'marriage', 'wedding', 'bride', 'couple', 'divorced', 'relative', 'uncle', 'aunt', 'cousin',
      'grandmother', 'grandfather', 'grandparent', 'friend', 'friendship', 'neighbour', 'neighbor',
      'neighbourhood', 'relationship', 'boyfriend', 'girlfriend', 'generation', 'youth', 'adult',
      'teenager', 'teenage', 'birth', 'born', 'childhood', 'home', 'household', 'adopt', 'partner',
      'people', 'person', 'human', 'man', 'woman', 'boy', 'girl', 'gentleman', 'lady', 'mr', 'mrs',
      'miss', 'sir', 'guest', 'host', 'together', 'alone', 'single', 'social', 'society', 'community',
    ],
    keywords: ['family', 'mother', 'father', 'parent', 'brother', 'sister', 'child', 'friend', 'marri', 'wed', 'neighbour', 'neighbor', 'grand'],
  },
  {
    key: 'body',
    title: 'Cơ thể & sức khỏe',
    seeds: [
      'body', 'head', 'hair', 'face', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'teeth', 'tongue',
      'neck', 'shoulder', 'arm', 'hand', 'finger', 'leg', 'foot', 'knee', 'ankle', 'back', 'chest',
      'stomach', 'heart', 'blood', 'bone', 'brain', 'muscle', 'skin', 'voice', 'breath', 'breathe',
      'breathing', 'health', 'healthy', 'ill', 'illness', 'sick', 'disease', 'pain', 'hurt', 'injury',
      'doctor', 'nurse', 'hospital', 'medicine', 'medical', 'patient', 'treatment', 'cure', 'drug',
      'virus', 'infection', 'cancer', 'diet', 'exercise', 'fitness', 'strong', 'weak', 'tired',
      'sleep', 'dream', 'wake', 'alive', 'dead', 'death', 'die', 'life', 'live', 'living', 'lung',
      'throat', 'tooth', 'dentist', 'operation', 'surgery', 'therapy', 'mental', 'physical', 'energy',
      'stress', 'relax', 'relaxed', 'relaxing', 'feel', 'feeling', 'sense', 'smell', 'taste', 'touch',
      'hear', 'hearing', 'see', 'sight', 'look', 'watch', 'listen',
    ],
    keywords: ['health', 'medic', 'doctor', 'hospital', 'body', 'pain', 'blood', 'muscle', 'infect', 'therapy'],
  },
  {
    key: 'food',
    title: 'Ăn uống & nhà bếp',
    seeds: [
      'food', 'eat', 'eating', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'hungry', 'thirsty',
      'cook', 'cooking', 'kitchen', 'restaurant', 'cafe', 'menu', 'dish', 'plate', 'bowl', 'cup',
      'glass', 'knife', 'fork', 'spoon', 'recipe', 'ingredient', 'fresh', 'sweet', 'bitter', 'salty',
      'sour', 'spicy', 'delicious', 'taste', 'bread', 'butter', 'cheese', 'egg', 'meat', 'chicken',
      'beef', 'fish', 'rice', 'pasta', 'noodle', 'soup', 'salad', 'sandwich', 'pizza', 'cake',
      'biscuit', 'cookie', 'chocolate', 'sugar', 'salt', 'pepper', 'oil', 'milk', 'cream', 'yogurt',
      'coffee', 'tea', 'water', 'juice', 'wine', 'beer', 'alcohol', 'fruit', 'apple', 'banana',
      'orange', 'lemon', 'grape', 'berry', 'vegetable', 'potato', 'tomato', 'onion', 'carrot',
      'bean', 'nut', 'rice', 'flour', 'sauce', 'soup', 'snack', 'ice', 'cream', 'chef', 'bake',
      'boil', 'fry', 'grill', 'roast', 'organic', 'nutrition', 'fat', 'calorie', 'kitchen',
    ],
    keywords: ['food', 'eat', 'drink', 'cook', 'meal', 'fruit', 'veget', 'kitchen', 'restaur', 'chef', 'recipe'],
  },
  {
    key: 'home',
    title: 'Nhà cửa & đồ dùng',
    seeds: [
      'house', 'home', 'apartment', 'flat', 'room', 'bedroom', 'bathroom', 'kitchen', 'living',
      'garden', 'door', 'window', 'wall', 'floor', 'ceiling', 'roof', 'stairs', 'lift', 'elevator',
      'furniture', 'table', 'chair', 'sofa', 'bed', 'desk', 'shelf', 'cupboard', 'wardrobe',
      'mirror', 'lamp', 'light', 'clock', 'carpet', 'curtain', 'pillow', 'blanket', 'sheet',
      'towel', 'soap', 'shower', 'bath', 'toilet', 'sink', 'fridge', 'refrigerator', 'oven',
      'cooker', 'microwave', 'washing', 'machine', 'cleaner', 'clean', 'dirty', 'tidy', 'mess',
      'key', 'lock', 'address', 'neighbourhood', 'building', 'block', 'floor', 'rent', 'landlord',
      'clothes', 'clothing', 'dress', 'shirt', 'trousers', 'pants', 'skirt', 'jacket', 'coat',
      'shoe', 'boot', 'hat', 'cap', 'bag', 'pocket', 'wear', 'fashion', 'style', 'cotton', 'wool',
      'silk', 'leather', 'jewellery', 'jewelry', 'ring', 'watch', 'glasses',
    ],
    keywords: ['house', 'home', 'room', 'furniture', 'cloth', 'dress', 'shirt', 'shoe', 'wear', 'apartment', 'flat'],
  },
  {
    key: 'school',
    title: 'Học tập & trường lớp',
    seeds: [
      'school', 'student', 'teacher', 'teach', 'teaching', 'learn', 'learning', 'study', 'studies',
      'class', 'classroom', 'lesson', 'course', 'subject', 'homework', 'exam', 'test', 'mark',
      'grade', 'score', 'pass', 'fail', 'university', 'college', 'campus', 'library', 'book',
      'page', 'read', 'reading', 'write', 'writing', 'writer', 'pencil', 'pen', 'paper', 'notebook',
      'dictionary', 'language', 'english', 'maths', 'mathematics', 'science', 'history', 'geography',
      'art', 'music', 'sport', 'pe', 'education', 'educational', 'educate', 'educated', 'academic',
      'degree', 'diploma', 'certificate', 'qualification', 'scholarship', 'lecture', 'seminar',
      'research', 'researcher', 'project', 'essay', 'report', 'presentation', 'knowledge',
      'skill', 'talent', 'practice', 'practise', 'revise', 'revision', 'memory', 'remember',
      'forget', 'understand', 'understanding', 'explain', 'example', 'idea', 'theory', 'fact',
      'information', 'data', 'question', 'answer', 'problem', 'solution', 'solve', 'calculate',
      'count', 'number', 'figure', 'list', 'note', 'notes', 'summary', 'title', 'chapter',
      'paragraph', 'sentence', 'word', 'vocabulary', 'grammar', 'spelling', 'pronounce',
      'instructor', 'professor', 'pupil', 'training', 'train', 'trainer', 'curriculum', 'faculty',
      'thesis', 'discipline', 'achievement', 'achieve', 'success', 'successful', 'fail', 'failure',
    ],
    keywords: ['school', 'teach', 'student', 'learn', 'study', 'educat', 'exam', 'university', 'college', 'lesson', 'homework', 'academic'],
  },
  {
    key: 'work',
    title: 'Công việc & nghề nghiệp',
    seeds: [
      'work', 'worker', 'job', 'career', 'profession', 'professional', 'occupation', 'employ',
      'employee', 'employer', 'employment', 'unemployed', 'unemployment', 'hire', 'fire', 'resign',
      'retire', 'retired', 'office', 'colleague', 'boss', 'manager', 'management', 'manage',
      'leader', 'leadership', 'staff', 'team', 'meeting', 'interview', 'application', 'apply',
      'applicant', 'candidate', 'cv', 'resume', 'salary', 'wage', 'pay', 'payment', 'earn',
      'income', 'benefit', 'contract', 'task', 'duty', 'responsibility', 'role', 'position',
      'promotion', 'promote', 'experience', 'skill', 'ability', 'able', 'qualified', 'qualification',
      'training', 'busy', 'overtime', 'shift', 'workplace', 'desk', 'secretary', 'assistant',
      'director', 'executive', 'agency', 'department', 'company', 'firm', 'business', 'industry',
      'factory', 'worker', 'labour', 'labor', 'union', 'strike', 'client', 'customer', 'service',
      'serve', 'product', 'produce', 'production', 'manufacturer', 'manufacture',
    ],
    keywords: ['work', 'job', 'employ', 'career', 'office', 'manager', 'salary', 'wage', 'profession', 'colleague', 'boss'],
  },
  {
    key: 'travel',
    title: 'Du lịch & giao thông',
    seeds: [
      'travel', 'traveller', 'traveler', 'trip', 'tour', 'tourism', 'tourist', 'holiday', 'vacation',
      'journey', 'flight', 'fly', 'flying', 'plane', 'aircraft', 'airline', 'airport', 'ticket',
      'passport', 'visa', 'luggage', 'baggage', 'suitcase', 'hotel', 'hostel', 'accommodation',
      'reservation', 'book', 'booking', 'check', 'map', 'guide', 'destination', 'departure',
      'arrive', 'arrival', 'leave', 'delay', 'cancel', 'abroad', 'overseas', 'foreign', 'local',
      'city', 'town', 'village', 'country', 'countryside', 'capital', 'border', 'customs',
      'transport', 'transportation', 'traffic', 'road', 'street', 'path', 'bridge', 'tunnel',
      'car', 'bus', 'train', 'tram', 'metro', 'subway', 'taxi', 'bike', 'bicycle', 'motorbike',
      'motorcycle', 'truck', 'lorry', 'van', 'boat', 'ship', 'ferry', 'driver', 'driving', 'drive',
      'passenger', 'vehicle', 'engine', 'wheel', 'petrol', 'gas', 'fuel', 'park', 'parking',
      'station', 'stop', 'platform', 'route', 'direction', 'north', 'south', 'east', 'west',
      'left', 'right', 'straight', 'far', 'near', 'distance', 'mile', 'kilometre', 'kilometer',
      'expedition', 'adventure', 'explore', 'exploration', 'visit', 'visitor', 'sightseeing',
      'beach', 'island', 'mountain', 'lake', 'river', 'sea', 'ocean', 'coast', 'harbour', 'harbor',
    ],
    keywords: ['travel', 'tour', 'flight', 'airport', 'hotel', 'train', 'bus', 'taxi', 'tourist', 'holiday', 'vacation', 'journey', 'traffic', 'vehicle'],
  },
  {
    key: 'nature',
    title: 'Thiên nhiên & môi trường',
    seeds: [
      'nature', 'natural', 'world', 'earth', 'planet', 'environment', 'environmental', 'climate',
      'weather', 'temperature', 'hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'rain', 'snow',
      'storm', 'wind', 'cloud', 'sky', 'sun', 'moon', 'star', 'season', 'spring', 'summer',
      'autumn', 'fall', 'winter', 'tree', 'forest', 'wood', 'flower', 'plant', 'grass', 'leaf',
      'garden', 'field', 'farm', 'farmer', 'farming', 'animal', 'bird', 'dog', 'cat', 'horse',
      'cow', 'sheep', 'pig', 'chicken', 'fish', 'insect', 'spider', 'snake', 'lion', 'tiger',
      'bear', 'monkey', 'mouse', 'rabbit', 'wildlife', 'wild', 'pet', 'sea', 'ocean', 'river',
      'lake', 'water', 'island', 'mountain', 'hill', 'valley', 'desert', 'beach', 'rock', 'stone',
      'sand', 'soil', 'land', 'ground', 'air', 'gas', 'pollution', 'pollute', 'recycle', 'waste',
      'energy', 'solar', 'nuclear', 'protect', 'protection', 'save', 'destroy', 'destruction',
      'disaster', 'earthquake', 'flood', 'hurricane', 'fire', 'burn', 'smoke', 'global',
      'atmosphere', 'oxygen', 'species', 'habitat', 'ecology', 'ecological', 'sustainable',
      'renewable', 'conservation', 'preserve', 'landscape', 'view', 'scenery', 'outdoor',
      'outdoors', 'camp', 'camping', 'hike', 'climbing',
    ],
    keywords: ['nature', 'weather', 'animal', 'climate', 'environment', 'forest', 'mountain', 'ocean', 'pollut', 'season', 'plant', 'flower'],
  },
  {
    key: 'media',
    title: 'Truyền thông & giải trí',
    seeds: [
      'media', 'news', 'newspaper', 'magazine', 'article', 'journalist', 'reporter', 'editor',
      'press', 'publish', 'publication', 'book', 'novel', 'story', 'author', 'writer', 'write',
      'read', 'reader', 'reading', 'film', 'movie', 'cinema', 'actor', 'actress', 'director',
      'camera', 'photo', 'photograph', 'photographer', 'photography', 'picture', 'image',
      'video', 'television', 'tv', 'radio', 'channel', 'program', 'programme', 'show', 'series',
      'episode', 'drama', 'comedy', 'documentary', 'cartoon', 'music', 'song', 'singer', 'band',
      'concert', 'album', 'guitar', 'piano', 'instrument', 'dance', 'dancer', 'dancing', 'art',
      'artist', 'painting', 'paint', 'drawing', 'draw', 'museum', 'gallery', 'theatre', 'theater',
      'stage', 'audience', 'performance', 'perform', 'celebrity', 'famous', 'star', 'fan',
      'internet', 'online', 'website', 'web', 'email', 'blog', 'app', 'application', 'digital',
      'computer', 'laptop', 'phone', 'mobile', 'smartphone', 'screen', 'download', 'upload',
      'click', 'link', 'social', 'network', 'chat', 'message', 'text', 'call', 'advertise',
      'advertisement', 'advertising', 'ad', 'poster', 'broadcast', 'stream', 'gaming', 'game',
      'play', 'player', 'sport', 'match', 'team', 'win', 'lose', 'score', 'competition',
      'entertainment', 'entertain', 'hobby', 'interest', 'fun', 'enjoy', 'leisure',
    ],
    keywords: ['media', 'news', 'film', 'movie', 'music', 'song', 'internet', 'online', 'computer', 'phone', 'tv', 'television', 'game', 'sport', 'photo', 'video', 'actor', 'artist'],
  },
  {
    key: 'business',
    title: 'Tiền bạc & mua sắm',
    seeds: [
      'money', 'cash', 'coin', 'note', 'bank', 'account', 'card', 'credit', 'debit', 'loan',
      'debt', 'interest', 'tax', 'salary', 'wage', 'pay', 'payment', 'cost', 'price', 'value',
      'cheap', 'expensive', 'free', 'discount', 'sale', 'sell', 'buy', 'purchase', 'spend',
      'save', 'saving', 'budget', 'bill', 'receipt', 'invoice', 'shop', 'shopping', 'store',
      'market', 'supermarket', 'mall', 'customer', 'client', 'product', 'goods', 'service',
      'order', 'delivery', 'package', 'brand', 'quality', 'quantity', 'amount', 'total',
      'profit', 'loss', 'business', 'company', 'firm', 'industry', 'trade', 'trading',
      'economy', 'economic', 'finance', 'financial', 'invest', 'investment', 'stock', 'share',
      'capital', 'wealth', 'rich', 'poor', 'poverty', 'income', 'expense', 'cost', 'afford',
      'own', 'owner', 'property', 'rent', 'hire', 'insurance', 'claim', 'consumer', 'consume',
      'commercial', 'corporate', 'enterprise', 'entrepreneur', 'negotiate', 'negotiation',
      'contract', 'deal', 'offer', 'demand', 'supply', 'market', 'marketing', 'advertising',
      'competition', 'competitive', 'competitor', 'revenue', 'currency', 'dollar', 'euro',
      'pound', 'yen', 'exchange', 'rate', 'percent', 'percentage', 'million', 'billion',
    ],
    keywords: ['money', 'bank', 'price', 'cost', 'buy', 'sell', 'shop', 'market', 'pay', 'tax', 'financ', 'econom', 'profit', 'budget', 'credit', 'cheap', 'expensive'],
  },
  {
    key: 'time-place',
    title: 'Thời gian & nơi chốn',
    seeds: [
      'time', 'hour', 'minute', 'second', 'day', 'week', 'month', 'year', 'century', 'decade',
      'morning', 'afternoon', 'evening', 'night', 'midnight', 'noon', 'today', 'tomorrow',
      'yesterday', 'now', 'soon', 'later', 'early', 'late', 'recent', 'recently', 'future',
      'past', 'present', 'always', 'never', 'often', 'sometimes', 'usually', 'rarely',
      'already', 'still', 'yet', 'again', 'once', 'twice', 'first', 'second', 'third', 'last',
      'next', 'previous', 'before', 'after', 'during', 'while', 'until', 'since', 'when',
      'clock', 'watch', 'calendar', 'date', 'birthday', 'anniversary', 'holiday', 'weekend',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
      'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
      'october', 'november', 'december', 'season', 'place', 'position', 'location', 'area',
      'space', 'here', 'there', 'where', 'everywhere', 'somewhere', 'nowhere', 'inside',
      'outside', 'up', 'down', 'above', 'below', 'under', 'over', 'between', 'among',
      'beside', 'behind', 'front', 'middle', 'centre', 'center', 'edge', 'corner', 'side',
      'top', 'bottom', 'north', 'south', 'east', 'west', 'map', 'world', 'global', 'local',
      'national', 'international', 'region', 'regional', 'zone', 'district', 'address',
    ],
    keywords: ['time', 'day', 'week', 'month', 'year', 'hour', 'minute', 'morning', 'night', 'today', 'place', 'where', 'monday', 'january'],
  },
  {
    key: 'feelings',
    title: 'Cảm xúc & tính cách',
    seeds: [
      'happy', 'happiness', 'sad', 'sadness', 'angry', 'anger', 'afraid', 'fear', 'scared',
      'worried', 'worry', 'anxious', 'anxiety', 'nervous', 'excited', 'excitement', 'bored',
      'boring', 'interested', 'interesting', 'surprised', 'surprise', 'shock', 'shocked',
      'disappointed', 'disappointing', 'proud', 'pride', 'embarrassed', 'embarrassing',
      'ashamed', 'jealous', 'lonely', 'alone', 'love', 'hate', 'like', 'dislike', 'prefer',
      'enjoy', 'fun', 'funny', 'humour', 'humor', 'joke', 'laugh', 'smile', 'cry', 'tear',
      'hope', 'wish', 'dream', 'desire', 'want', 'need', 'feel', 'feeling', 'emotion',
      'emotional', 'mood', 'attitude', 'character', 'personality', 'kind', 'kindness',
      'nice', 'friendly', 'polite', 'rude', 'honest', 'honestly', 'dishonest', 'true',
      'truth', 'lie', 'false', 'real', 'really', 'serious', 'seriously', 'careful', 'careless',
      'brave', 'courage', 'confident', 'confidence', 'shy', 'quiet', 'loud', 'calm',
      'patient', 'patience', 'lazy', 'hardworking', 'clever', 'smart', 'stupid', 'wise',
      'crazy', 'mad', 'normal', 'strange', 'weird', 'positive', 'negative', 'optimistic',
      'pessimistic', 'believe', 'belief', 'doubt', 'trust', 'respect', 'admire', 'appreciate',
    ],
    keywords: ['happy', 'sad', 'angry', 'afraid', 'fear', 'love', 'hate', 'feel', 'emotion', 'mood', 'worry', 'excit', 'bore', 'confiden', 'nervous'],
  },
  {
    key: 'communication',
    title: 'Giao tiếp & ngôn từ',
    seeds: [
      'say', 'said', 'tell', 'told', 'speak', 'spoke', 'spoken', 'talk', 'talking', 'ask', 'answer',
      'reply', 'respond', 'response', 'suggest', 'suggestion', 'advise', 'advice', 'recommend',
      'recommend', 'mention', 'comment', 'discuss', 'discussion', 'argue', 'argument', 'agree',
      'agreement', 'disagree', 'disagreement', 'promise', 'warn', 'warning', 'complain', 'complaint',
      'apologize', 'apology', 'invite', 'invitation', 'introduce', 'introduction', 'explain',
      'explanation', 'describe', 'description', 'define', 'definition', 'mean', 'meaning',
      'express', 'expression', 'communicate', 'communication', 'conversation', 'dialogue',
      'statement', 'claim', 'announce', 'announcement', 'declare', 'inform', 'information',
      'news', 'message', 'note', 'letter', 'email', 'call', 'phone', 'contact', 'report',
      'present', 'presentation', 'speech', 'lecture', 'interview', 'question', 'answer',
      'whisper', 'shout', 'scream', 'sing', 'song', 'language', 'word', 'phrase', 'sentence',
      'translate', 'translation', 'accent', 'pronounce', 'pronunciation', 'fluency', 'fluent',
    ],
    keywords: ['speak', 'talk', 'say', 'tell', 'ask', 'communicat', 'discuss', 'argu', 'agree', 'suggest', 'pronounc', 'translat'],
  },
  {
    key: 'actions',
    title: 'Động từ cốt lõi & hành động',
    seeds: [
      'do', 'does', 'did', 'done', 'make', 'made', 'get', 'got', 'gotten', 'give', 'gave', 'given',
      'take', 'took', 'taken', 'put', 'go', 'went', 'gone', 'come', 'came', 'bring', 'brought',
      'carry', 'hold', 'keep', 'leave', 'left', 'let', 'allow', 'permit', 'help', 'try', 'attempt',
      'start', 'begin', 'began', 'begun', 'start', 'stop', 'finish', 'end', 'continue', 'keep',
      'change', 'move', 'turn', 'open', 'close', 'shut', 'cut', 'break', 'broke', 'broken',
      'fix', 'build', 'built', 'create', 'destroy', 'grow', 'grew', 'grown', 'develop',
      'increase', 'decrease', 'rise', 'fall', 'raise', 'drop', 'push', 'pull', 'throw', 'catch',
      'hit', 'kick', 'touch', 'press', 'pull', 'lift', 'drop', 'pick', 'choose', 'select',
      'find', 'found', 'search', 'look', 'seek', 'seek', 'discover', 'lose', 'lost', 'win', 'won',
      'use', 'used', 'using', 'need', 'want', 'wish', 'hope', 'expect', 'plan', 'prepare',
      'arrange', 'organize', 'organise', 'manage', 'control', 'handle', 'deal', 'serve',
      'provide', 'offer', 'supply', 'support', 'protect', 'prevent', 'avoid', 'escape',
      'follow', 'lead', 'join', 'meet', 'visit', 'stay', 'remain', 'return', 'arrive', 'reach',
      'enter', 'exit', 'pass', 'cross', 'climb', 'run', 'ran', 'walk', 'stand', 'sit', 'lie',
      'sleep', 'wake', 'rest', 'work', 'play', 'wait', 'watch', 'see', 'saw', 'seen', 'hear',
      'heard', 'listen', 'feel', 'felt', 'seem', 'appear', 'become', 'became', 'happen',
      'occur', 'cause', 'result', 'lead', 'force', 'require', 'include', 'contain', 'consist',
      'belong', 'own', 'share', 'send', 'receive', 'accept', 'refuse', 'reject', 'allow',
      'enable', 'cause', 'produce', 'generate', 'form', 'shape', 'design', 'invent', 'discover',
      'explore', 'examine', 'check', 'test', 'measure', 'compare', 'contrast', 'match', 'fit',
      'suit', 'depend', 'rely', 'base', 'focus', 'aim', 'target', 'achieve', 'succeed', 'fail',
      'improve', 'progress', 'develop', 'reduce', 'remove', 'add', 'join', 'connect', 'link',
      'relate', 'refer', 'apply', 'affect', 'influence', 'encourage', 'motivate', 'inspire',
      'persuade', 'convince', 'force', 'require', 'demand', 'order', 'command', 'request',
      'invite', 'welcome', 'greet', 'thank', 'forgive', 'blame', 'accuse', 'punish', 'reward',
      'save', 'spend', 'waste', 'cost', 'pay', 'buy', 'sell', 'pay', 'charge', 'owe',
    ],
    keywords: ['make', 'take', 'give', 'bring', 'carry', 'create', 'develop', 'increase', 'decrease', 'improve', 'reduce', 'provide', 'produce', 'generate', 'achieve', 'succeed'],
  },
  {
    key: 'qualities',
    title: 'Tính từ & mô tả',
    seeds: [
      'good', 'bad', 'better', 'best', 'worse', 'worst', 'great', 'excellent', 'perfect', 'fine',
      'ok', 'okay', 'nice', 'lovely', 'beautiful', 'pretty', 'handsome', 'ugly', 'attractive',
      'big', 'small', 'large', 'little', 'tiny', 'huge', 'enormous', 'long', 'short', 'tall',
      'high', 'low', 'wide', 'narrow', 'thick', 'thin', 'deep', 'shallow', 'heavy', 'light',
      'hard', 'soft', 'strong', 'weak', 'tough', 'easy', 'difficult', 'simple', 'complex',
      'complicated', 'clear', 'obvious', 'certain', 'sure', 'possible', 'impossible', 'likely',
      'unlikely', 'true', 'false', 'real', 'actual', 'right', 'wrong', 'correct', 'incorrect',
      'important', 'significant', 'serious', 'major', 'minor', 'main', 'basic', 'essential',
      'necessary', 'useful', 'useless', 'helpful', 'effective', 'efficient', 'successful',
      'famous', 'popular', 'common', 'rare', 'special', 'ordinary', 'normal', 'strange',
      'unusual', 'different', 'similar', 'same', 'unique', 'original', 'new', 'old', 'young',
      'modern', 'ancient', 'recent', 'current', 'future', 'past', 'early', 'late', 'quick',
      'fast', 'slow', 'sudden', 'gradual', 'frequent', 'regular', 'constant', 'continuous',
      'full', 'empty', 'complete', 'whole', 'total', 'entire', 'partial', 'available',
      'ready', 'busy', 'free', 'open', 'closed', 'public', 'private', 'personal', 'official',
      'legal', 'illegal', 'safe', 'dangerous', 'risky', 'secure', 'clean', 'dirty', 'fresh',
      'natural', 'artificial', 'physical', 'mental', 'emotional', 'social', 'political',
      'economic', 'cultural', 'religious', 'scientific', 'technical', 'practical', 'theoretical',
      'positive', 'negative', 'active', 'passive', 'direct', 'indirect', 'formal', 'informal',
      'general', 'specific', 'particular', 'individual', 'common', 'standard', 'average',
      'maximum', 'minimum', 'extra', 'additional', 'further', 'final', 'initial', 'primary',
      'secondary', 'central', 'local', 'national', 'international', 'global', 'foreign',
      'domestic', 'urban', 'rural', 'rich', 'poor', 'expensive', 'cheap', 'valuable',
      'worth', 'suitable', 'appropriate', 'relevant', 'related', 'similar', 'equal',
      'fair', 'unfair', 'honest', 'kind', 'cruel', 'friendly', 'polite', 'rude', 'brave',
      'clever', 'smart', 'intelligent', 'stupid', 'wise', 'silly', 'crazy', 'calm', 'quiet',
      'loud', 'noisy', 'silent', 'bright', 'dark', 'colourful', 'colorful', 'warm', 'cold',
      'hot', 'cool', 'wet', 'dry', 'comfortable', 'uncomfortable', 'pleasant', 'unpleasant',
      'happy', 'sad', 'angry', 'afraid', 'worried', 'surprised', 'interested', 'bored',
      'excited', 'tired', 'ill', 'healthy', 'alive', 'dead', 'awake', 'asleep',
    ],
    keywords: ['able', 'ible', 'ful', 'less', 'ous', 'ive', 'al', 'ic', 'ish', 'good', 'bad', 'great', 'important', 'different', 'possible', 'necessary'],
  },
  {
    key: 'function',
    title: 'Từ chức năng (grammar core)',
    seeds: [
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'so', 'than', 'as', 'of', 'to',
      'in', 'on', 'at', 'by', 'for', 'with', 'without', 'from', 'into', 'onto', 'about',
      'above', 'across', 'after', 'against', 'along', 'among', 'around', 'before', 'behind',
      'below', 'beneath', 'beside', 'between', 'beyond', 'during', 'except', 'inside',
      'outside', 'through', 'throughout', 'toward', 'towards', 'under', 'underneath', 'until',
      'upon', 'via', 'within', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
      'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'ours',
      'theirs', 'this', 'that', 'these', 'those', 'who', 'whom', 'whose', 'which', 'what',
      'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'every', 'few', 'many',
      'much', 'more', 'most', 'other', 'another', 'some', 'such', 'no', 'none', 'one', 'two',
      'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand',
      'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'having',
      'do', 'does', 'did', 'done', 'doing', 'can', 'could', 'may', 'might', 'must', 'shall',
      'should', 'will', 'would', 'ought', 'need', 'dare', 'used', 'not', 'no', 'yes', 'please',
      'thank', 'thanks', 'sorry', 'hello', 'hi', 'bye', 'goodbye', 'ok', 'okay', 'well',
      'very', 'too', 'also', 'only', 'just', 'even', 'still', 'already', 'yet', 'else',
      'there', 'here', 'then', 'than', 'thus', 'therefore', 'however', 'although', 'though',
      'unless', 'whether', 'while', 'whereas', 'moreover', 'furthermore', 'nevertheless',
      'anyway', 'else', 'either', 'neither', 'nor', 'both', 'not only',
    ],
    keywords: [],
  },
];

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', ''] as const;

export function classifyOxfordWord(word: string): string {
  const w = word.trim().toLowerCase();
  // exact seed first (priority order in OXFORD_THEMES)
  for (const theme of OXFORD_THEMES) {
    if (theme.seeds.includes(w)) return theme.key;
  }
  // keyword / token — suffix ngắn (able/ive/…) chỉ match nếu stem đủ dài
  const tokens = w.split(/[\s\-']+/);
  for (const theme of OXFORD_THEMES) {
    if (theme.key === 'function') continue;
    for (const kw of theme.keywords) {
      if (w === kw) return theme.key;
      if (kw.length >= 4 && (w.startsWith(kw) || tokens.some((t) => t === kw || (t.length > kw.length && t.startsWith(kw))))) {
        return theme.key;
      }
      // adjective morphology: -ful -less -ous -ive -ical (không dùng -able/-al ngắn)
      if (theme.key === 'qualities' && w.length >= 6) {
        if (/(ful|less|ous|ive|ical|able|ible)$/.test(w) && !/^(table|cable|label|enable|disable)$/.test(w)) {
          return 'qualities';
        }
      }
      if (kw.length >= 5 && w.endsWith(kw) && w.length >= kw.length + 2) return theme.key;
    }
  }
  // light morphology for actions (verbs)
  if (w.length >= 5 && /(ing|tion|ment|ness|ship|ence|ance)$/.test(w)) {
    // still abstract-ish nouns — leave abstract
    return 'abstract';
  }
  return 'abstract';
}

/** Theme key cho phần còn lại (không có trong OXFORD_THEMES seeds). */
export const ABSTRACT_THEME: OxfordTheme = {
  key: 'abstract',
  title: 'Ý tưởng & hành động chung',
  seeds: [],
  keywords: [],
};

export function allOxfordThemeDefs(): OxfordTheme[] {
  // Thứ tự hiển thị/học: concrete → skills → abstract → function
  const order = [
    'family', 'body', 'food', 'home', 'school', 'work', 'travel', 'nature', 'media', 'business',
    'time-place', 'feelings', 'communication', 'actions', 'qualities', 'abstract', 'function',
  ];
  const byKey = new Map(OXFORD_THEMES.map((t) => [t.key, t]));
  byKey.set(ABSTRACT_THEME.key, ABSTRACT_THEME);
  return order.map((k) => byKey.get(k)!).filter(Boolean);
}

export function cefrRank(cefr?: string | null): number {
  const i = CEFR_ORDER.indexOf((cefr ?? '') as (typeof CEFR_ORDER)[number]);
  return i < 0 ? CEFR_ORDER.length - 1 : i;
}

/**
 * Gán theme + sắp: theme order → (optional cefr) → alpha trong cùng tầng.
 * Trả map themeKey → words[].
 */
export function groupOxfordByTheme(
  words: string[],
  cefrByWord?: Map<string, string | null>,
): Map<string, string[]> {
  const buckets = new Map<string, string[]>();
  for (const theme of allOxfordThemeDefs()) buckets.set(theme.key, []);

  for (const w of words) {
    const key = classifyOxfordWord(w);
    const bucket = buckets.get(key) ?? buckets.get('abstract')!;
    bucket.push(w);
  }

  for (const [key, list] of buckets) {
    list.sort((a, b) => {
      if (cefrByWord) {
        const ra = cefrRank(cefrByWord.get(a));
        const rb = cefrRank(cefrByWord.get(b));
        if (ra !== rb) return ra - rb;
      }
      return a.localeCompare(b, 'en');
    });
    buckets.set(key, list);
  }
  return buckets;
}

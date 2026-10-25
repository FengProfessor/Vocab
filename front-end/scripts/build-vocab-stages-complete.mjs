import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

function getEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) {
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[m[1]] = v;
    }
  }
  return env;
}

const env = getEnv();
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function readList(file) {
  const p = path.join(process.cwd(), 'scripts/lists', file);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8')
    .split(/[\r\n]+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w && !w.startsWith('#'));
}

const oxford3000 = readList('oxford-3000.txt');
const oxford5000 = readList('oxford-5000-b2c1.txt');
const academicList = readList('academic-word-list.txt');
const phrasalList = readList('phrasal-verbs-essential.txt');

// Load foundation 100 verbs
const foundationPath = path.resolve(process.cwd(), 'src/data/roadmap/foundation-verbs-v1.json');
const foundationData = JSON.parse(fs.readFileSync(foundationPath, 'utf8'));
const foundation100Verbs = new Set(foundationData.verbPacks.flatMap(p => p.verbs.map(v => v.lemma.toLowerCase())));

// Define the 12 topics for Stage 1 (75 words each)
const STAGE_1_TOPICS = [
  {
    id: 's1-topic-family',
    stage: 1,
    index: 1,
    title: 'Gia đình & Bản thân',
    titleEn: 'Family & Self',
    icon: '👨‍👩‍👧‍👦',
    badge: 'Căn bản nhất',
    description: 'Từ vựng cốt lõi về người thân, đại từ, các mối quan hệ gia đình và thông tin cá nhân.',
    targetCount: 75,
    seedWords: [
      'family', 'mother', 'father', 'mom', 'dad', 'brother', 'sister', 'parent', 'parents', 'child',
      'children', 'baby', 'son', 'daughter', 'husband', 'wife', 'friend', 'relative', 'uncle', 'aunt',
      'cousin', 'grandfather', 'grandmother', 'grandparent', 'kid', 'teenager', 'adult', 'person',
      'people', 'man', 'woman', 'boy', 'girl', 'name', 'age', 'birth', 'address', 'home',
      'neighbor', 'neighbourhood', 'guest', 'host', 'single', 'married', 'marriage', 'wedding',
      'partner', 'member', 'relationship', 'generation', 'human', 'youth', 'childhood', 'together',
      'alone', 'diary', 'memory', 'personal', 'private', 'contact', 'smile', 'love', 'live',
      'born', 'grow', 'meet', 'visit', 'introduce', 'care', 'kiss', 'hug', 'respect', 'welcome', 'share'
    ]
  },
  {
    id: 's1-topic-time',
    stage: 1,
    index: 2,
    title: 'Thời gian & Lịch trình',
    titleEn: 'Time & Calendar',
    icon: '⏰',
    badge: 'Hàng ngày',
    description: 'Nắm vững các mốc thời gian, thứ trong tuần, tháng, mùa và các phó từ chỉ tần suất cơ bản.',
    targetCount: 75,
    seedWords: [
      'time', 'hour', 'minute', 'second', 'day', 'week', 'month', 'year', 'date', 'calendar',
      'today', 'tomorrow', 'yesterday', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight',
      'weekend', 'early', 'late', 'now', 'soon', 'later', 'always', 'usually', 'often', 'sometimes',
      'rarely', 'never', 'already', 'still', 'yet', 'again', 'once', 'twice', 'first', 'second',
      'third', 'last', 'next', 'past', 'future', 'clock', 'watch', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may',
      'june', 'july', 'august', 'september', 'october', 'november', 'december', 'season', 'spring',
      'summer', 'autumn', 'winter', 'holiday', 'schedule', 'start', 'finish', 'daily'
    ]
  },
  {
    id: 's1-topic-food',
    stage: 1,
    index: 3,
    title: 'Đồ ăn & Thức uống',
    titleEn: 'Food & Drinks',
    icon: '🍳',
    badge: 'Sinh hoạt',
    description: 'Thực phẩm thông dụng, bữa ăn hàng ngày, rau củ quả, đồ uống và các tính từ vị giác.',
    targetCount: 75,
    seedWords: [
      'food', 'eat', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'bread', 'rice',
      'noodle', 'egg', 'meat', 'beef', 'chicken', 'pork', 'fish', 'fruit', 'apple', 'banana',
      'orange', 'lemon', 'grape', 'vegetable', 'potato', 'tomato', 'onion', 'carrot', 'bean',
      'salad', 'soup', 'sandwich', 'pizza', 'cake', 'biscuit', 'chocolate', 'sugar', 'salt', 'pepper',
      'oil', 'milk', 'cheese', 'butter', 'yogurt', 'water', 'juice', 'tea', 'coffee', 'beer',
      'wine', 'cup', 'glass', 'bottle', 'plate', 'bowl', 'fork', 'spoon', 'knife', 'hungry',
      'thirsty', 'delicious', 'sweet', 'salty', 'bitter', 'sour', 'fresh', 'cook', 'boil', 'fry',
      'bake', 'heat', 'taste', 'serve', 'diet'
    ]
  },
  {
    id: 's1-topic-home',
    stage: 1,
    index: 4,
    title: 'Nhà cửa & Đồ gia dụng',
    titleEn: 'Home & Appliances',
    icon: '🏠',
    badge: 'Gia đình',
    description: 'Không gian sống, các phòng trong nhà và trang thiết bị nội thất quen thuộc nhất.',
    targetCount: 75,
    seedWords: [
      'house', 'home', 'apartment', 'flat', 'room', 'bedroom', 'bathroom', 'kitchen', 'living',
      'garden', 'yard', 'door', 'window', 'wall', 'floor', 'roof', 'stairs', 'ceiling', 'gate',
      'furniture', 'table', 'chair', 'desk', 'sofa', 'bed', 'shelf', 'cupboard', 'mirror', 'lamp',
      'light', 'fan', 'carpet', 'curtain', 'pillow', 'blanket', 'sheet', 'towel', 'soap', 'shampoo',
      'shower', 'bath', 'sink', 'toilet', 'fridge', 'oven', 'stove', 'microwave', 'washing', 'machine',
      'iron', 'clean', 'dirty', 'tidy', 'mess', 'key', 'lock', 'bell', 'corner', 'hall',
      'paint', 'repair', 'fix', 'enter', 'leave', 'shut', 'open', 'quiet', 'warm', 'cool',
      'safe', 'rent', 'building', 'stay', 'balcony'
    ]
  },
  {
    id: 's1-topic-school',
    stage: 1,
    index: 5,
    title: 'Trường học & Học tập',
    titleEn: 'School & Study',
    icon: '📚',
    badge: 'Tri thức',
    description: 'Đồ dùng học tập, môn học, lớp học, từ vựng cơ bản để đọc viết và trao đổi bài vở.',
    targetCount: 75,
    seedWords: [
      'school', 'student', 'teacher', 'classroom', 'lesson', 'class', 'course', 'homework', 'subject',
      'book', 'notebook', 'page', 'pen', 'pencil', 'eraser', 'ruler', 'desk', 'board', 'bag',
      'library', 'exam', 'test', 'grade', 'mark', 'score', 'pass', 'fail', 'learn', 'study',
      'teach', 'read', 'write', 'listen', 'speak', 'ask', 'answer', 'question', 'mistake', 'correct',
      'word', 'sentence', 'grammar', 'dictionary', 'alphabet', 'letter', 'number', 'math', 'science',
      'history', 'geography', 'language', 'english', 'practice', 'remember', 'forget', 'understand',
      'explain', 'paper', 'idea', 'note', 'rule', 'simple', 'easy', 'hard', 'draw', 'paint',
      'song', 'story', 'exercise', 'check', 'pupil', 'term', 'education'
    ]
  },
  {
    id: 's1-topic-body',
    stage: 1,
    index: 6,
    title: 'Cơ thể & Sức khỏe căn bản',
    titleEn: 'Body & Basic Health',
    icon: '💪',
    badge: 'Cơ thể',
    description: 'Các bộ phận cơ thể con người, trạng thái sức khỏe thường gặp và sơ cứu cơ bản.',
    targetCount: 75,
    seedWords: [
      'body', 'head', 'hair', 'face', 'eye', 'ear', 'nose', 'mouth', 'lip', 'tooth',
      'teeth', 'tongue', 'neck', 'shoulder', 'chest', 'back', 'arm', 'hand', 'finger', 'nail',
      'leg', 'knee', 'foot', 'feet', 'skin', 'blood', 'bone', 'heart', 'stomach', 'brain',
      'voice', 'breath', 'breathe', 'health', 'healthy', 'fit', 'strong', 'weak', 'ill', 'sick',
      'pain', 'hurt', 'ache', 'cold', 'fever', 'cough', 'medicine', 'pill', 'doctor', 'nurse',
      'hospital', 'clinic', 'rest', 'sleep', 'tired', 'energy', 'walk', 'run', 'jump', 'sit',
      'stand', 'touch', 'smell', 'alive', 'wash', 'clean', 'life', 'die', 'danger', 'care'
    ]
  },
  {
    id: 's1-topic-clothes',
    stage: 1,
    index: 7,
    title: 'Quần áo & Thời trang',
    titleEn: 'Clothes & Daily Wear',
    icon: '👕',
    badge: 'Trang phục',
    description: 'Trang phục thường ngày, phụ kiện, chất liệu vải và màu sắc thông dụng.',
    targetCount: 75,
    seedWords: [
      'clothes', 'clothing', 'wear', 'shirt', 't-shirt', 'pants', 'trousers', 'jeans', 'shorts',
      'skirt', 'dress', 'jacket', 'coat', 'sweater', 'suit', 'uniform', 'shoes', 'boots', 'sneakers',
      'sandals', 'socks', 'hat', 'cap', 'scarf', 'gloves', 'belt', 'tie', 'glasses', 'sunglasses',
      'bag', 'pocket', 'umbrella', 'ring', 'button', 'zip', 'cotton', 'wool', 'silk', 'leather',
      'color', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'pink', 'brown', 'purple',
      'orange', 'grey', 'gray', 'size', 'fit', 'loose', 'tight', 'short', 'long', 'light',
      'dark', 'bright', 'style', 'fashion', 'cheap', 'expensive', 'new', 'old', 'pretty', 'simple',
      'clean', 'dirty', 'wash', 'iron', 'dry'
    ]
  },
  {
    id: 's1-topic-animals',
    stage: 1,
    index: 8,
    title: 'Động vật & Thiên nhiên',
    titleEn: 'Animals & Nature',
    icon: '🐾',
    badge: 'Thế giới tự nhiên',
    description: 'Thú cưng, động vật nuôi, hoang dã và cảnh quan thiên nhiên căn bản.',
    targetCount: 75,
    seedWords: [
      'animal', 'pet', 'dog', 'cat', 'puppy', 'kitten', 'bird', 'fish', 'cow', 'horse',
      'pig', 'sheep', 'goat', 'duck', 'chicken', 'rabbit', 'mouse', 'rat', 'lion', 'tiger',
      'elephant', 'bear', 'monkey', 'snake', 'spider', 'insect', 'bee', 'fly', 'ant', 'wild',
      'farm', 'zoo', 'nature', 'tree', 'plant', 'grass', 'flower', 'rose', 'leaf', 'forest',
      'wood', 'park', 'earth', 'land', 'rock', 'stone', 'sand', 'ground', 'hill', 'mountain',
      'valley', 'river', 'lake', 'sea', 'ocean', 'beach', 'sky', 'sun', 'moon', 'star',
      'cloud', 'rain', 'snow', 'wind', 'storm', 'air', 'ice', 'hot', 'warm', 'cool',
      'island', 'field', 'mud', 'path', 'outdoor'
    ]
  },
  {
    id: 's1-topic-shopping',
    stage: 1,
    index: 9,
    title: 'Mua sắm & Tiền bạc cơ bản',
    titleEn: 'Shopping & Money',
    icon: '🛒',
    badge: 'Giao dịch',
    description: 'Hỏi giá, phương thức thanh toán, cửa hàng, siêu thị và mua sắm sinh hoạt.',
    targetCount: 75,
    seedWords: [
      'money', 'cash', 'coin', 'bill', 'card', 'dollar', 'cent', 'pay', 'payment', 'buy',
      'sell', 'spend', 'save', 'cost', 'price', 'cheap', 'expensive', 'free', 'afford', 'shop',
      'store', 'market', 'supermarket', 'mall', 'customer', 'buyer', 'seller', 'cashier', 'cart',
      'basket', 'receipt', 'discount', 'sale', 'reduce', 'change', 'wallet', 'purse', 'bank',
      'borrow', 'lend', 'choose', 'select', 'pick', 'order', 'total', 'count', 'list', 'gift',
      'present', 'return', 'refund', 'goods', 'brand', 'modern', 'quality', 'need', 'rich',
      'poor', 'earn', 'coin', 'tip', 'cheaply', 'expensive', 'luxury', 'value', 'worth', 'offer',
      'bargain', 'counter', 'pocket', 'plastic', 'tag'
    ]
  },
  {
    id: 's1-topic-transport',
    stage: 1,
    index: 10,
    title: 'Giao thông & Đi lại',
    titleEn: 'Transport & Directions',
    icon: '🚗',
    badge: 'Di chuyển',
    description: 'Phương tiện đi lại hàng ngày, đường sá, biển báo và chỉ dẫn phương hướng cơ bản.',
    targetCount: 75,
    seedWords: [
      'travel', 'trip', 'journey', 'road', 'street', 'way', 'path', 'avenue', 'lane', 'bridge',
      'corner', 'traffic', 'car', 'bus', 'taxi', 'bike', 'bicycle', 'motorbike', 'train', 'metro',
      'subway', 'plane', 'airplane', 'boat', 'ship', 'station', 'stop', 'airport', 'port', 'ticket',
      'passenger', 'driver', 'map', 'guide', 'direction', 'left', 'right', 'straight', 'forward', 'back',
      'near', 'far', 'distance', 'kilometer', 'mile', 'cross', 'turn', 'wait', 'fast', 'slow',
      'quick', 'safe', 'dangerous', 'seat', 'wheel', 'engine', 'gas', 'petrol', 'park', 'parking',
      'arrive', 'leave', 'departure', 'arrival', 'delay', 'route', 'traffic light', 'pedestrian',
      'helmet', 'railway', 'speed', 'sign', 'crossroad', 'sidewalk', 'van'
    ]
  },
  {
    id: 's1-topic-places',
    stage: 1,
    index: 11,
    title: 'Thành phố & Nơi chốn',
    titleEn: 'City & Places',
    icon: '🏙️',
    badge: 'Địa điểm',
    description: 'Các công trình công cộng, địa điểm giải trí, cơ quan và không gian đô thị.',
    targetCount: 75,
    seedWords: [
      'city', 'town', 'village', 'countryside', 'capital', 'center', 'building', 'hospital',
      'clinic', 'pharmacy', 'bank', 'post office', 'supermarket', 'mall', 'restaurant', 'cafe',
      'bar', 'hotel', 'cinema', 'theatre', 'theater', 'museum', 'gallery', 'stadium', 'gym',
      'park', 'zoo', 'square', 'church', 'temple', 'bridge', 'station', 'airport', 'river',
      'lake', 'beach', 'place', 'location', 'area', 'zone', 'address', 'local', 'national',
      'foreign', 'here', 'there', 'inside', 'outside', 'public', 'private', 'quiet', 'crowded',
      'busy', 'flat', 'palace', 'castle', 'monument', 'tower', 'fountain', 'factory', 'port',
      'harbour', 'quay', 'suburb', 'downtown', 'quarter', 'region', 'district', 'block', 'site',
      'spot', 'corner', 'neighborhood', 'community', 'country', 'world'
    ]
  },
  {
    id: 's1-topic-hobbies',
    stage: 1,
    index: 12,
    title: 'Sở thích & Giải trí',
    titleEn: 'Hobbies & Free Time',
    icon: '🎨',
    badge: 'Giải trí',
    description: 'Hoạt động giải trí cuối tuần, âm nhạc, nghệ thuật, phim ảnh và các trò chơi vận động.',
    targetCount: 75,
    seedWords: [
      'hobby', 'leisure', 'fun', 'enjoy', 'game', 'video game', 'sport', 'football', 'soccer',
      'basketball', 'volleyball', 'tennis', 'badminton', 'swimming', 'running', 'cycling', 'chess',
      'music', 'song', 'singing', 'dancing', 'guitar', 'piano', 'art', 'drawing', 'painting',
      'photo', 'picture', 'camera', 'comic', 'magazine', 'movie', 'film', 'cinema', 'show',
      'internet', 'surfing', 'camping', 'fishing', 'cooking', 'baking', 'gardening', 'picnic',
      'party', 'weekend', 'relax', 'rest', 'fan', 'star', 'audience', 'instrument', 'band',
      'concert', 'theatre', 'player', 'team', 'match', 'win', 'lose', 'champion', 'club',
      'activity', 'pleasure', 'entertainment', 'festival', 'parade', 'carnival', 'puzzle',
      'novel', 'craft', 'collection', 'interest', 'magic'
    ]
  }
];

// Helper to sanitize words
function cleanWord(w) {
  return w.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '');
}

console.log('Stage 1 configured with 12 topics.');

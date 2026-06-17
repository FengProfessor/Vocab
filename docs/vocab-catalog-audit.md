# Vocabulary Catalog Audit

- Nguồn bundled: `pro3m.json` (165 lesson), `pro3m-plus.json` (67 lesson)
- Quy tắc tái tạo: bỏ `STT` / `Cấp độ ...` / `Alphabetical list ...`; normalize lowercase + trim; bỏ rỗng và chuỗi >=80 ký tự; dedupe trong lesson; bỏ lesson <10 từ; dedupe lesson signature có thứ tự; pack mục tiêu 15, ngưỡng audit 10-20.
- Live DB: đã đọc bằng anon, chỉ SELECT.

## Tổng quan

| Chỉ số | Giá trị |
|---|---:|
| Lesson bundled | 232 |
| Lesson bị loại bởi STT/cấp độ/A-Z | 27 |
| Lesson rỗng | 68 |
| Lesson dưới 10 từ sau clean | 4 |
| Lesson trùng signature bị loại | 0 |
| Topic catalog cuối | 133 |
| Tổng pack | 441 |
| Raw word occurrences trong candidate lessons | 6053 |
| Cleaned occurrences trước dedupe signature | 6018 |
| Unique catalog words | 5144 |
| Duplicate occurrence rate xuyên topic | 874 / 6018 (14.5%) |
| Duplicate bị bỏ trong từng lesson catalog | 3 |
| Chuỗi rỗng/quá dài bị bỏ trong topic catalog | 0 |
| Suspicious/garbage phrases | 33 |
| Typo lesson titles | 9 |

## Vi phạm kích thước

- Topic ngoài ngưỡng khuyến nghị 10-200: **1**.
- Pack ngoài ngưỡng 10-20: **0**.
- Candidate lesson bị loại vì dưới 10 từ: **4**.

| Package | Topic | Từ |
|---|---|---:|
| pro3m | Body | 274 |

## Lesson trùng signature

Không có.

## Suspicious / Garbage Phrases

| Package | Topic | Phrase | Lý do |
|---|---|---|---|
| pro3m | Topic 5: Health and Diseases | to be in the mood for a home-cooked meal | quá dài, giống câu |
| pro3m | Topic 8: Family and Relationships | to get on like a house on fire | quá dài, giống câu |
| pro3m | Topic 8: Family and Relationships | men build the house and women make it home | quá dài, giống câu |
| pro3m | Unit 3: Ways Of Socialising | q | một ký tự |
| pro3m | Anger - Annoyance - Irritation | come down on someone like a ton of bricks | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | take to something like a duck to water | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | as quick as a dog can lick a dish | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | you can't teach an old dog new tricks | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | no room not enough room to swing a cat | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | run with the hair and hunt with the hounds | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | why buy a cow when you can get milk for free | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | a hair of the dog that bit you | quá dài, giống câu |
| pro3m | Animals - Fish - Birds - Insects | be sent away with a flea in your ear | quá dài, giống câu |
| pro3m | Anxiety - Fear | if you can't stand the heat get out of the kitchen | quá dài, giống câu |
| pro3m | Authority - Power | have someone by the short hairs or buy the shortened curlies | quá dài, giống câu |
| pro3m | Body | left hand doesn't know what the right hand is doing | quá dài, giống câu |
| pro3m | Body | put your pants on one leg at a time | quá dài, giống câu |
| pro3m | Body | more than one way to skin a cat | quá dài, giống câu |
| pro3m | Choices - Options - Alternantives | between the devil and the deep blue sea | quá dài, giống câu |
| pro3m | Colours | born with a silver spoon in your mouth | quá dài, giống câu |
| pro3m | Comparison - Similarity | as happy as a flea in a dog house | quá dài, giống câu |
| pro3m | Comparison - Similarity | as much use as a handbrake on a canoe | quá dài, giống câu |
| pro3m | Comparison - Similarity | as quick as a dog can lick a dish | quá dài, giống câu |
| pro3m | Consequences - Effects | as happy as a flea in a dog house | quá dài, giống câu |
| pro3m | Consequences - Effects | as much use as a handbrake on a canoe | quá dài, giống câu |
| pro3m | Consequences - Effects | as quick as a dog can lick a dish | quá dài, giống câu |
| pro3m | Countries - Cities - Nationalities | when in rome do as the romans do | quá dài, giống câu |
| pro3m | Descriptions Of People | born with a silver spoon in one's mouth | quá dài, giống câu |
| pro3m | Descriptions Of People | puts pants on one leg at a time | quá dài, giống câu |
| pro3m | Feelings - Emotions - Reactions | think the sun rises and sets on someone | quá dài, giống câu |
| pro3m | Food and Drink | proof of the pudding is in the eating | quá dài, giống câu |
| pro3m-plus | Expression with know | know something like the back of your hand | quá dài, giống câu |
| pro3m-plus | Expression with mind | get someone or something out of your mind | quá dài, giống câu |

## Typo Lesson Titles

| Package | Hiện tại | Gợi ý | Lý do |
|---|---|---|---|
| pro3m | Topic 2: Enviroment and Climate Change | Topic 2: Environment and Climate Change | enviroment → environment |
| pro3m | Unit 9: Preserving The Enviroment | Unit 9: Preserving The Environment | enviroment → environment |
| pro3m | Topic 13: Bussiness | Topic 13: Business | bussiness → business |
| pro3m | Unit 6: Global Warning | Unit 6: Global Warming | global warning → global warming |
| pro3m | Theme 2: Enviroment | Theme 2: Environment | enviroment → environment |
| pro3m | Theme 11: Socical Issues | Theme 11: Social Issues | socical → social |
| pro3m | Choices - Options - Alternantives | Choices - Options - Alternatives | alternantives → alternatives |
| pro3m-plus | Expression with cant | Expression with can't | cant → can't |
| pro3m-plus | Phrasal verbs ENVIROMENT | Phrasal verbs Environment | enviroment → environment |

## Live Image Audit

| Chỉ số | Giá trị |
|---|---:|
| Catalog words có row DB | 5144 / 5144 (100.0%) |
| Thiếu row DB | 0 |
| Có ảnh hợp lệ | 4650 / 5144 (90.4%) |
| Thiếu ảnh | 494 / 5144 (9.6%) |
| Confidence cao >=70 | 1080 |
| Confidence trung bình 50-69 | 19 |
| Confidence thấp 15-49 | 48 |
| Confidence reject <15 | 0 |
| Có ảnh nhưng chưa chấm confidence | 3503 |

### Nguồn ảnh

| Source | Số ảnh |
|---|---:|
| duckduckgo | 3962 |
| pexels | 520 |
| bing | 85 |
| duckduckgo-low | 37 |
| pexels-low | 30 |
| wikipedia | 8 |
| bing-low | 8 |

## Top Topics Cần Sửa

Điểm ưu tiên cộng từ suspicious phrase, duplicate nội bộ, lệch declared count, vi phạm size và vấn đề ảnh live.

| # | Package | Topic | Điểm | Từ | Suspicious | Dup nội bộ | Δ declared | Pack lỗi | Thiếu ảnh | Ảnh conf <50 |
|---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | pro3m | Animals - Fish - Birds - Insects | 43.5 | 150 | 8 | 0 | 0 | 0 | 11 | 1 |
| 2 | pro3m | Body | 41.6 | 274 | 3 | 2 | 0 | 0 | 35 | 0 |
| 3 | pro3m | Consequences - Effects | 18.4 | 118 | 3 | 0 | 0 | 0 | 8 | 1 |
| 4 | pro3m | Comparison - Similarity | 17.2 | 88 | 3 | 0 | 0 | 0 | 1 | 1 |
| 5 | pro3m | Descriptions Of People | 16.5 | 129 | 2 | 0 | 0 | 0 | 16 | 2 |
| 6 | pro3m | Topic 8: Family and Relationships | 15.6 | 155 | 2 | 0 | 0 | 0 | 28 | 1 |
| 7 | pro3m-plus | Expression with all | 14.0 | 26 | 0 | 0 | 0 | 0 | 0 | 7 |
| 8 | pro3m | Choices - Options - Alternantives | 11.4 | 32 | 1 | 0 | 0 | 0 | 7 | 1 |
| 9 | pro3m-plus | Expression with know | 10.5 | 13 | 1 | 0 | 0 | 0 | 1 | 2 |
| 10 | pro3m | Unit 3: Ways Of Socialising | 9.7 | 30 | 1 | 0 | 0 | 0 | 4 | 1 |
| 11 | pro3m | Feelings - Emotions - Reactions | 9.5 | 80 | 1 | 0 | 0 | 0 | 18 | 0 |
| 12 | pro3m-plus | Expression with mind | 9.0 | 37 | 1 | 0 | 0 | 0 | 0 | 2 |
| 13 | pro3m | Authority - Power | 8.6 | 39 | 1 | 0 | 0 | 0 | 7 | 0 |
| 14 | pro3m | Phrasal Verbs (4) | 8.3 | 80 | 0 | 0 | 0 | 0 | 25 | 1 |
| 15 | pro3m | Anger - Annoyance - Irritation | 7.5 | 71 | 1 | 0 | 0 | 0 | 9 | 0 |
| 16 | pro3m | Countries - Cities - Nationalities | 7.4 | 17 | 1 | 0 | 0 | 0 | 2 | 0 |
| 17 | pro3m | Food and Drink | 7.3 | 87 | 1 | 0 | 0 | 0 | 10 | 0 |
| 18 | pro3m | Topic 5: Health and Diseases | 6.7 | 104 | 1 | 0 | 0 | 0 | 9 | 0 |
| 19 | pro3m | Colours | 6.5 | 55 | 1 | 0 | 0 | 0 | 4 | 0 |
| 20 | pro3m | Topic 23: Deciding and Choosing | 6.3 | 16 | 0 | 0 | 0 | 0 | 5 | 0 |

## Ghi chú

- Suspicious/garbage là heuristic để review thủ công, không phải đề xuất xóa tự động.
- Duplicate occurrence rate xuyên topic là mức lặp của từ giữa các topic hợp lệ trước khi dedupe lesson signature; catalog hiện cho phép một từ xuất hiện ở nhiều topic.
- Script tuyệt đối không ghi Supabase; live audit chỉ dùng `select` theo batch.


# Nghiên cứu nguồn dữ liệu từ vựng cho LingoPro

## Trạng thái NLM CLI

- Đã tự động đăng nhập lại và chạy deep research.
- Notebook: `LingoPro topic vocabulary sources`
- Notebook ID: `e7b091aa-9668-4adf-b7a6-88855aa6286d`
- Kết quả: 71 nguồn được tìm thấy; chỉ nhập 4 nguồn máy đọc được để đánh giá.

## Nguồn nên ưu tiên

| Nguồn | Dùng cho | Giấy phép | Quyết định |
|---|---|---|---|
| [Open English WordNet](https://en-word.net/) | Gom từ theo trường nghĩa: nghề nghiệp, nhân viên, gia đình, đồ ăn, phương tiện... | CC BY 4.0 | Ưu tiên số 1 để tạo taxonomy topic/subtopic |
| [Kaikki / Wiktionary extract](https://kaikki.org/dictionary/index.html) | Nghĩa, IPA, từ loại, cụm từ, quan hệ từ | CC BY-SA + GFDL | Có thể import, nhưng phải lưu attribution và kiểm tra nghĩa trước khi publish |
| [Tatoeba downloads](https://tatoeba.org/en/downloads) | Câu ví dụ tự nhiên | CC BY 2.0 FR; một phần CC0 | Chỉ dùng khi lưu tác giả/license theo từng câu |
| [EFLLex](https://cental.uclouvain.be/cefrlex/efllex/) | Xếp độ khó CEFR A1-C1 | Trang tải cho phép nghiên cứu/giảng dạy | Chưa dùng production trả phí trước khi xác minh quyền thương mại |

## Kết quả NLM

| Nguồn | Giá trị | Quyết định |
|---|---|---|
| [Open Language Profiles CEFR-J](https://github.com/openlanguageprofiles/olp-en-cefrj) | CSV gắn độ khó CEFR-J, phù hợp map vào kho hiện tại | Ưu tiên thử nghiệm; xác minh attribution từng file trước production |
| [open-dict-data/ipa-dict](https://github.com/open-dict-data/ipa-dict) | IPA dạng text/JSON/CSV | Chỉ cân nhắc tập English US sau khi kiểm tra license file cụ thể |
| FreeDict | Từ điển song ngữ, TEI/XML | Không import production trước khi review nghĩa vụ GPL của từng bộ |

Các nguồn NLM tìm được vẫn thiếu taxonomy topic thực dụng. Topic/subtopic nên được tạo từ Open English WordNet và được kiểm duyệt trước khi publish.

## Việc đã tự động hóa trong UI

- Loại bộ A-Z và các bộ tổng hợp 462-595 từ khỏi catalog học.
- Chia đều mỗi lesson thành micro-pack 10-20 từ, mục tiêu 15.
- Gắn ảnh cover theo nhóm chủ đề và sửa một số typo tiêu đề nguồn.
- Preview toàn bộ từ trước khi thêm; backend từ chối pack trên 20 từ.
- Học đúng pack vừa chọn bằng danh sách ID tối đa 20.
- Khóa `catalogVersion` để tab cũ không nhập nhầm pack sau deploy.
- Import thủ công giới hạn 30 từ duy nhất/lượt.

## Nguồn không tự động import

- Oxford 3000/5000, Cambridge English Vocabulary Profile và các list IELTS thương mại: không import nếu chưa có giấy phép rõ ràng.
- Danh sách blog, Quizlet, Anki deck cộng đồng: nguồn gốc và quyền tái phân phối không ổn định.
- Bộ từ chỉ xếp A-Z hoặc bộ 500-600 từ: không đưa vào onboarding vì không có ngữ cảnh học.

## Pipeline đề xuất

1. Dùng Open English WordNet để lấy các synset gốc theo topic.
2. Lọc lemma bằng tần suất/CEFR; mỗi subtopic giữ 30-90 từ.
3. Chuẩn hóa với `global_dictionary`, loại từ thiếu nghĩa tiếng Việt hoặc ảnh không phù hợp.
4. Chia đều thành micro-pack 10-20 từ, mục tiêu 15 từ.
5. Chỉ publish pack khi 100% có nghĩa và tối thiểu 80% có ảnh hợp lệ.
6. Lưu `source`, `source_url`, `license`, `attribution` trong artifact nhập trước khi đẩy database.

## Topic ưu tiên nhập tiếp

1. Đi làm: nhân viên, phòng ban, họp, deadline, tuyển dụng, lương.
2. Du lịch: sân bay, khách sạn, chỉ đường, sự cố.
3. Đời sống: gia đình, nhà cửa, mua sắm, đồ ăn.
4. Sức khỏe: cơ thể, triệu chứng, khám bệnh, thói quen.
5. Công nghệ: thiết bị, internet, bảo mật, giao tiếp số.

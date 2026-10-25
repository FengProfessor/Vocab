# Open vocabulary import

Pipeline chỉ đọc file local. Không tải/cào. Mặc định chỉ tạo artifact tại
`tmp/open-vocab-staging/open-vocab-staging.json`, không kết nối production.

## Input hỗ trợ

- CEFR-J CSV: header `word`/`headword`/`lemma` và `cefr`/`level`.
- ipa-dict English US TSV/CSV: `word<TAB>ipa`, có hoặc không có header.
- Open English WordNet JSON/CSV tùy chọn: flat records có `word`/`lemma` và
  `topic`/`domain`/`lexname`.

License mặc định: CEFR-J `CC BY-SA 4.0`, ipa-dict `MIT`, Open English WordNet
`CC BY 4.0`. Phải kiểm tra license/attribution của chính release local trước khi
apply. Có thể override bằng `--cefr-license`, `--cefr-attribution`,
`--ipa-license`, `--ipa-attribution`, `--wordnet-license`,
`--wordnet-attribution`. Validator chỉ chấp nhận allowlist trên.

## DRY-RUN và validate

```powershell
npm run open-vocab:stage -- --cefr=D:\data\cefr-j.csv --ipa=D:\data\en_US.tsv --wordnet=D:\data\oewn.csv
npm run open-vocab:validate
```

Artifact chứa word lowercase, CEFR, IPA-US, source attribution/license và
diagnostics. Validator kiểm tra license allowlist, duplicate artifact word,
word/CEFR/IPA/attribution; báo coverage; exit code 1 khi invalid > 1% hoặc có
lỗi artifact global. Tỷ lệ source rows bị reject cũng phải `<= 1%`; duplicate
trong cùng source được báo riêng để review.

WordNet topic mapping chỉ dùng cho staging/review. Pipeline không apply topics
WordNet vào database.

## Apply có chủ đích

```powershell
$env:OPEN_VOCAB_APPLY_CONFIRM='I_UNDERSTAND'
npm run open-vocab:apply -- --cefr=D:\data\cefr-j.csv --ipa=D:\data\en_US.tsv
```

`--apply` chỉ cập nhật `global_dictionary.data.openVocab` trên từ đã tồn tại.
Không insert từ mới; không sửa nghĩa, ảnh, tags hoặc field `data` khác. Script
ghi backup row cũ vào `tmp/open-vocab-staging/apply-backup-*.json`.

Apply cần `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` trong env
hoặc `.env.local`. Không commit env hay artifact staging.

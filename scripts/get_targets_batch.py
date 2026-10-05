import sys
import json

with open('.agents/teamwork/explorer_m3_audit_remediation/remediation_targets_114.json', 'r', encoding='utf-8') as f:
    targets = json.load(f)

start_idx = int(sys.argv[1]) if len(sys.argv) > 1 else 0
end_idx = int(sys.argv[2]) if len(sys.argv) > 2 else len(targets)

for i in range(start_idx, min(end_idx, len(targets))):
    t = targets[i]
    print(f"INDEX {i}: ImageName: rem_{i:03d} | card_id: {t['card_id']}")
    print(f"PROMPT: {t['remediation_prompt']}")
    print("-" * 50)

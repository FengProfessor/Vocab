import os
import json
import urllib.request

dotenv_path = '.env.local'
env_vars = {}
with open(dotenv_path, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env_vars[k.strip()] = v.strip()

api_key = env_vars.get('GROQ_API_KEY')
print("Testing Groq API key:", bool(api_key))

test_cards = [
    {
        "id": "verb-to-be_1",
        "sentence": "I am a student.",
        "vi": "Tôi là học sinh.",
        "situation": "giới thiệu tên, nghề nghiệp hoặc vai trò"
    },
    {
        "id": "verb-to-be_3",
        "sentence": "The keys are on the table.",
        "vi": "Chìa khóa ở trên bàn.",
        "situation": "nói vị trí"
    }
]

prompt = f"""You are an educational art director for an English-learning platform for Vietnamese learners.
For each sentence below, generate a 1-sentence vivid visual scene description for FLUX image generation.
The image MUST depict the exact situation described so a learner understands the meaning at a glance.
Do NOT include any text, letters, signs, words, or typography in the scene.
Every prompt must end with: ", clear situational educational illustration, modern vibrant art style, no text, no letters, no words, no watermark"

Return ONLY a valid JSON object mapping "id" to prompt string.

Input:
{json.dumps(test_cards, ensure_ascii=False, indent=2)}
"""

req_data = {
    "model": "llama-3.3-70b-versatile",
    "messages": [
        {"role": "user", "content": prompt}
    ],
    "response_format": {"type": "json_object"},
    "temperature": 0.2
}

req = urllib.request.Request(
    "https://api.groq.com/openai/v1/chat/completions",
    data=json.dumps(req_data).encode("utf-8"),
    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
)

with urllib.request.urlopen(req, timeout=30) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    content = res["choices"][0]["message"]["content"]
    print("Response JSON:")
    print(content)

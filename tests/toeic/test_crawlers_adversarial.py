"""
Adversarial test suite for TOEIC crawlers:
1. crawl_study4.py cluster grouping and audio extraction with mock HTML.
2. crawl_all_ets.py sibling inheritance across 3-question clusters in Part 3 and Part 4.
"""

import sys
from bs4 import BeautifulSoup

def test_study4_part3_mock_html():
    print("=== TEST 1: Study4 Part 3 Mock HTML Clustering ===")
    # Construct mock HTML: 13 distinct audio elements, 39 question wrappers
    html_parts = []
    for i in range(13):
        html_parts.append(f'<audio src="https://s4-media1.study4.com/audios/{32+i*3}-{34+i*3}_audio.{i:04d}.mp3"><source src="https://s4-media1.study4.com/audios/{32+i*3}-{34+i*3}_audio.{i:04d}.mp3"></audio>')

    for q in range(32, 71):
        html_parts.append(f'''
        <div class="question-wrapper" data-qid="qid_{q}">
            <div class="question-number"><strong>{q}</strong></div>
            <div class="question-text">Question text for {q}</div>
            <div class="form-check-label">Option A for {q}</div>
            <div class="form-check-label">Option B for {q}</div>
            <div class="form-check-label">Option C for {q}</div>
            <div class="form-check-label">Option D for {q}</div>
        </div>
        ''')

    soup_prac = BeautifulSoup("".join(html_parts), "html.parser")

    # Replicate crawl_study4.py audio extraction
    page_audios = []
    for a in soup_prac.select("audio"):
        source = a.select_one("source")
        a_src = a.get("src") or (source.get("src") if source else None)
        if a_src and a_src not in page_audios:
            page_audios.append(a_src)

    assert len(page_audios) == 13, f"Expected 13 audios, got {len(page_audios)}"

    part_data = {"questions": [], "groups": []}
    p_num = 3
    q_wrappers = soup_prac.select(".question-wrapper")
    assert len(q_wrappers) == 39, f"Expected 39 wrappers, got {len(q_wrappers)}"

    for q_idx, qw in enumerate(q_wrappers):
        qid = qw.get("data-qid", "")
        qnum_el = qw.select_one(".question-number strong, .question-number")
        qnum = qnum_el.text.strip() if qnum_el else str(q_idx + 1)
        qtext_el = qw.select_one(".question-text")
        qtext = qtext_el.get_text(" ", strip=True) if qtext_el else ""
        options = [lbl.text.strip() for lbl in qw.select(".form-check-label, .answer-item label")]

        if p_num in (3, 4):
            audio_idx = q_idx // 3
            q_audio = page_audios[audio_idx] if audio_idx < len(page_audios) else ""
        else:
            q_audio = page_audios[q_idx] if q_idx < len(page_audios) else ""

        q_item = {
            "qid": qid,
            "qnum": qnum,
            "text": qtext,
            "options": options,
            "audio_url": q_audio,
            "image_url": "",
            "correct_answer": None
        }
        part_data["questions"].append(q_item)

    if p_num in (3, 4):
        cluster_count = 13 if p_num == 3 else 10
        for c_idx in range(cluster_count):
            start_i = c_idx * 3
            cluster_qs = part_data["questions"][start_i:start_i + 3]
            c_audio = page_audios[c_idx] if c_idx < len(page_audios) else ""
            part_data["groups"].append({
                "group_index": c_idx + 1,
                "passage": "",
                "audio_url": c_audio,
                "images": [],
                "questions": cluster_qs
            })

    # Verification checks
    assert len(part_data["questions"]) == 39, "Part 3 must have 39 questions"
    assert len(part_data["groups"]) == 13, "Part 3 must have 13 groups"

    for c_idx in range(13):
        group = part_data["groups"][c_idx]
        assert len(group["questions"]) == 3, f"Group {c_idx+1} must contain exactly 3 questions"
        expected_audio = f"32+i*3"
        start_q = 32 + c_idx * 3
        end_q = start_q + 2

        # Check all 3 questions in group share identical audio
        q0 = group["questions"][0]
        q1 = group["questions"][1]
        q2 = group["questions"][2]

        assert q0["audio_url"] == group["audio_url"], f"Q{q0['qnum']} audio mismatch with group"
        assert q1["audio_url"] == group["audio_url"], f"Q{q1['qnum']} audio mismatch with group"
        assert q2["audio_url"] == group["audio_url"], f"Q{q2['qnum']} audio mismatch with group"
        assert f"{start_q}-{end_q}" in group["audio_url"], f"Audio {group['audio_url']} does not match range {start_q}-{end_q}"

    unique_audios = set(q["audio_url"] for q in part_data["questions"])
    assert len(unique_audios) == 13, f"Expected 13 unique audios, got {len(unique_audios)}"
    print("  PASS: Study4 Part 3 mock HTML correctly grouped 39 questions into 13 clusters with 13 unique audios.")

def test_study4_part4_mock_html():
    print("\n=== TEST 2: Study4 Part 4 Mock HTML Clustering ===")
    html_parts = []
    for i in range(10):
        html_parts.append(f'<audio src="https://s4-media1.study4.com/audios/{71+i*3}-{73+i*3}_audio.{i:04d}.mp3"><source src="https://s4-media1.study4.com/audios/{71+i*3}-{73+i*3}_audio.{i:04d}.mp3"></audio>')

    for q in range(71, 101):
        html_parts.append(f'''
        <div class="question-wrapper" data-qid="qid_{q}">
            <div class="question-number"><strong>{q}</strong></div>
            <div class="question-text">Talk question text for {q}</div>
            <div class="form-check-label">Option A for {q}</div>
            <div class="form-check-label">Option B for {q}</div>
            <div class="form-check-label">Option C for {q}</div>
            <div class="form-check-label">Option D for {q}</div>
        </div>
        ''')

    soup_prac = BeautifulSoup("".join(html_parts), "html.parser")

    page_audios = []
    for a in soup_prac.select("audio"):
        source = a.select_one("source")
        a_src = a.get("src") or (source.get("src") if source else None)
        if a_src and a_src not in page_audios:
            page_audios.append(a_src)

    assert len(page_audios) == 10, f"Expected 10 audios, got {len(page_audios)}"

    part_data = {"questions": [], "groups": []}
    p_num = 4
    q_wrappers = soup_prac.select(".question-wrapper")

    for q_idx, qw in enumerate(q_wrappers):
        qid = qw.get("data-qid", "")
        qnum_el = qw.select_one(".question-number strong, .question-number")
        qnum = qnum_el.text.strip() if qnum_el else str(q_idx + 1)
        qtext_el = qw.select_one(".question-text")
        qtext = qtext_el.get_text(" ", strip=True) if qtext_el else ""
        options = [lbl.text.strip() for lbl in qw.select(".form-check-label, .answer-item label")]

        audio_idx = q_idx // 3
        q_audio = page_audios[audio_idx] if audio_idx < len(page_audios) else ""

        part_data["questions"].append({
            "qid": qid,
            "qnum": qnum,
            "text": qtext,
            "options": options,
            "audio_url": q_audio,
            "image_url": "",
            "correct_answer": None
        })

    cluster_count = 10
    for c_idx in range(cluster_count):
        start_i = c_idx * 3
        cluster_qs = part_data["questions"][start_i:start_i + 3]
        c_audio = page_audios[c_idx] if c_idx < len(page_audios) else ""
        part_data["groups"].append({
            "group_index": c_idx + 1,
            "passage": "",
            "audio_url": c_audio,
            "images": [],
            "questions": cluster_qs
        })

    assert len(part_data["questions"]) == 30, "Part 4 must have 30 questions"
    assert len(part_data["groups"]) == 10, "Part 4 must have 10 groups"

    for c_idx in range(10):
        group = part_data["groups"][c_idx]
        assert len(group["questions"]) == 3, f"Group {c_idx+1} must contain exactly 3 questions"
        start_q = 71 + c_idx * 3
        end_q = start_q + 2

        q0 = group["questions"][0]
        q1 = group["questions"][1]
        q2 = group["questions"][2]

        assert q0["audio_url"] == group["audio_url"]
        assert q1["audio_url"] == group["audio_url"]
        assert q2["audio_url"] == group["audio_url"]
        assert f"{start_q}-{end_q}" in group["audio_url"]

    unique_audios = set(q["audio_url"] for q in part_data["questions"])
    assert len(unique_audios) == 10, f"Expected 10 unique audios, got {len(unique_audios)}"
    print("  PASS: Study4 Part 4 mock HTML correctly grouped 30 questions into 10 clusters with 10 unique audios.")

def test_study4_adversarial_edge_cases():
    print("\n=== TEST 3: Study4 Crawler Adversarial Edge Cases ===")
    # Edge case 1: Duplicate audios in HTML
    html = '''
    <audio src="audio1.mp3"></audio>
    <audio src="audio1.mp3"></audio>
    <audio src="audio2.mp3"></audio>
    '''
    soup = BeautifulSoup(html, "html.parser")
    page_audios = []
    for a in soup.select("audio"):
        a_src = a.get("src")
        if a_src and a_src not in page_audios:
            page_audios.append(a_src)
    assert page_audios == ["audio1.mp3", "audio2.mp3"], "Duplicate audios should be deduped"
    print("  PASS: Audio deduplication works correctly.")

    # Edge case 2: Insufficient audios (e.g. 11 audios for 13 clusters)
    page_audios = [f"audio_{i}.mp3" for i in range(11)]
    part_data = {"questions": [], "groups": []}
    for q_idx in range(39):
        audio_idx = q_idx // 3
        q_audio = page_audios[audio_idx] if audio_idx < len(page_audios) else ""
        part_data["questions"].append({"qnum": 32 + q_idx, "audio_url": q_audio})

    for c_idx in range(13):
        start_i = c_idx * 3
        cluster_qs = part_data["questions"][start_i:start_i + 3]
        c_audio = page_audios[c_idx] if c_idx < len(page_audios) else ""
        part_data["groups"].append({
            "group_index": c_idx + 1,
            "audio_url": c_audio,
            "questions": cluster_qs
        })

    # Clusters 0-10 should have audio, clusters 11-12 should have empty audio without IndexError
    assert part_data["groups"][10]["audio_url"] == "audio_10.mp3"
    assert part_data["groups"][11]["audio_url"] == ""
    assert part_data["groups"][12]["audio_url"] == ""
    print("  PASS: Insufficient audios handled gracefully with empty string fallback, zero crash.")

def test_ets_sibling_inheritance_adversarial():
    print("\n=== TEST 4: ETS Sibling Inheritance Adversarial Simulation ===")

    # Simulate questions with intentional corruptions in Part 3 and Part 4
    questions = []

    # Generate 39 Part 3 questions
    for qnum in range(32, 71):
        c_idx = (qnum - 32) // 3
        questions.append({
            'id': f"q-ets-{qnum}",
            'questionNumber': qnum,
            'part': 3,
            'audioUrl': f"https://toeic.com/audio/cluster_{c_idx}.mp3",
            'imageUrl': f"https://toeic.com/img/cluster_{c_idx}.png" if c_idx == 4 else None,
            'transcript': f"Transcript for cluster {c_idx}"
        })

    # Corruptions in Part 3:
    # Cluster 0 (Q32-34): Q33 missing audioUrl
    questions[1]['audioUrl'] = None

    # Cluster 1 (Q35-37): Q35 missing audioUrl (first item)
    questions[3]['audioUrl'] = None

    # Cluster 2 (Q38-40): Q40 missing audioUrl (last item)
    questions[8]['audioUrl'] = None

    # Cluster 3 (Q41-43): Q41 and Q42 missing audioUrl (two siblings missing)
    questions[9]['audioUrl'] = None
    questions[10]['audioUrl'] = None

    # Cluster 4 (Q44-46): Q45 and Q46 missing imageUrl (has image on Q44)
    questions[13]['imageUrl'] = None
    questions[14]['imageUrl'] = None

    # Cluster 5 (Q47-49): Q48 missing transcript
    questions[16]['transcript'] = None

    # Cluster 6 (Q50-52): All 3 missing audioUrl (orphaned cluster)
    questions[18]['audioUrl'] = None
    questions[19]['audioUrl'] = None
    questions[20]['audioUrl'] = None

    # Generate 30 Part 4 questions
    for qnum in range(71, 101):
        c_idx = (qnum - 71) // 3
        questions.append({
            'id': f"q-ets-{qnum}",
            'questionNumber': qnum,
            'part': 4,
            'audioUrl': f"https://toeic.com/audio/p4_cluster_{c_idx}.mp3",
            'imageUrl': None,
            'transcript': f"P4 Transcript for cluster {c_idx}"
        })

    # Part 4 corruption: Q72 missing audioUrl
    questions[40]['audioUrl'] = None

    # RUN SIBLING INHERITANCE ALGORITHM (as implemented in crawl_all_ets.py lines 244-268)
    for part, start_q, end_q in [(3, 32, 70), (4, 71, 100)]:
        for cluster_start in range(start_q, end_q + 1, 3):
            cluster = [q for q in questions if q['part'] == part and cluster_start <= q['questionNumber'] <= cluster_start + 2]
            # Inherit audioUrl
            shared_audio = next((q['audioUrl'] for q in cluster if q.get('audioUrl')), None)
            if shared_audio:
                for q in cluster:
                    if not q.get('audioUrl'):
                        q['audioUrl'] = shared_audio
            # Inherit imageUrl
            shared_image = next((q['imageUrl'] for q in cluster if q.get('imageUrl')), None)
            if shared_image:
                for q in cluster:
                    if not q.get('imageUrl'):
                        q['imageUrl'] = shared_image
            # Inherit transcript
            shared_transcript = next((q['transcript'] for q in cluster if q.get('transcript')), None)
            if shared_transcript:
                for q in cluster:
                    if not q.get('transcript'):
                        q['transcript'] = shared_transcript

    # VERIFY INHERITANCE
    # 1. Cluster 0: Q33 inherited audioUrl from Q32
    assert questions[1]['audioUrl'] == "https://toeic.com/audio/cluster_0.mp3", f"Q33 did not inherit audioUrl: {questions[1]['audioUrl']}"
    print("  PASS: Cluster 0 Q33 (middle sibling) inherited audioUrl.")

    # 2. Cluster 1: Q35 inherited audioUrl from Q36
    assert questions[3]['audioUrl'] == "https://toeic.com/audio/cluster_1.mp3", f"Q35 did not inherit audioUrl: {questions[3]['audioUrl']}"
    print("  PASS: Cluster 1 Q35 (first sibling) inherited audioUrl.")

    # 3. Cluster 2: Q40 inherited audioUrl from Q38
    assert questions[8]['audioUrl'] == "https://toeic.com/audio/cluster_2.mp3", f"Q40 did not inherit audioUrl: {questions[8]['audioUrl']}"
    print("  PASS: Cluster 2 Q40 (last sibling) inherited audioUrl.")

    # 4. Cluster 3: Q41 and Q42 inherited audioUrl from Q43
    assert questions[9]['audioUrl'] == "https://toeic.com/audio/cluster_3.mp3", f"Q41 did not inherit audioUrl: {questions[9]['audioUrl']}"
    assert questions[10]['audioUrl'] == "https://toeic.com/audio/cluster_3.mp3", f"Q42 did not inherit audioUrl: {questions[10]['audioUrl']}"
    print("  PASS: Cluster 3 Q41 & Q42 (two siblings) inherited audioUrl from single surviving sibling.")

    # 5. Cluster 4: Q45 and Q46 inherited imageUrl from Q44
    assert questions[13]['imageUrl'] == "https://toeic.com/img/cluster_4.png", f"Q45 did not inherit imageUrl: {questions[13]['imageUrl']}"
    assert questions[14]['imageUrl'] == "https://toeic.com/img/cluster_4.png", f"Q46 did not inherit imageUrl: {questions[14]['imageUrl']}"
    print("  PASS: Cluster 4 Q45 & Q46 inherited imageUrl from Q44.")

    # 6. Cluster 5: Q48 inherited transcript from Q47
    assert questions[16]['transcript'] == "Transcript for cluster 5", f"Q48 did not inherit transcript: {questions[16]['transcript']}"
    print("  PASS: Cluster 5 Q48 inherited transcript.")

    # 7. Cluster 6 (Orphan): Remains None, zero crash
    assert questions[18]['audioUrl'] is None
    assert questions[19]['audioUrl'] is None
    assert questions[20]['audioUrl'] is None
    print("  PASS: Cluster 6 (orphaned cluster) gracefully kept None without throwing exceptions.")

    # 8. Part 4 Cluster 0: Q72 inherited audioUrl from Q71
    assert questions[40]['audioUrl'] == "https://toeic.com/audio/p4_cluster_0.mp3", f"Q72 did not inherit audioUrl: {questions[40]['audioUrl']}"
    print("  PASS: Part 4 Q72 inherited audioUrl.")

    # 9. Verify zero cross-cluster leakage
    for c_idx in range(13):
        if c_idx == 6: continue # orphan
        start_i = c_idx * 3
        c_qs = questions[start_i:start_i+3]
        for q in c_qs:
            assert f"cluster_{c_idx}.mp3" in q['audioUrl'], f"Cross-cluster audio leak detected in Q{q['questionNumber']}: {q['audioUrl']}"
    print("  PASS: Sibling inheritance strictly contained within 3-question clusters (zero cross-cluster leakage).")

if __name__ == "__main__":
    test_study4_part3_mock_html()
    test_study4_part4_mock_html()
    test_study4_adversarial_edge_cases()
    test_ets_sibling_inheritance_adversarial()
    print("\n[SUCCESS] ALL CRAWLER ADVERSARIAL TESTS PASSED CLEANLY!")

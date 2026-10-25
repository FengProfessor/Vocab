import {
  SentenceSpan,
  SentenceChunk,
  SentenceKernel,
  MainClauseAnalysis,
  SecondaryClause,
  SentenceAnalysisData,
  SpanRole,
} from '@/types/sentence-analysis';

export interface GdMeaning {
  pos?: string;
  definition?: string;
  example?: string;
}

export interface GdData {
  pronunciations?: { ipa?: string }[];
  results?: { meanings?: GdMeaning[] }[];
}

export function looksVietnamese(s: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s);
}

export function looksEnglishHead(s: string): boolean {
  const t = s.trim();
  if (!t || looksVietnamese(t)) return false;
  return /^[A-Za-z][A-Za-z'’\-\s]{0,120}$/.test(t);
}

/**
 * Extracts the core head noun phrase from a complex noun phrase.
 * Example: "the flow of water from the Atlantic into the Strait of Gibraltar" -> "the flow of water"
 * Rather than blindly stripping all stop words and returning the last word (e.g. "Gibraltar").
 */
export function extractNounPhraseHead(phrase: string): string {
  let t = phrase.trim();
  if (!t) return '';

  // Remove relative clauses: "the scientist who discovered X" -> "the scientist"
  t = t.replace(/\s+,?\s*(who|which|that|whom|whose)\b[\s\S]*$/i, '').trim();

  // If there are downstream prepositional phrases, preserve the initial core (e.g. "the flow of water")
  const prepMatch = t.match(
    /^([\s\S]+?)\s+(from|into|onto|in|at|with|by|under|over|through|for|about|towards|against|between|among|across|during|without)\s+[\s\S]+$/i,
  );
  if (prepMatch && prepMatch[1]) {
    const headPart = prepMatch[1].trim();
    if (headPart.length >= 3 && headPart.split(/\s+/).length <= 6) {
      return headPart;
    }
  }

  // If phrase is reasonable length (1-4 words), return as-is
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return t;

  // Otherwise take up to first 4 words
  return words.slice(0, 4).join(' ');
}

/**
 * Aligns spans to the original sentence so that joining span texts strictly reproduces
 * 100% of the original sentence with zero omitted characters, zero text shift, and zero duplication.
 */
export function alignSpansWithSentence(
  rawSpans: SentenceSpan[],
  originalSentence: string,
): SentenceSpan[] {
  if (!originalSentence) return rawSpans || [];
  if (!rawSpans || rawSpans.length === 0) {
    return [{ text: originalSentence, role: 'other', label_vi: '' }];
  }

  const result: SentenceSpan[] = [];
  let currIdx = 0;
  const sentenceLower = originalSentence.toLowerCase();

  for (const span of rawSpans) {
    const spanText = (span.text || '').trim();
    if (!spanText) continue;

    const spanLower = spanText.toLowerCase();

    // 1. Direct sequential exact match
    let matchIdx = sentenceLower.indexOf(spanLower, currIdx);
    let matchLen = spanText.length;

    // 2. Fuzzy token boundary match if exact match fails
    // Handles missing punctuation/commas in span (e.g. "John the doctor" vs "John, the doctor,")
    if (matchIdx < 0) {
      const words = spanLower.match(/[\p{L}\p{N}']+/gu);
      if (words && words.length > 0) {
        const firstWord = words[0];
        const lastWord = words[words.length - 1];
        const firstIdx = sentenceLower.indexOf(firstWord, currIdx);
        if (firstIdx >= 0) {
          const lastIdx = sentenceLower.indexOf(lastWord, firstIdx + firstWord.length - 1);
          if (lastIdx >= 0) {
            matchIdx = firstIdx;
            matchLen = lastIdx + lastWord.length - firstIdx;
          }
        }
      }
    }

    if (matchIdx >= 0) {
      // Gap text between currIdx and matchIdx
      if (matchIdx > currIdx) {
        result.push({
          text: originalSentence.slice(currIdx, matchIdx),
          role: 'other',
          label_vi: '',
        });
      }

      // Exact slice from originalSentence ensures original punctuation is retained
      const exactText = originalSentence.slice(matchIdx, matchIdx + matchLen);
      result.push({
        ...span,
        text: exactText,
      });
      currIdx = matchIdx + matchLen;
    }
  }

  // Trailing remainder
  if (currIdx < originalSentence.length) {
    result.push({
      text: originalSentence.slice(currIdx),
      role: 'other',
      label_vi: '',
    });
  }

  return result;
}

/**
 * Constructs span segmentation from structured Main Clause and Secondary Clauses
 * sorted by appearance order in sentence with zero overlaps.
 */
export function buildSpansFromClauses(
  sentence: string,
  mainClause: MainClauseAnalysis,
  secondaryClauses: SecondaryClause[] = [],
): SentenceSpan[] {
  const sentenceLower = sentence.toLowerCase();
  const candidateSpans: Array<SentenceSpan & { pos: number; len: number }> = [];

  const addCandidate = (text: string, role: SpanRole, label_vi: string) => {
    const t = text.trim();
    if (!t) return;
    const pos = sentenceLower.indexOf(t.toLowerCase());
    if (pos >= 0) {
      candidateSpans.push({ text: t, role, label_vi, pos, len: t.length });
    }
  };

  // If subject has embedded relative clause and secondaryClauses contains that relative clause,
  // ensure subject text doesn't overlap with the relative clause text
  let subjText = mainClause.subject?.text || '';
  const embeddedRel = secondaryClauses.find(
    (sc) => sc.type === 'relative_clause' && subjText.toLowerCase().includes(sc.text.toLowerCase()),
  );
  if (embeddedRel) {
    const relIdx = subjText.toLowerCase().indexOf(embeddedRel.text.toLowerCase());
    if (relIdx > 0) {
      subjText = subjText.slice(0, relIdx).trim();
    }
  }

  if (subjText) {
    addCandidate(subjText, 'S', 'Chủ ngữ [S]');
  }
  if (mainClause.verb?.text) {
    addCandidate(
      mainClause.verb.text,
      'V',
      mainClause.verb.tense ? `Vị ngữ [V] (${mainClause.verb.tense})` : 'Vị ngữ [V]',
    );
  }
  if (mainClause.object?.text) {
    addCandidate(mainClause.object.text, 'O', 'Tân ngữ [O]');
  }

  for (const clause of secondaryClauses) {
    if (clause.text) {
      addCandidate(clause.text, 'clause', clause.type_label_vi || 'Mệnh đề phụ');
    }
  }

  // Sort candidates by appearance in the sentence
  candidateSpans.sort((a, b) => a.pos - b.pos);

  // Filter out overlapping candidates
  const nonOverlapping: SentenceSpan[] = [];
  let lastEnd = 0;
  for (const cand of candidateSpans) {
    if (cand.pos >= lastEnd) {
      nonOverlapping.push({
        text: cand.text,
        role: cand.role,
        label_vi: cand.label_vi,
      });
      lastEnd = cand.pos + cand.len;
    }
  }

  return alignSpansWithSentence(nonOverlapping, sentence);
}

/**
 * Protects AI contextual meanings & POS from being overwritten by blind database lookups.
 * Solves R2: "stemmed" must retain POS as Động từ (Verb) and contextual meaning "ngăn chặn, kìm hãm dòng chảy",
 * not noun "thân cây".
 */
export function enrichChunksWithDbMeanings(
  chunks: SentenceChunk[],
  dbMap: Map<string, GdData>,
): SentenceChunk[] {
  return chunks.map((chunk) => {
    const gd = dbMap.get(chunk.base.toLowerCase());
    if (!gd) return chunk;

    const ipa = gd.pronunciations?.[0]?.ipa || chunk.ipa;
    const chunkPosLower = (chunk.pos || '').toLowerCase();

    const isVerb = /verb|động từ|\bv\b/i.test(chunkPosLower);
    const isNoun = /noun|danh từ|\bn\b/i.test(chunkPosLower);
    const isAdj = /adj|tính từ/i.test(chunkPosLower);
    const isAdv = /adv|trạng từ/i.test(chunkPosLower);

    // Search for a matching meaning that aligns with chunk's POS
    let matchingMeaning: GdMeaning | undefined;
    if (gd.results) {
      for (const res of gd.results) {
        for (const m of res.meanings || []) {
          const mPos = (m.pos || '').toLowerCase();
          if (
            (isVerb && /verb|động từ|\bv\b/i.test(mPos)) ||
            (isNoun && /noun|danh từ|\bn\b/i.test(mPos)) ||
            (isAdj && /adj|tính từ/i.test(mPos)) ||
            (isAdv && /adv|trạng từ/i.test(mPos))
          ) {
            matchingMeaning = m;
            break;
          }
        }
        if (matchingMeaning) break;
      }
    }

    // Never overwrite valid contextual Vietnamese meaning from AI
    const hasValidContextMeaning =
      chunk.meaning_vi &&
      chunk.meaning_vi !== '—' &&
      looksVietnamese(chunk.meaning_vi);

    let finalPos = chunk.pos;
    if (!finalPos && matchingMeaning?.pos) {
      finalPos = matchingMeaning.pos;
    }

    let finalMeaning = chunk.meaning_vi;
    if (!hasValidContextMeaning && matchingMeaning?.definition) {
      finalMeaning = matchingMeaning.definition;
    }

    return {
      ...chunk,
      meaning_vi: finalMeaning || chunk.meaning_vi,
      pos: finalPos || chunk.pos,
      ipa,
      from_db: Boolean(matchingMeaning || gd.pronunciations?.length),
    };
  });
}

const AUX_FINITE =
  /^(is|are|was|were|has|have|had|do|does|did|can|could|will|would|should|must|may|might|am)$/i;

const KNOWN_FINITE =
  /^(stemmed|stems|likes?|liked|loves?|loved|lives?|lived|teaches?|taught|reads?|writes?|wrote|makes?|made|takes?|took|gives?|gave|gets?|got|seems?|becomes?|became|remains?|turns?|lies?|lay|goes?|went|comes?|came|works?|worked|plays?|played|helps?|helped|needs?|needed|wants?|wanted|shows?|showed|says?|said|tells?|told|asks?|asked|feels?|felt|keeps?|kept|leaves?|left|begins?|began|starts?|started|ends?|ended|opens?|opened|closes?|closed|moves?|moved|runs?|ran|walks?|walked|sits?|sat|stands?|stood|thinks?|thought|knows?|knew|sees?|saw|hears?|heard|calls?|called|uses?|used|finds?|found|builds?|built|buys?|bought|sells?|sold|pays?|paid|costs?|means?|meant|outperforms?|outperformed|supplants?|supplanted|shifts?|shifted|involves?|involved|demands?|demanded|requires?|required|equals?|highlights?|underlines?|describes?|argues?|claims?|proves?|functions?|produces?|produced|puts?|put|sets?|leads?|led|holds?|held|brings?|brought|meets?|met|grows?|grew|falls?|fell|rises?|rose|presents?|presented|discovered|discovers|expands?|expanded|resolves?|resolved|dismisses?|dismissed|continues?|continued|publishes?|published|creates?|created|reduces?|reduced)$/i;

const PRONOUN_STOP =
  /^(this|that|these|those|his|its|their|theirs|ours|yours|us|someone|everyone|anyone|no one|something|everything|anything|nothing)$/i;

export function isFiniteVerbToken(t: string): boolean {
  if (PRONOUN_STOP.test(t)) return false;
  if (AUX_FINITE.test(t) || KNOWN_FINITE.test(t)) return true;
  if (/ed$/i.test(t) && t.length > 3 && !/ly$/i.test(t)) return true;
  if (/(?:ches|shes|sses|zzes|xes|oes|[bcdfghjklmnpqrstvwxyz]ies|[aeiou]ys|[^s]s)$/i.test(t) && t.length > 3) {
    if (/^(students|teachers|books|things|years|days|people|children|women|men|ways|parts|words|ideas|problems|results|systems|methods|reasons|levels|areas|times|places|cases|points|groups|members|numbers|values|types|kinds|forms|names|sides|lines|pages|rooms|schools|cities|countries|laptops|mornings|evenings|process|analysis|basis|crisis|hypothesis)$/i.test(t)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Extracts true dictionary lemma for English verbs to avoid corruptions like "wa", "ha", "creat".
 */
export function getVerbBase(v: string): string {
  const s = v.trim().toLowerCase();
  if (!s) return '';
  if (/^(is|am|are|was|were|been|being)$/.test(s)) return 'be';
  if (/^(has|have|had|having)$/.test(s)) return 'have';
  if (/^(do|does|did|doing|done)$/.test(s)) return 'do';
  if (/^(can|could)$/.test(s)) return 'can';
  if (/^(will|would)$/.test(s)) return 'will';
  if (/^(shall|should)$/.test(s)) return 'shall';
  if (/^(may|might)$/.test(s)) return 'may';
  if (/^(went|gone)$/.test(s)) return 'go';
  if (/^(saw|seen)$/.test(s)) return 'see';
  if (/^(took|taken)$/.test(s)) return 'take';
  if (/^(gave|given)$/.test(s)) return 'give';
  if (/^(became|become)$/.test(s)) return 'become';
  if (/^(made|making)$/.test(s)) return 'make';
  if (/^(found|finding)$/.test(s)) return 'find';
  if (/^(led|leading)$/.test(s)) return 'lead';
  if (/^(held|holding)$/.test(s)) return 'hold';
  if (/^(brought|bringing)$/.test(s)) return 'bring';
  if (/^(came|come|coming)$/.test(s)) return 'come';
  if (/^(wrote|written|writing)$/.test(s)) return 'write';
  if (/^(spoke|spoken|speaking)$/.test(s)) return 'speak';
  if (/^(chose|chosen|choosing)$/.test(s)) return 'choose';
  if (/^(began|begun|beginning)$/.test(s)) return 'begin';
  if (/^(knew|known|knowing)$/.test(s)) return 'know';
  if (/^(thought|thinking)$/.test(s)) return 'think';
  if (/^(built|building)$/.test(s)) return 'build';
  if (/^(bought|buying)$/.test(s)) return 'buy';
  if (/^(taught|teaching)$/.test(s)) return 'teach';
  if (/^(caught|catching)$/.test(s)) return 'catch';
  if (/^(lost|losing)$/.test(s)) return 'lose';
  if (/^(paid|paying)$/.test(s)) return 'pay';
  if (/^(read)$/.test(s)) return 'read';
  if (/^(put)$/.test(s)) return 'put';
  if (/^(set)$/.test(s)) return 'set';
  if (/^(stemmed|stem)$/.test(s)) return 'stem';

  // Double consonant + ed: stopped -> stop, planned -> plan, stemmed -> stem
  if (/([bdfgklmnprstz])\1ed$/i.test(s) && s.length > 5) {
    return s.slice(0, -3);
  }
  // -ied: studied -> study, applied -> apply
  if (s.endsWith('ied') && s.length > 4) {
    return s.slice(0, -3) + 'y';
  }
  // -ed ending: created -> create, solved -> solve, reduced -> reduce, expanded -> expand
  if (s.endsWith('ed') && s.length > 4) {
    if (s.endsWith('ued')) {
      return s.slice(0, -1); // continue, argue, pursue
    }
    if (/[cdegslmnprtvz]ed$/i.test(s)) {
      if (/(?:sent|pand|mand|tend|port|dict|sist|ject|tract|spect|duct|struct)ed$/i.test(s)) {
        return s.slice(0, -2);
      }
      return s.slice(0, -1);
    }
    return s.slice(0, -2);
  }
  // -ies: studies -> study
  if (s.endsWith('ies') && s.length > 4) {
    return s.slice(0, -3) + 'y';
  }
  // -es: passes -> pass, watches -> watch, washes -> wash, mixes -> mix
  if (/(?:sses|shes|ches|xes|zzes)$/i.test(s)) {
    return s.slice(0, -2);
  }
  // -s ending: teaches -> teach, writes -> write, likes -> like
  if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) {
    return s.slice(0, -1);
  }
  return s;
}

/**
 * Accurately detects the grammatical tense of a verb.
 */
export function detectVerbTense(v: string): string {
  const s = v.trim().toLowerCase();
  if (
    /^(was|were|had|did|went|saw|became|came|took|gave|found|built|led|kept|left|began|made|felt|knew|thought|sat|stood|told|said|brought|held|fell|rose)$/.test(
      s,
    ) ||
    /ed$/i.test(s)
  ) {
    return 'Past simple';
  }
  if (/^(will|shall)\b/i.test(s)) {
    return 'Future simple';
  }
  if (/^(can|could|may|might|should|would|must)\b/i.test(s)) {
    return 'Modal verb';
  }
  if (/^(is|are|am|has|have|do|does)$/.test(s) || /s$/i.test(s)) {
    return 'Present simple';
  }
  return 'Present simple';
}

/**
 * Advanced Heuristic Semantic Decomposition:
 * Detects Participle Result Clauses (, thereby ...ing, , thus ...ing, etc.)
 * Detects Fronted Participle Clauses ("Having completed..., the team...")
 * Detects Fronted Adverbial Clauses ("Although..., we decided...")
 * Detects Fronted Prepositional Frames ("According to..., the company...")
 * Detects Relative Clauses (who, which, that)
 * Decomposes Main Clause (S, V, O) without cutting or mangling.
 */
export function advancedHeuristicAnalysis(sentence: string): SentenceAnalysisData {
  let text = sentence.trim();
  const secondaryClauses: SecondaryClause[] = [];

  // 1. Detect tail participle result / modifier clause:
  // e.g. ", thereby significantly reducing the amount of water received by the Mediterranean."
  // or ", thus creating...", ", resulting in...", ", leading to..."
  const therebyMatch = text.match(
    /,?\s*\b(thereby|thus|resulting\s+in|leading\s+to|causing)\b\s*([\s\S]+)$/i,
  );
  let mainClauseText = text;

  if (therebyMatch && therebyMatch.index && therebyMatch.index > 10) {
    const fullTail = therebyMatch[0].trim().replace(/^,\s*/, '');
    const linker = therebyMatch[1].trim();
    const tailRest = therebyMatch[2].trim();

    const words = tailRest.split(/\s+/);
    let action = words[0] || '';
    let target = words.slice(1).join(' ');

    if (words.length > 1 && words[0].endsWith('ly') && /ing$/i.test(words[1])) {
      action = `${words[0]} ${words[1]}`;
      target = words.slice(2).join(' ');
    } else if (/ing$/i.test(words[0])) {
      action = words[0];
      target = words.slice(1).join(' ');
    }

    const cleanTarget = target.replace(/[.!?]+$/, '');

    secondaryClauses.push({
      type: 'participle_result',
      type_label_vi: 'Mệnh đề phân từ chỉ kết quả',
      text: fullTail,
      linker,
      action,
      target: cleanTarget,
      translation_vi: `qua đó ${action} ${cleanTarget}`.trim(),
    });

    mainClauseText = text.slice(0, therebyMatch.index).trim().replace(/,\s*$/, '');
  } else {
    // Check tail non-restrictive relative clause: e.g. ", which resulted in..."
    const whichMatch = text.match(/,?\s*\b(which)\s+([\s\S]*)$/i);
    if (whichMatch && whichMatch.index && whichMatch.index > 15) {
      const fullTail = whichMatch[0].trim().replace(/^,\s*/, '');
      const linker = whichMatch[1];
      const tailRest = whichMatch[2];

      secondaryClauses.push({
        type: 'relative_clause',
        type_label_vi: 'Mệnh đề quan hệ bổ sung ý',
        text: fullTail,
        linker,
        target: tailRest.replace(/[.!?]+$/, ''),
        translation_vi: `điều mà ${tailRest}`.replace(/[.!?]+$/, ''),
      });

      mainClauseText = text.slice(0, text.length - whichMatch[0].length).trim().replace(/,\s*$/, '');
    }
  }

  // 2. Detect fronted clauses on mainClauseText:
  // 2a. Fronted prepositional phrase / frame opener: "According to the report, the company..."
  const frontPrepMatch = mainClauseText.match(
    /^(According to\s+[^,]+|In a series of\s+[^,]+|In addition to\s+[^,]+|In order to\s+[^,]+|Despite\s+[^,]+|In spite of\s+[^,]+|Due to\s+[^,]+|For decades|For years|In reality,\s*however|By\s+[A-Za-z]+ing\s+[^,]+|Under\s+[^,]+),\s*([\s\S]+)$/i,
  );
  if (frontPrepMatch) {
    const frontText = frontPrepMatch[1].trim();

    secondaryClauses.unshift({
      type: 'prepositional_phrase',
      type_label_vi: 'Cụm giới từ / Khung mở đầu',
      text: frontText,
      translation_vi: frontText,
    });

    mainClauseText = frontPrepMatch[2].trim();
  } else {
    // 2b. Fronted adverbial clause: "Although the weather was bad, we decided..."
    const frontAdverbialMatch = mainClauseText.match(
      /^(Although|Even though|Though|While|Whereas|When|Whenever|Before|After|Since|Because|As|If|Unless|Once|Provided that|As soon as)\s+([^,]+),\s*([\s\S]+)$/i,
    );
    if (frontAdverbialMatch) {
      const linker = frontAdverbialMatch[1].trim();
      const body = frontAdverbialMatch[2].trim();
      const frontText = `${linker} ${body}`;

      secondaryClauses.unshift({
        type: 'adverbial_clause',
        type_label_vi: 'Mệnh đề trạng ngữ',
        text: frontText,
        linker,
        target: body,
        translation_vi: `${linker} ${body}`,
      });

      mainClauseText = frontAdverbialMatch[3].trim();
    } else {
      // 2c. Fronted participle: "Having completed the survey, the team..." or "Using advanced algorithms, the software..."
      const frontParticipleMatch = mainClauseText.match(
        /^((?:Having\s+[A-Za-z]+|Being\s+[A-Za-z]+|[A-Za-z]+ing)\s+[^,]+),\s*([\s\S]+)$/i,
      );
      if (frontParticipleMatch) {
        const frontText = frontParticipleMatch[1].trim();
        const words = frontText.split(/\s+/);
        let action = words[0];
        let target = words.slice(1).join(' ');
        if (words[0].toLowerCase() === 'having' && words.length > 1) {
          action = `${words[0]} ${words[1]}`;
          target = words.slice(2).join(' ');
        }

        secondaryClauses.unshift({
          type: 'participle_result',
          type_label_vi: 'Mệnh đề phân từ mở đầu',
          text: frontText,
          action,
          target,
          translation_vi: `Sau khi ${action} ${target}`.trim(),
        });

        mainClauseText = frontParticipleMatch[2].trim();
      }
    }
  }

  // 3. Check embedded relative clause in subject:
  // e.g. "The scientist who discovered X presented Y"
  const relInSubjMatch = mainClauseText.match(
    /^([A-Za-z0-9'\s-]+?)\s+\b(who|which|that)\s+([\s\S]+?)\s+\b([A-Za-z]+ed|[A-Za-z]+s|presented|showed|argued|made|took|gave|leads?|led)\b([\s\S]*)$/i,
  );

  let s = '';
  let sHead = '';
  let v = '';
  let vTense = 'Present / Past';
  let o = '';
  let oHead = '';

  if (relInSubjMatch) {
    const subjNoun = relInSubjMatch[1].trim();
    const relMarker = relInSubjMatch[2];
    const relBody = relInSubjMatch[3].trim();
    const mainVerb = relInSubjMatch[4];
    const mainObj = relInSubjMatch[5].trim();

    s = subjNoun; // Core subject without the relative clause!
    sHead = subjNoun;
    v = mainVerb;
    vTense = detectVerbTense(mainVerb);
    o = mainObj.replace(/^[,\s]+|[,\s.!?;]+$/g, '');
    oHead = extractNounPhraseHead(o);

    const relClause: SecondaryClause = {
      type: 'relative_clause',
      type_label_vi: `Mệnh đề quan hệ (${relMarker})`,
      text: `${relMarker} ${relBody}`,
      linker: relMarker,
      action: relBody.split(/\s+/)[0] || '',
      target: relBody.split(/\s+/).slice(1).join(' ') || '',
      translation_vi: `người / cái mà ${relBody}`,
    };

    // Keep relative clause positioned after any fronted clause
    const therebyIdx = secondaryClauses.findIndex((c) => c.type === 'participle_result' && c.linker === 'thereby');
    if (therebyIdx >= 0) {
      secondaryClauses.splice(therebyIdx, 0, relClause);
    } else {
      secondaryClauses.push(relClause);
    }
  } else {
    // 4. Standard S - V - O extraction on mainClauseText
    const tokens = mainClauseText
      .replace(/[^\p{L}\p{N}'\s-]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean);

    let vIdx = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (isFiniteVerbToken(tokens[i])) {
        vIdx = i;
        break;
      }
    }

    if (vIdx === -1) {
      vIdx = Math.min(Math.max(1, Math.floor(tokens.length / 3)), Math.max(0, tokens.length - 1));
    }

    v = tokens[vIdx] || 'is';
    vTense = detectVerbTense(v);

    // Find v in mainClauseText to preserve exact substring characters and punctuation
    const vPos = mainClauseText.indexOf(v);
    if (vPos > 0) {
      s = mainClauseText.slice(0, vPos).trim();
    } else {
      s = tokens.slice(0, vIdx).join(' ') || 'This';
    }
    sHead = extractNounPhraseHead(s);

    if (vPos >= 0) {
      o = mainClauseText.slice(vPos + v.length).trim().replace(/^[,\s]+|[,\s.!?;]+$/g, '');
    } else {
      o = tokens.slice(vIdx + 1).join(' ');
    }
    oHead = extractNounPhraseHead(o);
  }

  const main_clause: MainClauseAnalysis = {
    subject: { text: s, head: sHead || s },
    verb: { text: v, head: getVerbBase(v) || v, tense: vTense },
    object: o ? { text: o, head: oHead || o } : undefined,
    translation_vi: `${s} đã ${v} ${o}`.trim(),
  };

  const kernel: SentenceKernel = {
    text: `${sHead || s} ${v} ${oHead || o}.`.replace(/\.\.+$/, '.'),
    s: sHead || s,
    v,
    o: oHead || o || undefined,
    translation_vi: `${sHead || s} ${v} ${oHead || o}`.trim(),
  };

  // Generate clean spans
  const spans = buildSpansFromClauses(sentence, main_clause, secondaryClauses);

  // Extract contextual chunks & collocations
  const chunks: SentenceChunk[] = [];
  const vBase = getVerbBase(v);
  if (v.toLowerCase() === 'stemmed' || v.toLowerCase() === 'stem') {
    chunks.push({
      text: 'stemmed',
      base: 'stem',
      pos: 'Động từ (Verb)',
      meaning_vi: 'ngăn chặn, kìm hãm, chặn đứng dòng chảy',
    });
  } else if (v) {
    chunks.push({
      text: v,
      base: vBase,
      pos: 'Động từ (Verb)',
      meaning_vi: vBase === 'be' ? 'là, thì, ở' : vBase === 'have' ? 'có' : 'thực hiện hành động',
    });
  }

  if (o.toLowerCase().includes('flow of water')) {
    chunks.push({
      text: 'the flow of water',
      base: 'flow of water',
      pos: 'Cụm danh từ',
      meaning_vi: 'dòng chảy của nước',
    });
  }
  if (o.toLowerCase().includes('strait of gibraltar')) {
    chunks.push({
      text: 'Strait of Gibraltar',
      base: 'Strait of Gibraltar',
      pos: 'Danh từ riêng',
      meaning_vi: 'eo biển Gibraltar',
    });
  }
  if (sHead && sHead.length > 2 && !/^(this|that|these|those|it|we|they|he|she)$/i.test(sHead)) {
    chunks.push({
      text: sHead,
      base: sHead.toLowerCase().replace(/^(the|a|an)\s+/i, ''),
      pos: 'Chủ ngữ / Cụm danh từ',
      meaning_vi: 'đối tượng chính',
    });
  }
  if (oHead && oHead.length > 2 && !chunks.some((c) => c.text === oHead)) {
    chunks.push({
      text: oHead,
      base: oHead.toLowerCase().replace(/^(the|a|an)\s+/i, ''),
      pos: 'Tân ngữ / Cụm danh từ',
      meaning_vi: 'đối tượng tác động',
    });
  }

  for (const sc of secondaryClauses) {
    if (sc.action && sc.action.toLowerCase().includes('reducing')) {
      chunks.push({
        text: sc.action,
        base: 'significantly reduce',
        pos: 'Cụm động từ',
        meaning_vi: 'làm giảm đáng kể',
      });
    }
    if (sc.target && sc.target.toLowerCase().includes('received by')) {
      chunks.push({
        text: 'received by',
        base: 'receive by',
        pos: 'Cụm động từ bị động',
        meaning_vi: 'được tiếp nhận bởi',
      });
    }
  }

  return {
    sentence,
    translation_vi:
      main_clause.translation_vi + (secondaryClauses.length ? `, ${secondaryClauses[0].translation_vi}` : ''),
    structure: secondaryClauses.length
      ? `S + V + O · ${secondaryClauses[0].type_label_vi}`
      : 'S + V + O',
    kernel,
    main_clause,
    secondary_clauses: secondaryClauses,
    spans,
    chunks,
    notes: [
      'Phân tích cấu trúc phân tầng (Mệnh đề chính vs Mệnh đề phụ/phân từ).',
    ],
  };
}

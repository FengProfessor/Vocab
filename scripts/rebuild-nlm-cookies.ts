/**
 * Rebuild NLM cookies.txt from browser cookie header.
 * Run: npx tsx scripts/rebuild-nlm-cookies.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const COOKIE_HEADER = `HSID=At7NUynGZnX9p9jZp; SSID=AJFgwOVLE8vOs--4N; APISID=sZNInXtZfWGWTmS8/AKNPmgeFR72TDHhPh; SAPISID=kCmAVN5BJkr6pdLT/APuGYrRfK-qRPQA0F; __Secure-1PAPISID=kCmAVN5BJkr6pdLT/APuGYrRfK-qRPQA0F; __Secure-3PAPISID=kCmAVN5BJkr6pdLT/APuGYrRfK-qRPQA0F; SEARCH_SAMESITE=CgQI3qAB; AEC=AaJma5va3eajqVRhziBbBAiT3inXMCkHsejMfBcWmj2AmNaA0VqxGVyqRQ; __Secure-BUCKET=CMsG; NID=533=OFoNeM39mLKUOYE57iOqkdzArXnV5tVFFm7mHlC8ys4MetUdKqqwbvXUtG2qAljxpUoza-NB5oVA0GyoOrX2lyEbYrgXfR0Q-tWLCl4SGmBhuNwidGKvI2IOOU6ci_XSf1iZmoX4ZU5niBtcmlwNUxRX1EXaVfCKMXOPqiwpkjoyi-zuAKDST0GQ7yBzGHZ_Uce5SQb-MyL-KbDofvKoMy3aoEh-I7SNrL8B1ndOeaoZj6HjYLT2JtGEhbzXS_wPq6YE86qj_pk1n34ujGUbj0vMu8iRnepA9BKLS2J1dRVg_ITZOgeIoiNdTOqODRnDNxjxA6NaK6Dyu-QchJu5of33gxOVarjrCb-r5viGPNEzfC1O1OupRBOF7JC2dP_jpKwjPbTE8od8bSjDgN0QuNc2yS1VuHxAaNz8ymqL7XnRtnd9kRrKCPBkAGLgyuaPFUQ7jZU-Je18BltVRfqaoKivf0NrXpr90ua7QiLm611vZ9LAgm2b_mih0al35zXz1RrYWStOFii0hbyQZ-ONJU2wjiYpcG9FJvSwXuehTDgcyZBl494POH1_j7Ld4leYRnA8qV7DntJx9iwXS0l4pRGlr4FFknbIUBQ1QO6ua0HoSuxY6uY0TaeU-lxGllsSZo0KnfAWh3gShQohBC_YRnxoKtcms-AfK0S1z6qKCgPp1GT_OdsRLdVzqkRcRnhFbZCr1eIJ_iTa5PSgmEROpLiaRXndV6mwkSbhClTqaK2Z5FO1QSxYL9L9cR8; SID=g.a000BQkVKuOk8lRI3PeWCyg8TvbGghcuzv52ZaADD-GGdnn6LEkVOMg0xNSGTuMOtrcgafUgRQACgYKAbQSARQSFQHGX2MiE2osfqM8mnbMjF0a9I15shoVAUF8yKre1MecnNyxKWiDvn3asPpI0076; __Secure-1PSID=g.a000BQkVKuOk8lRI3PeWCyg8TvbGghcuzv52ZaADD-GGdnn6LEkVYPDS65zHMINTJsPqdt19-gACgYKAYsSARQSFQHGX2MiPAaJC28jRXATdFVEV9UHahoVAUF8yKoQa8I65J5YO0_U9mNcM_ky0076; __Secure-3PSID=g.a000BQkVKuOk8lRI3PeWCyg8TvbGghcuzv52ZaADD-GGdnn6LEkV-MtEVv9bjSXOe6n_Fb3ECQACgYKAZwSARQSFQHGX2MixyWPglKCbUl6TQFRPJ1h5RoVAUF8yKruuiCq7E1l2T60tudbKPz20076; OSID=g.a000BQkVKnZjXqqYefSITvBQBPsN-80cKyeJa9N0wNGyWESPSqqSQ_wMWvnZ41cq09WDixIBOwACgYKAR0SARQSFQHGX2MiMiX3x4wLxN9oDs_4thhWSRoVAUF8yKokY4QlbgOrMxzZptdHsteF0076; __Secure-OSID=g.a000BQkVKnZjXqqYefSITvBQBPsN-80cKyeJa9N0wNGyWESPSqqS-rPcn00abE4sQ5exxS3DNgACgYKAVQSARQSFQHGX2Mi1tQohJk3wgQ8S7duPLtwxxoVAUF8yKqouJvTjaOYgOzTrH755BNw0076; _ga=GA1.1.1339294029.1786147626; _ga_W0LDH41ZCB=GS2.1.s1786147626$o1$g1$t1786148054$j59$l0$h0; __Secure-1PSIDTS=sidts-CjYBPWEu2RwOPFLu2hEbk07YBsCKqur5c_kxH8vZmLvwZsbRdlafLt_0omdyEhMEbdWhJXcJuSsQAA; __Secure-1PSIDRTS=sidts-CjYBPWEu2RwOPFLu2hEbk07YBsCKqur5c_kxH8vZmLvwZsbRdlafLt_0omdyEhMEbdWhJXcJuSsQAA; __Secure-3PSIDTS=sidts-CjYBPWEu2RwOPFLu2hEbk07YBsCKqur5c_kxH8vZmLvwZsbRdlafLt_0omdyEhMEbdWhJXcJuSsQAA; __Secure-3PSIDRTS=sidts-CjYBPWEu2RwOPFLu2hEbk07YBsCKqur5c_kxH8vZmLvwZsbRdlafLt_0omdyEhMEbdWhJXcJuSsQAA; SIDCC=AKEyXzWjmZKXVgoMPrI9smq76xaDKJzFv1gN5G2VeKYi1SAhhMYLkWp_TNgsjHX2fOqTxxKtOxI; __Secure-1PSIDCC=AKEyXzX_u2UwQLXElpUhAA4tHwObJSOFPGg7Kg2PR_uMGTvO2eqRe_m4h-hHbmv7MEhDz7nm-x0; __Secure-3PSIDCC=AKEyXzXx7PzVsbY94_7VgtbQVFwYm_OpciwMofTbagjxKBH5K3Vj5wISSsW46Gf-aPTX1S7lSA`;

const NLM_DIR = path.join(process.env.USERPROFILE || '', '.nlm');
const COOKIE_FILE = path.join(NLM_DIR, 'cookies.txt');

// Parse cookie header → Netscape cookie format
function headerToNetscape(header: string): string {
  const lines: string[] = [
    '# Netscape HTTP Cookie File',
    '# https://curl.haxx.se/rfc/cookie_spec.html',
    '# This is a generated file! Do not edit.',
    '',
  ];

  // Expiry: 1 year from now
  const expiry = Math.floor(Date.now() / 1000) + 365 * 86400;

  const pairs = header.split(';').map((s) => s.trim()).filter(Boolean);

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx < 0) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();

    // Determine domain and secure flag
    const isSecure = name.startsWith('__Secure-');
    const isOSID = name === 'OSID' || name === '__Secure-OSID';

    // OSID cookies go to notebook.google.com
    const domain = isOSID ? 'notebook.google.com' : '.google.com';
    const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const secureFl = isSecure ? 'TRUE' : 'FALSE';

    // Format: domain \t includeSubdomains \t path \t secure \t expiry \t name \t value
    lines.push(`${domain}\t${includeSubdomains}\t/\t${secureFl}\t${expiry}\t${name}\t${value}`);
  }

  return lines.join('\n') + '\n';
}

const content = headerToNetscape(COOKIE_HEADER);

// Backup old
if (fs.existsSync(COOKIE_FILE)) {
  const backup = COOKIE_FILE + '.bak.' + Date.now();
  fs.copyFileSync(COOKIE_FILE, backup);
  console.log('Backed up old cookies to:', backup);
}

fs.writeFileSync(COOKIE_FILE, content, 'utf-8');
console.log('Written new cookies.txt:', COOKIE_FILE);
console.log(`${content.split('\n').filter((l) => l && !l.startsWith('#')).length} cookies`);

// Also write to burn-minh profile dir if it exists
const profileDir = path.join(NLM_DIR, 'profiles', 'burn-minh');
if (fs.existsSync(profileDir)) {
  const profileCookie = path.join(profileDir, 'cookies.txt');
  fs.writeFileSync(profileCookie, content, 'utf-8');
  console.log('Also written to profile:', profileCookie);
} else {
  // Create profile dir
  fs.mkdirSync(profileDir, { recursive: true });
  const profileCookie = path.join(profileDir, 'cookies.txt');
  fs.writeFileSync(profileCookie, content, 'utf-8');
  console.log('Created profile dir and cookies:', profileCookie);
}

console.log('\nDone! Test with: nlm auth status -p burn-minh');

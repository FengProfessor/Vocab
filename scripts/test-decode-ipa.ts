import * as path from 'path';
import * as fs from 'fs';

const CP437_CHARS = [
  '\u00c7', '\u00fc', '\u00e9', '\u00e2', '\u00e4', '\u00e0', '\u00e5', '\u00e7', // 80-87
  '\u00ea', '\u00eb', '\u00e8', '\u00ef', '\u00ee', '\u00ec', '\u00c4', '\u00c5', // 88-8F
  '\u00c9', '\u00e6', '\u00c6', '\u00f4', '\u00f6', '\u00f2', '\u00fb', '\u00f9', // 90-97
  '\u00ff', '\u00d6', '\u00dc', '\u00a2', '\u00a3', '\u00a5', '\u20a7', '\u0192', // 98-9F
  '\u00e1', '\u00ed', '\u00f3', '\u00fa', '\u00f1', '\u00d1', '\u00aa', '\u00ba', // A0-A7
  '\u00bf', '\u2310', '\u00ac', '\u00bd', '\u00bc', '\u00a1', '\u00ab', '\u00bb', // A8-AF
  '\u2591', '\u2592', '\u2593', '\u2502', '\u2524', '\u2561', '\u2562', '\u2556', // B0-B7
  '\u2555', '\u2563', '\u2551', '\u2557', '\u255d', '\u255c', '\u255b', '\u2510', // B8-BF
  '\u2514', '\u2534', '\u252c', '\u251c', '\u2500', '\u253c', '\u255e', '\u255f', // C0-C7
  '\u255a', '\u2554', '\u2569', '\u2566', '\u2560', '\u2550', '\u256c', '\u2567', // C8-CF
  '\u2568', '\u2564', '\u2565', '\u2559', '\u2558', '\u2552', '\u2553', '\u256b', // D0-D7
  '\u256a', '\u2518', '\u250c', '\u2588', '\u2584', '\u258c', '\u2590', '\u2580', // D8-DF
  '\u03b1', '\u00df', '\u0393', '\u03c0', '\u03a3', '\u03c3', '\u00b5', '\u03c4', // E0-E7
  '\u03a6', '\u0398', '\u03a9', '\u03b4', '\u221e', '\u03c6', '\u03b5', '\u2229', // E8-EF
  '\u2261', '\u00b1', '\u2265', '\u2264', '\u2320', '\u2321', '\u00f7', '\u2248', // F0-F7
  '\u00b0', '\u2219', '\u00b7', '\u221a', '\u207f', '\u00b2', '\u25a0', '\u00a0'  // F8-FF
];

const charToByteMap: Record<string, number> = {};
for (let i = 0; i < 128; i++) {
  charToByteMap[String.fromCharCode(i)] = i;
}
for (let i = 0; i < CP437_CHARS.length; i++) {
  charToByteMap[CP437_CHARS[i]] = i + 128;
}

function decodeCP437ToUTF8(str: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (charToByteMap[char] !== undefined) {
      bytes.push(charToByteMap[char]);
    } else {
      // Fallback if character not in our map: keep char code as byte if < 256
      const code = char.charCodeAt(0);
      bytes.push(code < 256 ? code : 63); // 63 is '?'
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

const samples = [
  "/╔¬n h╔Æt ╦êw╔ö╦Ét╔Ö/",
  "/╔¬n ├░╔Ö ╦ê╔¬nt╔Ör╔¬m/",
  "/h├ªv ╦êb╩ît╔Öfla╔¬z ╔¬n j╔Ö(r) ╦êst╩îm╔Ök/",
  "/d╩Æ╩împ da╩èn ╦ês╩îmw╩înz ╬╕r╔Ö╩èt/",
  "/╦êk╔Æm╔Ön ╦îm╔¬sk╔Ön╦êsep╩ânz/",
  "/╔Ö╦êra╔¬v ├ªt ╔Ö ╦êd╔¬fr╔Önt k╔Ön╦êklu╦É╩Æn/",
  "/ste╔¬ ╔¬n t╩ît╩â w╔¬├░/",
  "/ki╦Ép ╩îp w╔¬├░ ├░╔Ö ╦êd╩Æ╔Ö╩ènz╔¬z/",
  "/╦ênes╔Öseri ╦êi╦Évl/",
  "/╦îl╔æ╦Éd╩Æ╔Ö ├░╔Ön ╦êla╔¬f/",
  "/╔íet ╔Ö ra╔¬z a╩èt ╔Öv ╦ês╩îmb╔Ödi/",
  "/la╔¬k ╔Ö k├ªt ├░├ªt e╔¬t ├░╔Ö k╔Ö╦êne╔Öri/",
  "/l╩îl b╔¬╦êf╔ö╦É ├░╔Ö st╔ö╦Ém/",
  "/la╔¬k ╔Ö red fl├ª╔í tu ╔Ö b╩èl/",
  "/h├ªv ├░╔Ö n╔£╦Érv/",
  "/la╔¬k ╦êk╔¬k╔¬┼ï ╔Ö d╔¢d we╔¬l da╩èn ├░╔Ö bi╦Ét╩â/",
  "/me╔¬k ╔Ö ╦êm╩î┼ïki a╩èt ╔Öv/",
  "/╦êp├ªdl j╔ö╦Ér ╔Ö╩èn k╔Ö╦ênu╦É/",
  "/me╔¬k s╔¢ns ╔Öv ╦ês╩îm╬╕╔¬┼ï/",
  "/me╔¬k ├░╔Ö best ╔Öv ╬╕╔¬┼ïz/",
  "/mi╦Ét ╔Ö ╦êst├ªnd╔Öd/",
  "/╦ên├ª╩ân╔Öl k╔Ö╦êr╔¬kj╔Öl╔Öm/",
  "/nek ╔Önd nek/",
  "/ni╦Édz m╩îst wen ├░╔Ö ╦êdevl dra╔¬vz/",
  "/ple╔¬ ╦êh├ªv.╔Ök/",
  "/nest e╔í/",
  "/╦ênev╔Ör re╔¬nz b╩ît ╔¬t p╔ö╦Érz/",
  "/n╔Ö╩è ╦êp╔¬kn╔¬k/",
  "/n╔æt ╔Ö h╔¢r a╩èt ╔Öv ple╔¬s/",
  "/n╔Æt ╔Ö p├ªt╩â ╔Æn/",
  "/╦ên╩î╬╕╔¬┼ï ╦êvent╩â╔Örd ╦ên╩î╬╕╔¬┼ï ╔íe╔¬nd/",
  "/╦în╩îts ╔Önd ╦êb╔Ö╩èlts/",
  "/╔íet ╔ö╦É ╔íe╔¬n ├░i ╦ê╩îp╔Ö h├ªnd/",
  "/w╩în ╔¬n ├░i a╔¬/",
  "/╦ê╔Ö╩èp╔Ön ├░╔Ö ╦êfl╩îd╔íe╔¬ts/",
  "/╦în╔¬ti ╦ê╔ír╔¬ti/",
  "/a╩èt ╔Öv ├░╔Ö ╦êkw╔¢st╩â╔Ön/",
  "/a╩èt ╔Öv ├░╔¬s w╔£╦Éld/",
  "/╦îed╩Æu╦êke╔¬╩ân r╔¬╦êf╔ö╦Ém/",
  "/╦îo╩èv╔Ör╦êw╔¢lmd w╔¬├░ ╔¬╦êmo╩è╩â╔Ön/",
  "/n╔Ö╩è ╔í╔Ö╩è ╦êe╔Öri╔Ö/",
  "/╔íet ra╩ènd ╔Ö ╦êp╔£╦És╔Ön/",
  "/f╔¬l ╔¬n f╔ö╦Émz/"
];

console.log('Testing CP437 decoding:');
for (const sample of samples) {
  console.log(`Original : "${sample}"`);
  console.log(`Decoded  : "${decodeCP437ToUTF8(sample)}"`);
  console.log('---');
}

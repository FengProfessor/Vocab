const fs = require('fs');
const path = require('path');
const d = 'src/data/speaking/topic-library/describing';
const files = fs.readdirSync(d).filter(f => f.endsWith('.ts') && f !== 'index.ts');

files.forEach(f => {
    let c = fs.readFileSync(path.join(d, f), 'utf8');
    const subcat = f.replace('.ts', '');
    // Replace { "id": "something",
    // with { "id": "something", "category": "describing", "subcategory": "subcat",
    c = c.replace(/\{\s*"?id"?:\s*"([^"]+)",/g, `{\n    "id": "$1",\n    "category": "describing",\n    "subcategory": "${subcat}",`);
    fs.writeFileSync(path.join(d, f), c);
});
console.log('Done!');

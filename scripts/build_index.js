const fs = require('fs');

let targetFile = 'C:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web-arcade/games/data/blind-test.json';
let existingData = JSON.parse(fs.readFileSync(targetFile, 'utf8'));

const lines = existingData.map(t => `${t.id} - ${t.titre} - ${t.theme || 'mixte'}`);

fs.writeFileSync('C:/Users/chjeu/Documents/Codes/Antigravity/Mini-jeux-web-arcade/games/data/blind-test-index.txt', lines.join('\n'), 'utf8');

console.log('Index généré avec succès. Quantité de morceaux : ' + lines.length);

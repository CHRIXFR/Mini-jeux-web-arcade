// Script de conversion du dictionnaire ODS (.txt → .json)
// À lancer une seule fois depuis la racine du projet : node scripts/convert-dictionary.js

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, '../games/dictionary/French ODS dictionary.txt');
const archivePath = path.join(__dirname, '../games/dictionary/archive/French ODS dictionary.txt');
const destPath = path.join(__dirname, '../games/dictionary/French ODS dictionary.json');

// Archivage du fichier .txt original avant conversion
fs.mkdirSync(path.dirname(archivePath), { recursive: true });
fs.copyFileSync(srcPath, archivePath);
console.log(`Fichier .txt archivé → ${archivePath}`);

// Lecture, filtrage et conversion en JSON
const text = fs.readFileSync(srcPath, 'utf8');
const words = text
    .split(/\r?\n/)
    .map(w => w.trim().toUpperCase())
    .filter(w => w.length >= 2 && w.length <= 15);

fs.writeFileSync(destPath, JSON.stringify(words));
console.log(`Conversion réussie : ${words.length} mots exportés → ${destPath}`);

const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';
// Modification pour viser le dossier games/data depuis /scripts
const targetDir = path.join(__dirname, '..', 'games', 'data');
const targetFile = path.join(targetDir, 'capitales.json');

// S'assurer que le dossier existe
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Téléchargement des données de mledoze/countries...');

https.get(url, (res) => {
    let rawData = '';

    res.on('data', (chunk) => {
        rawData += chunk;
    });

    res.on('end', () => {
        try {
            const countries = JSON.parse(rawData);

            // Filtrer et formater les données
            const filteredCountries = countries
                .filter(c => c.capital && c.capital.length > 0 && c.translations && (c.translations.fra || c.translations.fr))
                .map(c => ({
                    nom: (c.translations.fra || c.translations.fr).common,
                    capitale: Array.isArray(c.capital) ? c.capital[0] : c.capital,
                    iso: c.cca2 ? c.cca2.toLowerCase() : ''
                }));

            // Filtre final pour s'assurer que tout est bien là
            const finalCountries = filteredCountries.filter(c => c.nom && c.capitale && c.iso);

            fs.writeFileSync(targetFile, JSON.stringify(finalCountries, null, 2));
            console.log(`Succès ! Extrait ${finalCountries.length} pays/capitales vers ${targetFile}`);

            // Afficher un exemple
            if (finalCountries.length > 0) {
                console.log('Exemple de donnée :', finalCountries[0]);
            }

        } catch (e) {
            console.error('Erreur lors du parsing JSON:', e.message);
        }
    });

}).on('error', (e) => {
    console.error('Erreur lors de la requête GET:', e.message);
});

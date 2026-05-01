const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'games', 'data', 'capitales.json');
const PACKAGE_PATH = path.join(ROOT, 'node_modules', 'flag-icons', 'package.json');
const SOURCE_DIR = path.join(ROOT, 'node_modules', 'flag-icons', 'flags', '4x3');
const LICENSE_PATH = path.join(ROOT, 'node_modules', 'flag-icons', 'LICENSE');
const TARGET_ROOT = path.join(ROOT, 'images', 'flags');
const TARGET_DIR = path.join(TARGET_ROOT, '4x3');
const MANIFEST_PATH = path.join(TARGET_ROOT, 'flags-manifest.json');
const TARGET_LICENSE_PATH = path.join(TARGET_ROOT, 'LICENSE.flag-icons.txt');

const isCheck = process.argv.includes('--check');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureFlagIconsInstalled() {
    if (!fs.existsSync(PACKAGE_PATH) || !fs.existsSync(SOURCE_DIR)) {
        throw new Error('flag-icons is not installed. Run `npm install` before syncing flags.');
    }
}

function getIsoCodes() {
    const countries = readJson(DATA_PATH);
    const codes = countries
        .map((country) => String(country.iso || '').trim().toLowerCase())
        .filter(Boolean);
    return [...new Set(codes)].sort();
}

function buildReport() {
    ensureFlagIconsInstalled();

    const packageInfo = readJson(PACKAGE_PATH);
    const isoCodes = getIsoCodes();
    const missing = [];
    const present = [];
    const copied = [];

    if (!isCheck) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    for (const iso of isoCodes) {
        const sourcePath = path.join(SOURCE_DIR, `${iso}.svg`);
        const targetPath = path.join(TARGET_DIR, `${iso}.svg`);

        if (!fs.existsSync(sourcePath)) {
            missing.push(iso);
            continue;
        }

        const needsCopy = !fs.existsSync(targetPath)
            || fs.readFileSync(sourcePath, 'utf8') !== fs.readFileSync(targetPath, 'utf8');

        if (!isCheck && needsCopy) {
            fs.copyFileSync(sourcePath, targetPath);
            copied.push(iso);
        }

        if (fs.existsSync(targetPath) || !isCheck) {
            present.push(iso);
        }
    }

    const manifest = {
        source: 'flag-icons',
        sourcePackage: 'flag-icons',
        sourceVersion: packageInfo.version,
        sourceLicense: packageInfo.license,
        sourceRepository: packageInfo.repository && packageInfo.repository.url,
        generatedAt: new Date().toISOString(),
        flagSet: '4x3',
        totalCountries: isoCodes.length,
        copiedCount: isCheck ? present.length : isoCodes.length - missing.length,
        missing,
        flags: isoCodes
            .filter((iso) => !missing.includes(iso))
            .map((iso) => `images/flags/4x3/${iso}.svg`)
    };

    if (!isCheck) {
        fs.mkdirSync(TARGET_ROOT, { recursive: true });
        fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
        if (fs.existsSync(LICENSE_PATH)) {
            fs.copyFileSync(LICENSE_PATH, TARGET_LICENSE_PATH);
        }
    }

    return {
        ...manifest,
        copiedThisRun: copied
    };
}

try {
    const report = buildReport();
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.missing.length > 0) {
        process.exitCode = 1;
    }
} catch (error) {
    console.error(error.message);
    process.exitCode = 1;
}

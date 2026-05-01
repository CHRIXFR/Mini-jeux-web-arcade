# Arcade Minimaliste Android

APK familial qui ouvre la version GitHub Pages de l'arcade dans une WebView Android.

## Build local

Le projet utilise le SDK Android local et le plugin Android Gradle. La version release est signée si `signing/keystore.properties` existe.

```powershell
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat :app:assembleRelease
```

## Signature

Le fichier `signing/keystore.properties` n'est pas versionné. Garde le keystore associé en lieu sûr: Android exige la même clé pour installer une mise à jour par-dessus une version existante.

## Publication familiale

Copie l'APK généré vers `dist/android/arcade-minimaliste.apk`, puis publie le site GitHub Pages. La page `install.html` le télécharge depuis le dépôt versionné:

`https://chrixfr.github.io/Mini-jeux-web-arcade/dist/android/arcade-minimaliste.apk`

Le QR code versionné dans `images/install-qr.png` pointe vers:

`https://chrixfr.github.io/Mini-jeux-web-arcade/install.html`

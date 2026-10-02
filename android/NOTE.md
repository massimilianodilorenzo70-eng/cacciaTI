# App Android (TWA) — note dell'esperimento

Stato: **in pausa**. Il ramo `claude/android-twa-prova` resta com'è; da riprendere in seguito.

## Perché
Chi installa la PWA dal browser su alcuni telefoni (es. Galaxy S25 nuovo) vede l'avviso di Play Protect
«App non sicura bloccata — sviluppata per una versione precedente di Android». Il pacchetto lo costruisce
il browser, non il sito: il manifest non c'entra (era già corretto).

## Cosa è stato provato
- Sito: tolto il pulsante «Installa» su Edge e su Samsung Internet (consiglia Chrome) + nota sull'avviso
  Play Protect nell'invito (già su `main`, PR #31).
- App vera: progetto Android in `android/` (TWA, `targetSdk 35`, `minSdk 23`), compilato con GitHub Actions
  (`.github/workflows/android.yml`, si avvia anche a mano). APK/AAB negli «Artifacts» dell'esecuzione.

## Risultato della prova su telefono
- Con `targetSdk 35` l'avviso «versione precedente di Android» **non compare più**.
- Resta solo «sviluppatore non noto» (normale fuori dal Play Store).
- L'app si apre e mostra il sito; le modifiche al sito compaiono da sole (l'APK non va rifatto per quelle).
- In alto c'è la barra del browser: manca la verifica del collegamento sito–app.

## Errori incontrati (da non ripetere)
- Il passo `android-actions/setup-android` fallisce sui server GitHub: l'SDK c'è già, bastano licenze + `sdkmanager`.
- In Gradle `versionCode (x) as int` è letto male: usare `versionCode Integer.parseInt(...)`.
- `LauncherActivity` sta nella libreria `com.google.androidbrowserhelper:androidbrowserhelper`, non in
  `androidx.browser`: senza, l'app si installa ma non si apre.
- Da qui (sessione cloud) non si può scaricare l'Android SDK né generare il wrapper Gradle: si compila solo su GitHub Actions.
- La chiave di firma attuale è temporanea e cambia a ogni compilazione: per aggiornare un'app già installata
  va disinstallata prima.

## Per riprendere
1. Chiave di firma fissa: crearla e salvarla nei segreti del repo `ANDROID_KEYSTORE_B64` e
   `ANDROID_KEYSTORE_PASSWORD` (e conservarne una copia sicura).
2. Togliere la barra del browser: repo `massimilianodilorenzo70-eng.github.io` con
   `.well-known/assetlinks.json` (impronta SHA-256 della chiave, pacchetto
   `io.github.massimilianodilorenzo70eng.cacciati`) e un file `.nojekyll`.
3. Distribuzione: Play Store (25 $ una tantum) per eliminare anche «sviluppatore non noto».

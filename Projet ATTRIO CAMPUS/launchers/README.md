# Lanceurs natifs ATTRIO CAMPUS

## Génération

- Lance `npm run launcher:build`
- Le script génère :
  - `../ATTRIO CAMPUS.app`
  - `launchers/ATTRIO CAMPUS.icns`
  - `launchers/ATTRIO CAMPUS.ico`

## Mac

- Double-clique sur `../ATTRIO CAMPUS.app`
- L'app ouvre Terminal, démarre le serveur local, puis ouvre le navigateur via le script existant

## Windows

- L’icône Windows est prête dans `launchers/ATTRIO CAMPUS.ico`
- Le dossier racine conserve `../Lancer ATTRIO CAMPUS.bat` pour le démarrage
- Un builder Windows est prêt dans `scripts/build-windows-launcher.ps1`
- Sur un PC Windows, lance ce script pour générer `../ATTRIO CAMPUS.exe` avec l’icône Attrio

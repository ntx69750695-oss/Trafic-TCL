# Trafic-TCL

Application web responsive pour suivre les perturbations du réseau TCL.

## Fonctionnalités

- Actualisation automatique toutes les minutes
- Recherche par ligne ou mot-clé
- Indication du nombre de perturbations
- Interface adaptée aux téléphones
- Mise à jour manuelle

## Source des données

Grand Lyon / Sytral Mobilités — dataset officiel :
**Alertes trafic du réseau des Transports en Commun Lyonnais (v2)**.

Le navigateur contacte directement le flux JSON public lors de son utilisation.

## Déploiement GitHub Pages

1. Fusionnez cette branche dans `main`.
2. Dans GitHub, ouvrez **Settings > Pages**.
3. Dans **Build and deployment**, choisissez **Deploy from a branch**.
4. Sélectionnez `main` et le dossier `/ (root)`.
5. Ouvrez l'adresse indiquée par GitHub.

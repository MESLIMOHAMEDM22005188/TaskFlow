# Grindly Rust

Première base de la réécriture Rust de Grindly.

## Stack
- Axum + Tokio : serveur HTTP et WebSocket.
- Maud : rendu HTML côté serveur.
- SQLx / MySQL : pool MariaDB compatible MySQL.
- Serde : sérialisation des événements.

## Lancer en local

Depuis ce dossier :

```bash
cp .env.example .env
cargo run
```

Puis ouvrir http://localhost:8100.

Sans `DATABASE_URL`, le serveur démarre en mode aperçu sans persistance. Avec une URL MariaDB valide, il initialise un pool SQLx.

## Variables

Voir `.env.example`. Ne jamais committer de secrets.

## Limites de cette première étape

- L'interface communautaire est un prototype SSR.
- Les messages WebSocket sont temporaires, en mémoire, et visibles uniquement par les connexions du même processus.
- L'identité affichée est provisoire : aucune authentification n'est encore branchée.
- Les tâches, habitudes, profils, groupes et statistiques ne sont pas encore migrés.
- Aucune table existante n'est modifiée à ce stade.

## Plan de migration

1. Cartographier le schéma MariaDB réel et les contrats API existants.
2. Ajouter les repositories SQLx sans modifier les tables en place.
3. Migrer authentification, comptes et récupération de mot de passe.
4. Migrer tâches, habitudes, objectifs et statistiques.
5. Migrer communautés, groupes, publications et permissions.
6. Ajouter persistance des messages, présence et notifications.
7. Migrer les écrans restants, comparer les résultats avec l'application actuelle, puis préparer le basculement.

Le serveur Node/React existant reste la version de production pendant toute la migration.

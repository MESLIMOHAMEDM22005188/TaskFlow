# Vérification de l'adresse e-mail

## Parcours

1. `POST /api/auth/signup` crée le compte avec `email_verified = 0`, crée ses thèmes par défaut dans la même transaction, puis envoie un code de 6 chiffres via Resend.
2. Le frontend redirige vers `/verify-email?email=...`.
3. `POST /api/auth/verify-email` vérifie le code, limité à 5 tentatives et valable 15 minutes, puis active le compte.
4. `POST /api/auth/resend-verification` permet de demander un autre code. Un délai minimal d'une minute est appliqué.
5. `POST /api/auth/login` refuse les comptes non vérifiés.
6. Le middleware des routes protégées refuse également les sessions existantes d'un compte en attente.

Les comptes présents avant la migration reçoivent `email_verified = 1` par défaut afin de ne pas bloquer les utilisateurs actuels.

## Pré-requis

- Node.js 20.19 ou supérieur.
- Base MariaDB/MySQL accessible.
- Une clé API Resend.
- Une adresse expéditrice appartenant à un domaine vérifié dans Resend.
- `JWT_SECRET` configuré côté backend.

Variables backend :

```env
RESEND_API_KEY=re_...
EMAIL_FROM=Grindly <no-reply@ton-domaine-verifie.fr>
```

Le code accepte aussi l'ancienne variable `RESET_EMAIL_FROM` comme expéditeur de repli.

## Migration base de données

Exécuter une seule fois sur la base TaskFlow :

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME NULL,
  INDEX idx_email_verification_user (user_id, created_at),
  INDEX idx_email_verification_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

La migration exacte se trouve dans `backend/migrations/20261112_email_verification.sql`.

## Tests manuels

1. Créer un compte avec une adresse contrôlée.
2. Vérifier la réception d'un code à six chiffres.
3. Tenter de se connecter avant validation : l'API doit répondre HTTP 403 avec `EMAIL_NOT_VERIFIED`.
4. Ouvrir `/verify-email`, saisir le code : l'API doit répondre `verified: true`.
5. Se connecter : un JWT doit être émis.
6. Vérifier qu'un code incorrect échoue, que le code expire après 15 minutes et qu'un nouveau code ne peut pas être renvoyé plus d'une fois par minute.
7. Confirmer qu'un compte créé avant la migration peut toujours se connecter.

## Déploiement

Appliquer la migration avant de déployer le nouveau backend. Ajouter les deux variables Resend à l'environnement du service, puis déployer le frontend et le backend depuis la même révision. Ne jamais committer de fichier `.env` ou de clé Resend.

# Supabase — TaskFlow

## Projet

- Référence : `ffykzjxnsgdkzxcppvoo`
- Région : `eu-west-3` (Paris)
- URL : `https://ffykzjxnsgdkzxcppvoo.supabase.co`
- Dashboard : `https://supabase.com/dashboard/project/ffykzjxnsgdkzxcppvoo`

MySQL sur AlwaysData reste la base principale de TaskFlow. Supabase est prévu pour Auth, l'envoi des codes de récupération et leur vérification. Les tâches, profils et statistiques ne sont pas migrés.

## 1. Configuration Resend SMTP

Créer un compte sur [Resend](https://resend.com/signup), puis :

1. Ajouter un domaine d'envoi que vous contrôlez dans **Domains**.
2. Publier les enregistrements DNS SPF/DKIM fournis par Resend chez le fournisseur DNS du domaine.
3. Attendre que Resend indique que le domaine est vérifié.
4. Créer une API key dédiée à TaskFlow dans **API Keys**. Ne pas la publier dans GitHub.

Dans Supabase : [Authentication → Emails → SMTP Settings](https://supabase.com/dashboard/project/ffykzjxnsgdkzxcppvoo/auth/smtp), activer le SMTP personnalisé et renseigner :

| Champ Supabase | Valeur |
| --- | --- |
| Sender email | Une adresse du domaine vérifié, par exemple `no-reply@votre-domaine.fr` |
| Sender name | `TaskFlow` |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) |
| Username | `resend` |
| Password | La clé API Resend `re_...` |
| Minimum interval per user | Conserver au moins 60 secondes |

Resend documente aussi les ports 587/STARTTLS et 2465/SSL. Ne jamais mettre la clé Resend dans le frontend ou dans GitHub.

**Important :** le domaine vérifié est nécessaire pour envoyer des e-mails à tous les utilisateurs. L'expéditeur de test `onboarding@resend.dev` n'est pas un expéditeur de production pour les comptes de tiers.

## 2. Configuration des e-mails Supabase Auth

1. Dans **Authentication → URL Configuration**, définir le Site URL sur l'URL de production réelle de TaskFlow.
2. Ajouter les URLs de redirection de récupération de production et de développement à la liste autorisée (ex. `http://localhost:5173`).
3. Dans **Authentication → Email Templates → Reset Password**, inclure le jeton OTP avec `{{ .Token }}`, par exemple :

   `<p>Ton code de réinitialisation TaskFlow est : <strong>{{ .Token }}</strong></p>`

4. Utiliser un code à durée de vie limitée et ne pas remplacer la vérification serveur par le défi de multiplication.

## 3. Clés et variables d'environnement

- Frontend : `frontend/.env` — uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Backend AlwaysData : `SUPABASE_URL=https://ffykzjxnsgdkzxcppvoo.supabase.co` et `SUPABASE_SECRET_KEY` (clé secret Supabase), dans les variables privées de l'application.
- La clé API Resend est enregistrée uniquement dans le panneau SMTP Supabase, pas dans le dépôt Git.

La clé publishable peut être utilisée dans le navigateur. La clé secret Supabase est privilégiée : uniquement côté serveur, jamais avec un préfixe `VITE_`, jamais dans GitHub.

## 4. Architecture de récupération — point bloquant à traiter

Les utilisateurs et leurs mots de passe hachés restent dans MySQL. Le backend implémente désormais une récupération à la demande pour tous les comptes MySQL :

1. L'utilisateur saisit son pseudo TaskFlow.
2. Le backend cherche `id` et `email` dans MySQL sans révéler l'adresse au navigateur.
3. Après le défi arithmétique, le backend crée à la demande une identité Supabase Auth confirmée avec un mot de passe aléatoire inconnu, ou réutilise l'identité si elle existe déjà.
4. Supabase Auth envoie un code de récupération à l'adresse MySQL enregistrée.
5. Le backend vérifie le code Supabase avec le type `recovery`, puis met à jour uniquement le hash bcrypt du compte MySQL correspondant.

Les tâches, profils et statistiques ne sont pas migrés vers Supabase. La clé Supabase secrète reste uniquement côté serveur. Les codes et les identifiants de flux sont temporaires et conservés en mémoire du processus backend ; un redémarrage invalide les procédures en cours.

Le défi arithmétique ne prouve pas la propriété de l'adresse e-mail : seul le code reçu sur cette adresse autorise la modification du mot de passe. Ne pas exposer le service role/secret key au frontend.

## 5. Vérifications avant mise en production

- [ ] Domaine d'envoi authentifié (SPF/DKIM) et expéditeur validé dans Resend.
- [ ] SMTP personnalisé activé dans Supabase avec les paramètres Resend.
- [ ] E-mail Reset Password utilisant `{{ .Token }}`.
- [ ] Site URL et URLs de redirection correctes.
- [ ] Clé secrète Supabase stockée uniquement dans les variables privées AlwaysData.
- [ ] Provisionnement Supabase Auth à la demande testé sur plusieurs comptes MySQL.
- [ ] OTP vérifié côté serveur avant modification du hash MySQL.
- [ ] Limitation de débit, anti-énumération des comptes, expiration et usage unique testés.

## Références

- Resend — SMTP : https://resend.com/changelog/smtp-service
- Resend — intégration Supabase : https://resend.com/supabase
- Supabase — SMTP personnalisé : https://supabase.com/docs/guides/auth/auth-smtp
- Supabase — modèles d'e-mails : https://supabase.com/docs/guides/auth/auth-email-templates

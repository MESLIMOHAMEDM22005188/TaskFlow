# Supabase — TaskFlow

## Projet

- Référence : `ffykzjxnsgdkzxcppvoo`
- Région : `eu-west-3` (Paris)
- URL : `https://ffykzjxnsgdkzxcppvoo.supabase.co`
- Dashboard : `https://supabase.com/dashboard/project/ffykzjxnsgdkzxcppvoo`

MySQL sur AlwaysData reste la base principale de TaskFlow. Supabase est prévu pour Auth, l'envoi des codes de récupération et leur vérification. Les tâches, profils et statistiques ne sont pas migrés.

## 1. Configuration Brevo SMTP

Dans Brevo :

1. Ouvrir **Settings → Senders, Domains & Dedicated IPs**.
2. Ajouter un domaine d'envoi que vous contrôlez et publier les enregistrements DNS SPF/DKIM fournis par Brevo. Attendre que le domaine soit authentifié.
3. Créer un expéditeur vérifié, par exemple `no-reply@votre-domaine.fr`.
4. Ouvrir **Settings → SMTP & API → SMTP** (https://app.brevo.com/settings/keys/smtp).
5. Copier le login SMTP affiché et générer une **SMTP key**.

Ne pas utiliser le mot de passe du compte Brevo ni une API key. La SMTP key est un secret et ne doit jamais être commitée dans GitHub.

Dans Supabase : **Authentication → Emails → SMTP Settings** (https://supabase.com/dashboard/project/ffykzjxnsgdkzxcppvoo/auth/smtp), activer le SMTP personnalisé et renseigner :

| Champ Supabase | Valeur |
| --- | --- |
| Sender email | L'expéditeur vérifié chez Brevo, ex. `no-reply@votre-domaine.fr` |
| Sender name | `TaskFlow` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Le login SMTP affiché dans Brevo |
| Password | La SMTP key générée dans Brevo |
| Minimum interval per user | Conserver la valeur par défaut (60 secondes) |

Enregistrer. Le port 587 utilise STARTTLS. Le port 465 est une alternative avec SSL/TLS. Ne jamais mettre le host SMTP dans le champ username.

## 2. Configuration des e-mails Supabase Auth

1. Dans **Authentication → URL Configuration**, définir le Site URL sur l'URL de production réelle de TaskFlow.
2. Ajouter les URLs de redirection de récupération de production et de développement à la liste autorisée (ex. `http://localhost:5173`).
3. Dans **Authentication → Email Templates → Reset Password**, inclure le jeton OTP avec `{{ .Token }}`, par exemple :

   `<p>Ton code de réinitialisation TaskFlow est : <strong>{{ .Token }}</strong></p>`

4. Utiliser un code à durée de vie limitée et ne pas remplacer la vérification serveur par le défi de multiplication.

## 3. Clés et variables d'environnement

- Frontend : `frontend/.env` — uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Backend AlwaysData : `SUPABASE_URL` et `SUPABASE_SECRET_KEY`, dans les variables privées de l'application.
- Les identifiants SMTP Brevo sont enregistrés dans le panneau SMTP Supabase, pas dans le dépôt Git.

La clé publishable peut être utilisée dans le navigateur. La clé secret Supabase est privilégiée : uniquement côté serveur, jamais avec un préfixe `VITE_`, jamais dans GitHub.

## 4. Architecture de récupération — point bloquant à traiter

Les utilisateurs et leurs mots de passe hachés sont actuellement dans MySQL. Ils ne sont pas automatiquement présents dans Supabase Auth. Avant d'activer la récupération, le backend doit provisionner ou lier les identités Supabase de façon contrôlée, demander un OTP de récupération, vérifier le code côté serveur, puis seulement autoriser la mise à jour du hash bcrypt MySQL.

Ne pas activer l'inscription automatique Supabase comme raccourci et ne jamais modifier le mot de passe MySQL sur la seule base du calcul de multiplication.

La branche contient actuellement l'interface de récupération et le défi arithmétique côté serveur, mais l'envoi d'e-mail et le pont de vérification Supabase → mise à jour MySQL ne sont pas encore actifs. Ne pas considérer cette fonction comme opérationnelle ni fusionner la branche avant la fin de cette implémentation et de ses tests.

## 5. Vérifications avant mise en production

- [ ] Domaine d'envoi authentifié (SPF/DKIM) et expéditeur validé dans Brevo.
- [ ] SMTP personnalisé activé dans Supabase avec la SMTP key, pas une API key.
- [ ] E-mail Reset Password utilisant `{{ .Token }}`.
- [ ] Site URL et URLs de redirection correctes.
- [ ] Clé secrète Supabase stockée uniquement dans les variables privées AlwaysData.
- [ ] Comptes MySQL existants liés/provisionnés de façon sécurisée dans Supabase Auth.
- [ ] OTP vérifié côté serveur avant modification du hash MySQL.
- [ ] Limitation de débit, anti-énumération des comptes, expiration et usage unique testés.

## Références

- Brevo — guide SMTP : https://help.brevo.com/hc/fr/articles/7924908994450-Envoyer-des-emails-transactionnels-avec-Brevo-SMTP
- Brevo — paramètres SMTP : https://developers.brevo.com/docs/smtp-integration
- Supabase — SMTP personnalisé : https://supabase.com/docs/guides/auth/auth-smtp
- Supabase — modèles d'e-mails : https://supabase.com/docs/guides/auth/auth-email-templates

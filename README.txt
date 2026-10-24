# Système réel de candidatures — Club Dev UCAO-UUT

Ce projet comprend :
- index.html : formulaire public ;
- app.js : validation et envoi vers Supabase ;
- admin.html + admin.js : connexion bureau, liste, recherche, filtre et statut ;
- config.js : URL + clé publique du projet ;
- schema.sql : tables, contraintes et politiques RLS ;
- style.css : styles.

## Étape 1 — Créer Supabase
1. Va sur https://supabase.com et crée un projet.
2. Garde le mot de passe de base de données dans un gestionnaire de mots de passe ; ne le mets jamais dans le code.
3. Dans le tableau de bord Supabase, ouvre SQL Editor, colle tout `schema.sql`, puis exécute-le.
4. Dans Project Settings / API (ou Connect), copie l'URL du projet et la clé publishable/anon. Ne copie jamais `service_role` / secret key dans le site.

## Étape 2 — Configurer le site
1. Ouvre `config.js`.
2. Remplace `COLLER_ICI_URL_SUPABASE` par l'URL du projet.
3. Remplace `COLLER_ICI_CLE_PUBLISHABLE_OU_ANON` par la clé publishable/anon.
4. Enregistre le fichier. La clé publishable est visible dans le navigateur par conception : c'est RLS qui protège les données.

## Étape 3 — Créer le premier administrateur
1. Dans Supabase, va dans Authentication > Users et ajoute/invite le compte e-mail d'un responsable du club, avec un mot de passe robuste. Désactive les inscriptions publiques dans Auth si elles ne sont pas nécessaires.
2. Copie l'UUID de cet utilisateur.
3. Dans SQL Editor, exécute cette requête en remplaçant l'UUID :
   insert into public.club_admins (user_id) values ('UUID-DE-L-ADMIN');
4. Répète seulement pour les responsables qui doivent accéder aux candidatures. Ne donne pas le compte admin à tous les membres.

## Étape 4 — Tester en local
1. Ouvre le dossier dans VS Code.
2. Utilise l'extension Live Server pour lancer `index.html`.
3. Soumets une candidature de test avec des données fictives.
4. Ouvre `admin.html` avec Live Server et connecte-toi avec le compte administrateur.
5. Vérifie que le dossier apparaît, que la recherche fonctionne et que le statut peut être modifié.
6. Dans Supabase Table Editor, confirme que la ligne existe.
7. Teste en navigation privée : sans connexion, admin.html ne doit pas montrer les dossiers. L'API publique ne doit pas permettre de lire les candidatures.

## Étape 5 — Publication
Héberge le dossier sur un hébergeur statique HTTPS (par exemple Netlify, Cloudflare Pages ou GitHub Pages). Publie `index.html`, `admin.html`, `style.css`, `app.js`, `admin.js` et `config.js`.
N'active pas l'accès administrateur par mot de passe partagé dans le code. Utilise Supabase Auth.

## Limites et sécurité à traiter avant une campagne publique importante
Cette version enregistre réellement les candidatures dans Supabase et protège la lecture via RLS, mais elle reste une première version. Le honeypot n'est qu'une défense basique contre les robots ; il ne limite pas à lui seul les soumissions répétées. Avant un lancement à grande échelle, ajoute une fonction serveur/Edge Function avec validation et limitation de débit, ainsi qu'un CAPTCHA respectueux de la vie privée si nécessaire. Ajoute également une politique de suppression, une durée de conservation, des procédures de sauvegarde et un contact responsable.
N'enregistre pas de pièce d'identité, mot de passe, information médicale ou autre donnée sensible.
Vérifie les obligations applicables au Togo en matière de protection des données. La note de confidentialité du formulaire doit être complétée avec la durée exacte de conservation et un contact réel du club avant publication.

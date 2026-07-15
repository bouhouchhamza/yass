# Déploiement Cloudflare

Créez `stationery-db` avec Wrangler, remplacez son ID dans `wrangler.jsonc`, appliquez les migrations distantes, ajoutez `BETTER_AUTH_SECRET` avec `wrangler secret put BETTER_AUTH_SECRET`, puis exécutez `npm run deploy`. Définissez `BETTER_AUTH_URL` avec l’URL HTTPS finale pour la production.

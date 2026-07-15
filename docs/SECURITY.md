# Sécurité

Better Auth utilise des cookies de session sécurisés et des mots de passe hachés. Chaque page et action sensible valide la session côté serveur. Le propriétaire crée les caissiers; l’inscription publique est désactivée. Les opérations de caisse, dette, stock et audit utilisent des lots D1 atomiques. `BETTER_AUTH_SECRET` est un secret Worker et ne doit jamais être placé dans `wrangler.jsonc` ou Git.
# Audit des dépendances — 15 juillet 2026

`npm audit` signale six avis modérés, sans avis élevé ou critique.

- `esbuild`, `@esbuild-kit/core-utils`, `@esbuild-kit/esm-loader` et `drizzle-kit` concernent uniquement l’outil de génération de migrations en développement. Le serveur esbuild n’est pas exposé en production. npm propose un retour incompatible vers Drizzle Kit 0.18.1; ce downgrade n’est pas appliqué.
- `postcss` est embarqué transitivement par Next.js 16.2.10. L’avis concerne la sérialisation de CSS contenant une balise `</style>` contrôlée. L’application ne transforme pas de CSS fourni par les utilisateurs. npm propose un downgrade majeur incorrect de Next.js; il n’est pas appliqué.

Risque accepté temporairement jusqu’à publication de versions compatibles en amont. Ne jamais lancer `npm audit fix --force` sans revue. Les outils de développement ne doivent pas être exposés publiquement.

## Secrets

`.dev.vars` est ignoré. `.dev.vars.example` contient uniquement un placeholder. `BETTER_AUTH_SECRET` reste une variable Worker secrète et n’utilise jamais un préfixe public. Aucun mot de passe, hash, token de session ou secret n’est exporté en CSV ou écrit dans les journaux métier.

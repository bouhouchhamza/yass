# Architecture

Application mono-boutique Next.js App Router déployée sur Cloudflare Workers avec OpenNext. D1 est l’unique base SQLite, Drizzle décrit le schéma et Better Auth gère les sessions. Les mutations critiques préparent leurs écritures puis utilisent `D1Database.batch()`, qui garantit l’exécution atomique du lot.

Les montants sont toujours enregistrés en centimes entiers. Aucune image produit ni pièce jointe externe n’est stockée en version 1.

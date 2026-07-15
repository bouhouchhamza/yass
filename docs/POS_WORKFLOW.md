# Flux POS

1. Le caissier ouvre une session avec le fond de caisse.
2. Il scanne/recherche des produits ou services et choisit éventuellement un client.
3. Il sélectionne espèces, crédit ou partiel. Tout crédit exige un client.
4. Le serveur valide rôle, caisse, idempotence, prix et stock sous verrou.
5. Une transaction écrit vente, lignes, paiement, mouvements, dette et audit.
6. Le reçu utilise les snapshots immuables.

Sans réseau, la confirmation est bloquée et le panier reste dans `localStorage`.

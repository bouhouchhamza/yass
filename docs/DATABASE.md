# Base de données

La migration initiale définit les types, tables, contraintes, index, RLS et fonctions transactionnelles. `sales.idempotency_key` évite les doubles ventes. Les modes autorisés sont uniquement `cash`, `credit` et `partial_cash_credit`; une contrainte impose `paid_amount + credit_amount = total_amount`.

Le stock n’est modifié que dans une transaction qui écrit aussi `stock_movements`. La dette est accompagnée d’une ligne `customer_credit_transactions`. Les rapports de profit utilisent `sale_items.purchase_price_snapshot`.

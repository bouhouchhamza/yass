# Codes-barres

`generate_internal_barcode` incrémente atomiquement une séquence d’organisation et produit `PREFIX-000001`. Le préfixe est nettoyé, le résultat est unique et imprimable en Code 128. La caisse recherche exactement les deux codes-barres avant la recherche textuelle. Un scanner USB doit envoyer Entrée comme suffixe; la caméra utilise ZXing et nécessite HTTPS.

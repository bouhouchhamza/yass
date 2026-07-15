# Stock

Disponible = physique − réservé. Les services ont `track_stock=false`. Chaque entrée, sortie, casse, perte, retour ou inventaire écrit le stock avant/après dans `stock_movements`. Les kits valident puis verrouillent tous leurs composants avant décrément. Les seuils et la vélocité alimentent les suggestions d’achat et le rapport de stock dormant.

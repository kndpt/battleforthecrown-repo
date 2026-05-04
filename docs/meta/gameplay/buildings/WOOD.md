# 🪓 WOOD - Progression & Coûts

## Coûts de construction

| Niveau | Bois | Pierre | Fer | Population | Temps (s) |
| ------ | ---- | ------ | --- | ---------- | --------- |
| 1      | 75   | 45     | 30  | 5          | 120       |
| 2      | 90   | 55     | 35  | 0          | 220       |
| 3      | 110  | 65     | 45  | 1          | 390       |
| 4      | 130  | 80     | 50  | 0          | 710       |
| 5      | 155  | 95     | 60  | 1          | 1280      |
| 6      | 185  | 110    | 75  | 0          | 2300      |
| 7      | 220  | 135    | 90  | 1          | 4140      |
| 8      | 265  | 160    | 105 | 0          | 7450      |
| 9      | 320  | 190    | 125 | 1          | 13410     |
| 10     | 385  | 230    | 150 | 0          | 24140     |

## Effets passifs

**Poids** : 15 (constant)

**Fonction** : Production passive de bois toutes les heures

### Taux de production par niveau

| Niveau | Production/h | Multiplicateur cumulatif |
| ------ | ------------ | ------------------------ |
| 1      | 50           | 1.0x                     |
| 2      | 70           | 1.4x                     |
| 3      | 100          | 2.0x                     |
| 4      | 135          | 2.7x                     |
| 5      | 190          | 3.8x                     |
| 6      | 265          | 5.3x                     |
| 7      | 375          | 7.5x                     |
| 8      | 525          | 10.5x                    |
| 9      | 735          | 14.7x                    |
| 10     | 1,030        | 20.6x                    |

> 💡 **Notes** :
>
> - La production s'accumule continuellement en arrière-plan
> - Limité par la capacité de l'Entrepôt (Warehouse)
> - Statut : **Activé** dans la configuration actuelle

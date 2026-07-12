# Performances — DataShare

## 1. Objectif

Ce document présente le test de performance réalisé sur l'endpoint public de téléchargement ainsi que les objectifs de performance retenus pour le MVP.

L'objectif est de vérifier que le backend peut servir plusieurs téléchargements simultanés sans erreur et avec un temps de réponse acceptable.

## 2. Endpoint testé

```http
GET /api/download/{token}
```

Le test utilise un token public valide associé à un fichier existant et non expiré.

## 3. Outil utilisé

Le test est réalisé avec Grafana k6.

Le scénario est versionné dans :

```text
performance/download-test.js
```

## 4. Scénario de charge

Le scénario applique :

- 10 utilisateurs virtuels simultanés ;
- une durée de 30 secondes ;
- une pause d'une seconde entre les itérations de chaque utilisateur ;
- un téléchargement avec un token valide ;
- une vérification du statut HTTP 200 ;
- une vérification que le corps de la réponse n'est pas vide.

## 5. Seuils d'acceptation

| Indicateur | Seuil |
|---|---:|
| Taux d'erreur HTTP | inférieur à 1 % |
| Temps de réponse au 95e percentile | inférieur à 500 ms |
| Statut HTTP attendu | 200 |
| Corps du fichier | non vide |

La configuration k6 correspondante est :

```javascript
thresholds: {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
}
```

## 6. Préparation et exécution

Le backend doit être démarré et un utilisateur de test doit exister.

Exemple de préparation :

```bash
echo "Performance Test" > /tmp/perf.txt

TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@datashare.com","password":"password123"}' \
  | jq -r '.token')

UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8080/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/perf.txt" \
  -F "expirationDays=7")

DOWNLOAD_TOKEN=$(echo "$UPLOAD_RESPONSE" | jq -r '.downloadToken')
```

Exécution du test :

```bash
DOWNLOAD_TOKEN="$DOWNLOAD_TOKEN" \
k6 run performance/download-test.js
```

Les identifiants utilisés ci-dessus sont uniquement des exemples de développement et ne doivent pas être utilisés comme identifiants de production.

## 7. Résultats du test

Test exécuté le 12 juillet 2026.

### Résumé

| Indicateur | Résultat |
|---|---:|
| Utilisateurs virtuels | 10 |
| Durée | 30 secondes |
| Requêtes terminées | 300 |
| Itérations interrompues | 0 |
| Vérifications exécutées | 600 |
| Vérifications réussies | 100 % |
| Requêtes HTTP en erreur | 0 % |
| Débit moyen | 9,89 requêtes/s |
| Temps moyen | 9,09 ms |
| Temps médian | 6,26 ms |
| 90e percentile | 16,24 ms |
| 95e percentile | 21,86 ms |
| Temps maximal | 53,78 ms |

### Seuils

```text
p(95) mesuré       : 21,86 ms
p(95) maximal      : 500 ms
Résultat           : seuil respecté

Taux d'erreur      : 0,00 %
Taux maximal admis : 1,00 %
Résultat           : seuil respecté
```

Les 300 réponses ont retourné un statut 200 et un contenu non vide.

## 8. Interprétation

L'endpoint de téléchargement a supporté 300 requêtes en 30 secondes avec 10 utilisateurs virtuels simultanés, sans erreur.

Le temps de réponse au 95e percentile est de 21,86 ms, soit très en dessous du seuil de 500 ms défini pour le MVP.

Le temps maximal observé reste inférieur à 54 ms.

Dans l'environnement local utilisé pour le test, l'endpoint respecte donc les objectifs de performance définis.

Ces résultats ne constituent pas une garantie pour un environnement de production, car ils dépendent notamment :

- de la taille des fichiers ;
- du débit disque ;
- de la bande passante réseau ;
- du nombre de connexions concurrentes ;
- des ressources du serveur ;
- de la base de données ;
- de la proximité entre k6 et l'application testée.

## 9. Budget de performance frontend

Le budget de performance retenu pour le frontend est le suivant :

| Indicateur | Objectif |
|---|---:|
| Chargement initial en environnement standard | inférieur à 2 secondes |
| Réponse visuelle après une action utilisateur | inférieure à 200 ms hors appel réseau |
| Erreurs JavaScript bloquantes | 0 |
| Requêtes API inutiles ou dupliquées | 0 |
| Taille maximale d'un bundle initial | à surveiller lors du build Angular |

Les mesures de protection suivantes sont appliquées ou recommandées :

- compilation Angular en mode production ;
- découpage des pages par routes ;
- limitation des dépendances inutiles ;
- affichage d'un indicateur pendant les opérations réseau ;
- traitement des erreurs côté interface ;
- contrôle du poids des bundles lors des évolutions.

La commande suivante permet d'évaluer les bundles de production :

```bash
cd frontend
npm run build
```

Les métriques navigateur peuvent être complétées avec Lighthouse ou les outils de développement du navigateur lors d'une future campagne.

## 10. Procédure de suivi

Le test k6 doit être relancé :

- après une modification du téléchargement ;
- après un changement du mécanisme de stockage ;
- après une modification des limites de fichiers ;
- avant une mise en production importante ;
- après un changement significatif d'infrastructure.

Pour comparer les campagnes, il faut conserver :

- la version du code ;
- la taille du fichier testé ;
- la configuration k6 ;
- les ressources de la machine ;
- les résultats complets de la commande.

## 11. Conclusion

Les deux seuils de performance définis ont été respectés :

- aucune erreur HTTP ;
- temps de réponse au 95e percentile de 21,86 ms pour un objectif inférieur à 500 ms.

Le comportement mesuré est satisfaisant pour le périmètre et la charge du MVP.

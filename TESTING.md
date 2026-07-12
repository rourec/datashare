# Plan de tests — DataShare

## 1. Objectif

Le plan de tests de DataShare vise à vérifier le bon fonctionnement des fonctionnalités critiques de l'application et à limiter les risques de régression.

Les fonctionnalités prioritaires sont :

- l'inscription et l'authentification ;
- l'envoi et la validation des fichiers ;
- le stockage local des fichiers ;
- la consultation de l'historique ;
- le téléchargement par lien public ;
- la suppression des fichiers ;
- l'expiration automatique des fichiers.

La stratégie de test combine des tests automatisés backend, des tests automatisés frontend et des vérifications fonctionnelles.

## 2. Critères d'acceptation

L'application est considérée comme fonctionnelle lorsque :

- un utilisateur peut créer un compte avec une adresse e-mail valide ;
- un utilisateur peut s'authentifier et obtenir un token JWT ;
- un utilisateur authentifié peut envoyer un fichier autorisé ;
- la durée d'expiration est comprise entre 1 et 7 jours ;
- les fichiers envoyés apparaissent dans l'historique de leur propriétaire ;
- un utilisateur ne peut supprimer que ses propres fichiers ;
- un fichier peut être téléchargé à partir d'un token public valide ;
- un fichier expiré ou supprimé n'est plus téléchargeable ;
- les erreurs sont affichées clairement dans l'interface ;
- les tests automatisés ne présentent aucun échec bloquant.

## 3. Tests backend

Les tests backend utilisent principalement JUnit 5 et Mockito.

### Classes couvertes

- `BackendApplicationTests`
- `AuthServiceTest`
- `FileTransferServiceTest`
- `FileValidatorTest`
- `LocalFileStorageServiceTest`
- `FileExpirationSchedulerTest`

Les tests couvrent notamment :

- l'inscription et l'authentification ;
- la validation des fichiers ;
- la création d'un transfert ;
- le stockage et la suppression physiques ;
- les erreurs de stockage ;
- l'expiration automatique des fichiers.

### Exécution

```bash
cd backend
./mvnw test
```

### Résultat constaté

Résultat du 12 juillet 2026 :

```text
Tests exécutés : 18
Échecs         : 0
Erreurs        : 0
Tests ignorés  : 0
Résultat Maven : BUILD SUCCESS
```

## 4. Tests frontend

Les tests frontend vérifient les composants, les pages et les services Angular.

Ils couvrent notamment :

- l'inscription ;
- la connexion ;
- l'envoi d'un fichier ;
- la page de confirmation ;
- l'historique ;
- le téléchargement ;
- les services d'authentification et de gestion des fichiers ;
- l'affichage des erreurs HTTP 400, 401, 404, 410, 413 et 500.

### Exécution

```bash
cd frontend
npm test -- --watch=false
```

### Résultat constaté

Résultat du 12 juillet 2026 :

```text
Fichiers de tests : 9 réussis sur 9
Tests exécutés    : 60
Tests réussis     : 60
Tests échoués     : 0
```

Les messages affichés sur la sortie d'erreur pendant certains tests correspondent à des erreurs HTTP volontairement simulées pour vérifier leur traitement par l'interface.

## 5. Tests de parcours utilisateur

Les principaux parcours peuvent également être contrôlés avec Cypress lorsque le frontend et le backend sont démarrés.

Exécution possible :

```bash
cd frontend
npx cypress run
```

Les scénarios fonctionnels à contrôler sont :

1. création d'un compte ;
2. authentification ;
3. envoi d'un fichier ;
4. consultation de l'historique ;
5. téléchargement depuis un lien public ;
6. suppression d'un fichier ;
7. refus d'un lien expiré.

Les résultats chiffrés présentés dans ce document concernent les tests Maven et Angular exécutés le 12 juillet 2026.

## 6. Couverture du backend

La couverture du code backend est mesurée avec JaCoCo.

### Génération du rapport

```bash
cd backend
./mvnw test jacoco:report
```

Le rapport HTML est généré dans :

```text
backend/target/site/jacoco/index.html
```

Les autres formats sont disponibles dans :

```text
backend/target/site/jacoco/jacoco.xml
backend/target/site/jacoco/jacoco.csv
```

### Résultats constatés

| Indicateur | Couverture |
|---|---:|
| Classes | 100,00 % |
| Méthodes | 42,59 % |
| Lignes | 31,04 % |
| Instructions | 28,63 % |
| Branches | 27,00 % |
| Complexité | 27,88 % |

Certaines classes techniques, DTO, contrôleurs, entités, exceptions et composants de sécurité sont exclus de la mesure afin de concentrer le rapport sur la logique métier testable.

La couverture actuelle valide les principaux services critiques, mais elle pourra être améliorée par l'ajout de tests sur davantage de branches d'erreur et de comportements secondaires.

## 7. Procédure avant validation d'une modification

Avant de fusionner ou de livrer une modification :

1. exécuter les tests backend ;
2. exécuter les tests frontend ;
3. contrôler les parcours critiques concernés ;
4. vérifier l'absence de régression fonctionnelle ;
5. régénérer le rapport JaCoCo si la logique métier a changé ;
6. exécuter le scan de sécurité si une dépendance a été ajoutée ou mise à jour.

## 8. Conclusion

Les campagnes exécutées le 12 juillet 2026 sont concluantes :

- 18 tests backend réussis sur 18 ;
- 60 tests frontend réussis sur 60 ;
- aucun échec ou erreur bloquante ;
- rapport JaCoCo généré avec succès.

Les fonctions critiques du MVP disposent donc d'une base de tests automatisés permettant de détecter les principales régressions.

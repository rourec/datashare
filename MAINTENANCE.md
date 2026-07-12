# Maintenance — DataShare

## 1. Objectif

Ce document décrit les opérations nécessaires pour maintenir DataShare, limiter les régressions et réduire les risques liés au vieillissement des dépendances, de la base de données et du stockage des fichiers.

## 2. Fréquence recommandée

| Opération | Fréquence recommandée |
|---|---|
| Vérification des dépendances Maven | mensuelle |
| Vérification des dépendances npm | mensuelle |
| Scan OWASP | mensuel et après chaque mise à jour importante |
| Exécution des tests automatisés | à chaque modification |
| Contrôle des vulnérabilités critiques | hebdomadaire |
| Sauvegarde PostgreSQL | quotidienne en production |
| Vérification de l'espace disque | quotidienne ou supervisée |
| Test de restauration de la base | trimestriel |
| Test de performance | avant une livraison importante |
| Revue des journaux applicatifs | hebdomadaire |
| Revue complète de la documentation | à chaque version |

Ces fréquences peuvent être adaptées selon le niveau d'utilisation et les exigences de l'environnement cible.

## 3. Mise à jour du backend

### Vérifier les mises à jour Maven

```bash
cd backend
./mvnw versions:display-dependency-updates
./mvnw versions:display-plugin-updates
```

### Procédure

1. créer une branche dédiée ;
2. mettre à jour une dépendance ou un groupe cohérent de dépendances ;
3. compiler le projet ;
4. exécuter les tests ;
5. exécuter le scan OWASP ;
6. contrôler Swagger et les endpoints critiques ;
7. documenter les changements ;
8. fusionner seulement si les contrôles sont concluants.

### Validation

```bash
./mvnw clean test
./mvnw org.owasp:dependency-check-maven:check
```

## 4. Mise à jour du frontend

### Vérifier les dépendances

```bash
cd frontend
npm outdated
npm audit
```

### Mise à jour contrôlée

```bash
npm update
```

Pour Angular, les migrations doivent être réalisées avec les outils Angular adaptés à la version du projet.

Après une mise à jour :

```bash
npm install
npm test -- --watch=false
npm run build
```

Il faut également contrôler manuellement :

- l'inscription ;
- la connexion ;
- l'envoi d'un fichier ;
- l'historique ;
- le téléchargement ;
- la suppression.

## 5. Maintenance de la base PostgreSQL

Les opérations importantes comprennent :

- sauvegarde régulière ;
- contrôle de l'espace disque ;
- surveillance de la croissance des tables ;
- vérification des connexions ;
- test périodique de restauration ;
- mise à jour contrôlée de PostgreSQL.

### Exemple de sauvegarde

```bash
pg_dump \
  -h localhost \
  -U datashare \
  -d datashare \
  -F c \
  -f datashare-backup.dump
```

### Exemple de restauration

```bash
pg_restore \
  -h localhost \
  -U datashare \
  -d datashare \
  --clean \
  datashare-backup.dump
```

Une restauration doit être testée sur un environnement distinct avant toute utilisation sur les données principales.

## 6. Maintenance du stockage des fichiers

Le stockage local doit être surveillé afin d'éviter une saturation du disque.

Les contrôles comprennent :

- espace disponible ;
- nombre et volume des fichiers ;
- cohérence entre les fichiers physiques et les métadonnées PostgreSQL ;
- fonctionnement du mécanisme d'expiration ;
- permissions du répertoire de stockage ;
- absence de fichiers temporaires abandonnés.

Les fichiers expirés sont traités par le scheduler prévu dans l'application.

Une alerte doit être configurée en production lorsque l'espace disponible passe sous un seuil défini, par exemple 20 %.

## 7. Maintenance de la sécurité

Le scan de dépendances doit être relancé régulièrement :

```bash
cd backend
./mvnw org.owasp:dependency-check-maven:check
```

Le rapport est généré dans :

```text
backend/target/dependency-check-report.html
```

Chaque vulnérabilité doit être analysée selon :

- sa sévérité ;
- l'exploitabilité dans le contexte de DataShare ;
- l'exposition du composant ;
- l'existence d'une version corrigée ;
- le risque de régression lié à la mise à jour.

Les vulnérabilités critiques ou activement exploitées doivent être traitées en priorité.

Swagger UI doit être mis à jour ou désactivé en production si les vulnérabilités actuellement signalées ne peuvent pas être corrigées immédiatement.

## 8. Tests après maintenance

Après toute opération significative :

### Backend

```bash
cd backend
./mvnw test
```

### Frontend

```bash
cd frontend
npm test -- --watch=false
```

### Documentation OpenAPI

Avec le backend démarré :

```bash
./scripts/export-openapi.sh
```

### Performance

```bash
DOWNLOAD_TOKEN="<token_valide>" \
k6 run performance/download-test.js
```

## 9. Gestion des versions avec Git

Chaque évolution doit être développée sur une branche dédiée.

Exemples :

```text
feature/nom-fonctionnalite
fix/nom-correction
docs/nom-documentation
chore/dependency-update
```

Avant une fusion vers `main` :

1. vérifier le diff ;
2. exécuter les tests ;
3. vérifier les fichiers non suivis ;
4. supprimer les sauvegardes locales inutiles ;
5. contrôler l'absence de secrets ;
6. mettre à jour la documentation ;
7. effectuer une revue du code.

## 10. Risques de maintenance

| Risque | Impact | Mesure préventive |
|---|---|---|
| Mise à jour incompatible d'une dépendance | application non fonctionnelle | mise à jour sur une branche et tests complets |
| Vulnérabilité d'une dépendance | exposition de l'application | scans réguliers et mises à jour |
| Saturation du disque | impossibilité d'envoyer des fichiers | supervision et purge |
| Perte de la base | perte des métadonnées et utilisateurs | sauvegardes et tests de restauration |
| Incohérence base/fichiers | téléchargements impossibles | contrôles périodiques de cohérence |
| Expiration défaillante | conservation excessive des fichiers | test du scheduler et surveillance |
| Secret JWT compromis | usurpation d'identité | secret externe, rotation et redémarrage |
| Régression fonctionnelle | parcours utilisateur bloqué | tests automatisés et contrôle manuel |
| Documentation obsolète | maintenance difficile | mise à jour à chaque version |

## 11. Variables sensibles

Les secrets et mots de passe ne doivent pas être versionnés dans Git.

Sont notamment concernés :

- mot de passe PostgreSQL ;
- clé de signature JWT ;
- identifiants de services tiers ;
- tokens et clés API.

En production, ces valeurs doivent être fournies par des variables d'environnement ou un gestionnaire de secrets.

## 12. Procédure de livraison

Avant une livraison :

1. mettre à jour la branche locale ;
2. vérifier les variables de configuration ;
3. exécuter les tests backend ;
4. exécuter les tests frontend ;
5. exécuter le scan OWASP ;
6. construire le frontend ;
7. régénérer OpenAPI ;
8. contrôler les migrations ou changements de base ;
9. sauvegarder les données ;
10. déployer ;
11. vérifier l'endpoint de santé ;
12. tester les parcours critiques ;
13. surveiller les journaux après le déploiement.

## 13. Conclusion

La maintenance de DataShare repose sur :

- des mises à jour contrôlées ;
- l'exécution systématique des tests ;
- des scans de sécurité réguliers ;
- la sauvegarde de PostgreSQL ;
- la surveillance du stockage local ;
- la mise à jour de la documentation ;
- l'utilisation de Git pour tracer chaque évolution.

Ces procédures réduisent les risques de régression, de vulnérabilité et de perte de données.

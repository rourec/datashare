# Sécurité — DataShare

## 1. Objectif

Ce document décrit les mesures de sécurité mises en œuvre dans DataShare, les résultats du scan de dépendances et les limites identifiées.

## 2. Authentification

L'application utilise une authentification par JSON Web Token, ou JWT.

Après une connexion réussie, le backend retourne un token que le frontend transmet aux routes protégées dans l'en-tête HTTP suivant :

```http
Authorization: Bearer <token>
```

L'authentification est gérée avec Spring Security.

L'application utilise une politique sans session côté serveur :

```text
SessionCreationPolicy.STATELESS
```

Les routes suivantes sont publiques :

- création d'un compte ;
- connexion ;
- téléchargement par token public ;
- consultation des métadonnées d'un téléchargement ;
- endpoint de santé ;
- documentation OpenAPI en environnement de développement.

Les routes de gestion des fichiers nécessitent un JWT valide.

## 3. Gestion des autorisations

Le MVP ne met pas en œuvre plusieurs rôles tels qu'administrateur ou utilisateur.

Les permissions reposent sur l'identité de l'utilisateur authentifié :

- l'historique ne retourne que les fichiers du propriétaire ;
- un utilisateur ne peut supprimer que ses propres fichiers ;
- l'accès public à un fichier nécessite un token de téléchargement valide ;
- un fichier expiré ou supprimé ne peut plus être téléchargé.

## 4. Protection des mots de passe

Les mots de passe ne sont jamais stockés en clair.

Ils sont hachés avec BCrypt avant leur enregistrement en base PostgreSQL.

BCrypt applique notamment :

- un sel généré automatiquement ;
- un algorithme volontairement coûteux en temps de calcul ;
- une protection contre l'utilisation directe d'une table de correspondance de mots de passe.

## 5. Validation des entrées

Les données reçues par l'API sont contrôlées avec Jakarta Bean Validation et des validations métier.

Les contrôles incluent notamment :

- validation du format de l'adresse e-mail ;
- mot de passe d'au moins 8 caractères ;
- durée d'expiration comprise entre 1 et 7 jours ;
- validation du fichier transmis ;
- contrôle des types et tailles autorisés ;
- contrôle des identifiants et tokens utilisés dans les URL.

Les erreurs sont retournées dans un format JSON commun afin d'éviter les réponses techniques difficiles à interpréter.

## 6. Protection des endpoints

Spring Security applique les règles d'accès aux endpoints.

Les principales mesures sont :

- authentification obligatoire pour `/api/files/**` ;
- accès public limité aux routes explicitement autorisées ;
- désactivation de l'authentification HTTP Basic ;
- désactivation du formulaire de connexion Spring ;
- politique CORS limitée aux origines frontend configurées ;
- filtrage des requêtes par le filtre JWT.

La protection CSRF est désactivée car l'API est sans session et utilise un JWT transmis dans l'en-tête `Authorization`, et non un cookie de session.

## 7. Sécurisation des fichiers

Les protections appliquées aux fichiers comprennent :

- limitation de la durée de disponibilité à 7 jours maximum ;
- génération d'un token public difficilement prédictible ;
- vérification du statut et de l'expiration avant téléchargement ;
- stockage du fichier avec un nom interne distinct du nom d'origine ;
- suppression ou expiration logique des fichiers ;
- purge automatisée des fichiers expirés ;
- restriction des opérations de gestion au propriétaire authentifié.

Le stockage local convient au périmètre du MVP. Pour une utilisation en production distribuée, un stockage objet tel que S3 ou MinIO serait plus adapté.

## 8. Chiffrement des communications

L'environnement local utilise HTTP.

Pour un déploiement en production, l'application doit être placée derrière un reverse proxy ou une infrastructure configurée en HTTPS afin de chiffrer :

- les identifiants ;
- les tokens JWT ;
- les fichiers transférés ;
- les réponses de l'API.

## 9. Scan OWASP Dependency-Check

Le backend est analysé avec OWASP Dependency-Check.

### Exécution

```bash
cd backend
./mvnw org.owasp:dependency-check-maven:check
```

Le rapport HTML est généré dans :

```text
backend/target/dependency-check-report.html
```

### Résultat du 12 juillet 2026

Le scan s'est terminé avec le résultat suivant :

```text
BUILD SUCCESS
```

Aucune vulnérabilité bloquante n'a été détectée dans les dépendances utilisées par l'application.

Le rapport HTML généré permet de conserver une trace de l'analyse et peut être consulté en cas de besoin.

### Analyse

Le scan confirme que les dépendances actuellement utilisées ne présentent pas de vulnérabilité bloquante connue.

Le rapport constitue néanmoins un contrôle préventif qui devra être exécuté régulièrement afin de détecter rapidement les vulnérabilités pouvant apparaître lors de futures mises à jour des bibliothèques utilisées.

Le scan précise également que :

- aucune clé API NVD n'était configurée ;
- l'analyse Sonatype OSS Index était désactivée faute d'identifiants.

Ces limitations n'ont pas empêché l'analyse de se terminer avec succès mais pourront être levées afin d'améliorer encore la qualité des contrôles.

## 10. Limites et améliorations envisagées

Les améliorations possibles comprennent :

- activation obligatoire de HTTPS en production ;
- limitation du nombre de requêtes par adresse IP ou utilisateur ;
- verrouillage temporaire après plusieurs échecs de connexion ;
- politique de mot de passe renforcée ;
- rotation ou révocation des JWT ;
- analyse antivirus des fichiers ;
- stockage objet externe ;
- journalisation de sécurité centralisée ;
- désactivation de Swagger en production ;
- automatisation des scans dans une chaîne CI/CD.

## 11. Conclusion

Le MVP applique les protections essentielles :

- authentification JWT ;
- hachage BCrypt ;
- contrôle des accès par propriétaire ;
- validation des entrées ;
- contrôle des fichiers et de leur expiration ;
- analyse des dépendances.

Le scan OWASP Dependency-Check ne met en évidence aucune vulnérabilité bloquante dans les dépendances de l'application au moment de l'analyse. Son exécution régulière permet de détecter rapidement d'éventuelles vulnérabilités introduites lors de futures mises à jour.

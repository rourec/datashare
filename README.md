# DataShare

## Présentation

DataShare est une application web permettant de partager des fichiers de manière simple et sécurisée.

Un utilisateur authentifié peut :

- créer un compte ;
- se connecter ;
- téléverser un fichier ;
- choisir une durée de conservation (1 à 7 jours) ;
- partager un lien public de téléchargement ;
- consulter son historique de fichiers ;
- supprimer un fichier.

Les liens de téléchargement sont publics mais expirent automatiquement à la date définie lors du téléversement.

---

# Fonctionnalités

## Authentification

- Création de compte
- Connexion par JWT
- Routes sécurisées
- Déconnexion

## Gestion des fichiers

- Téléversement d'un fichier
- Choix de la durée d'expiration (1 à 7 jours)
- Génération d'un lien public
- Téléchargement sans authentification
- Historique des fichiers
- Suppression d'un fichier

## Sécurité

- Authentification JWT
- Hash des mots de passe avec BCrypt
- Validation des données
- Contrôle des accès Spring Security
- Expiration automatique des liens

---

# Architecture

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Maven

## Frontend

- Angular 22
- TypeScript
- SCSS

## Base de données

- PostgreSQL

## Tests

### Backend

- JUnit 5
- Mockito
- JaCoCo

### Frontend

- Vitest

### End-to-End

- Cypress

---

# Prérequis

- Java 21
- Maven 3.9+
- Node.js 22+
- npm
- PostgreSQL 16+
- Git

---

# Installation

## Cloner le projet

```bash
git clone https://github.com/rourec/datashare
cd datashare
```

---

# Configuration de la base PostgreSQL

Créer une base de données :

```sql
CREATE DATABASE datashare;
```

Créer un utilisateur :

```sql
CREATE USER datashare WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE datashare TO datashare;
```

Configurer ensuite le fichier :

```
backend/src/main/resources/application.properties
```

Exemple :

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/datashare
spring.datasource.username=datashare
spring.datasource.password=password
```

---

# Lancement du backend

Depuis le dossier :

```bash
cd backend
```

Installer les dépendances puis lancer :

```bash
mvn spring-boot:run
```

Le backend sera disponible sur :

```
http://localhost:8080
```

---

# Lancement du frontend

Depuis le dossier :

```bash
cd frontend
```

Installer les dépendances :

```bash
npm install
```

Lancer l'application :

```bash
npm start
```

Le frontend sera disponible sur :

```
http://localhost:4200
```

---

# Utilisation

1. Créer un compte
2. Se connecter
3. Téléverser un fichier
4. Choisir une durée d'expiration
5. Copier le lien de téléchargement
6. Partager le lien
7. Consulter ou supprimer les fichiers depuis l'historique

---

# Tests

## Backend

Lancer tous les tests :

```bash
cd backend

mvn clean verify
```

Génération du rapport JaCoCo :

```
backend/target/site/jacoco/index.html
```

---

## Frontend

Lancer les tests unitaires :

```bash
cd frontend

npm test -- --watch=false
```

Générer la couverture :

```bash
npx ng test --watch=false --coverage
```

Rapport :

```
frontend/coverage/index.html
```

---

## Tests End-to-End

Lancer tous les tests :

```bash
npm run e2e
```

Ou un scénario spécifique :

Authentification :

```bash
npm run e2e -- --spec cypress/e2e/auth.cy.ts
```

Téléversement / téléchargement :

```bash
npm run e2e -- --spec cypress/e2e/file-transfer.cy.ts
```

---

# Qualité

Le projet comprend :

- tests unitaires backend
- tests unitaires frontend
- tests End-to-End
- couverture de code
- analyse de sécurité
- tests de performances
- documentation de maintenance

---

# Choix techniques

## Authentification

L'authentification repose sur JWT.

Les routes d'administration nécessitent un jeton valide.

Les liens de téléchargement restent accessibles publiquement.

---

## Téléchargement

Chaque fichier possède :

- un UUID interne ;
- un token public de téléchargement.

Le téléchargement utilise le token public afin de ne jamais exposer l'identifiant interne.

---

## Expiration

Chaque fichier possède une date d'expiration.

Un lien expiré retourne automatiquement le code HTTP :

```
410 Gone
```

---

# Auteur

Projet réalisé dans le cadre de la formation **Expert DevOps** d'OpenClassrooms.

## Documentation de l'API

Lorsque le back-end est démarré, la documentation interactive de l'API est disponible avec Swagger UI :

```text
http://localhost:8080/swagger-ui.html
```

La spécification OpenAPI est également disponible aux formats JSON et YAML :

```text
http://localhost:8080/v3/api-docs
http://localhost:8080/v3/api-docs.yaml
```

Les exports versionnés dans le dépôt se trouvent dans :

```text
docs/api/openapi.json
docs/api/openapi.yaml
```

Les routes protégées utilisent une authentification JWT.

Pour tester une route protégée dans Swagger UI :

1. appeler `POST /api/auth/login` ;
2. copier le token retourné ;
3. cliquer sur `Authorize` ;
4. coller le token ;
5. exécuter la requête souhaitée.

Après une modification de l'API, les fichiers OpenAPI peuvent être régénérés avec :

```bash
./scripts/export-openapi.sh
```


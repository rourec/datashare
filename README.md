# DataShare

## Présentation

DataShare est une application web permettant de partager des fichiers de manière simple et sécurisée.

Un utilisateur authentifié peut :

- créer un compte ;
- se connecter ;
- téléverser un fichier ;
- choisir une durée de conservation de 1 à 7 jours ;
- partager un lien public de téléchargement ;
- consulter son historique de fichiers ;
- supprimer un fichier.

Les liens de téléchargement sont publics, mais expirent automatiquement à la date définie lors du téléversement.

---

# Fonctionnalités

## Authentification

- Création de compte
- Connexion avec JWT
- Routes protégées
- Déconnexion

## Gestion des fichiers

- Téléversement d'un fichier
- Choix de la durée d'expiration de 1 à 7 jours
- Génération d'un lien public
- Téléchargement sans authentification
- Historique des fichiers
- Suppression d'un fichier

## Sécurité

- Authentification JWT
- Hachage des mots de passe avec BCrypt
- Validation des données
- Contrôle des accès avec Spring Security
- Expiration automatique des liens

---

# Architecture technique

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL 16
- Maven Wrapper

## Frontend

- Angular
- TypeScript
- SCSS
- Node.js 22

## Base de données

- PostgreSQL 16 exécuté avec Docker Compose

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

# Installation

Les commandes ci-dessous sont prévues pour une machine sous Rocky Linux 9.

Elles doivent être exécutées avec le compte `root`.

## 1. Mettre à jour le système

```bash
dnf update -y
```

## 2. Installer les outils nécessaires

```bash
dnf install -y \
  git \
  curl \
  dnf-plugins-core
```

---

# Installation de Docker

## 1. Supprimer les éventuels paquets incompatibles

```bash
dnf remove -y \
  podman-docker \
  docker \
  docker-client \
  docker-client-latest \
  docker-common \
  docker-latest \
  docker-latest-logrotate \
  docker-logrotate \
  docker-engine
```

L'absence de certains de ces paquets n'est pas une erreur.

## 2. Ajouter le dépôt Docker

```bash
dnf config-manager --add-repo \
  https://download.docker.com/linux/centos/docker-ce.repo
```

## 3. Installer Docker Engine et Docker Compose

```bash
dnf install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin
```

## 4. Démarrer Docker

```bash
systemctl enable --now docker
```

## 5. Vérifier Docker

```bash
docker --version
docker compose version
systemctl is-active docker
```

La dernière commande doit retourner :

```text
active
```

---

# Installation de Java 21

## 1. Installer le JDK Java 21

```bash
dnf install -y \
  java-21-openjdk \
  java-21-openjdk-devel
```

## 2. Sélectionner Java 21

```bash
alternatives --set java \
  /usr/lib/jvm/java-21-openjdk/bin/java

alternatives --set javac \
  /usr/lib/jvm/java-21-openjdk/bin/javac
```

## 3. Configurer JAVA_HOME

```bash
cat > /etc/profile.d/java21.sh <<'JAVAEOF'
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export PATH="$JAVA_HOME/bin:$PATH"
JAVAEOF

source /etc/profile.d/java21.sh
```

## 4. Vérifier Java

```bash
java -version
javac -version
```

Les deux commandes doivent afficher une version Java 21.

---

# Installation de Node.js 22

## 1. Supprimer une éventuelle ancienne version de Node.js

```bash
dnf remove -y nodejs
```

## 2. Ajouter le dépôt NodeSource

```bash
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
```

## 3. Installer Node.js

```bash
dnf install -y nodejs
```

## 4. Vérifier Node.js et npm

```bash
node --version
npm --version
```

La version de Node.js doit être une version 22 récente.

---

# Vérification des prérequis

Exécuter toutes les vérifications suivantes :

```bash
git --version
docker --version
docker compose version
java -version
javac -version
node --version
npm --version
```

Il n'est pas nécessaire d'installer Maven manuellement.

Le projet contient le Maven Wrapper `mvnw`, qui télécharge et utilise automatiquement la version de Maven prévue par le projet.

---

# Récupération du projet

```bash
cd /root

git clone https://github.com/rourec/datashare.git

cd /root/datashare
```

Vérifier la présence des fichiers principaux :

```bash
ls -la
```

Le répertoire doit notamment contenir :

```text
backend
frontend
docker-compose.yml
README.md
```

---

# Lancement de PostgreSQL

La base PostgreSQL est créée et configurée automatiquement par Docker Compose.

Il n'est pas nécessaire :

- d'installer PostgreSQL directement sur la machine ;
- de créer manuellement la base ;
- de créer manuellement l'utilisateur PostgreSQL.

## 1. Démarrer PostgreSQL

Depuis la racine du projet :

```bash
cd /root/datashare

docker compose up -d
```

Lors du premier lancement, Docker télécharge automatiquement l'image PostgreSQL.

## 2. Vérifier le conteneur

```bash
docker compose ps
```

Le conteneur PostgreSQL doit être dans l'état `Up` ou `running`.

## 3. Afficher les logs PostgreSQL

```bash
docker compose logs postgres
```

Pour suivre les logs en temps réel :

```bash
docker compose logs -f postgres
```

Utiliser `Ctrl+C` pour quitter l'affichage des logs sans arrêter le conteneur.

## 4. Vérifier la connexion à la base

```bash
docker compose exec postgres \
  psql -U datashare -d datashare -c '\conninfo'
```

La configuration de la base est définie dans :

```text
docker-compose.yml
```

La configuration utilisée par le backend se trouve dans :

```text
backend/src/main/resources/application.properties
```

---

# Lancement du backend

Ouvrir un premier terminal.

## 1. Se placer dans le backend

```bash
cd /root/datashare/backend
```

## 2. Autoriser l'exécution du Maven Wrapper

```bash
chmod +x mvnw
```

## 3. Vérifier Java et Maven Wrapper

```bash
java -version
javac -version
./mvnw -version
```

La commande `./mvnw -version` doit indiquer que Maven utilise Java 21.

## 4. Lancer le backend

```bash
./mvnw spring-boot:run
```

Le backend est disponible sur :

```text
http://localhost:8080
```

Depuis une autre machine du réseau, remplacer `localhost` par l'adresse IP de la VM :

```text
http://ADRESSE_IP_VM:8080
```

Pour arrêter le backend, utiliser :

```text
Ctrl+C
```

---

# Lancement du frontend

Laisser le backend en cours d'exécution et ouvrir un deuxième terminal.

## 1. Se placer dans le frontend

```bash
cd /root/datashare/frontend
```

## 2. Installer les dépendances

```bash
npm install
```

## 3. Lancer le frontend

```bash
npm start -- --host 0.0.0.0
```

Le frontend est disponible localement sur :

```text
http://localhost:4200
```

Depuis une autre machine du réseau, remplacer `localhost` par l'adresse IP de la VM :

```text
http://ADRESSE_IP_VM:4200
```

Pour arrêter le frontend, utiliser :

```text
Ctrl+C
```

---

# Vérification de l'application

## Vérifier PostgreSQL

```bash
cd /root/datashare
docker compose ps
```

## Vérifier le backend

```bash
curl http://localhost:8080/actuator/health
```

Résultat attendu :

```json
{"status":"UP"}
```

## Vérifier le frontend

```bash
curl -I http://localhost:4200
```

Une réponse HTTP doit être retournée.

---

# Utilisation

1. Ouvrir le frontend dans un navigateur.
2. Créer un compte.
3. Se connecter.
4. Téléverser un fichier.
5. Choisir une durée d'expiration.
6. Copier le lien de téléchargement.
7. Partager le lien.
8. Consulter ou supprimer les fichiers depuis l'historique.

---

# Arrêt de l'application

## Arrêter le frontend

Dans le terminal du frontend :

```text
Ctrl+C
```

## Arrêter le backend

Dans le terminal du backend :

```text
Ctrl+C
```

## Arrêter PostgreSQL

```bash
cd /root/datashare

docker compose down
```

Cette commande arrête le conteneur sans supprimer les données.

---

# Réinitialisation complète de PostgreSQL

Pour supprimer le conteneur ainsi que toutes les données de la base :

```bash
cd /root/datashare

docker compose down -v
```

Puis recréer une base vide :

```bash
docker compose up -d
```

Attention : la commande `docker compose down -v` supprime définitivement les données enregistrées dans PostgreSQL.

---

# Tests

## Tests backend

Se placer dans le backend :

```bash
cd /root/datashare/backend
```

Lancer tous les tests :

```bash
./mvnw clean verify
```

Le rapport JaCoCo est généré dans :

```text
backend/target/site/jacoco/index.html
```

Pour ouvrir le rapport depuis la VM avec Firefox :

```bash
firefox /root/datashare/backend/target/site/jacoco/index.html
```

---

## Tests frontend

Se placer dans le frontend :

```bash
cd /root/datashare/frontend
```

Lancer les tests unitaires :

```bash
npm test -- --watch=false
```

Générer la couverture :

```bash
npx ng test --watch=false --coverage
```

Le rapport est généré dans :

```text
frontend/coverage/index.html
```

---

## Tests End-to-End

Se placer dans le frontend :

```bash
cd /root/datashare/frontend
```

Lancer tous les tests End-to-End :

```bash
npm run e2e
```

Lancer uniquement le scénario d'authentification :

```bash
npm run e2e -- --spec cypress/e2e/auth.cy.ts
```

Lancer uniquement le scénario de transfert de fichier :

```bash
npm run e2e -- --spec cypress/e2e/file-transfer.cy.ts
```

---

# Documentation de l'API

Lorsque le backend est démarré, Swagger UI est disponible sur :

```text
http://localhost:8080/swagger-ui.html
```

Depuis une autre machine :

```text
http://ADRESSE_IP_VM:8080/swagger-ui.html
```

La spécification OpenAPI est disponible aux formats JSON et YAML :

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
cd /root/datashare

chmod +x scripts/export-openapi.sh
./scripts/export-openapi.sh
```

---

# Qualité

Le projet comprend :

- des tests unitaires backend ;
- des tests unitaires frontend ;
- des tests End-to-End ;
- de la couverture de code ;
- une analyse de sécurité des dépendances ;
- des tests de performances ;
- une documentation de maintenance.

---

# Choix techniques

## Authentification

L'authentification repose sur JWT.

Les routes protégées nécessitent un jeton valide.

Les liens publics de téléchargement restent accessibles sans authentification.

## Téléchargement

Chaque fichier possède :

- un UUID interne ;
- un token public de téléchargement.

Le téléchargement utilise le token public afin de ne pas exposer directement l'identifiant interne.

## Expiration

Chaque fichier possède une date d'expiration.

Un lien expiré retourne le code HTTP :

```text
410 Gone
```

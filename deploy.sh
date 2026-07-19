#!/bin/bash

GREEN='\033[1;32m'
NC='\033[0m'

step() {
    echo
    echo -e "${GREEN}=====================================================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}=====================================================================${NC}"
}

# ==============================================================================
# Installation de Docker
# ==============================================================================

step "Installation & configuration de Docker"

dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# ==============================================================================
# Installation de Java 21
# ==============================================================================

step "Installation & configuration de Java 21"

dnf install -y java-21-openjdk java-21-openjdk-devel

step "Sélection de Java 21"

alternatives --config java
alternatives --config javac

step "Configuration de JAVA_HOME"

JAVA_HOME=$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")

cat > /etc/profile.d/java21.sh <<JAVAEOF
export JAVA_HOME=$JAVA_HOME
export PATH="\$JAVA_HOME/bin:\$PATH"
JAVAEOF

source /etc/profile.d/java21.sh

java -version
javac -version
echo "JAVA_HOME=$JAVA_HOME"

# ==============================================================================
# Installation de Node.js
# ==============================================================================

step "Installation de Node.js 22"

curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

node --version
npm --version

# ==============================================================================
# Clone du projet (si nécessaire)
# ==============================================================================

# step "Clonage du dépôt Git"
# git clone https://github.com/rourec/datashare.git

# ==============================================================================
# PostgreSQL
# ==============================================================================

step "Démarrage de PostgreSQL"

cd /root/datashare
docker compose up -d

# ==============================================================================
# Frontend
# ==============================================================================

step "Installation des dépendances frontend"

cd frontend
npm ci

cd ..

# ==============================================================================
# Lancement de l'application
# ==============================================================================

step "Lancement du backend"

(
    cd backend
    ./mvnw spring-boot:run
) &

step "Lancement du frontend"

(
    cd frontend
    npm start -- --host 0.0.0.0
) &

step "Application démarrée"

echo "Backend  : http://localhost:8080"
echo "Frontend : http://localhost:4200"

wait

#echo "============================= Installation des outils git ============================="
#dnf install -y git curl dnf-plugins-core

echo "============================= Installation & configuration de Docker  ============================="
dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

echo "============================= Installation & configuration de Java ============================="
dnf install -y java-21-openjdk java-21-openjdk-devel

echo "============================= Choisir java-21-openjdk.x86_64 ============================="
alternatives --config java

echo "============================= Choisir java-21-openjdk.x86_64 ============================="
alternatives --config javac
JAVA_HOME=$(dirname "$(dirname "$(readlink -f "$(command -v java)")")")
cat > /etc/profile.d/java21.sh <<JAVAEOF
export JAVA_HOME=$JAVA_HOME
export PATH="\$JAVA_HOME/bin:\$PATH"
JAVAEOF
source /etc/profile.d/java21.sh
java -version
javac -version
echo "$JAVA_HOME"

echo "============================= Installation de Node.js ============================="
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs

#echo "============================= Clone du repo Git ============================="
#git clone https://github.com/rourec/datashare
#cd datashare

echo "============================= Démarrage de la base Postgre ============================="
docker compose up -d
cd frontend

echo "============================= Installation des dépendances CI ============================="
npm ci

echo "============================= Lancement Front & Back-end ============================="
cd /root/datashare

(cd backend && ./mvnw spring-boot:run) &
(cd frontend && npm ci && npm start -- --host 0.0.0.0) &

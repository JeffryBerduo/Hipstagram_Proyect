pipeline {
    agent any

    environment {
        DOCKER_HUB_USER    = credentials('JefryBerduo')
        DOCKER_HUB_PASS    = credentials('4659')
        SONAR_TOKEN        = credentials('sonar-token')
        SONAR_HOST_URL     = 'http://sonarqube:9000'
        PROJECT_NAME       = 'hipstagram'
    }

    stages {

        // ── 1. Checkout ──────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Clonando repositorio...'
                checkout scm
            }
        }

        // ── 2. Instalar dependencias ─────────────────────────────
        stage('Install') {
            steps {
                echo '📦 Instalando dependencias de cada servicio...'
                sh '''
                    cd backend/auth-service    && npm install
                    cd ../../backend/post-service    && npm install
                    cd ../../backend/vote-service    && npm install
                    cd ../../backend/comment-service && npm install
                    cd ../../backend/search-service  && npm install
                '''
            }
        }

        // ── 3. Lint ──────────────────────────────────────────────
        stage('Lint') {
            steps {
                echo '🔍 Verificando estilo del código...'
                sh '''
                    cd backend/auth-service    && npm run lint --if-present
                    cd ../../backend/post-service    && npm run lint --if-present
                    cd ../../backend/vote-service    && npm run lint --if-present
                    cd ../../backend/comment-service && npm run lint --if-present
                    cd ../../backend/search-service  && npm run lint --if-present
                '''
            }
        }

        // ── 4. Tests ─────────────────────────────────────────────
        stage('Test') {
            steps {
                echo '🧪 Ejecutando pruebas...'
                sh '''
                    cd backend/auth-service    && npm test --if-present
                    cd ../../backend/post-service    && npm test --if-present
                    cd ../../backend/vote-service    && npm test --if-present
                    cd ../../backend/comment-service && npm test --if-present
                    cd ../../backend/search-service  && npm test --if-present
                '''
            }
        }

        // ── 5. SonarQube ─────────────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                echo '📊 Analizando calidad del código con SonarQube...'
                sh '''
                    npx sonar-scanner \
                        -Dsonar.projectKey=${PROJECT_NAME} \
                        -Dsonar.projectName=Hipstagram \
                        -Dsonar.sources=backend \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.token=${SONAR_TOKEN} \
                        -Dsonar.exclusions=**/node_modules/**,**/*.test.js
                '''
            }
        }

        // ── 6. Quality Gate ──────────────────────────────────────
        stage('Quality Gate') {
            steps {
                echo '✅ Verificando Quality Gate de SonarQube...'
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── 7. Build Docker images ───────────────────────────────
        stage('Build Docker Images') {
            steps {
                echo '🐳 Construyendo imágenes Docker...'
                sh '''
                    docker build -t ${DOCKER_HUB_USER}/hipstagram-auth:latest    ./backend/auth-service
                    docker build -t ${DOCKER_HUB_USER}/hipstagram-post:latest    ./backend/post-service
                    docker build -t ${DOCKER_HUB_USER}/hipstagram-vote:latest    ./backend/vote-service
                    docker build -t ${DOCKER_HUB_USER}/hipstagram-comment:latest ./backend/comment-service
                    docker build -t ${DOCKER_HUB_USER}/hipstagram-search:latest  ./backend/search-service
                '''
            }
        }

        // ── 8. Push a Docker Hub ─────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                echo '⬆️ Subiendo imágenes a Docker Hub...'
                sh '''
                    echo ${DOCKER_HUB_PASS} | docker login -u ${DOCKER_HUB_USER} --password-stdin
                    docker push ${DOCKER_HUB_USER}/hipstagram-auth:latest
                    docker push ${DOCKER_HUB_USER}/hipstagram-post:latest
                    docker push ${DOCKER_HUB_USER}/hipstagram-vote:latest
                    docker push ${DOCKER_HUB_USER}/hipstagram-comment:latest
                    docker push ${DOCKER_HUB_USER}/hipstagram-search:latest
                    docker logout
                '''
            }
        }

        // ── 9. Deploy ────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo '🚀 Desplegando servicios...'
                sh 'docker-compose up -d --build'
            }
        }
    }

    // ── Notificaciones ───────────────────────────────────────────
    post {
        success {
            echo '✅ Pipeline completado exitosamente'
        }
        failure {
            echo '❌ Pipeline falló — revisar logs'
        }
    }
}

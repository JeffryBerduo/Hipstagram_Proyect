pipeline {
    agent none

    environment {
        DOCKER_HUB_USER    = credentials('JefryBerduo')
        DOCKER_HUB_PASS    = credentials('4659')
        SONAR_TOKEN        = credentials('sonar-token')
        SONAR_HOST_URL     = 'http://sonarqube:9000'
        PROJECT_NAME       = 'hipstagram'
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                echo '📥 Clonando repositorio...'
                checkout scm
            }
        }

        stage('Install') {
            agent { docker { image 'node:18-alpine' } }
            steps {
                echo '📦 Instalando dependencias de cada servicio...'
                sh '''
                    (cd backend/auth-service    && npm install)
                    (cd backend/post-service    && npm install)
                    (cd backend/vote-service    && npm install)
                    (cd backend/comment-service && npm install)
                    (cd backend/search-service  && npm install)
                '''
            }
        }

        stage('Lint') {
            agent { docker { image 'node:18-alpine' } }
            steps {
                echo '🔍 Verificando estilo del código...'
                sh '''
                    (cd backend/auth-service    && npm run lint --if-present)
                    (cd backend/post-service    && npm run lint --if-present)
                    (cd backend/vote-service    && npm run lint --if-present)
                    (cd backend/comment-service && npm run lint --if-present)
                    (cd backend/search-service  && npm run lint --if-present)
                '''
            }
        }

        stage('Test') {
            agent { docker { image 'node:18-alpine' } }
            steps {
                echo '🧪 Ejecutando pruebas...'
                sh '''
                    (cd backend/auth-service    && npm test --if-present)
                    (cd backend/post-service    && npm test --if-present)
                    (cd backend/vote-service    && npm test --if-present)
                    (cd backend/comment-service && npm test --if-present)
                    (cd backend/search-service  && npm test --if-present)
                '''
            }
        }

        stage('SonarQube Analysis') {
            agent { docker { image 'node:18-alpine' } }
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

        stage('Quality Gate') {
            agent any
            steps {
                echo '✅ Verificando Quality Gate de SonarQube...'
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
            agent any
            steps {
                echo '🐳 Construyendo imágenes Docker...'
                sh '''
                    docker build -t $DOCKER_HUB_CREDS_USR/hipstagram-auth:latest    ./backend/auth-service
                    docker build -t $DOCKER_HUB_CREDS_USR/hipstagram-post:latest    ./backend/post-service
                    docker build -t $DOCKER_HUB_CREDS_USR/hipstagram-vote:latest    ./backend/vote-service
                    docker build -t $DOCKER_HUB_CREDS_USR/hipstagram-comment:latest ./backend/comment-service
                    docker build -t $DOCKER_HUB_CREDS_USR/hipstagram-search:latest  ./backend/search-service
                '''
            }
        }

        stage('Push to Docker Hub') {
            agent any
            steps {
                echo '⬆️ Subiendo imágenes a Docker Hub...'
                sh '''
                    echo $DOCKER_HUB_CREDS_PSW | docker login -u $DOCKER_HUB_CREDS_USR --password-stdin
                    docker push $DOCKER_HUB_CREDS_USR/hipstagram-auth:latest
                    docker push $DOCKER_HUB_CREDS_USR/hipstagram-post:latest
                    docker push $DOCKER_HUB_CREDS_USR/hipstagram-vote:latest
                    docker push $DOCKER_HUB_CREDS_USR/hipstagram-comment:latest
                    docker push $DOCKER_HUB_CREDS_USR/hipstagram-search:latest
                    docker logout
                '''
            }
        }

        stage('Deploy') {
            agent any
            steps {
                echo '🚀 Desplegando servicios...'
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completado exitosamente'
        }
        failure {
            echo '❌ Pipeline falló — revisar logs'
        }
    }
}
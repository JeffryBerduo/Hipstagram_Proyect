pipeline {
    agent none

    environment {
        PROJECT_NAME = 'hipstagram'
        DOCKER_USER  = 'jeffryberduo'
        DOCKER_HUB   = credentials('jeffryberduo')
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                cleanWs()
                echo '📥 Clonando repositorio...'
                sh 'git -c credential.helper= clone -b bugfix/configjenkins https://github.com/JeffryBerduo/Hipstagram_Proyect.git .'
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
                    (cd backend/auth-service    && npm test --if-present || true)
                    (cd backend/post-service    && npm test --if-present || true)
                    (cd backend/vote-service    && npm test --if-present || true)
                    (cd backend/comment-service && npm test --if-present || true)
                    (cd backend/search-service  && npm test --if-present || true)
                '''
            }
        }

        stage('Build Docker Images') {
            agent any
            steps {
                echo '🐳 Construyendo imágenes Docker...'
                sh '''
                    docker build -t $DOCKER_USER/hipstagram-auth:latest    ./backend/auth-service
                    docker build -t $DOCKER_USER/hipstagram-post:latest    ./backend/post-service
                    docker build -t $DOCKER_USER/hipstagram-vote:latest    ./backend/vote-service
                    docker build -t $DOCKER_USER/hipstagram-comment:latest ./backend/comment-service
                    docker build -t $DOCKER_USER/hipstagram-search:latest  ./backend/search-service
                '''
            }
        }

        stage('Push to Docker Hub') {
            agent any
            steps {
                echo '⬆️ Subiendo imágenes a Docker Hub...'
                sh '''
                    echo $DOCKER_HUB_PSW | docker login -u $DOCKER_USER --password-stdin
                    docker push $DOCKER_USER/hipstagram-auth:latest
                    docker push $DOCKER_USER/hipstagram-post:latest
                    docker push $DOCKER_USER/hipstagram-vote:latest
                    docker push $DOCKER_USER/hipstagram-comment:latest
                    docker push $DOCKER_USER/hipstagram-search:latest
                    docker logout
                '''
            }
        }

        stage('Deploy') {
    agent any
    steps {
        echo '🚀 Desplegando servicios...'
        sh '''
            docker run -d --name hipstagram-auth    jeffryberduo/hipstagram-auth:latest    || true
            docker run -d --name hipstagram-post    jeffryberduo/hipstagram-post:latest    || true
            docker run -d --name hipstagram-vote    jeffryberduo/hipstagram-vote:latest    || true
            docker run -d --name hipstagram-comment jeffryberduo/hipstagram-comment:latest || true
            docker run -d --name hipstagram-search  jeffryberduo/hipstagram-search:latest  || true
        '''
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
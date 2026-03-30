pipeline {
    agent none

    environment {
        DOCKER_USER = 'jeffryberduo'
        DOCKER_HUB  = credentials('jeffryberduo')
    }

    stages {

        stage('Checkout') {
            agent any
            steps {
                cleanWs()
                sh 'git clone -b bugfix/configjenkins https://github.com/JeffryBerduo/Hipstagram_Proyect.git .'
            }
        }

        stage('Install') {
            agent { docker { image 'node:18-alpine'; reuseNode true } }
            steps {
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
            agent { docker { image 'node:18-alpine'; reuseNode true } }
            steps {
                sh '''
                    (cd backend/auth-service    && npm run lint --if-present || true)
                    (cd backend/post-service    && npm run lint --if-present || true)
                    (cd backend/vote-service    && npm run lint --if-present || true)
                    (cd backend/comment-service && npm run lint --if-present || true)
                    (cd backend/search-service  && npm run lint --if-present || true)
                '''
            }
        }

        stage('Test') {
            agent { docker { image 'node:18-alpine';git  reuseNode true } }
            steps {
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
                sh '''
                    docker network create hipstagram-net 2>/dev/null || true

                    deploy() {
                        NAME=$1 PORT=$2
                        docker stop  contenedor_${NAME}-service 2>/dev/null || true
                        docker rm    contenedor_${NAME}-service 2>/dev/null || true
                        docker run -d \
                            --name contenedor_${NAME}-service \
                            --network hipstagram-net \
                            --restart unless-stopped \
                            -p ${PORT}:${PORT} \
                            --env-file ./backend/${NAME}-service/.env \
                            $DOCKER_USER/hipstagram-${NAME}:latest
                    }

                    deploy auth    3001
                    deploy post    3002
                    deploy vote    3003
                    deploy comment 3004
                    deploy search  3005
                '''
            }
        }

        stage('Health Check') {
            agent any
            steps {
                sleep(time: 10, unit: 'SECONDS')
                sh '''
                    curl -sf http://localhost:3001/health || echo "WARN: auth-service no responde"
                    curl -sf http://localhost:3002/health || echo "WARN: post-service no responde"
                    curl -sf http://localhost:3003/health || echo "WARN: vote-service no responde"
                    curl -sf http://localhost:3004/health || echo "WARN: comment-service no responde"
                    curl -sf http://localhost:3005/health || echo "WARN: search-service no responde"
                '''
            }
        }

    }

    post {
        success {
            echo 'Pipeline completado exitosamente.'
        }
        failure {
            echo 'Pipeline fallo. Revisar los logs.'
            sh 'docker ps -a | grep hipstagram || true'
        }
        always {
            sh 'docker logout || true'
        }
    }
}

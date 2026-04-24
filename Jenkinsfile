pipeline {

    agent any

    environment {
        DOCKER_USER = 'jeffryberduo'
        DOCKER_HUB  = credentials('jeffryberduo')
        SONAR_TOKEN = credentials('sonarqube-token')
    }

    stages {

        stage('Checkout') {
            steps {
                cleanWs()
                sh 'git clone -b develop https://github.com/JeffryBerduo/Hipstagram_Proyect.git .'
            }
        }

        stage('Install') {
            agent { docker { image 'node:18-alpine' } }
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
            agent { docker { image 'node:18-alpine' } }
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
            agent { docker { image 'node:18-alpine' } }
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

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'
                        sh """
                            ${scannerHome}/bin/sonar-scanner \
                                -Dsonar.projectKey=hipstagram \
                                -Dsonar.projectName=Hipstagram \
                                -Dsonar.sources=backend \
                                -Dsonar.inclusions=**/*.js \
                                -Dsonar.exclusions=**/node_modules/**,**/coverage/** \
                                -Dsonar.token=${SONAR_TOKEN}
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Images') {
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
            steps {
                sh '''
                    echo $DOCKER_HUB_PSW | docker login -u $DOCKER_HUB_USR --password-stdin
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
            steps {
                sh '''
                    docker network create hipstagram-net 2>/dev/null || true

                    # Levantar base de datos primero
                    docker stop  database 2>/dev/null || true
                    docker rm    database 2>/dev/null || true

docker run -d \
    --name database \
                        --network hipstagram-net \
                        --restart unless-stopped \
                        -p 3000:5432 \
                        -e POSTGRES_USER=postgres \
                        -e POSTGRES_PASSWORD=4659 \
                        -e POSTGRES_DB=BD_Hipstagram \
                        -v postgres_data:/var/lib/postgresql/data \
                        postgres:16

                    echo "Esperando que la base de datos inicie..."
                    sleep 10

                    deploy() {
                        NAME=$1
                        PORT=$2
                        docker stop  contenedor_${NAME}-service 2>/dev/null || true
                        docker rm    contenedor_${NAME}-service 2>/dev/null || true
                        docker pull $DOCKER_USER/hipstagram-${NAME}:latest
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
            steps {
                sleep(time: 15, unit: 'SECONDS')
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
            echo 'Pipeline falló — revisar logs.'
        }
        always {
            echo 'Pipeline finalizado.'
        }
    }
}
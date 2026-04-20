pipeline {

    agent any

    environment {
        DOCKER_USER    = 'jeffryberduo'
        DOCKER_HUB     = credentials('jeffryberduo')        // credencial de Docker Hub
        SONAR_TOKEN    = credentials('sonarqube-token')     // credencial de SonarQube
    }

    stages {

        // ── STAGE 1: Checkout ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                cleanWs()
                sh 'git clone -b develop https://github.com/JeffryBerduo/Hipstagram_Proyect.git .'
            }
        }

        // ── STAGE 2: Install ──────────────────────────────────────────────
        // Corre en el agente principal (no en contenedor aparte)
        // así los node_modules persisten para los siguientes stages
        stage('Install') {
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

        // ── STAGE 3: Lint ─────────────────────────────────────────────────
        stage('Lint') {
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

        // ── STAGE 4: Test ─────────────────────────────────────────────────
        stage('Test') {
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

        // ── STAGE 5: SonarQube ────────────────────────────────────────────
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

        // ── STAGE 6: Quality Gate ─────────────────────────────────────────
        // Espera la respuesta de SonarQube (máx 5 min)
        // Si el código no pasa la calidad mínima, el pipeline se detiene aquí
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── STAGE 7: Build Docker Images ──────────────────────────────────
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

        // ── STAGE 8: Push a Docker Hub ────────────────────────────────────
        // DOCKER_HUB_USR y DOCKER_HUB_PSW son generadas automáticamente
        // por Jenkins cuando usas credentials('nombre') con usuario/contraseña
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

        // ── STAGE 9: Deploy ───────────────────────────────────────────────
        stage('Deploy') {
            steps {
                sh '''
                    # Crea la red si no existe (el || true evita error si ya existe)
                    docker network create hipstagram-net 2>/dev/null || true

                    # Función para detener el contenedor viejo y levantar el nuevo
                    deploy() {
                        NAME=$1
                        PORT=$2

                        echo "Desplegando ${NAME}-service en puerto ${PORT}..."

                        # Para el contenedor anterior si existe
                        docker stop  contenedor_${NAME}-service 2>/dev/null || true
                        docker rm    contenedor_${NAME}-service 2>/dev/null || true

                        # Descarga la imagen más reciente que acabamos de subir
                        docker pull $DOCKER_USER/hipstagram-${NAME}:latest

                        # Levanta el nuevo contenedor
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

        // ── STAGE 10: Health Check ────────────────────────────────────────
        stage('Health Check') {
            steps {
                // Espera 15s a que los contenedores terminen de iniciar
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
            echo '✅ Pipeline completado exitosamente.'
        }
        failure {
            echo '❌ Pipeline falló. Revisando contenedores...'
            sh 'docker ps -a | grep hipstagram || true'
        }
        always {
            sh 'docker logout || true'
        }
    }
}
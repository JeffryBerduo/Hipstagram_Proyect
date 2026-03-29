pipeline {


    agent any

    stages {

        // ── PASO 1: Descargar el código ───────────────────────────
        stage('Checkout') {
            steps {
                // Descarga el código desde GitHub al servidor Jenkins
                echo 'Descargando codigo desde GitHub...'
                checkout scm
            }
        }

        // ── PASO 2: Instalar dependencias ────────────────────────
        stage('Instalar dependencias') {
            steps {
                echo 'Instalando dependencias de cada servicio...'
                // Es como hacer "npm install" en cada carpeta de servicio
                sh 'cd backend/auth-service    && npm install'
                sh 'cd backend/post-service    && npm install'
                sh 'cd backend/vote-service    && npm install'
                sh 'cd backend/comment-service && npm install'
                sh 'cd backend/search-service  && npm install'
            }
        }

        // ── PASO 3: Pruebas ──────────────────────────────────────
        stage('Pruebas') {
            steps {
                echo 'Ejecutando pruebas...'
                // --if-present significa: solo corre si existe el comando "test"
                sh 'cd backend/auth-service    && npm test --if-present'
                sh 'cd backend/post-service    && npm test --if-present'
                sh 'cd backend/vote-service    && npm test --if-present'
                sh 'cd backend/comment-service && npm test --if-present'
                sh 'cd backend/search-service  && npm test --if-present'
            }
        }

        // ── PASO 4: Analizar calidad del código con SonarQube ────
        stage('SonarQube') {
            steps {
                echo 'Analizando calidad del codigo...'
                // SonarQube revisa el código y detecta errores, código duplicado, etc.
                sh '''
                    npx sonar-scanner \
                        -Dsonar.projectKey=hipstagram \
                        -Dsonar.sources=backend \
                        -Dsonar.host.url=http://sonarqube:9000 \
                        -Dsonar.token=${SONAR_TOKEN}
                '''
            }
        }

        // ── PASO 5: Construir imágenes Docker ────────────────────
        stage('Construir imagenes') {
            steps {
                echo 'Construyendo imagenes Docker de cada servicio...'
                // Es como hacer "docker build" para cada servicio
                sh 'docker build -t hipstagram-auth    ./backend/auth-service'
                sh 'docker build -t hipstagram-post    ./backend/post-service'
                sh 'docker build -t hipstagram-vote    ./backend/vote-service'
                sh 'docker build -t hipstagram-comment ./backend/comment-service'
                sh 'docker build -t hipstagram-search  ./backend/search-service'
            }
        }

        // ── PASO 6: Levantar los servicios ───────────────────────
        stage('Desplegar') {
            steps {
                echo 'Levantando todos los contenedores...'
                // Es como hacer "docker-compose up" pero automatico
                sh 'docker-compose up -d --build'
            }
        }
    }

    // ── Qué hacer al terminar el pipeline ────────────────────────
    post {
        success {
            // Si todo salió bien
            echo 'Pipeline completado exitosamente'
        }
        failure {
            // Si algo falló
            echo 'Algo fallo en el pipeline, revisar los logs'
        }
    }
}
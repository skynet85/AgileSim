// Az ágens által generált pipeline, automatikusan javítva.
//   - A deploy port 8080-ra igazítva (az application.properties szerint)
//   - Sanity Check stage beszúrva (a néma, no-op zöld build ellen)
pipeline {
    agent any
    
    tools {
        nodejs "Node18"
        maven "Maven3"
    }
    
    stages {
        stage('Sanity Check') {
            steps {
                script {
                    def fe = fileExists('frontend/package.json')
                    def be = fileExists('backend/pom.xml')
                    echo "frontend/package.json=${fe}  backend/pom.xml=${be}"
                    if (!fe && !be) {
                        error('Egyetlen build-leíró sincs a repóban – nincs mit építeni.')
                    }
                }
            }
        }
        stage('Frontend Build') {
            when { expression { fileExists('frontend/package.json') } }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Backend Build') {
            when { expression { fileExists('backend/pom.xml') } }
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }
        
        stage('Deployment') {
            when { expression { fileExists('frontend/package.json') && fileExists('backend/pom.xml') } }
            steps { script {
                dir('frontend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup npm run dev -- --host 0.0.0.0 --port 3000 > app.log 2>&1 < /dev/null &'
                }
                dir('backend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8080 > app.log 2>&1 < /dev/null &'
                }
            }}
        }
        
        stage('Health Check') {
            steps { script {
                def ready = false
                for (int i = 0; i < 30; i++) {
                    try {
                        sh 'curl -f http://localhost:3000 --retry-connrefused --retry 5'
                        sh 'curl -f http://localhost:8081 --retry-connrefused --retry 5'
                        ready = true
                        break
                    } catch (Exception e) {
                        sleep time: 4, unit: 'SECONDS'
                    }
                }
                if (!ready) {
                    sh 'cat frontend/app.log || echo "[FRONTEND] No log found"'
                    sh 'cat backend/app.log || echo "[BACKEND] No log found"'
                    error "Health check failed: Services did not become available. Pipeline terminated for determinism."
                }
            }}
        }
    }
}
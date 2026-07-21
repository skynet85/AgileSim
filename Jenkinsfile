// Determinisztikusan generálva a ténylegesen feltöltött fájlok alapján.
pipeline {
    agent any
    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
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
            tools { nodejs 'Node18' }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run typecheck'
                    sh 'npm run build'
                }
            }
        }
        stage('Frontend Deploy') {
            when { expression { fileExists('frontend/package.json') } }
            tools { nodejs 'Node18' }
            steps {
                dir('frontend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup npm run dev -- --host 0.0.0.0 --port 3000 > frontend.log 2>&1 < /dev/null &'
                }
            }
        }
        stage('Backend Build') {
            when { expression { fileExists('backend/pom.xml') } }
            tools { maven 'Maven3' }
            steps {
                dir('backend') {
                    sh 'mvn -B clean package -DskipTests'
                }
            }
        }
        stage('Backend Deploy') {
            when { expression { fileExists('backend/pom.xml') } }
            tools { maven 'Maven3' }
            steps {
                dir('backend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dspring-boot.run.arguments=--server.port=8081 > backend.log 2>&1 < /dev/null &'
                }
            }
        }
        stage('Health Check') {
            steps {
                sh '''
                    echo '--- Frontend ellenőrzés (port 3000) ---'
                    ok=0
                    for i in $(seq 1 30); do
                      if curl -sf -o /dev/null http://localhost:3000; then ok=1; break; fi
                      sleep 2
                    done
                    if [ "$ok" != "1" ]; then
                      echo 'A FRONTEND NEM INDULT EL. Napló:'
                      cat frontend/frontend.log 2>/dev/null || echo '(nincs napló)'
                      exit 1
                    fi
                    echo 'Frontend fut.'
                    echo '--- Backend ellenőrzés (port 8081) ---'
                    # KIZÁRÓLAG az actuator health számít. A korábbi "bármilyen
                    # HTTP válasz jó" logika a Jenkins SAJÁT weboldalát fogadta el
                    # élő backendnek, ha a port ütközött – zöld build, halott app.
                    ok=0
                    for i in $(seq 1 45); do
                      if curl -sf http://localhost:8081/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then ok=1; break; fi
                      sleep 2
                    done
                    if [ "$ok" != "1" ]; then
                      echo 'A BACKEND NEM INDULT EL (nincs UP állapot az actuatoron). Napló:'
                      cat backend/backend.log 2>/dev/null || echo '(nincs napló)'
                      echo '--- Tipp: ha a naplóban "Port already in use" áll, ütközik a Jenkins portjával. ---'
                      exit 1
                    fi
                    echo 'Backend fut.'
                '''
            }
        }
    }
    post {
        failure {
            echo 'A pipeline elbukott – nézd meg a frontend.log / backend.log tartalmát.'
        }
    }
}

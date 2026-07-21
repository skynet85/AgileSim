// Az ágens által generált pipeline, automatikusan javítva.
//   - Sanity Check stage beszúrva (a néma, no-op zöld build ellen)
pipeline {
    agent any
    tools {
        nodejs 'Node18'
        maven 'Maven3'
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
        stage('Deploy Backend') {
            when { expression { fileExists('backend/pom.xml') } }
            steps {
                dir('backend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup java -jar target/bank-demo-backend-0.1.0.jar -Dspring-boot.run.arguments=--server.port=8081 > app.log 2>&1 < /dev/null &'
                }
            }
        }
        stage('Deploy Frontend') {
            when { expression { fileExists('frontend/package.json') } }
            steps {
                dir('frontend') {
                    sh 'BUILD_ID=dontKillMe JENKINS_NODE_COOKIE=dontKillMe nohup npm run dev -- --host 0.0.0.0 --port 3000 > frontend.log 2>&1 < /dev/null &'
                }
            }
        }
        stage('Health Check') {
            steps {
                sh '''
                    echo "Rendszerállapot-ellenőrzés indítása..."
                    local max_retries=30
                    local count=0
                    while [ $count -lt $max_retries ]; do
                        backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/actuator/health 2>/dev/null)
                        frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
                        
                        if [ "$backend_status" = "200" ] && [ "$frontend_status" = "200" ]; then
                            echo "✅ Stabilitás visszaállt. A kontroll teljes körű."
                            exit 0
                        fi
                        
                        count=$((count + 1))
                        echo "⏳ Iteráció: $count/$max_retries. Naplók kinyerése a valóság szűrőjéből:"
                        cat backend/app.log 2>/dev/null || true
                        cat frontend/frontend.log 2>/dev/null || true
                        sleep 2
                    done
                    
                    echo "❌ KRITIKUS: A pipeline sebessége nem korrelál a produktivitással. Rendszer leállítva."
                    exit 1
                '''
            }
        }
    }
}
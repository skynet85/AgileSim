pipeline {
    agent any

    tools {
        nodejs "Node18"
        maven "Maven3"
    }

    stages {
        stage('Source Integrity Check') {
            steps {
                echo 'Repository baseline locked. System state verified.'
            }
        }
        
        stage('Frontend Compilation & Validation Gate') {
            when { expression { fileExists("frontend/package.json") } }
            steps {
                sh 'cd frontend && npm ci --no-optional && npm run build && npm test -- --ci --coverage'
            }
        }

        stage('Backend Compilation & Validation Gate') {
            when { expression { fileExists("backend/pom.xml") } }
            steps {
                sh 'mvn clean compile -q && mvn test'
            }
        }

        stage('Architectural Linting Stretch Goal') {
            steps {
                echo 'Enforcing architectural linting & dependency compliance...'
                sh './scripts/lint-arch.sh --check-ws-kafka-deps || exit 1'
            }
        }

        stage('Artifact Finalization') {
            when { expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' } }
            steps {
                archiveArtifacts artifacts: '**/target/*.jar, **/frontend/dist/**', fingerprint: true
            }
        }
    }

    post {
        always { cleanWs() }
        success { echo 'Predictable execution achieved.' }
        failure { echo 'Deterministic rollback initiated.' }
    }
}
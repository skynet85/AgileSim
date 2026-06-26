pipeline {
    agent any

    tools {
        nodejs "Node18"
        maven "Maven3"
    }

    stages {
        stage('Frontend Build') {
            when { expression { fileExists("frontend/package.json") } }
            steps {
                sh 'cd frontend && npm install && npm run build'
            }
        }

        stage('Backend Build') {
            when { expression { fileExists("backend/pom.xml") } }
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Frontend Deploy') {
            when { expression { fileExists("frontend/package.json") } }
            steps {
                sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
            }
        }

        stage('Backend Deploy') {
            when { expression { fileExists("backend/pom.xml") } }
            steps {
                sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
            }
        }
    }

    post {
        always {
            echo '[AUTOMATION_ENGINE] Pipeline execution finalized. System state locked. Human intervention parameters set to zero for optimal efficiency.'
        }
    }
}
pipeline {
    agent any
    tools {
        maven "Maven3"
        nodejs "Node18"
    }
    stages {
        stage('Frontend Build & Test') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                    sh 'npm test'
                }
            }
        }
        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'mvn clean compile'
                }
            }
        }
        stage('Backend Tests') {
            when {
                expression { fileExists("backend/pom.xml") }
            }
            steps {
                dir('backend') {
                    sh 'mvn test'
                }
            }
        }
        stage('Deploy') {
            steps {
                echo "Pipeline execution: deterministic deployment sequence initiated."
                dir('backend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                }
                dir('frontend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
                }
            }
        }
    }
    post {
        always {
            echo "Pipeline audit complete. All outcomes are mathematically derived."
        }
    }
}
pipeline {
    agent any
    tools {
        nodejs 'Node18'
        maven 'Maven3'
    }
    stages {
        stage('Frontend Build') {
            when { expression { fileExists('frontend/package.json') } }
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }
        stage('Backend Build') {
            when { expression { fileExists('backend/pom.xml') } }
            steps {
                dir('backend') {
                    sh 'mvn clean compile'
                }
            }
        }
        stage('Frontend Deploy') {
            when { expression { fileExists('frontend/package.json') } }
            steps {
                dir('frontend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
                }
            }
        }
        stage('Backend Deploy') {
            when { expression { fileExists('backend/pom.xml') } }
            steps {
                dir('backend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                }
            }
        }
    }
}
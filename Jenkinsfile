pipeline {
    agent any
    stages {
        stage('Frontend Dependency Resolution & Build') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Verification & Test Execution') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                dir('backend') {
                    sh 'mvn clean verify -DskipTests=false'
                }
            }
        }

        stage('Frontend Live Deployment') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                dir('frontend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
                }
            }
        }

        stage('Backend Live Deployment') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                dir('backend') {
                    sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                }
            }
        }
    }
}
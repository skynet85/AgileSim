pipeline {
    agent any
    stages {
        stage('Frontend Dependencies') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                sh 'npm install'
            }
        }

        stage('Frontend Build') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                sh 'npm run build'
            }
        }

        stage('Frontend Deploy') {
            when { expression { fileExists("frontend/package.json") } }
            tools { nodejs "Node18" }
            steps {
                sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &'
            }
        }

        stage('Backend Compile') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                sh 'mvn clean compile'
            }
        }

        stage('Backend Deploy') {
            when { expression { fileExists("backend/pom.xml") } }
            tools { maven "Maven3" }
            steps {
                sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
            }
        }
    }
}
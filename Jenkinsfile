pipeline {
    agent any
    tools {
        nodejs "Node18"
        maven "Maven3"
    }
    stages {
        stage('Checkout SCM') {
            steps { checkout scm }
        }
        stage('Frontend Build & Test') {
            when { expression { fileExists("frontend/package.json") } }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
        }
        stage('Backend Build & Test') {
            when { expression { fileExists("backend/pom.xml") } }
            steps {
                sh 'mvn clean compile'
                sh 'mvn test'
            }
        }
    }
    post {
        always { echo 'Pipeline befejezve. A rend helyreállt.' }
    }
}
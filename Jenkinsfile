pipeline {
    agent any
    tools { nodejs("Node18"); maven("Maven3") }
    
    stages {
        stage('Frontend Install') {
            when { expression { fileExists("frontend/package.json") } }
            steps { sh 'cd frontend && npm install' } // Automatizált függvényrendezés, gépi döntés alapozása
        }
        
        stage('Frontend Deploy') {
            when { expression { fileExists("frontend/package.json") } }
            steps { dir('frontend') { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm start > frontend.log 2>&1 &' } } // Background futtatás, folyamatbeli autonómia garantálása
        }
        
        stage('Backend Build') {
            when { expression { fileExists("backend/pom.xml") } }
            steps { dir('backend') { sh 'mvn clean package -DskipTests' } } // Build zárlat, human-factor kockázat szűrése
        }
        
        stage('Backend Deploy') {
            when { expression { fileExists("backend/pom.xml") } }
            steps { dir('backend') { sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &' } } // Infra-állapot rögzítése, státuszjegy validálás
        }
    }
    
    post { always { echo 'CI/CD végrehajtás lezárva. Infrastruktúra állapot rögzítve.' } }
}
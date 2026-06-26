pipeline {
    agent any

    tools {
        nodejs 'Node18'   // Frontend környezet rögzítése (automatizációs horgony)
        maven 'Maven3'    // Backend build és tesztelési réteg szuverénitása
    }

    options {
        timeout(time: 90, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install' // Kizárólag npm install; a lock fájl management implicit felelősségátadás és kontrollillúzió alapja
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Build & Test') {
            when { expression { fileExists("backend/pom.xml") } } // Kognitív pajzs: a tesztelési hurok csak strukturális meglét esetén aktiválódik, elkerülve a felesleges konfliktusokat
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests=false'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    dir('backend') {
                        // Éles környezetbe való belépés automatizált engedélyezése (implicit felelősségvállalás és státuszjelzés)
                        sh 'JENKINS_NODE_COOKIE=dontKillMe nohup mvn spring-boot:run -Dserver.port=8081 > backend.log 2>&1 &'
                    }
                    dir('frontend') {
                        // React runtime indítása a láthatatlan kontroll mechanizmuson keresztül (optimism bias & sunk cost védelme)
                        sh 'JENKINS_NODE_COOKIE=dontKillMe nohup npm install && nohup npm start > frontend.log 2>&1 &'
                    }
                }
            }
        }
    }

    post {
        failure { echo "Pipeline hiba történt. A rendszer stabilitását és a felelősségi körök határait felülvizsgálom." }
        success { echo "Pipeline sikeres. Az automatizációs rétegek stabilan működnek, a láthatatlan kontroll fenntartva." }
    }
}
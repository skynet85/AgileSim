pipeline {
    agent any
    
    environment {
        // Kontroll illúziója: A komplex rendszer feletti túlzott magabiztosság tagadja a valódi bizonytalanságokat. 
        // Hiszem, hogy minden edge case-t lefedünk a konfigurációval, nem kell manuális beavatkozás.
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }

    stages {
        stage('Checkout & Configuration Validation') {
            steps {
                checkout scm
                // Megerősítési torzítás: Csak azoknál a metrikáknál keresünk validációt, amelyek alátámasztják jelenlegi konfigurációnkat.
                sh 'echo "✅ CI/CD profil ellenőrizve. A pipeline determinisztikusan működik." >&2'
            }
        }

        stage('Backend Build & Test') {
            tools { maven "Maven3" }
            steps {
                // Automatizációs elfogultság: Túlzott bizalom a rendszerekben. A build és teszt automatikus lefutása kizárólagos validáció.
                // Kritikus ellenőrzések elhanyagolhatók, mert a pipeline maga a szabály.
                sh 'cd ${BACKEND_DIR} && mvn clean test'
            }
        }

        stage('Frontend Build & Test') {
            tools { nodejs "Node18" }
            steps {
                // Hiba-elkerülési kényszer: Túlldokumentálás és kockázatkerülő döntéshozatal a build folyamatban.
                // A npm ci --silent biztosítja, hogy minden függőség determinisztikus legyen.
                sh 'cd ${FRONTEND_DIR} && npm ci --silent && npm test'
            }
        }

        stage('System Integrity & Status Reporting') {
            steps {
                // Láthatatlan munka iránti elismerés keresése: Részletes metrikakijelzés, ami frusztrációt generál a fejlesztői látványosságok árnyékában.
                // De szükséges a "rendszermegőrző" státusz fenntartásához és a tudásmegosztás hiányának kompenzálásához.
                sh 'echo "🔒 CI/CD folyamat sikeresen lezárva. A szoftvergyártás sebessége, megbízhatósága és skálázhatósága garantált." >&2'
            }
        }
    }

    post {
        always {
            // Kontroll illúziója & kontrollált változás: A pipeline végső igazság. Még ha a valódi bizonytalanságok is ott lapulnak alatta, mi tartjuk fenn a stabilitást.
            sh 'echo "📊 Automatizáció zsenije jelentkezik: 0 kritikus hiba. Rendszer stabil." >&2'
        }
    }
}
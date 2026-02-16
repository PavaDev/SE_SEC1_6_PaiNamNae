pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'
    }

    environment {
        CI = 'true'
    }

    stages {

        stage('Install Dependencies') {
            steps {
                dir('src/backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Unit Tests') {
            steps {
                dir('src/backend') {
                    sh 'npx jest --testPathPattern="../../tests/backend/unit" --verbose --ci --forceExit --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'src/backend/junit.xml'
                }
            }
        }

        stage('Integration Tests') {
            steps {
                dir('src/backend') {
                    sh 'npx jest --testPathPattern="../../tests/backend/integrate" --verbose --ci --forceExit --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'src/backend/junit.xml'
                }
            }
        }

        stage('Functional Tests') {
            steps {
                dir('src/backend') {
                    sh 'npx jest --testPathPattern="../../tests/backend/functional" --verbose --ci --forceExit --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'src/backend/junit.xml'
                }
            }
        }

        stage('UAT Tests') {
            steps {
                dir('src/backend') {
                    sh 'npx jest --testPathPattern="../../tests/backend/uat" --verbose --ci --forceExit --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'src/backend/junit.xml'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        success {
            echo 'All tests passed!'
        }
        failure {
            echo 'Some tests failed. Check the reports above.'
        }
    }
}

pipeline {
    agent any

    parameters {
        choice(
            name: 'RELEASE_VERSION',
            choices: ['v1.0.0', 'v1.1.0'],
            description: 'Release version to deploy'
        )
        string(
            name: 'MONGO_PASSWORD',
            defaultValue: '',
            description: 'MongoDB Atlas password'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Using local repository"
            }
        }

        stage('Verify Maven') {
            steps {
                sh 'mvn --version'
                sh 'java --version'
            }
        }

        stage('Download Dependencies') {
            steps {
                sh 'mvn dependency:resolve'
            }
        }

        stage('Update Connection') {
            steps {
                script {
                    sh """
                        cp liquibase.properties liquibase.properties.backup
                        sed 's/PASSWORD_HERE/${params.MONGO_PASSWORD}/g' liquibase.properties.backup > liquibase.properties
                    """
                }
            }
        }

        stage('Validate Setup') {
            steps {
                sh 'mvn liquibase:validate'
            }
        }

        stage('Apply Changes') {
            steps {
                sh """
                    mvn liquibase:update \\
                    -Dliquibase.includeAll.path=db/mongo/release/${params.RELEASE_VERSION}/
                """
            }
        }

        stage('Show Status') {
            steps {
                sh 'mvn liquibase:status'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'liquibase*.log', allowEmptyArchive: true
        }
        success {
            echo "✅ Database deployment completed successfully!"
        }
        failure {
            echo "❌ Database deployment failed!"
        }
    }
}

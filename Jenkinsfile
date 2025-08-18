pipeline {
    agent any

    parameters {
        choice(
            name: 'RELEASE_VERSION',
            choices: ['v1.0.0', 'v1.1.0'],
            description: 'Release version to deploy'
        )
    }

    environment {
        MONGO_PASSWORD = credentials('mongodb-atlas-password')
    }

    stages {
        stage('Verify Setup') {
            steps {
                sh 'pwd && ls -la'
                sh 'mvn --version'
            }
        }

        stage('List Available Versions') {
            steps {
                sh 'echo "Available release versions:"'
                sh 'ls -la db/mongo/release/'
            }
        }

        stage('Setup MongoDB Connection') {
            steps {
                sh '''
                    cp liquibase.properties liquibase.properties.backup
                    sed "s/PASSWORD_HERE/${MONGO_PASSWORD}/g" liquibase.properties.backup > liquibase.properties
                    echo "MongoDB connection configured"
                '''
            }
        }

        stage('Apply Database Changes') {
            steps {
                sh '''
                    echo "🚀 Applying MongoDB changes from version: ${RELEASE_VERSION}"
                    mvn liquibase:update -Dliquibase.includeAll.path=db/mongo/release/${RELEASE_VERSION}/
                '''
            }
        }
    }
}

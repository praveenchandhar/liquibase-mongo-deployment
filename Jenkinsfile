pipeline {
    agent any

    parameters {
        string(
            name: 'RELEASE_PATH',
            defaultValue: 'db/mongo/release/v1.0.0',
            description: 'Path to release scripts (e.g., db/mongo/release/v1.0.0)'
        )
    }

    environment {
        MONGO_DB_URL = "mongodb://127.0.0.1:27017/liquibase_db"
    }

    stages {
        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying environment..."
                sh 'pwd && ls -la'
                sh 'mongosh --version'
            }
        }

        stage('List Provided Release Path') {
            steps {
                echo "📁 Listing files in the provided release path: ${params.RELEASE_PATH}"
                sh "ls -la ${params.RELEASE_PATH}"
            }
        }

        stage('Run MongoDB Migration Script') {
            steps {
                echo "🚀 Running MongoDB migration script from path: ${params.RELEASE_PATH}"

                // Execute the migration `.js` script dynamically using mongosh
                sh """
                    mongosh ${MONGO_DB_URL} \\
                           --file ${params.RELEASE_PATH}/users-setup.js
                """
            }
        }

        stage('Run MongoDB Rollback Script (optional)') {
            when {
                expression { return fileExists("${params.RELEASE_PATH}/users-setup.rollback.js") }
            }
            steps {
                echo "⏪ Optionally running MongoDB rollback script from path: ${params.RELEASE_PATH}"

                // Execute the rollback `.js` script dynamically using mongosh
                sh """
                    mongosh ${MONGO_DB_URL} \\
                           --file ${params.RELEASE_PATH}/users-setup.rollback.js
                """
            }
        }
    }

    post {
        success {
            echo "✅ MongoDB deployment completed successfully!"
        }
        failure {
            echo "❌ MongoDB deployment failed!"
        }
    }
}

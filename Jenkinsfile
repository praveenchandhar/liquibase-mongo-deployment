pipeline {
    agent any

    tools {
        maven 'Maven-3.9'
    }

    parameters {
        string(
            name: 'RELEASE_PATH',
            defaultValue: 'db/mongo/release/v1.0.0',
            description: 'Path to release scripts (e.g., db/mongo/release/v1.0.0)'
        )
    }

    stages {
        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying environment..."
                sh 'pwd && ls -la'
                sh 'mvn --version'
            }
        }

        stage('List Release Directory') {
            steps {
                echo "📁 Listing files in the provided release path: ${params.RELEASE_PATH}"
                sh "ls -la ${params.RELEASE_PATH}"
            }
        }

        stage('Download Maven Dependencies') {
            steps {
                echo "📦 Downloading Liquibase dependencies..."
                sh 'mvn dependency:resolve'
            }
        }

        stage('Apply Changes') {
            steps {
                echo "🚀 Applying MongoDB changes from path: ${params.RELEASE_PATH}"
                
                // Replace Maven Liquibase command with dynamic path below:
                sh """
                    mvn liquibase:update \\
                    -Dliquibase.includeAll.path=${params.RELEASE_PATH}
                """
            }
        }

        stage('Show Status') {
            steps {
                echo "📊 Checking deployment status..."
                sh 'mvn liquibase:status'
            }
        }
    }

    post {
        success {
            echo "✅ MongoDB deployment completed successfully!"
            echo "Release path: ${params.RELEASE_PATH}"
        }
        failure {
            echo "❌ MongoDB deployment failed!"
        }
    }
}

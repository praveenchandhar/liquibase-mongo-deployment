pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
    }

    parameters {
        choice(
            name: 'RELEASE_VERSION',
            choices: ['v1.0.0', 'v1.1.0'],
            description: 'Release version to deploy'
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

        stage('List Available Versions') {
            steps {
                echo "📁 Available MongoDB release versions:"
                sh "ls -la db/mongo/release/"
            }
        }

        stage('Download Maven Dependencies') {
            steps {
                echo "📦 Downloading Liquibase dependencies..."
                sh 'mvn dependency:resolve'
            }
        }

        stage('Apply MongoDB Changes') {
            steps {
                echo "🚀 Applying MongoDB changes from version: ${params.RELEASE_VERSION}"
                sh """
                    mvn liquibase:update \\
                    -Dliquibase.includeAll.path=db/mongo/release/${params.RELEASE_VERSION}/
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
            echo "Version: ${params.RELEASE_VERSION}"
        }
        failure {
            echo "❌ MongoDB deployment failed!"
        }
    }
}

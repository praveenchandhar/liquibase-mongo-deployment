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

    environment {
        MONGO_PASSWORD = credentials('mongodb-atlas-password')
    }

    stages {
        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying environment..."
                sh 'pwd'
                sh 'ls -la'
                sh 'mvn --version'
            }
        }

        stage('List Available Versions') {
            steps {
                echo "📁 Available MongoDB release versions:"
                sh "ls -la db/mongo/release/ || echo 'Directory not found'"
            }
        }

        stage('Download Maven Dependencies') {
            steps {
                echo "📦 Downloading Liquibase dependencies..."
                sh 'mvn dependency:resolve'
            }
        }

        stage('Setup MongoDB Configuration') {
            steps {
                echo "⚙️ Setting up MongoDB configuration..."
                sh """
                    cp liquibase.properties liquibase.properties.backup
                    sed 's/PASSWORD_HERE/${MONGO_PASSWORD}/g' liquibase.properties.backup > liquibase.properties
                    echo "MongoDB configuration updated"
                """
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

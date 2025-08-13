pipeline {
    agent any
    
    parameters {
        choice(
            name: 'RELEASE_VERSION',
            choices: ['v1.0.0', 'v1.1.0', 'weekly-patch-001'],
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
                checkout scm
            }
        }
        
        stage('Update Connection') {
            steps {
                script {
                    sh """
                        sed -i 's/PASSWORD_HERE/${params.MONGO_PASSWORD}/g' liquibase.properties
                    """
                }
            }
        }
        
        stage('Apply Changes') {
            steps {
                sh 'mvn liquibase:update -Dliquibase.includeAll.path=db/mongo/release/${RELEASE_VERSION}/'
            }
        }
    }
}

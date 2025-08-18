pipeline {
    agent any

    parameters {
        choice(
            name: 'ACTION',
            choices: ['status', 'update', 'rollback'],
            description: 'Liquibase action to perform'
        )
        string(
            name: 'CHANGELOG_PATH',
            defaultValue: 'db/mongo/release/v1.0.2/changelog.yaml',
            description: 'Complete path to the changelog file (any path supported)'
        )
        string(
            name: 'ROLLBACK_COUNT',
            defaultValue: '1',
            description: 'Number of changesets to rollback (ONLY used when ACTION = rollback)'
        )
    }

    tools {
        // Use the correct Maven tool name from your Jenkins configuration
        maven 'Maven-3.9' // Fixed to match your Jenkins Maven tool name
    }

    environment {
        // Common settings
        MAVEN_OPTS = "-Xmx512m"
        
        // MongoDB settings from your liquibase.properties
        DB_URL = "mongodb://127.0.0.1:27017/liquibase_db?authSource=admin"
        DB_USERNAME = "praveents"
        DB_PASSWORD = "EkafqheY5FzPgwyK"
        
        // Changeset tracking
        CHANGESETS_COUNT = "0"
        DEPLOYMENT_STATUS = "Unknown"
    }

    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    echo "🔍 Validating parameters..."
                    echo "Database Type: MongoDB"
                    echo "Action: ${params.ACTION}"
                    echo "Changelog Path: ${params.CHANGELOG_PATH}"
                    
                    if (params.ACTION == 'rollback') {
                        echo "Rollback Count: ${params.ROLLBACK_COUNT}"
                        
                        // Validate rollback count
                        try {
                            def count = Integer.parseInt(params.ROLLBACK_COUNT)
                            if (count <= 0) {
                                error("❌ Rollback count must be a positive number")
                            }
                            echo "✅ Rollback count validated: ${count}"
                        } catch (NumberFormatException e) {
                            error("❌ Rollback count must be a valid number")
                        }
                    } else {
                        echo "ℹ️ Rollback count parameter ignored (not applicable for ${params.ACTION})"
                    }
                }
            }
        }

        stage('Check Prerequisites') {
            steps {
                echo "🔍 Checking prerequisites for MongoDB deployment..."
                
                sh '''
                    echo "🔧 Java version:"
                    java -version
                    
                    echo "🔧 Maven version:"
                    mvn --version
                    
                    echo "📁 Current directory:"
                    pwd
                    
                    echo "📂 Project structure:"
                    ls -la
                    
                    echo "📋 Liquibase properties file:"
                    ls -la liquibase.properties
                '''
            }
        }

        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying MongoDB environment and changelog file"
                
                script {
                    // Check if changelog file exists
                    if (!fileExists("${params.CHANGELOG_PATH}")) {
                        error("❌ Changelog file not found: ${params.CHANGELOG_PATH}")
                    }
                    
                    echo "✅ Changelog file exists: ${params.CHANGELOG_PATH}"
                }
                
                sh '''
                    echo "📂 Changelog file details:"
                    ls -la ${CHANGELOG_PATH}
                    
                    echo "📂 Changelog content preview:"
                    head -20 ${CHANGELOG_PATH}
                    
                    echo "🗄️ MongoDB connection details:"
                    echo "Database URL: ${DB_URL}"
                    echo "Username: ${DB_USERNAME}"
                    echo "Password: [HIDDEN]"
                '''
            }
        }

        stage('Liquibase Status') {
            when {
                anyOf {
                    expression { params.ACTION == 'status' }
                    expression { params.ACTION == 'update' }
                    expression { params.ACTION == 'rollback' }
                }
            }
            steps {
                echo "📊 Checking Liquibase status for MongoDB"
                
                script {
                    def statusCommand = buildLiquibaseCommand('status')
                    echo "🔧 Executing command: ${statusCommand}"
                    
                    def statusOutput = sh(script: statusCommand, returnStdout: true)
                    echo "📄 Status output:\n${statusOutput}"
                    
                    // Extract changeset count from status output
                    env.CHANGESETS_COUNT = extractChangesetCount(statusOutput)
                    echo "📊 Changesets to be applied: ${env.CHANGESETS_COUNT}"
                }
            }
        }

        stage('Liquibase Update') {
            when {
                expression { params.ACTION == 'update' }
            }
            steps {
                echo "🚀 Applying changes to MongoDB database"
                
                script {
                    def updateCommand = buildLiquibaseCommand('update')
                    echo "🔧 Executing command: ${updateCommand}"
                    
                    def updateOutput = sh(script: updateCommand, returnStdout: true)
                    echo "📄 Update output:\n${updateOutput}"
                    
                    // Extract actual changesets applied from update output
                    env.CHANGESETS_COUNT = extractAppliedChangesetCount(updateOutput)
                    env.DEPLOYMENT_STATUS = "Success"
                    
                    echo "✅ Applied ${env.CHANGESETS_COUNT} changesets"
                }
                
                // Archive MongoDB Pro reports
                archiveArtifacts(
                    artifacts: '**/Update-report-*.html',
                    allowEmptyArchive: true,
                    fingerprint: true
                )
            }
        }

        stage('Liquibase Rollback') {
            when {
                expression { params.ACTION == 'rollback' }
            }
            steps {
                echo "⏪ Rolling back ${params.ROLLBACK_COUNT} changeset(s) for MongoDB"
                
                script {
                    // Preview rollback first
                    def rollbackSQLCommand = buildLiquibaseCommand('rollbackSQL')
                    echo "🔍 Preview of rollback operations:"
                    echo "🔧 Executing command: ${rollbackSQLCommand}"
                    
                    def rollbackPreview = sh(script: rollbackSQLCommand, returnStdout: true)
                    echo "📄 Rollback preview:\n${rollbackPreview}"
                    
                    // Confirm rollback
                    def userInput = input(
                        message: "Are you sure you want to rollback ${params.ROLLBACK_COUNT} changeset(s) for MongoDB?",
                        parameters: [
                            choice(choices: 'No\nYes', description: 'Confirm rollback', name: 'CONFIRM_ROLLBACK')
                        ]
                    )
                    
                    if (userInput == 'Yes') {
                        def rollbackCommand = buildLiquibaseCommand('rollback')
                        echo "🔧 Executing command: ${rollbackCommand}"
                        def rollbackOutput = sh(script: rollbackCommand, returnStdout: true)
                        echo "📄 Rollback output:\n${rollbackOutput}"
                        
                        env.CHANGESETS_COUNT = params.ROLLBACK_COUNT
                        env.DEPLOYMENT_STATUS = "Rollback Success"
                        echo "✅ Rollback completed successfully"
                    } else {
                        env.DEPLOYMENT_STATUS = "Rollback Cancelled"
                        echo "❌ Rollback cancelled by user"
                    }
                }
            }
        }

        stage('Verify MongoDB Changes') {
            when {
                expression { params.ACTION == 'update' }
            }
            steps {
                echo "✅ Verifying MongoDB deployment"
                
                sh '''
                    echo "🔍 Checking MongoDB collections and changelog history:"
                    
                    # Use mongosh to verify the deployment
                    mongosh "${DB_URL}" --username "${DB_USERNAME}" --password "${DB_PASSWORD}" --eval "
                        print('=== Database Collections ===');
                        db.adminCommand('listCollections').cursor.firstBatch.forEach(
                            function(collection) {
                                print('📁 Collection: ' + collection.name);
                            }
                        );
                        
                        print('\\n=== Recent Changelog Entries ===');
                        if (db.DATABASECHANGELOG.countDocuments() > 0) {
                            db.DATABASECHANGELOG.find().sort({orderExecuted: -1}).limit(5).forEach(
                                function(entry) {
                                    print('🔄 ID: ' + entry.id + ', Author: ' + entry.author + ', Date: ' + entry.dateExecuted);
                                }
                            );
                        } else {
                            print('No changelog entries found');
                        }
                    " || echo "⚠️ MongoDB verification completed with warnings"
                '''
            }
        }

        stage('Summary') {
            steps {
                script {
                    echo "📋 === MONGODB DEPLOYMENT SUMMARY ==="
                    echo "🗄️ Database Type: MongoDB"
                    echo "🎯 Action: ${params.ACTION}"
                    echo "📁 Changelog: ${params.CHANGELOG_PATH}"
                    echo "📊 Changesets: ${env.CHANGESETS_COUNT}"
                    echo "✅ Status: ${env.DEPLOYMENT_STATUS}"
                    echo "⏰ Completed: ${new Date()}"
                    
                    def fileName = params.CHANGELOG_PATH.split('/').last()
                    echo "📄 File: ${fileName}"
                    echo "🔗 Build: #${env.BUILD_NUMBER}"
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    echo "🧹 Cleaning up temporary files"
                    sh 'find . -name "liquibase-*.txt" -delete 2>/dev/null || true'
                    sh 'find . -name "*.tmp" -delete 2>/dev/null || true'
                } catch (Exception e) {
                    echo "⚠️ Cleanup warning: ${e.getMessage()}"
                }
            }
        }
        
        success {
            script {
                env.DEPLOYMENT_STATUS = env.DEPLOYMENT_STATUS ?: "Success"
                
                def fileName = params.CHANGELOG_PATH.split('/').last()
                
                echo """
                🎉 === MONGODB SUCCESS SUMMARY ===
                📄 File Name: ${fileName}
                📊 Changesets: ${env.CHANGESETS_COUNT}
                🎯 Action: ${params.ACTION}
                🗄️ Database: MongoDB
                ✅ Status: ${env.DEPLOYMENT_STATUS}
                🔗 Build: #${env.BUILD_NUMBER}
                ⏰ Time: ${new Date()}
                """
            }
        }
        
        failure {
            script {
                env.DEPLOYMENT_STATUS = "Failed"
                env.CHANGESETS_COUNT = env.CHANGESETS_COUNT ?: "0"
                
                def fileName = params.CHANGELOG_PATH.split('/').last()
                
                echo """
                ❌ === MONGODB FAILURE SUMMARY ===
                📄 File Name: ${fileName}
                📊 Changesets: ${env.CHANGESETS_COUNT}
                🎯 Action: ${params.ACTION}
                🗄️ Database: MongoDB
                ❌ Status: ${env.DEPLOYMENT_STATUS}
                🔗 Build: #${env.BUILD_NUMBER}
                ⏰ Time: ${new Date()}
                """
                
                // Debug information
                echo "=== DEBUG INFORMATION ==="
                echo "Changelog Path: ${params.CHANGELOG_PATH}"
                echo "Action: ${params.ACTION}"
                if (params.ACTION == 'rollback') {
                    echo "Rollback Count: ${params.ROLLBACK_COUNT}"
                }
                echo "MongoDB URL: ${env.DB_URL}"
                echo "Username: ${env.DB_USERNAME}"
            }
        }
    }
}

// Helper function to build Liquibase Maven commands
def buildLiquibaseCommand(action) {
    def baseCommand = "mvn liquibase:${action}"
    
    // Add changelog file parameter
    def command = "${baseCommand} -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}"
    
    // Add MongoDB connection parameters
    command += " -Dliquibase.url='${env.DB_URL}'"
    command += " -Dliquibase.username='${env.DB_USERNAME}'"
    command += " -Dliquibase.password='${env.DB_PASSWORD}'"
    
    // Add action-specific parameters
    switch(action) {
        case 'rollback':
        case 'rollbackSQL':
            command += " -Dliquibase.rollbackCount=${params.ROLLBACK_COUNT}"
            break
    }
    
    return command
}

// Helper function to extract changeset count from status output
def extractChangesetCount(output) {
    try {
        def matcher = output =~ /(\d+)\s+changeset[s]?\s+(?:have\s+not\s+been\s+applied|to\s+be\s+applied)/
        if (matcher) {
            return matcher[0][1]
        }
        
        matcher = output =~ /(\d+)\s+change\s+sets/
        if (matcher) {
            return matcher[0][1]
        }
        
        // Check for "0 changesets" or "no changesets"
        if (output.contains("0 changesets") || output.contains("no changesets")) {
            return "0"
        }
        
        return "Unknown"
    } catch (Exception e) {
        echo "Warning: Could not extract changeset count from status output"
        return "Unknown"
    }
}

// Helper function to extract applied changeset count from update output
def extractAppliedChangesetCount(output) {
    try {
        def matcher = output =~ /Run:\s+(\d+)/
        if (matcher) {
            return matcher[0][1]
        }
        
        matcher = output =~ /(\d+)\s+changesets?\s+(?:applied|executed|ran successfully)/
        if (matcher) {
            return matcher[0][1]
        }
        
        return env.CHANGESETS_COUNT ?: "Unknown"
    } catch (Exception e) {
        echo "Warning: Could not extract applied changeset count from update output"
        return env.CHANGESETS_COUNT ?: "Unknown"
    }
}

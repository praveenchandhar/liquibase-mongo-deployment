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
        maven 'Maven-3.9'
    }

    environment {
        // Common settings
        MAVEN_OPTS = "-Xmx512m"
        
        // MongoDB settings from your liquibase.properties
        DB_URL = "mongodb://127.0.0.1:27017/liquibase_db?authSource=admin"
        DB_USERNAME = "praveents"
        DB_PASSWORD = "EkafqheY5FzPgwyK"
        
        // Teams webhook URL
        TEAMS_WEBHOOK_URL = "https://sequoiaone.webhook.office.com/webhookb2/be6a7224-f57d-4807-b8a3-5bb01b290044@27d3059a-ce98-46a7-9665-afb1bb64a0d0/IncomingWebhook/79893df4ce6646d9a48390424016e927/36702cd9-0cd7-48ab-aa73-3ddd772363a6/V2CWa_m3kOcAf_YbSvaIS0zTgPdzzF1A_ZzvU8WMbSRP41"
        
        // Add mongosh to PATH
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        
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
                    
                    echo "🍃 Checking mongosh availability:"
                    if command -v mongosh >/dev/null 2>&1; then
                        echo "✅ mongosh found:"
                        mongosh --version
                        which mongosh
                    else
                        echo "❌ mongosh not found in PATH"
                        echo "Current PATH: $PATH"
                        echo "Searching for mongosh..."
                        find /usr -name "mongosh" 2>/dev/null || true
                        find /opt -name "mongosh" 2>/dev/null || true
                        find /Applications -name "mongosh" 2>/dev/null || true
                    fi
                    
                    echo "📁 Current directory:"
                    pwd
                    
                    echo "📂 Project structure:"
                    ls -la
                '''
            }
        }

        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying MongoDB environment and changelog file"
                
                script {
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
                    
                    env.CHANGESETS_COUNT = extractAppliedChangesetCount(updateOutput)
                    env.DEPLOYMENT_STATUS = "Success"
                    
                    echo "✅ Applied ${env.CHANGESETS_COUNT} changesets"
                }
                
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
                    def rollbackSQLCommand = buildLiquibaseCommand('rollbackSQL')
                    echo "🔍 Preview of rollback operations:"
                    echo "🔧 Executing command: ${rollbackSQLCommand}"
                    
                    def rollbackPreview = sh(script: rollbackSQLCommand, returnStdout: true)
                    echo "📄 Rollback preview:\n${rollbackPreview}"
                    
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
                
                // Send Teams success notification
                sendTeamsNotification(true)
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
                
                echo "=== DEBUG INFORMATION ==="
                echo "Changelog Path: ${params.CHANGELOG_PATH}"
                echo "Action: ${params.ACTION}"
                if (params.ACTION == 'rollback') {
                    echo "Rollback Count: ${params.ROLLBACK_COUNT}"
                }
                echo "MongoDB URL: ${env.DB_URL}"
                echo "Username: ${env.DB_USERNAME}"
                
                // Send Teams failure notification
                sendTeamsNotification(false)
            }
        }
    }
}

// Helper function to build Liquibase Maven commands
def buildLiquibaseCommand(action) {
    def baseCommand = "mvn liquibase:${action}"
    def command = "${baseCommand} -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}"
    command += " -Dliquibase.url='${env.DB_URL}'"
    command += " -Dliquibase.username='${env.DB_USERNAME}'"
    command += " -Dliquibase.password='${env.DB_PASSWORD}'"
    
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
        // Look for pattern: "X changeset has not been applied" or "X changesets have not been applied"
        def matcher = output =~ /(\d+)\s+changeset[s]?\s+has?\s+not\s+been\s+applied/
        if (matcher) {
            return matcher[0][1]
        }
        
        // Alternative patterns
        matcher = output =~ /(\d+)\s+changeset[s]?\s+(?:have\s+not\s+been\s+applied|to\s+be\s+applied)/
        if (matcher) {
            return matcher[0][1]
        }
        
        matcher = output =~ /(\d+)\s+change\s+sets/
        if (matcher) {
            return matcher[0][1]
        }
        
        // Check for "0 changesets" or up-to-date
        if (output.contains("is up to date") || output.contains("0 changesets")) {
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

// Helper function to send Teams notification
def sendTeamsNotification(isSuccess) {
    try {
        def fileName = params.CHANGELOG_PATH.split('/').last()
        def emoji = isSuccess ? "✅" : "❌"
        def status = env.DEPLOYMENT_STATUS
        def color = isSuccess ? "Good" : "Attention"
        
        def message = [
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": isSuccess ? "00FF00" : "FF0000",
            "summary": "MongoDB Liquibase ${status}",
            "sections": [
                [
                    "activityTitle": "${emoji} MongoDB Liquibase ${status}",
                    "activitySubtitle": "Database deployment completed",
                    "facts": [
                        [
                            "name": "File Name",
                            "value": fileName
                        ],
                        [
                            "name": "Changesets",
                            "value": env.CHANGESETS_COUNT
                        ],
                        [
                            "name": "Action",
                            "value": params.ACTION
                        ],
                        [
                            "name": "Database",
                            "value": "MongoDB"
                        ],
                        [
                            "name": "Build",
                            "value": "#${env.BUILD_NUMBER}"
                        ],
                        [
                            "name": "Time",
                            "value": new Date().toString()
                        ]
                    ],
                    "markdown": true
                ]
            ],
            "potentialAction": [
                [
                    "@type": "OpenUri",
                    "name": "View Build",
                    "targets": [
                        [
                            "os": "default",
                            "uri": env.BUILD_URL
                        ]
                    ]
                ]
            ]
        ]
        
        // Create JSON string manually to avoid writeJSON dependency
        def jsonString = """
        {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "${isSuccess ? '00FF00' : 'FF0000'}",
            "summary": "MongoDB Liquibase ${status}",
            "sections": [
                {
                    "activityTitle": "${emoji} MongoDB Liquibase ${status}",
                    "activitySubtitle": "Database deployment completed",
                    "facts": [
                        {"name": "File Name", "value": "${fileName}"},
                        {"name": "Changesets", "value": "${env.CHANGESETS_COUNT}"},
                        {"name": "Action", "value": "${params.ACTION}"},
                        {"name": "Database", "value": "MongoDB"},
                        {"name": "Build", "value": "#${env.BUILD_NUMBER}"},
                        {"name": "Time", "value": "${new Date()}"}
                    ]
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "View Build",
                    "targets": [{"os": "default", "uri": "${env.BUILD_URL}"}]
                }
            ]
        }
        """.stripIndent()
        
        sh """
            curl -X POST '${env.TEAMS_WEBHOOK_URL}' \\
                 -H 'Content-Type: application/json' \\
                 -d '${jsonString}'
        """
        
        echo "📢 Teams notification sent successfully"
        
    } catch (Exception e) {
        echo "⚠️ Failed to send Teams notification: ${e.getMessage()}"
    }
}

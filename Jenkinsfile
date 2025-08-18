pipeline {
    agent any

    parameters {
        choice(
            name: 'DATABASE_TYPE',
            choices: ['mongodb', 'mysql', 'postgresql'],
            description: 'Select the database type'
        )
        choice(
            name: 'ACTION',
            choices: ['status', 'update', 'rollback'],
            description: 'Liquibase action to perform'
        )
        string(
            name: 'CHANGELOG_PATH',
            defaultValue: 'db/mongo/release/v1.0.0/changelog.yaml',
            description: 'Complete path to the changelog file (any path supported)'
        )
        string(
            name: 'ROLLBACK_COUNT',
            defaultValue: '1',
            description: 'Number of changesets to rollback (only for rollback action)'
        )
        string(
            name: 'TEAMS_WEBHOOK_URL',
            defaultValue: 'https://sequoiaone.webhook.office.com/webhookb2/be6a7224-f57d-4807-b8a3-5bb01b290044@27d3059a-ce98-46a7-9665-afb1bb64a0d0/IncomingWebhook/79893df4ce6646d9a48390424016e927/36702cd9-0cd7-48ab-aa73-3ddd772363a6/V2CWa_m3kOcAf_YbSvaIS0zTgPdzzF1A_ZzvU8WMbSRP41',
            description: 'Teams webhook URL for notifications'
        )
    }

    environment {
        // Common settings
        MAVEN_OPTS = "-Xmx512m"
        LIQUIBASE_LICENSE_KEY = credentials('liquibase-pro-license')
        
        // Database-specific settings will be set dynamically
        DB_URL = ""
        DB_USERNAME = ""
        DB_PASSWORD = ""
        DB_DRIVER = ""
        
        // Changeset tracking
        CHANGESETS_COUNT = "0"
        DEPLOYMENT_STATUS = "Unknown"
    }

    stages {
        stage('Setup Database Configuration') {
            steps {
                script {
                    echo "🗄️ Setting up configuration for: ${params.DATABASE_TYPE}"
                    
                    // Set database-specific configurations
                    switch(params.DATABASE_TYPE) {
                        case 'mongodb':
                            env.DB_URL = "mongodb://127.0.0.1:27017/liquibase_db?authSource=admin"
                            env.DB_USERNAME = credentials('mongo-username')
                            env.DB_PASSWORD = credentials('mongo-password')
                            env.DB_DRIVER = ""
                            echo "📋 MongoDB configuration loaded"
                            break
                            
                        case 'mysql':
                            env.DB_URL = "jdbc:mysql://localhost:3306/liquibase_db"
                            env.DB_USERNAME = credentials('mysql-username')
                            env.DB_PASSWORD = credentials('mysql-password')
                            env.DB_DRIVER = "com.mysql.cj.jdbc.Driver"
                            echo "📋 MySQL configuration loaded"
                            break
                            
                        case 'postgresql':
                            env.DB_URL = "jdbc:postgresql://localhost:5432/liquibase_db"
                            env.DB_USERNAME = credentials('postgres-username')
                            env.DB_PASSWORD = credentials('postgres-password')
                            env.DB_DRIVER = "org.postgresql.Driver"
                            echo "📋 PostgreSQL configuration loaded"
                            break
                            
                        default:
                            error("❌ Unsupported database type: ${params.DATABASE_TYPE}")
                    }
                    
                    echo "🔗 Database URL: ${env.DB_URL}"
                    echo "📁 Changelog Path: ${params.CHANGELOG_PATH}"
                    echo "🎯 Action: ${params.ACTION}"
                }
            }
        }

        stage('Verify Environment') {
            steps {
                echo "🔍 Verifying environment and prerequisites"
                
                script {
                    // Check if changelog file exists
                    if (!fileExists("${params.CHANGELOG_PATH}")) {
                        error("❌ Changelog file not found: ${params.CHANGELOG_PATH}")
                    }
                    
                    echo "✅ Changelog file exists: ${params.CHANGELOG_PATH}"
                }
                
                sh '''
                    echo "📁 Project structure:"
                    pwd && ls -la
                    
                    echo "📂 Changelog file details:"
                    ls -la ${CHANGELOG_PATH}
                    
                    echo "🔧 Maven version:"
                    mvn --version
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
                echo "📊 Checking Liquibase status for ${params.DATABASE_TYPE}"
                
                script {
                    def statusCommand = buildLiquibaseCommand('status')
                    def statusOutput = sh(script: statusCommand, returnStdout: true)
                    
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
                echo "🚀 Applying changes to ${params.DATABASE_TYPE} database"
                
                script {
                    def updateCommand = buildLiquibaseCommand('update')
                    def updateOutput = sh(script: updateCommand, returnStdout: true)
                    
                    // Extract actual changesets applied from update output
                    env.CHANGESETS_COUNT = extractAppliedChangesetCount(updateOutput)
                    env.DEPLOYMENT_STATUS = "Success"
                    
                    echo "✅ Applied ${env.CHANGESETS_COUNT} changesets"
                }
                
                // Archive any generated reports
                script {
                    if (params.DATABASE_TYPE == 'mongodb') {
                        archiveArtifacts(
                            artifacts: '**/Update-report-*.html',
                            allowEmptyArchive: true,
                            fingerprint: true
                        )
                    }
                }
            }
        }

        stage('Liquibase Rollback') {
            when {
                expression { params.ACTION == 'rollback' }
            }
            steps {
                echo "⏪ Rolling back ${params.ROLLBACK_COUNT} changeset(s) for ${params.DATABASE_TYPE}"
                
                script {
                    // Preview rollback first
                    def rollbackSQLCommand = buildLiquibaseCommand('rollbackSQL')
                    echo "🔍 Preview of rollback operations:"
                    sh rollbackSQLCommand
                    
                    // Confirm rollback
                    def userInput = input(
                        message: "Are you sure you want to rollback ${params.ROLLBACK_COUNT} changeset(s)?",
                        parameters: [
                            choice(choices: 'No\nYes', description: 'Confirm rollback', name: 'CONFIRM_ROLLBACK')
                        ]
                    )
                    
                    if (userInput == 'Yes') {
                        def rollbackCommand = buildLiquibaseCommand('rollback')
                        def rollbackOutput = sh(script: rollbackCommand, returnStdout: true)
                        
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
    }

    post {
        always {
            echo "🧹 Cleaning up temporary files"
            sh 'find . -name "liquibase-*.txt" -delete || true'
            sh 'find . -name "*.tmp" -delete || true'
        }
        
        success {
            script {
                env.DEPLOYMENT_STATUS = env.DEPLOYMENT_STATUS ?: "Success"
                
                echo "✅ Deployment completed successfully!"
                echo "📊 Final changeset count: ${env.CHANGESETS_COUNT}"
                
                // Send Teams notification
                sendTeamsNotification(true)
            }
        }
        
        failure {
            script {
                env.DEPLOYMENT_STATUS = "Failed"
                env.CHANGESETS_COUNT = env.CHANGESETS_COUNT ?: "0"
                
                echo "❌ Deployment failed!"
                
                // Send Teams notification
                sendTeamsNotification(false)
            }
        }
    }
}

// Helper function to build Liquibase Maven commands
def buildLiquibaseCommand(action) {
    def baseCommand = "mvn liquibase:${action}"
    
    // Add common parameters
    def command = "${baseCommand} -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}"
    
    // Add database-specific parameters
    if (env.DB_URL) {
        command += " -Dliquibase.url='${env.DB_URL}'"
    }
    if (env.DB_USERNAME) {
        command += " -Dliquibase.username='${env.DB_USERNAME}'"
    }
    if (env.DB_PASSWORD) {
        command += " -Dliquibase.password='${env.DB_PASSWORD}'"
    }
    if (env.DB_DRIVER && env.DB_DRIVER != "") {
        command += " -Dliquibase.driver='${env.DB_DRIVER}'"
    }
    if (env.LIQUIBASE_LICENSE_KEY) {
        command += " -Dliquibase.licenseKey='${env.LIQUIBASE_LICENSE_KEY}'"
    }
    
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
        // Look for patterns like "X changesets have not been applied"
        def matcher = output =~ /(\d+)\s+changeset[s]?\s+(?:have\s+not\s+been\s+applied|to\s+be\s+applied)/
        if (matcher) {
            return matcher[0][1]
        }
        
        // Alternative pattern for different Liquibase versions
        matcher = output =~ /(\d+)\s+change\s+sets/
        if (matcher) {
            return matcher[0][1]
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
        // Look for "Run: X" in the update summary
        def matcher = output =~ /Run:\s+(\d+)/
        if (matcher) {
            return matcher[0][1]
        }
        
        // Alternative pattern
        matcher = output =~ /(\d+)\s+changesets?\s+(?:applied|executed)/
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
        def color = isSuccess ? "Good" : "Attention"
        def emoji = isSuccess ? "✅" : "❌"
        def status = env.DEPLOYMENT_STATUS
        
        def message = [
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": isSuccess ? "00FF00" : "FF0000",
            "summary": "Liquibase Deployment ${status}",
            "sections": [
                [
                    "activityTitle": "${emoji} Liquibase Deployment ${status}",
                    "activitySubtitle": "Database: ${params.DATABASE_TYPE}",
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
                            "value": params.DATABASE_TYPE
                        ],
                        [
                            "name": "Build",
                            "value": "#${env.BUILD_NUMBER}"
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
        
        def jsonPayload = writeJSON returnText: true, json: message
        
        sh """
            curl -X POST '${params.TEAMS_WEBHOOK_URL}' \\
                 -H 'Content-Type: application/json' \\
                 -d '${jsonPayload}'
        """
        
        echo "📢 Teams notification sent successfully"
        
    } catch (Exception e) {
        echo "⚠️ Failed to send Teams notification: ${e.getMessage()}"
    }
}

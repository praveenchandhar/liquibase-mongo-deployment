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
        // Add mongosh to PATH
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        
        // Teams webhook URL
        TEAMS_WEBHOOK_URL = "https://sequoiaone.webhook.office.com/webhookb2/be6a7224-f57d-4807-b8a3-5bb01b290044@27d3059a-ce98-46a7-9665-afb1bb64a0d0/IncomingWebhook/79893df4ce6646d9a48390424016e927/36702cd9-0cd7-48ab-aa73-3ddd772363a6/V2CWa_m3kOcAf_YbSvaIS0zTgPdzzF1A_ZzvU8WMbSRP41"
        
        // Jenkins build info for HTML report links
        BUILD_URL = "${env.BUILD_URL}"
        JOB_NAME = "${env.JOB_NAME}"
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Validate Parameters') {
            steps {
                script {
                    echo "🔍 Validating parameters..."
                    echo "Database Type: MongoDB"
                    echo "Action: ${params.ACTION}"
                    echo "Changelog Path: ${params.CHANGELOG_PATH}"
                    
                    if (params.ACTION != 'rollback') {
                        echo "ℹ️ Rollback count parameter ignored (not applicable for ${params.ACTION})"
                    } else {
                        echo "🔄 Rollback count: ${params.ROLLBACK_COUNT}"
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
                    echo "🔧 MongoDB Shell version:"
                    mongosh --version
                    echo "📁 Liquibase properties file:"
                    ls -la liquibase.properties
                '''
            }
        }

        stage('Verify Changelog File') {
            steps {
                script {
                    if (fileExists(params.CHANGELOG_PATH)) {
                        echo "✅ Changelog file exists: ${params.CHANGELOG_PATH}"
                        sh "echo '📄 Changelog content preview:' && head -20 '${params.CHANGELOG_PATH}'"
                    } else {
                        error "❌ Changelog file not found: ${params.CHANGELOG_PATH}"
                    }
                }
            }
        }

        stage('Execute Liquibase Action') {
            steps {
                script {
                    def changesetCount = 0
                    def reportGenerated = false
                    def htmlReportPath = ""
                    
                    // Execute the requested action
                    if (params.ACTION == 'status') {
                        echo "📋 Checking Liquibase status..."
                        def statusOutput = sh(
                            script: "mvn liquibase:status -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}",
                            returnStdout: true
                        )
                        echo "Status Output: ${statusOutput}"
                        
                        // Extract changeset count
                        def matcher = statusOutput =~ /(\d+)\s+changesets?\s+have\s+not\s+been\s+applied/
                        if (matcher.find()) {
                            changesetCount = matcher[0][1] as Integer
                        }
                        
                    } else if (params.ACTION == 'update') {
                        echo "🚀 Performing Liquibase update..."
                        
                        // Generate HTML documentation before update
                        echo "📊 Generating HTML documentation..."
                        sh "mvn liquibase:dbDoc -Dliquibase.changeLogFile=${params.CHANGELOG_PATH} -Dliquibase.outputDirectory=liquibase-reports"
                        
                        // Perform the update
                        def updateOutput = sh(
                            script: "mvn liquibase:update -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}",
                            returnStdout: true
                        )
                        echo "Update Output: ${updateOutput}"
                        
                        // Extract applied changeset count
                        def matcher = updateOutput =~ /(\d+)\s+changesets?\s+applied/
                        if (matcher.find()) {
                            changesetCount = matcher[0][1] as Integer
                        }
                        
                        reportGenerated = true
                        htmlReportPath = "liquibase-reports"
                        
                    } else if (params.ACTION == 'rollback') {
                        echo "⏪ Performing Liquibase rollback of ${params.ROLLBACK_COUNT} changesets..."
                        
                        def rollbackOutput = sh(
                            script: "mvn liquibase:rollbackCount -Dliquibase.rollbackCount=${params.ROLLBACK_COUNT} -Dliquibase.changeLogFile=${params.CHANGELOG_PATH}",
                            returnStdout: true
                        )
                        echo "Rollback Output: ${rollbackOutput}"
                        
                        changesetCount = params.ROLLBACK_COUNT as Integer
                    }
                    
                    // Store results for Teams notification
                    env.CHANGESET_COUNT = changesetCount.toString()
                    env.REPORT_GENERATED = reportGenerated.toString()
                    env.HTML_REPORT_PATH = htmlReportPath
                }
            }
        }

        stage('Generate Additional Reports') {
            when {
                expression { env.REPORT_GENERATED == 'true' }
            }
            steps {
                script {
                    echo "📊 Creating additional HTML reports..."
                    
                    // Create timestamp for report name
                    def timestamp = new Date().format('dd-MMM-yyyy-HHmmss')
                    def reportName = "${params.ACTION}-report-${timestamp}.html"
                    
                    // Ensure reports directory exists
                    sh "mkdir -p liquibase-reports"
                    
                    // Create a summary HTML report
                    sh """
                        cat > liquibase-reports/${reportName} << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Liquibase ${params.ACTION.toUpperCase()} Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .content { margin-top: 20px; }
        .success { color: green; }
        .info { color: blue; }
        pre { background-color: #f8f8f8; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Liquibase ${params.ACTION.toUpperCase()} Report</h1>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>Changelog:</strong> ${params.CHANGELOG_PATH}</p>
        <p><strong>Action:</strong> ${params.ACTION}</p>
        <p class="success"><strong>Changesets Processed:</strong> ${env.CHANGESET_COUNT}</p>
    </div>
    <div class="content">
        <h2>Execution Summary</h2>
        <p class="success">✅ Liquibase ${params.ACTION} completed successfully!</p>
        <p class="info">📊 Total changesets processed: ${env.CHANGESET_COUNT}</p>
    </div>
</body>
</html>
EOF
                    """
                    
                    echo "✅ Summary report generated: ${reportName}"
                    
                    // List all generated files
                    sh "echo '📁 Generated reports:' && ls -la liquibase-reports/"
                }
            }
        }
    }

    post {
        always {
            script {
                // Archive all reports
                if (fileExists('liquibase-reports')) {
                    echo "📁 Archiving Liquibase reports..."
                    archiveArtifacts artifacts: 'liquibase-reports/**/*', allowEmptyArchive: true, fingerprint: true
                    
                    // List archived files
                    sh "find liquibase-reports -type f"
                }
                
                // Prepare Teams notification
                def status = currentBuild.result ?: 'SUCCESS'
                def statusIcon = status == 'SUCCESS' ? '✅' : '❌'
                def changelogFile = params.CHANGELOG_PATH.split('/').last()
                
                // Build the HTML report URL for Jenkins artifacts
                def htmlReportUrl = ""
                if (env.REPORT_GENERATED == 'true') {
                    htmlReportUrl = "${env.BUILD_URL}artifact/liquibase-reports/"
                }
                
                // Create Teams message
                def teamsMessage = [
                    "@type": "MessageCard",
                    "@context": "http://schema.org/extensions",
                    "themeColor": status == 'SUCCESS' ? "00FF00" : "FF0000",
                    "summary": "Liquibase ${params.ACTION.toUpperCase()} Report",
                    "sections": [
                        [
                            "activityTitle": "${statusIcon} Liquibase ${params.ACTION.toUpperCase()} Report",
                            "activitySubtitle": "MongoDB Database Deployment",
                            "facts": [
                                ["name": "File", "value": changelogFile],
                                ["name": "Changesets", "value": env.CHANGESET_COUNT ?: "0"],
                                ["name": "Action", "value": params.ACTION.toUpperCase()],
                                ["name": "Status", "value": status]
                            ],
                            "markdown": true
                        ]
                    ]
                ]
                
                // Add View Details button if HTML report was generated
                if (htmlReportUrl) {
                    teamsMessage.potentialAction = [
                        [
                            "@type": "OpenUri",
                            "name": "View Details",
                            "targets": [
                                ["os": "default", "uri": htmlReportUrl]
                            ]
                        ]
                    ]
                }
                
                // Send Teams notification
                sh """
                    curl -H 'Content-Type: application/json' \\
                         -d '${groovy.json.JsonBuilder(teamsMessage).toString()}' \\
                         '${env.TEAMS_WEBHOOK_URL}'
                """
                
                echo "📢 Teams notification sent with HTML report link: ${htmlReportUrl}"
            }
        }
    }
}

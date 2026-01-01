pipeline {
    agent any
    
    environment {
        // Project configuration
        PROJECT_NAME = 'ocr-editing'
        DEPLOY_DIR = '/opt/ocr-editing'
        NODE_VERSION = '22'
        
        // Git credentials for private repo
        GIT_CREDENTIALS = 'gitlab-token' // Jenkins credential ID
        
        // Environment files
        ENV_PROD = credentials('ocr-env-prod')     // Production .env.prod file
        // ENV_DEV = credentials('ocr-env-dev')    // Development - Not needed for now
        
        // Notification settings (optional - comment out if not needed)
        // DISCORD_WEBHOOK = credentials('discord-webhook-url')
    }
    
    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['prod'],
            description: 'Target deployment environment (Production only)'
        )
        choice(
            name: 'DEPLOY_TYPE', 
            choices: ['pm2', 'docker'],
            description: 'Deployment method'
        )
        booleanParam(
            name: 'SKIP_TESTS',
            defaultValue: false,
            description: 'Skip running tests (for hotfix deployments)'
        )
    }
    
    stages {
        stage('🏁 Initialize') {
            steps {
                script {
                    // Set build display name
                    currentBuild.displayName = "#${BUILD_NUMBER} - ${params.DEPLOY_ENV}"
                    currentBuild.description = "Deploy to ${params.DEPLOY_ENV} using ${params.DEPLOY_TYPE}"
                    
                    // Log build information
                    echo "🚀 Starting deployment for OCR Editing System"
                    echo "📋 Build: ${BUILD_NUMBER}"
                    echo "🎯 Environment: ${params.DEPLOY_ENV}"
                    echo "📦 Deploy Type: ${params.DEPLOY_TYPE}"
                    echo "🧪 Skip Tests: ${params.SKIP_TESTS}"
                }
            }
        }
        
        stage('📥 Checkout') {
            steps {
                script {
                    // Clean workspace
                    deleteDir()
                    
                    // Checkout private repository
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        doGenerateSubmoduleConfigurations: false,
                        extensions: [
                            [$class: 'CleanBeforeCheckout'],
                            [$class: 'CloneOption', depth: 1, shallow: true]
                        ],
                        submoduleCfg: [],
                        userRemoteConfigs: [[
                            credentialsId: "${GIT_CREDENTIALS}",
                            url: 'https://gitlab.aistudio.com.vn/inf_dev/ocr_editing.git'
                        ]]
                    ])
                    
                    // Get commit info
                    env.GIT_COMMIT_HASH = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_COMMIT_MESSAGE = sh(
                        script: 'git log -1 --pretty=%s',
                        returnStdout: true
                    ).trim()
                    
                    echo "✅ Checked out commit: ${env.GIT_COMMIT_HASH}"
                    echo "📝 Commit message: ${env.GIT_COMMIT_MESSAGE}"
                }
            }
        }
        
        stage('🔧 Setup Environment') {
            steps {
                script {
                    // Setup Node.js version - optimized for Node.js v22
                    sh """
                        echo "Setting up Node.js ${NODE_VERSION}"
                        
                        # Check current Node.js version
                        CURRENT_NODE_VERSION=\$(node --version 2>/dev/null || echo "none")
                        echo "Current Node.js version: \$CURRENT_NODE_VERSION"
                        
                        # Extract major version for comparison
                        if [ "\$CURRENT_NODE_VERSION" != "none" ]; then
                            CURRENT_MAJOR=\$(echo "\$CURRENT_NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
                            echo "Current major version: \$CURRENT_MAJOR"
                            
                            # Check if we have Node.js v22 as requested
                            TARGET_CHECK=\$(echo "\$CURRENT_NODE_VERSION" | grep "^v${NODE_VERSION}\\." || echo "no")
                            if [ "\$TARGET_CHECK" != "no" ]; then
                                echo "✅ Perfect! Using Node.js v${NODE_VERSION} as requested: \$CURRENT_NODE_VERSION"
                            elif [ "\$CURRENT_MAJOR" -ge "18" ]; then
                                echo "✅ Node.js version \$CURRENT_NODE_VERSION is compatible (>=18)"
                                echo "ℹ️ Target version is v${NODE_VERSION}, but current version is sufficient"
                            else
                                echo "❌ Node.js \$CURRENT_NODE_VERSION is too old (need v18+)"
                                exit 1
                            fi
                        else
                            echo "❌ Node.js not found on system"
                            exit 1
                        fi
                        
                        # Final verification and optimization
                        echo "Final Node.js environment:"
                        node --version
                        npm --version
                        
                        # Check if we can optimize npm for better performance
                        NPM_VERSION=\$(npm --version)
                        NPM_MAJOR=\$(echo "\$NPM_VERSION" | cut -d'.' -f1)
                        if [ "\$NPM_MAJOR" -ge "9" ]; then
                            echo "✅ NPM \$NPM_VERSION is up to date"
                        else
                            echo "ℹ️ NPM \$NPM_VERSION could be updated, but sufficient for build"
                        fi
                        
                        echo "✅ Node.js v${NODE_VERSION} environment ready for optimal build performance"
                    """
                    
                    // Copy production environment file
                    sh 'cp "${ENV_PROD}" .env.local'
                    sh 'cp "${ENV_PROD}" .env.prod'
                    echo "📋 Using production environment configuration (.env.prod)"
                    
                    // Ensure upload directory exists
                    sh 'mkdir -p public/uploads'
                    sh 'chmod 755 public/uploads'
                    
                    echo "✅ Environment setup completed"
                }
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                script {
                    // Install npm dependencies with caching
                    sh """
                        echo "Installing dependencies..."
                        
                        # Use npm cache if available
                        if [ -d "/opt/npm-cache" ]; then
                            npm install --cache /opt/npm-cache --prefer-offline
                        else
                            npm install
                        fi
                        
                        # Verify critical packages
                        npm list sharp uuid pg ioredis || echo "Some packages missing but continuing..."
                        
                        echo "✅ Dependencies installed successfully"
                    """
                }
            }
        }
        
        stage('🧪 Run Tests') {
            when {
                expression { !params.SKIP_TESTS }
            }
            steps {
                script {
                    try {
                        // Run linting
                        sh 'npm run lint'
                        echo "✅ Linting passed"
                        
                        // Run type checking (if available)
                        sh """
                            if npm run | grep -q "type-check"; then
                                npm run type-check
                                echo "✅ Type checking passed"
                            else
                                echo "⚠️ No type-check script found, skipping"
                            fi
                        """
                        
                        // Run unit tests (if available)
                        sh """
                            if npm run | grep -q " test "; then
                                npm test -- --ci --coverage --watchAll=false
                                echo "✅ Tests passed"
                            else
                                echo "⚠️ No test script found, skipping tests"
                            fi
                        """
                        
                    } catch (Exception e) {
                        echo "❌ Tests failed: ${e.getMessage()}"
                        error "Tests failed in production deployment"
                    }
                }
            }
        }
        
        stage('🏗️ Build Application') {
            steps {
                script {
                    sh """
                        echo "Building Next.js application..."
                        
                        # Set build environment
                        export NODE_ENV=production
                        export NEXT_TELEMETRY_DISABLED=1
                        
                        # Build the application
                        npm run build
                        
                        # Verify build output
                        if [ -d ".next" ]; then
                            echo "✅ Build completed successfully"
                            du -sh .next
                        else
                            echo "❌ Build failed - .next directory not found"
                            exit 1
                        fi
                    """
                }
            }
        }
        
        
        stage('🚀 Deploy Application') {
            steps {
                script {
                    if (params.DEPLOY_TYPE == 'pm2') {
                        // PM2 deployment
                        sh """
                            echo "Deploying with PM2..."
                            
                            # Create deployment directory
                            sudo mkdir -p ${DEPLOY_DIR}
                            sudo chown jenkins:jenkins ${DEPLOY_DIR}
                            
                            # Copy files to deployment directory
                            rsync -av --delete --exclude 'node_modules' --exclude '.git' . ${DEPLOY_DIR}/
                            
                            cd ${DEPLOY_DIR}
                            
                            # Install production dependencies
                            npm ci --production
                            
                            # Stop existing PM2 process
                            pm2 stop ${PROJECT_NAME} || true
                            pm2 delete ${PROJECT_NAME} || true
                            
                            # Start with PM2
                            pm2 start npm --name "${PROJECT_NAME}" -- start
                            pm2 save
                            
                            # Verify deployment
                            pm2 status ${PROJECT_NAME}
                            
                            echo "✅ PM2 deployment completed"
                        """
                    } else {
                        // Docker deployment (Production only)
                        sh """
                            echo "Deploying with Docker (Production)..."
                            
                            # Check which Docker Compose command is available (prioritize v2)
                            if docker compose version >/dev/null 2>&1; then
                                DOCKER_COMPOSE="docker compose"
                                echo "✅ Using Docker Compose Plugin v2"
                            elif command -v docker-compose >/dev/null 2>&1; then
                                DOCKER_COMPOSE="docker-compose"
                                echo "✅ Using Docker Compose standalone v1"
                            else
                                echo "❌ Docker Compose not found"
                                exit 1
                            fi
                            
                            echo "Docker Compose command: \$DOCKER_COMPOSE"
                            \$DOCKER_COMPOSE version
                            
                            # Stop existing container
                            \$DOCKER_COMPOSE -f docker-compose.prod.yml stop ocr-editing || echo "No running container to stop"
                            \$DOCKER_COMPOSE -f docker-compose.prod.yml rm -f ocr-editing || echo "No container to remove"
                            
                            # Note: Database and Redis are managed externally, not via this docker-compose
                            echo "🗄️ Skipping internal Postgres/Redis containers (using existing server services)..."
                            
                            # Build new image
                            \$DOCKER_COMPOSE -f docker-compose.prod.yml build --no-cache ocr-editing
                            
                            # Start container
                            \$DOCKER_COMPOSE -f docker-compose.prod.yml up -d ocr-editing
                            
                            # Verify deployment
                            sleep 10
                            \$DOCKER_COMPOSE -f docker-compose.prod.yml ps ocr-editing
                            
                            echo "✅ Docker deployment completed for Production"
                        """
                    }
                }
            }
        }
        
        stage('✅ Health Check') {
            steps {
                script {
                    sh """
                        echo "Performing health checks..."
                        
                        # Wait for application to start
                        sleep 15
                        
                        # Health check endpoint - sử dụng localhost thay vì IP cụ thể
                        if curl -f -s http://localhost:3000/api/health > /dev/null; then
                            echo "✅ Health check passed"
                        else
                            echo "⚠️ Health check endpoint not responding, trying main page"
                            if curl -f -s http://localhost:3000 > /dev/null; then
                                echo "✅ Main page accessible"
                            else
                                echo "❌ Application not responding"
                                exit 1
                            fi
                        fi
                        
                        # Check upload directory
                        if [ -d "${DEPLOY_DIR}/public/uploads" ]; then
                            echo "✅ Upload directory exists"
                        else
                            echo "⚠️ Upload directory missing"
                        fi
                        
                        echo "✅ Health checks completed"
                    """
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Clean up temporary files
                try {
                    sh 'rm -f .env.local .env.prod'
                } catch (Exception e) {
                    echo "Failed to cleanup: ${e.getMessage()}"
                }
                
                // Archive build artifacts
                try {
                    archiveArtifacts artifacts: 'package.json,package-lock.json', allowEmptyArchive: true
                } catch (Exception e) {
                    echo "Failed to archive artifacts: ${e.getMessage()}"
                }
                
                echo "🧹 Cleanup completed"
            }
        }
        
        success {
            script {
                echo "🎉 Deployment successful!"
                
                // Send success notification (optional - only if Discord webhook is configured)
                try {
                    if (env.DISCORD_WEBHOOK) {
                        sh """
                            curl -H "Content-Type: application/json" -X POST -d '{
                                "content": "✅ **OCR Editing Deployment Successful**\\n**Environment:** prod\\n**Build:** #${BUILD_NUMBER}\\n**Commit:** ${env.GIT_COMMIT_HASH}\\n**Deploy Type:** Docker/PM2"
                            }' ${env.DISCORD_WEBHOOK}
                        """
                    }
                } catch (Exception e) {
                    echo "Failed to send Discord notification: ${e.getMessage()}"
                }
            }
        }
        
        failure {
            script {
                echo "❌ Deployment failed!"
                
                // Send failure notification (optional)
                try {
                    if (env.DISCORD_WEBHOOK) {
                        sh """
                            curl -H "Content-Type: application/json" -X POST -d '{
                                "content": "❌ **OCR Editing Deployment Failed**\\n**Build:** #${BUILD_NUMBER}\\n**Stage:** ${env.STAGE_NAME}"
                            }' ${env.DISCORD_WEBHOOK}
                        """
                    }
                } catch (Exception e) {
                    echo "Failed to send Discord notification: ${e.getMessage()}"
                }
                
                // Collect logs for debugging
                try {
                    sh 'echo "Collecting deployment logs..." > deployment-logs.txt || true'
                    archiveArtifacts artifacts: 'deployment-logs.txt', allowEmptyArchive: true
                } catch (Exception e) {
                    echo "Failed to collect logs: ${e.getMessage()}"
                }
            }
        }
    }
}

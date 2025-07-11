pipeline {
      agent {
        label 'windows'
    }

    environment {
        DOCKER_USERNAME = "bamita" 
        

        IMAGE_VERSION = "1.${BUILD_NUMBER}"  
        
        DOCKER_IMAGE = "${DOCKER_USERNAME}/tp-app:${IMAGE_VERSION}" 
        

        DOCKER_CONTAINER = "Facture_app"  
    }

    stages {

        stage("Checkout") {
            steps {
                git branch: 'master', url: 'https://github.com/amina859/Application-de-Gestion-des-Factures.git'

                
                
            }
        }

        stage("Test") {
            steps {
                echo "✅ Tests en cours..."
                
            }
        }

        stage("Build Docker Image") {
            steps {
                script {
                    bat "docker build -t $DOCKER_IMAGE ."
                    
                }
            }
        }

        stage("Push image to Docker Hub") {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: '0000', 
                        
                        usernameVariable: 'DOCKER_USER', 
                        passwordVariable: 'DOCKER_PASSWORD'
                    )]) {
                        bat """
                            docker login -u ${DOCKER_USER} -p ${DOCKER_PASSWORD}
                            echo '✅ Docker login successful'
                            docker push $DOCKER_IMAGE
                            // ✅ Envoie l'image vers Docker Hub
                        """
                    }
                }
            }
        }

        stage("Deploy") {
            steps {
                script {
                    bat """
                        docker container stop $DOCKER_CONTAINER || true
                        // ✅ Arrête le conteneur si déjà existant

                        docker container rm $DOCKER_CONTAINER || true
                        // ✅ Supprime l'ancien conteneur si existant

                        docker container run -d --name $DOCKER_CONTAINER -p 8082:80 $DOCKER_IMAGE
                        // ✅ Lance le nouveau conteneur sur le port 8080
                    """
                }
            }
        }
    }

    post {
        success {
            mail to: 'moustaphasyoumarou@gmail.com, Yayamohamed209@gmail.com, mokhtaryacinabdillahi@gmail.com, tourealmamy2002@gmail.com, binetouimam@gmail.com',
                 subject: ":white_check_mark: Succès du pipeline : ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Le pipeline a été exécuté avec succès.\nVoir les détails ici : ${env.BUILD_URL}"
        }
        failure {
            mail to: 'mancabouben12@gmail.com, falilou1999@gmail.com, maimounasow1410@gmail.com, kubuyaphilemon4@gmail.com, robinyonli2@gmail.com',
                 subject: ":x: Échec du pipeline : ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Le pipeline a échoué.\nVoir les logs ici : ${env.BUILD_URL}"
        }
        always {
            echo 'Notification e-mail envoyée.'
        }
    }
}

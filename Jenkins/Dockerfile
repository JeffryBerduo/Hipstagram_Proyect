FROM jenkins/jenkins:lts
USER root
RUN apt-get update && apt-get install -y docker.io git curl
USER jenkins
RUN jenkins-plugin-cli --plugins \
    git \
    docker-workflow \
    docker-plugin \
    workflow-aggregator \
    credentials-binding \
    pipeline-stage-view \
    sonar \
    nodejs \
    pipeline-utility-steps
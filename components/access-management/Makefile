REGISTRY_PROJECT ?= kubeflow-dev
PROJECT ?= kubeflow-dev
GO_SWAGGER_URL ?= https://github.com/go-swagger/go-swagger/releases/download/v0.21.0/swagger_linux_amd64

GIT_VERSION := $(shell git describe --tags --always --dirty)

IMG ?= registry.aigoml.aigodev.com/kubeflow/dashboard/access-management
TAG ?= v1.10.0-1.0.2
ARCH ?= linux/amd64
generate-go-client: bin/swagger
	bin/swagger generate client -f api/swagger.yaml -t api/go_client

bin/swagger:
	mkdir -p bin
	wget -O bin/swagger '$(GO_SWAGGER_URL)'
	chmod +x bin/swagger

docker-build:
	docker build -t $(IMG):$(TAG) .

docker-push: 
	docker push $(IMG):$(TAG)

.PHONY: docker-build-multi-arch
docker-build-multi-arch: ##  Build multi-arch docker images with docker buildx
	docker buildx build --load --platform ${ARCH} --tag ${IMG}:${TAG} .

.PHONY: docker-build-push-multi-arch
docker-build-push-multi-arch: ## Build multi-arch docker images with docker buildx and push to docker registry 
	docker buildx build --platform ${ARCH} --tag ${IMG}:${TAG} --push .

image: docker-build docker-push 
.PHONY: build test run clean docker lint

# Variables
BINARY_NAME = signaling-server
GO = go
GOFLAGS = -ldflags="-s -w"

# Build
build:
	$(GO) build $(GOFLAGS) -o $(BINARY_NAME) .

# Build for production
build-prod:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GO) build $(GOFLAGS) -o $(BINARY_NAME) .

# Run
run:
	$(GO) run . -verbose

# Test
test:
	$(GO) test -v -race -cover ./...

# Clean
clean:
	rm -f $(BINARY_NAME)
	$(GO) clean

# Lint
lint:
	golangci-lint run

# Docker build
docker:
	docker build -t liberty-reach/signaling:latest .

# Docker run
docker-run:
	docker run -p 8080:8080 liberty-reach/signaling:latest

# Dependencies
deps:
	$(GO) mod download
	$(GO) mod tidy

# Generate
generate:
	$(GO) generate ./...

# All
all: deps lint test build

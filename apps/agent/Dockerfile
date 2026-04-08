FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/devcon-agent ./cmd/agent

FROM docker:27-cli

WORKDIR /app

COPY --from=builder /out/devcon-agent /usr/local/bin/devcon-agent

EXPOSE 8080

ENTRYPOINT ["devcon-agent"]
CMD ["server"]

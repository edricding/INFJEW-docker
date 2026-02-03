FROM golang:1.22-alpine AS builder

ARG GOPROXY=https://proxy.golang.org,direct
ENV GOPROXY=$GOPROXY

WORKDIR /app

RUN apk add --no-cache ca-certificates

# Cache deps when possible.
COPY go.mod ./
COPY backend ./backend

# Ensure go.sum is generated inside the build context.
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -mod=mod -o /out/backend ./backend

FROM alpine:3.20

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=builder /out/backend ./backend

USER app
EXPOSE 8080

CMD ["./backend"]
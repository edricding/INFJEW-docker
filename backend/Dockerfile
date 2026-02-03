FROM golang:1.22-alpine AS builder

WORKDIR /app

# Cache deps when possible.
COPY go.mod ./
COPY backend ./backend

RUN CGO_ENABLED=0 GOOS=linux go build -o /out/backend ./backend

FROM alpine:3.20

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app
COPY --from=builder /out/backend ./backend

USER app
EXPOSE 8080

CMD ["./backend"]

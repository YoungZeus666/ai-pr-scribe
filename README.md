# ai-pr-scribe

> A GitHub App built with [Probot](https://github.com/probot/probot) that AI-powered Pull Request description generator

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t ai-pr-scribe .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> ai-pr-scribe
```

## Contributing

If you have suggestions for how ai-pr-scribe could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2026 YoungZeus666

# ai-pr-scribe

> A GitHub App built with [Probot](https://github.com/probot/probot) that AI-powered Pull Request description generator

## Setup

1. Install dependencies:

```sh
npm install
```

2. Create a `.env` file with your app and model settings:

```dotenv
APP_ID=
WEBHOOK_SECRET=development
PRIVATE_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=gpt-4.1-mini
```

3. Run the bot:

```sh
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


# OpenAI-Compatible Config Design

## Goal

Refactor the PR description generator so the OpenAI-compatible API settings are read from environment variables instead of being hardcoded for DeepSeek.

## Scope

In scope:
- Replace the current DeepSeek-specific environment variable names
- Read API key, base URL, and model from `OPENAI_`-prefixed environment variables
- Default the model to `gpt-4.1-mini`
- Allow the OpenAI SDK to use its default base URL when `OPENAI_BASE_URL` is not set
- Update tests to validate the new configuration behavior
- Update `.env.example` to document the new variables

Out of scope:
- Changing the prompt format
- Changing the PR event handling behavior
- Changing comment formatting
- Supporting multiple config prefixes at the same time

## Current Context

The current implementation already uses the `openai` SDK, but the runtime configuration is still tied to DeepSeek:
- `DEEPSEEK_API_KEY`
- `https://api.deepseek.com`
- `deepseek-chat`

The test suite is also tied to DeepSeek by mocking the DeepSeek endpoint and asserting the DeepSeek model name.

## Recommended Approach

Keep the existing structure in `index.js`, but rename the configuration layer so it is provider-neutral while still using `OPENAI_` environment variables:
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

Recommended defaults:
- `OPENAI_MODEL`: `gpt-4.1-mini`
- `OPENAI_BASE_URL`: unset by default so the SDK uses the official OpenAI endpoint

This keeps the current code shape intact while making the app work with any OpenAI-compatible provider that exposes a compatible chat completions API.

## Configuration Rules

1. `OPENAI_API_KEY` is required
2. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`
3. `OPENAI_BASE_URL` is optional
4. If `OPENAI_BASE_URL` is empty or missing, the client should be created without a `baseURL` override

The implementation should not keep fallback support for `DEEPSEEK_API_KEY` because the requested direction is to fully standardize on `OPENAI_` naming.

## Implementation Shape

The current `createDeepSeekClient()` helper should become a provider-neutral helper such as `createOpenAIClient()` or `createLlmClient()`.

The helper should:
- read `OPENAI_API_KEY`
- optionally include `baseURL` only when `OPENAI_BASE_URL` is present

The request generation helper should:
- read `OPENAI_MODEL`
- fall back to `gpt-4.1-mini`

The log messages should no longer mention DeepSeek. They should instead refer to missing OpenAI configuration or generic PR description generation failures.

## Testing Changes

The existing PR webhook integration test should be updated to use:
- `OPENAI_API_KEY=test-openai-key`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_MODEL=gpt-4.1-mini`

The mocked LLM endpoint should move from:
- `https://api.deepseek.com/chat/completions`

to:
- `https://api.openai.com/v1/chat/completions`

The assertions should validate:
- the request uses `gpt-4.1-mini`
- the request still contains the constructed diff summary
- the PR comment is still created successfully

## Error Handling

The webhook should continue to fail softly:
- if `OPENAI_API_KEY` is missing, log and return
- if the LLM call fails, log and return
- if the LLM returns empty content, warn and return
- if posting the PR comment fails, log the error

These behaviors stay the same; only the configuration source becomes generalized.

## Success Criteria

The change is complete when:
- no DeepSeek-specific config names remain in runtime code
- the client can use OpenAI defaults when `OPENAI_BASE_URL` is unset
- the model defaults to `gpt-4.1-mini`
- `.env.example` documents `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL`
- tests pass with the updated OpenAI-compatible configuration

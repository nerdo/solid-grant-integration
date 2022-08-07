# Integration of [simov/grant](https://github.com/simov/grant) with SolidStart

Powered by [`solid-start`](https://github.com/ryansolid/solid-start/tree/master/packages/solid-start) and using [simov/grant](https://github.com/simov/grant) to adapt the authentication example to work with GitHub... but with so many services supported by [simov/grant](https://github.com/simov/grant), the sky is the limit!

## Configuration

- Create a test GitHub application under your account here: https://github.com/settings/developers, generate a secret key for your app, and make a note of the client ID.
- Copy `.env.example` to `.env` and edit any values you find there.

### Advanced Configuration

Visit [simov/grant](https://github.com/simov/grant) to learn how to tinker with the configuration and use different services.

The default configs are provided inline at `src/routes/connect/[provider].ts`.

You could choose to change the defaults inline or dynamically `import()` them from somewhere external (json? some API? who knows? ... well, you should lol).

Once you've got all your default oauth settings here, secrets like app client IDs and secret tokens should be imported from environment variables for a secure, deployable configuration.

## Developing

Install dependencies with your package manager of choice `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Notes

This is a proof-of-concept and built on an alpha version of Solid Start.

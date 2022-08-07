# Integration of [simov/grant](https://github.com/simov/grant) with SolidStart

Powered by [`solid-start`](https://github.com/ryansolid/solid-start/tree/master/packages/solid-start) and using [simov/grant](https://github.com/simov/grant) to adapt the authentication example to work with GitHub... but with so many services supported by [simov/grant](https://github.com/simov/grant), the sky is the limit!

## Configuration

- Create a test GitHub application under your account here: https://github.com/settings/developers, generate a secret key for your app, and make a note of the client ID.
- Copy `src/config/oauth.example.ts` to `src/config/oauth.ts` and edit the values you find there. Initially, it's best to just edit the key (client ID) and secret keys to test it out, but by all means, visit [simov/grant](https://github.com/simov/grant) to learn how to tinker with the configuration and use different services.
- Copy `.env.example` to `.env` and edit any values you find there.

## Developing

Installed dependencies with your package manager of choice `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Notes

This is a proof-of-concept and built on an alpha version of Solid Start.

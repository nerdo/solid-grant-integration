import {
  useParams,
  useRouteData,
} from '@solidjs/router'
import {
  createEffect,
  createSignal,
  Match,
  Show,
  Switch,
} from 'solid-js'
import { FormError } from 'solid-start/data'
import {
  createServerAction,
  createServerData,
  redirect,
} from 'solid-start/server'
import { db } from '~/db'
import { createUserSession, getUser, login, register } from '~/db/session'

// definitely NOT fully typed... just a quick and dirty
// conversion from a sample response to test TS in this
interface GitHubUserResponse {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: 'User'
  site_admin: boolean
  name: string
  company?: string
  blog: string
  location?: string
  email?: string
  hireable?: boolean
  bio?: string
  twitter_username?: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
  private_gists: number
  total_private_repos: number
  owned_private_repos: number
  disk_usage: number
  collaborators: number
  two_factor_authentication: boolean
  plan: {
    name: 'free'
    space: number
    collaborators: number
    private_repos: number
  }
}

function validateUsername(username: unknown) {
  if (typeof username !== 'string' || username.length < 3) {
    return `Usernames must be at least 3 characters long`
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== 'string' || password.length < 6) {
    return `Passwords must be at least 6 characters long`
  }
}

const getQueryParams = (url: string) => {
  const [, search] = url.split('?', 2)
  const urlSearchParams = new URLSearchParams(search)
  const q: Record<string, any> = {}
  for (const [key, value] of urlSearchParams.entries()) {
    q[key] = value
  }
  return q
}

const fetchGitHubUser = async (accessToken: string) => {
  const response = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${accessToken}` },
  })
  return (await response.json()) as GitHubUserResponse
}

const loginGitHubUser = async (username: string, metadata?: Record<string, any>) => {
  const userExists = await db.user.findUnique({ where: { username } })
  const user = userExists
    ? userExists
    : await register({
        username,
        password: 'how now brown cow pass word bird chow',
      }, metadata)
  return await createUserSession(`${user.id}`, '/')
}

export function routeData() {
  return createServerData(async (_, { request }) => {
    if (await getUser(request)) {
      throw redirect('/')
    }
    return {}
  })
}

export default function Login() {
  const data = useRouteData<typeof routeData>()
  const params = useParams()
  const [authSource, setAuthSource] = createSignal<'github' | 'password'>(
    'github'
  )
  const [grantError, setGrantError] = createSignal<{
    message: string
    description?: string
    uri?: string
  }>()

  const [queryParams, setQueryParams] = createSignal<Record<string, any>>()

  const ghLoginAction = createServerAction(async (form: FormData) => {
    const ghat = form.get('ghat')
    if (typeof ghat !== 'string') {
      throw new FormError('Invalid Login!')
    }

    const gh = await fetchGitHubUser(ghat)
    if (!gh || !gh.login) {
      throw new FormError('Invalid Login!')
    }

    return await loginGitHubUser(gh.login, gh)
  })

  createEffect(async () => {
    if (!location.search) return
    const q = getQueryParams(location.search)
    if (q.access_token) {
      const form = new FormData()
      form.set('ghat', q.access_token)
      await ghLoginAction.submit(form)
    }
    setQueryParams(q)
  })

  createEffect(() => {
    const q = queryParams()
    if (!q) return

    if (q.error) {
      setGrantError({
        message: q.error,
        description: q.error_description,
        uri: q.error_uri,
      })
    }
  })

  // hmm, do we need an option to force a msr style redirect?
  // should solid just know that this endpoint is an api endpoint?
  // navigate() doesn't work...
  // const navigate = useNavigate()
  // const startGithubLogin = () => navigate('/connect/github')
  const startGithubLogin = () => (window.location.href = '/connect/github')

  const loginAction = createServerAction(async (form: FormData) => {
    const loginType = form.get('loginType')
    const username = form.get('username')
    const password = form.get('password')
    const redirectTo = form.get('redirectTo') || '/'
    if (
      typeof loginType !== 'string' ||
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof redirectTo !== 'string'
    ) {
      throw new FormError(`Form not submitted correctly.`)
    }

    const fields = { loginType, username, password }
    const fieldErrors = {
      username: validateUsername(username),
      password: validatePassword(password),
    }
    if (Object.values(fieldErrors).some(Boolean)) {
      throw new FormError('Fields invalid', { fieldErrors, fields })
    }

    switch (loginType) {
      case 'login': {
        const user = await login({ username, password })
        if (!user) {
          throw new FormError(`Username/Password combination is incorrect`, {
            fields,
          })
        }
        return createUserSession(`${user.id}`, redirectTo)
      }
      case 'register': {
        const userExists = await db.user.findUnique({ where: { username } })
        if (userExists) {
          throw new FormError(`User with username ${username} already exists`, {
            fields,
          })
        }
        const user = await register({ username, password })
        if (!user) {
          throw new FormError(
            `Something went wrong trying to create a new user.`,
            {
              fields,
            }
          )
        }
        return createUserSession(`${user.id}`, redirectTo)
      }
      default: {
        throw new FormError(`Login type invalid`, { fields })
      }
    }
  })

  return (
    <div class="p-4">
      <div data-light="">
        <main class="p-6 mx-auto w-[fit-content] flex flex-col justify-content-center space-y-4 rounded-lg bg-gray-100">
          <Show when={grantError()}>
            {(error) => (
              <div class="flex flex-col p-10 bg-red-500 text-red-50 rounded-md">
                <div class="text-lg font-bold text-white">{error.message}</div>
                <Show when={error.description}>
                  <div>{error.description}</div>
                </Show>
                <Show when={error.uri}>
                  <div class="bg-red-600 mt-5 rounded-md">
                    <a
                      class="inline-block text-center w-full"
                      target="_blank"
                      href={error.uri}
                    >
                      click for more details...
                    </a>
                  </div>
                </Show>
              </div>
            )}
          </Show>

          <h1 class="font-bold text-xl">Login</h1>
          <div class="flex">
            <div class="w-1/2">
              <button
                onClick={() => setAuthSource('github')}
                disabled={authSource() === 'github'}
                class="w-full rounded-t-lg border-b-4 border-indigo-400 text-indigo-400 disabled:(text-indigo-100 border-indigo-300 hover:cursor-default bg-indigo-500) transition ease-in-out duration-200"
              >
                GitHub
              </button>
            </div>
            <div class="w-1/2">
              <button
                onClick={() => setAuthSource('password')}
                disabled={authSource() === 'password'}
                class="w-full rounded-t-lg border-b-4 border-indigo-400 text-indigo-400 disabled:(text-indigo-100 border-indigo-300 hover:cursor-default bg-indigo-500) transition ease-in-out duration-200"
              >
                Password
              </button>
            </div>
          </div>
          <Switch>
            <Match when={authSource() === 'password'}>
              <loginAction.Form method="post" class="flex flex-col space-y-2">
                <input
                  type="hidden"
                  name="redirectTo"
                  value={params.redirectTo ?? '/'}
                />
                <fieldset class="flex flex-row">
                  <legend class="sr-only">Login or Register?</legend>
                  <label class="w-full">
                    <input
                      type="radio"
                      name="loginType"
                      value="login"
                      checked={true}
                    />{' '}
                    Login
                  </label>
                  <label class="w-full">
                    <input type="radio" name="loginType" value="register" />{' '}
                    Register
                  </label>
                </fieldset>
                <div>
                  <label for="username-input">Username</label>
                  <input
                    name="username"
                    placeholder="kody"
                    class="border-gray-700 border-2 ml-2 rounded-md px-2"
                  />
                  <Show when={loginAction.error?.fieldErrors?.username}>
                    <p class="text-red-400" role="alert">
                      {loginAction.error.fieldErrors.username}
                    </p>
                  </Show>
                </div>
                <div>
                  <label for="password-input">Password</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="twixrox"
                    class="border-gray-700 border-2 ml-2 rounded-md px-2"
                  />
                  <Show when={loginAction.error?.fieldErrors?.password}>
                    <p class="text-red-400" role="alert">
                      {loginAction.error.fieldErrors.password}
                    </p>
                  </Show>
                </div>
                <Show when={loginAction.error}>
                  <p class="text-red-400" role="alert" id="error-message">
                    {loginAction.error.message}
                  </p>
                </Show>
                <button
                  class="focus:bg-white hover:bg-white bg-gray-300 rounded-md px-2"
                  type="submit"
                >
                  {data() ? 'Login' : ''}
                </button>
              </loginAction.Form>
            </Match>
            <Match when={authSource() === 'github'}>
              <ghLoginAction.Form method="post">
                <input
                  type="hidden"
                  name="redirectTo"
                  value={params.redirectTo ?? '/'}
                />
                <div class="min-w-64 mx-auto max-w-70 min-h-24">
                  <img
                    src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                    alt="GitHub"
                    class="w-full cursor-pointer"
                    onClick={() => startGithubLogin()}
                  />
                  <button
                    class="w-full focus:bg-white hover:bg-white bg-gray-300 rounded-b-md px-2"
                    type="submit"
                    onClick={() => startGithubLogin()}
                  >
                    {data() ? 'Login' : ''}
                  </button>
                  <Show when={ghLoginAction.error}>
                    <p class="text-red-400" role="alert" id="error-message">
                      {ghLoginAction.error.message}
                    </p>
                  </Show>
                </div>
              </ghLoginAction.Form>
            </Match>
          </Switch>
        </main>
      </div>
    </div>
  )
}

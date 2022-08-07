import { useRouteData } from '@solidjs/router'
import { Show } from 'solid-js'
import {
  createServerAction,
  createServerData,
  redirect,
} from 'solid-start/server'
import { getUser, logout } from '~/db/session'

export function routeData() {
  return createServerData(async (_, { request }) => {
    const user = await getUser(request)

    if (!user) {
      throw redirect('/login')
    }

    return user
  })
}

export default function Home() {
  const user = useRouteData<typeof routeData>()
  const logoutAction = createServerAction((_, { request }) => logout(request))

  return (
    <main class="w-full p-4 space-y-2">
      <div class='w-full flex items-center'>
        <Show when={user()?.metadata?.avatar_url}>
          {(avatarUrl) => (
            <img
              src={avatarUrl}
              class="rounded-full border-2 border-zinc-800 w-10 h-10 mr-4"
              alt={user().username}
            />
          )}
        </Show>
        <h1 class="font-bold text-3xl">Hello {user()?.username}</h1>
      </div>
      <h3 class="font-bold text-xl">Message board</h3>
      <logoutAction.Form>
        <button name="logout" type="submit">
          Logout
        </button>
      </logoutAction.Form>
    </main>
  )
}

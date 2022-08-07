import {
  Accessor,
  Component,
  createContext,
  createSignal,
  JSX,
  useContext,
} from 'solid-js'

export type GrantData = Record<string, any>

export interface GrantApi {
  get: Accessor<GrantData>
  set: (v: GrantData) => any
}

const [grant, setGrant] = createSignal({})
const GrantContext = createContext<GrantApi>({
  get: grant,
  set: setGrant,
})

export const GrantProvider: Component<{
  grant?: GrantApi
  children: JSX.Element
}> = (p) => {
  const [grant, setGrant] = createSignal(p.grant || {})

  const api = {
    get: grant,
    set: setGrant,
  }

  return <GrantContext.Provider value={api}>{p.children}</GrantContext.Provider>
}

export const useGrant = () => useContext(GrantContext)

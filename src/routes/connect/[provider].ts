import config from "~/config/oauth"
import { makeGrantHandler } from "~/lib/makeGrantHandler";

const { handler, getSession } = makeGrantHandler({ config, debug: false })

// hmmm, not quite right...
export const getGrantSession = getSession

export const get = handler

export const post = handler

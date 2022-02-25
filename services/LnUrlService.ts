import type { LNURLAuthParams } from "js-lnurl"

import { authenticate } from "./lnUrl/auth"
import { getParams } from "js-lnurl"

export type { LNURLAuthParams }

export { authenticate, getParams }

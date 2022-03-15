import type { LNURLAuthParams } from "js-lnurl"

import { authenticate } from "./lnUrl/auth"
import { getTag } from "./lnUrl/helper"
import { getParams } from "js-lnurl"

export type { LNURLAuthParams }

export { authenticate, getParams, getTag }

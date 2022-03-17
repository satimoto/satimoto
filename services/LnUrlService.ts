import type { LNURLAuthParams } from "js-lnurl"

import { authenticate } from "./lnUrl/auth"
import { getTag } from "./lnUrl/helper"
import { identifier } from "./lnUrl/identifier"
import { getParams } from "js-lnurl"

export type { LNURLAuthParams }

export { authenticate, getParams, getTag, identifier }

import type { LNURLAuthParams } from "js-lnurl"

import { authenticate } from "./lnUrl/auth"
import { getMetadataElement, getTag } from "./lnUrl/helper"
import { identifier } from "./lnUrl/identifier"
import { getPayRequest } from "./lnUrl/pay"
import { getParams } from "js-lnurl"

export type { LNURLAuthParams }

export { authenticate, getParams, getPayRequest, getMetadataElement, getTag, identifier }

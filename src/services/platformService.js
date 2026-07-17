import { isRestMode } from '../config/runtime'
import { mockPlatformService } from './mockPlatformService'
import { restPlatformService } from './restPlatformService'

export const platformService = isRestMode ? restPlatformService : mockPlatformService

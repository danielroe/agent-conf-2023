import { NitroConfig } from 'nitropack'
import { UserConfig } from 'vite'

interface AgentConfig {
  nitro?: NitroConfig
  vite?: UserConfig
}

export default {} satisfies AgentConfig

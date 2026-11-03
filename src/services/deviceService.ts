import { mockHandheldDevices, HandheldDevice } from '../mock-data/handheldDevices'

// In-memory mutable store, same pattern as the other services — persists
// registrations for the life of the session (reset on a full page reload),
// never a real backend. Introduced so BarcodeLabels' device registration
// goes through the same service architecture as every other module instead
// of only ever mutating local component state.
let inMemoryDevices: HandheldDevice[] = [...mockHandheldDevices]

export const deviceService = {
  async getDevices(): Promise<HandheldDevice[]> {
    return new Promise(resolve => setTimeout(() => resolve(inMemoryDevices), 300))
  },
  async registerDevice(newDevice: Omit<HandheldDevice, 'id'>): Promise<HandheldDevice> {
    return new Promise(resolve => {
      setTimeout(() => {
        const device: HandheldDevice = { ...newDevice, id: `dev-gen-${Date.now()}` }
        inMemoryDevices = [device, ...inMemoryDevices]
        resolve(device)
      }, 300)
    })
  }
}
export default deviceService

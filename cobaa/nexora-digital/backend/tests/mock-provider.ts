/** Mock provider untuk automated tests — tidak pernah memanggil jaringan. */
import { ProviderOrderResult, ProviderStatusResult, ProviderServicesResult } from '../src/providers/base-provider';

export class MockSuccessProvider {
  readonly code = 'MOCK_OK';
  async getServices(): Promise<ProviderServicesResult> { return { services: [] }; }
  async createOrder(_p: unknown): Promise<ProviderOrderResult> {
    return { ok: true, providerRef: 'MOCK-REF-1', sn: 'SN123', raw: { mock: true } };
  }
  async getOrderStatus(_ref: string): Promise<ProviderStatusResult> { return { status: 'SUCCESS', raw: {} }; }
  async getBalance(): Promise<number | null> { return 100000; }
}

export class MockFailProvider {
  readonly code = 'MOCK_FAIL';
  async createOrder(_p: unknown): Promise<ProviderOrderResult> {
    return { ok: false, raw: { error: 'stock kosong' } };
  }
  async getOrderStatus(): Promise<ProviderStatusResult> { return { status: 'FAILED', raw: {} }; }
}

export class MockTimeoutProvider {
  readonly code = 'MOCK_TIMEOUT';
  async createOrder(): Promise<ProviderOrderResult> {
    throw new Error('ETIMEDOUT');
  }
}

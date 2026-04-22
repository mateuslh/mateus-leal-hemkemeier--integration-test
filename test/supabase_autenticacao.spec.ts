import { StatusCodes } from 'http-status-codes';
import { p, rep, baseUrl } from './supabase_helpers';

describe('Supabase - Autenticação', () => {
  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  it('Rejeitar requisição sem apikey', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders({ 'Content-Type': 'application/json' })
      .withQueryParams({ select: '*' })
      .expectStatus(StatusCodes.UNAUTHORIZED);
  });

  it('Rejeitar requisição com apikey inválida', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders({
        apikey: 'token-invalido',
        Authorization: 'Bearer token-invalido',
        'Content-Type': 'application/json'
      })
      .withQueryParams({ select: '*' })
      .expectStatus(StatusCodes.UNAUTHORIZED);
  });
});

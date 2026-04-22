import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { p, rep, baseUrl, headers, criarCliente, excluirCliente } from './supabase_helpers';

describe('Supabase - Clientes Filtros e Ordenação', () => {
  let clienteId1: number;
  let clienteId2: number;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteId1 = await criarCliente(faker.internet.email(), faker.person.fullName(), 25);
    clienteId2 = await criarCliente(faker.internet.email(), faker.person.fullName(), 40);
  });

  afterAll(async () => {
    try { await excluirCliente(clienteId1); } catch { /* ok */ }
    try { await excluirCliente(clienteId2); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Filtrar clientes com idade >= 18 (gte)', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ idade: 'gte.18', select: '*' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const clientes = ctx.res.body as { idade: number }[];
        clientes.forEach((c) => expect(c.idade).toBeGreaterThanOrEqual(18));
      });
  });

  it('Ordenar clientes por id descendente', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ select: '*', order: 'id.desc' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const ids = (ctx.res.body as { id: number }[]).map((c) => c.id);
        for (let i = 1; i < ids.length; i++) {
          expect(ids[i]).toBeLessThan(ids[i - 1]);
        }
      });
  });

  it('Limitar resultado com limit', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ select: '*', limit: '1' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLength(1);
  });
});

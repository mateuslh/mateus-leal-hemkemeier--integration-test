import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  p, rep, baseUrl, headers,
  criarCliente, excluirCliente, criarPedido, excluirPedido
} from './supabase_helpers';

describe('Supabase - Pedidos Filtros e Ordenação', () => {
  let clienteId: number;
  let pedidoId1: number;
  let pedidoId2: number;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteId = await criarCliente(faker.internet.email(), faker.person.fullName(), 25);
    pedidoId1 = await criarPedido(clienteId, 50.0);
    pedidoId2 = await criarPedido(clienteId, 200.0);
  });

  afterAll(async () => {
    try { await excluirPedido(pedidoId1); } catch { /* ok */ }
    try { await excluirPedido(pedidoId2); } catch { /* ok */ }
    try { await excluirCliente(clienteId); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Filtrar pedidos com valor > 100', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ valor: 'gt.100', select: '*' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const pedidos = ctx.res.body as { valor: number }[];
        pedidos.forEach((ped) => expect(ped.valor).toBeGreaterThan(100));
      });
  });

  it('Ordenar pedidos por valor ascendente', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({
        cliente_id: `eq.${clienteId}`,
        select: '*',
        order: 'valor.asc'
      })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const valores = (ctx.res.body as { valor: number }[]).map((p) => p.valor);
        for (let i = 1; i < valores.length; i++) {
          expect(valores[i]).toBeGreaterThanOrEqual(valores[i - 1]);
        }
      });
  });
});

import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  p, rep, baseUrl, headers,
  criarCliente, excluirCliente, criarPedido, excluirPedido
} from './supabase_helpers';

describe('Supabase - Pedidos CRUD', () => {
  let clienteId: number;
  let clienteId2: number;
  let pedidoId: number;
  let pedidoId2: number;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteId = await criarCliente(faker.internet.email(), faker.person.fullName(), 25);
    clienteId2 = await criarCliente(faker.internet.email(), faker.person.fullName(), 30);
  });

  afterAll(async () => {
    try { await excluirPedido(pedidoId); } catch { /* ok */ }
    try { await excluirPedido(pedidoId2); } catch { /* ok */ }
    try { await excluirCliente(clienteId); } catch { /* ok */ }
    try { await excluirCliente(clienteId2); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Criar pedido válido', async () => {
    pedidoId = await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: clienteId,
        valor: 199.9
      })
      .expectStatus(StatusCodes.CREATED)
      .expectJsonLike([
        {
          cliente_id: clienteId,
          valor: 199.9
        }
      ])
      .expect((ctx) => {
        const pedido = (ctx.res.body as Record<string, unknown>[])[0];
        expect(pedido).toHaveProperty('id');
        expect(pedido).toHaveProperty('cliente_id');
        expect(pedido).toHaveProperty('valor');
        expect(typeof pedido.id).toBe('number');
      })
      .returns('[0].id');
  });

  it('Criar segundo pedido para o mesmo cliente', async () => {
    pedidoId2 = await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: clienteId,
        valor: 50.5
      })
      .expectStatus(StatusCodes.CREATED)
      .returns('[0].id');
  });

  it('Criar pedido com valor decimal preciso', async () => {
    const id = await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: clienteId,
        valor: 0.01
      })
      .expectStatus(StatusCodes.CREATED)
      .expectJsonLike([{ valor: 0.01 }])
      .returns('[0].id');

    await excluirPedido(id);
  });

  it('Consultar todos os pedidos', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ select: '*' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const body = ctx.res.body as unknown[];
        expect(body.length).toBeGreaterThanOrEqual(2);
      });
  });

  it('Consultar pedido por id', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([
        {
          id: pedidoId,
          cliente_id: clienteId
        }
      ]);
  });

  it('Consultar pedidos por cliente_id', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ cliente_id: `eq.${clienteId}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const pedidos = ctx.res.body as { cliente_id: number }[];
        expect(pedidos.length).toBeGreaterThanOrEqual(2);
        pedidos.forEach((ped) => expect(ped.cliente_id).toBe(clienteId));
      });
  });

  it('Consultar pedido inexistente retorna lista vazia', async () => {
    await p
      .spec()
      .get(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.999999`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLength(0);
  });

  it('Atualizar valor do pedido', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId}` })
      .withJson({ valor: 299.9 })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([
        {
          id: pedidoId,
          valor: 299.9
        }
      ]);
  });

  it('Reatribuir pedido para outro cliente', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId2}` })
      .withJson({ cliente_id: clienteId2 })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([{ cliente_id: clienteId2 }]);

    // Reverter para o cliente original
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId2}` })
      .withJson({ cliente_id: clienteId })
      .expectStatus(StatusCodes.OK);
  });
});

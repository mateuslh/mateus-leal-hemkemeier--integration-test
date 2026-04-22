import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  p, rep, baseUrl, headers,
  criarCliente, excluirCliente, criarPedido, excluirPedido
} from './supabase_helpers';

describe('Supabase - Pedidos Cenários de Erro', () => {
  let clienteId: number;
  let pedidoId: number;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteId = await criarCliente(faker.internet.email(), faker.person.fullName(), 25);
    pedidoId = await criarPedido(clienteId, 100.0);
  });

  afterAll(async () => {
    try { await excluirPedido(pedidoId); } catch { /* ok */ }
    try { await excluirCliente(clienteId); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Rejeitar pedido com cliente_id inexistente', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: 999999,
        valor: 100.0
      })
      .expectStatus(StatusCodes.CONFLICT);
  });

  it('Rejeitar pedido com valor = 0', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: clienteId,
        valor: 0
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar pedido com valor negativo', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: clienteId,
        valor: -10
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar pedido sem cliente_id', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({ valor: 100.0 })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar pedido sem valor', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({ cliente_id: clienteId })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar body vazio na criação de pedido', async () => {
    await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({})
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar atualização de pedido com valor zero', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId}` })
      .withJson({ valor: 0 })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar reatribuição para cliente inexistente', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId}` })
      .withJson({ cliente_id: 999999 })
      .expectStatus(StatusCodes.CONFLICT);
  });
});

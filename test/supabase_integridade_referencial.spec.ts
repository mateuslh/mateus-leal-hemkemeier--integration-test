import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  p, rep, baseUrl, headers,
  criarCliente, excluirCliente, criarPedido, excluirPedido
} from './supabase_helpers';

describe('Supabase - Integridade Referencial', () => {
  let clienteId: number;
  let clienteId2: number;
  let pedidoId: number;
  let pedidoId2: number;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteId = await criarCliente(faker.internet.email(), faker.person.fullName(), 25);
    clienteId2 = await criarCliente(faker.internet.email(), faker.person.fullName(), 30);
    pedidoId = await criarPedido(clienteId, 100.0);
    pedidoId2 = await criarPedido(clienteId, 200.0);
  });

  afterAll(async () => {
    try { await excluirPedido(pedidoId); } catch { /* ok */ }
    try { await excluirPedido(pedidoId2); } catch { /* ok */ }
    try { await excluirCliente(clienteId); } catch { /* ok */ }
    try { await excluirCliente(clienteId2); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Rejeitar exclusão de cliente com pedidos vinculados (ON DELETE RESTRICT)', async () => {
    await p
      .spec()
      .delete(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}` })
      .expectStatus(StatusCodes.CONFLICT);
  });

  it('Rejeitar exclusão do segundo cliente com pedido reatribuído', async () => {
    // Reatribuir um pedido para clienteId2
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId2}` })
      .withJson({ cliente_id: clienteId2 })
      .expectStatus(StatusCodes.OK);

    await p
      .spec()
      .delete(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId2}` })
      .expectStatus(StatusCodes.CONFLICT);

    // Reverter
    await p
      .spec()
      .patch(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${pedidoId2}` })
      .withJson({ cliente_id: clienteId })
      .expectStatus(StatusCodes.OK);
  });
});

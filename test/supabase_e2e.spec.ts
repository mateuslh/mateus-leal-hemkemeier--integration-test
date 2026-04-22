import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { p, rep, baseUrl, headers } from './supabase_helpers';

describe('Supabase - Fluxo E2E ciclo de vida completo', () => {
  let e2eClienteId: number;
  let e2ePedidoId: number;
  const e2eEmail = faker.internet.email();

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  it('1. Criar cliente', async () => {
    e2eClienteId = await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: e2eEmail,
        nome: 'Cliente E2E',
        idade: 30
      })
      .expectStatus(StatusCodes.CREATED)
      .returns('[0].id');
  });

  it('2. Validar campos persistidos', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2eClienteId}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([
        {
          email: e2eEmail,
          nome: 'Cliente E2E',
          idade: 30,
          status: 'ATIVO'
        }
      ]);
  });

  it('3. Atualizar cliente', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2eClienteId}` })
      .withJson({ nome: 'Cliente E2E Atualizado', idade: 31 })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([{ nome: 'Cliente E2E Atualizado', idade: 31 }]);
  });

  it('4. Criar pedido para o cliente', async () => {
    e2ePedidoId = await p
      .spec()
      .post(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withJson({
        cliente_id: e2eClienteId,
        valor: 500.0
      })
      .expectStatus(StatusCodes.CREATED)
      .returns('[0].id');
  });

  it('5. Tentar excluir cliente com pedido (deve falhar)', async () => {
    await p
      .spec()
      .delete(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2eClienteId}` })
      .expectStatus(StatusCodes.CONFLICT);
  });

  it('6. Excluir pedido', async () => {
    await p
      .spec()
      .delete(`${baseUrl}/pedidos`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2ePedidoId}` })
      .expectStatus(StatusCodes.OK);
  });

  it('7. Excluir cliente (agora sem pedidos)', async () => {
    await p
      .spec()
      .delete(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2eClienteId}` })
      .expectStatus(StatusCodes.OK);
  });

  it('8. Confirmar que cliente foi removido', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${e2eClienteId}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLength(0);
  });
});

import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { p, rep, baseUrl, headers, criarCliente, excluirCliente } from './supabase_helpers';

describe('Supabase - Clientes Cenários de Erro', () => {
  let clienteId: number;
  let clienteId2: number;
  let clienteEmail: string;

  beforeAll(async () => {
    p.reporter.add(rep);
    clienteEmail = faker.internet.email();
    clienteId = await criarCliente(clienteEmail, faker.person.fullName(), 25);
    clienteId2 = await criarCliente(faker.internet.email(), faker.person.fullName(), 30);
  });

  afterAll(async () => {
    try { await excluirCliente(clienteId); } catch { /* ok */ }
    try { await excluirCliente(clienteId2); } catch { /* ok */ }
    p.reporter.end();
  });

  it('Rejeitar email duplicado', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: clienteEmail,
        nome: faker.person.fullName(),
        idade: 25
      })
      .expectStatus(StatusCodes.CONFLICT);
  });

  it('Rejeitar idade = 17 (limite inferior)', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        idade: 17
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar idade = 0', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        idade: 0
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar idade negativa', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: faker.internet.email(),
        nome: faker.person.fullName(),
        idade: -5
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Aceitar idade = 18 (limite exato)', async () => {
    const emailLimite = faker.internet.email();
    const id = await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: emailLimite,
        nome: faker.person.fullName(),
        idade: 18
      })
      .expectStatus(StatusCodes.CREATED)
      .returns('[0].id');

    await p
      .spec()
      .delete(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${id}` })
      .expectStatus(StatusCodes.OK);
  });

  it('Rejeitar cliente sem nome', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: faker.internet.email(),
        idade: 25
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar cliente sem email', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        nome: faker.person.fullName(),
        idade: 25
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar cliente sem idade', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: faker.internet.email(),
        nome: faker.person.fullName()
      })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar body vazio na criação de cliente', async () => {
    await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({})
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar atualização com idade inválida', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}` })
      .withJson({ idade: 10 })
      .expectStatus(StatusCodes.BAD_REQUEST);
  });

  it('Rejeitar atualização de email para duplicado', async () => {
    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId2}` })
      .withJson({ email: clienteEmail })
      .expectStatus(StatusCodes.CONFLICT);
  });
});

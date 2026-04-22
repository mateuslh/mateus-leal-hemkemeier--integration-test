import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import { p, rep, baseUrl, headers, criarCliente, excluirCliente } from './supabase_helpers';

describe('Supabase - Clientes CRUD', () => {
  let clienteId: number;
  let clienteEmail = faker.internet.email();
  const clienteNome = faker.person.fullName();
  const clienteIdade = faker.number.int({ min: 18, max: 80 });

  beforeAll(() => p.reporter.add(rep));
  afterAll(async () => {
    try { await excluirCliente(clienteId); } catch { /* já removido */ }
    p.reporter.end();
  });

  it('Criar cliente válido', async () => {
    clienteId = await p
      .spec()
      .post(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withJson({
        email: clienteEmail,
        nome: clienteNome,
        idade: clienteIdade
      })
      .expectStatus(StatusCodes.CREATED)
      .expectJsonLike([
        {
          email: clienteEmail,
          nome: clienteNome,
          idade: clienteIdade,
          status: 'ATIVO'
        }
      ])
      .expect((ctx) => {
        const cliente = (ctx.res.body as Record<string, unknown>[])[0];
        expect(cliente).toHaveProperty('id');
        expect(cliente).toHaveProperty('email');
        expect(cliente).toHaveProperty('nome');
        expect(cliente).toHaveProperty('idade');
        expect(cliente).toHaveProperty('status');
        expect(cliente).toHaveProperty('criado_em');
        expect(typeof cliente.id).toBe('number');
        expect(typeof cliente.criado_em).toBe('string');
      })
      .returns('[0].id');
  });

  it('Consultar todos os clientes', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ select: '*' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const body = ctx.res.body as unknown[];
        expect(body.length).toBeGreaterThanOrEqual(1);
      });
  });

  it('Consultar cliente por id', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([
        {
          id: clienteId,
          email: clienteEmail,
          nome: clienteNome
        }
      ]);
  });

  it('Consultar cliente por email', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ email: `eq.${clienteEmail}`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([{ id: clienteId }]);
  });

  it('Consultar cliente com select parcial (id, nome)', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}`, select: 'id,nome' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const cliente = (ctx.res.body as Record<string, unknown>[])[0];
        expect(cliente).toHaveProperty('id');
        expect(cliente).toHaveProperty('nome');
        expect(cliente).not.toHaveProperty('email');
        expect(cliente).not.toHaveProperty('idade');
      });
  });

  it('Consultar cliente inexistente retorna lista vazia', async () => {
    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.999999`, select: '*' })
      .expectStatus(StatusCodes.OK)
      .expectJsonLength(0);
  });

  it('Atualizar nome e idade do cliente', async () => {
    const novoNome = faker.person.fullName();
    const novaIdade = faker.number.int({ min: 18, max: 80 });

    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}` })
      .withJson({
        nome: novoNome,
        idade: novaIdade
      })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([
        {
          id: clienteId,
          nome: novoNome,
          idade: novaIdade
        }
      ]);
  });

  it('Atualizar somente o email do cliente', async () => {
    const novoEmail = faker.internet.email();

    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}` })
      .withJson({ email: novoEmail })
      .expectStatus(StatusCodes.OK)
      .expectJsonLike([{ id: clienteId, email: novoEmail }]);

    clienteEmail = novoEmail;
  });

  it('Validar que criado_em não muda após atualização', async () => {
    const antes = await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}`, select: 'criado_em' })
      .expectStatus(StatusCodes.OK)
      .returns('[0].criado_em');

    await p
      .spec()
      .patch(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}` })
      .withJson({ nome: faker.person.fullName() })
      .expectStatus(StatusCodes.OK);

    await p
      .spec()
      .get(`${baseUrl}/clientes`)
      .withHeaders(headers)
      .withQueryParams({ id: `eq.${clienteId}`, select: 'criado_em' })
      .expectStatus(StatusCodes.OK)
      .expect((ctx) => {
        const depois = (ctx.res.body as Record<string, string>[])[0].criado_em;
        expect(depois).toBe(antes);
      });
  });
});

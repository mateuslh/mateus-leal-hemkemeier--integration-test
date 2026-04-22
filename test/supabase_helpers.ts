import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';

export const p = pactum;
export const rep = SimpleReporter;
export const baseUrl = 'https://hrukfntjdqwphobfzldr.supabase.co/rest/v1';
export const apiKey = 'sb_publishable_5PNl3szJolHaSANKSB7G5g_FRFC2Aev';

export const headers = {
  apikey: apiKey,
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

p.request.setDefaultTimeout(60000);

export async function criarCliente(email: string, nome: string, idade: number): Promise<number> {
  return p
    .spec()
    .post(`${baseUrl}/clientes`)
    .withHeaders(headers)
    .withJson({ email, nome, idade })
    .expectStatus(201)
    .returns('[0].id');
}

export async function excluirCliente(id: number): Promise<void> {
  await p
    .spec()
    .delete(`${baseUrl}/clientes`)
    .withHeaders(headers)
    .withQueryParams({ id: `eq.${id}` })
    .expectStatus(200);
}

export async function criarPedido(clienteId: number, valor: number): Promise<number> {
  return p
    .spec()
    .post(`${baseUrl}/pedidos`)
    .withHeaders(headers)
    .withJson({ cliente_id: clienteId, valor })
    .expectStatus(201)
    .returns('[0].id');
}

export async function excluirPedido(id: number): Promise<void> {
  await p
    .spec()
    .delete(`${baseUrl}/pedidos`)
    .withHeaders(headers)
    .withQueryParams({ id: `eq.${id}` })
    .expectStatus(200);
}

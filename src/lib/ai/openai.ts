import { Mistral } from '@mistralai/mistralai';

let mistralInstance: Mistral | null = null;

export function getMistral(): Mistral {
  if (!mistralInstance) {
    mistralInstance = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY ?? '',
    });
  }
  return mistralInstance;
}

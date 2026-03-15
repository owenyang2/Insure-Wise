import OpenAI from "openai";

const GPT_OSS_BASE_URL = "https://vjioo4r1vyvcozuj.us-east-2.aws.endpoints.huggingface.cloud/v1";
const GPT_OSS_MODEL = "openai/gpt-oss-120b";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "test",
  baseURL: process.env.OPENAI_BASE_URL ?? GPT_OSS_BASE_URL,
});

export const AI_MODEL = process.env.AI_MODEL ?? GPT_OSS_MODEL;

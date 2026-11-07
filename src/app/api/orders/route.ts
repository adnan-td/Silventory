import { createStitchingRequest } from "../../order-mutations";

export async function POST(request: Request) {
  await createStitchingRequest(await request.formData());
  return new Response(null, { status: 204 });
}

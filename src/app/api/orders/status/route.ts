import { updateOrderStatus } from "../../../order-mutations";

export async function POST(request: Request) {
  await updateOrderStatus(await request.formData());
  return new Response(null, { status: 204 });
}

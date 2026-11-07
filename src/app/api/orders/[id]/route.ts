import { updateStitchingRequest } from "../../../order-mutations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await request.formData();
  if (formData.get("orderId") !== id) {
    return new Response("Invalid order update.", { status: 400 });
  }
  await updateStitchingRequest(formData);
  return new Response(null, { status: 204 });
}

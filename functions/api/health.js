export async function onRequestGet() {
  return new Response(JSON.stringify({ ok: true, version: "prp-01" }), {
    headers: { "Content-Type": "application/json" },
  });
}

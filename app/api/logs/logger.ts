export async function track(event: string, data?: any) {
  await fetch("/api/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event,
      data,
    }),
  });
}
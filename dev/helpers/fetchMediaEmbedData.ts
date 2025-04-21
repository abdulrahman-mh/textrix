export async function fetchMediaEmbedData({ url }: { url: string }): Promise<any> {
  const res = await fetch(`http://localhost:8000/api/embed?url=${url}&maxwidth=854&maxheight=10000`);
  return await res.json();
}
  
export default async function Post({ params }: any) {
  const { id } = await params;

  const res = await fetch(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    { cache: 'no-store' }
  );

  const post = await res.json();

  return (
    <div className="bg-white rounded-2xl p-10 shadow-sm">
      <div className="h-60 bg-gray-200 rounded-xl mb-6"></div>

      <h1 className="text-2xl font-bold mb-4">
        {post.title}
      </h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        {post.body}
      </p>

      <button className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-80">
        Comprar
      </button>
    </div>
  );
}
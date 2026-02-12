// Public card page — /card/[userId]
export default async function CardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <p>Card for user {userId}</p>
    </main>
  );
}

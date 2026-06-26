export default function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
import AartiDetail from "../../components/AartiDetail";
import data from "../../store/data";

export function generateStaticParams() {
  return data.map((aarti) => ({ slug: aarti.metadata.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const aarti = data.find((item) => item.metadata.slug === slug);

  return {
    title: aarti
      ? `${aarti.title.original} (${aarti.title.transliteration}) | आरती संग्रह`
      : "आरती संग्रह",
  };
}

export default async function AartiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = data.findIndex((item) => item.metadata.slug === slug);
  const aarti = data[index];

  if (!aarti) {
    return <p className="p-8">आरती सापडली नाही.</p>;
  }

  return (
    <AartiDetail
      aarti={aarti}
      prevAarti={index > 0 ? data[index - 1] : null}
      nextAarti={index < data.length - 1 ? data[index + 1] : null}
    />
  );
}

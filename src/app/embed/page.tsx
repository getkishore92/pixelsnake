import { ContributionSnake } from "@/components/contribution-snake";
import { getGithubContributions } from "@/lib/github-contributions";

export const dynamic = "force-dynamic";

type EmbedPageProps = {
  searchParams: Promise<{ user?: string; theme?: string }>;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const { user = "github", theme } = await searchParams;
  const safeUser = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(user)
    ? user
    : "github";

  const data = await getGithubContributions(safeUser);

  return (
    <>
      {theme === "dark" || theme === "light" ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-theme','${theme}');`,
          }}
        />
      ) : null}
      <div className="embed-shell">
        <ContributionSnake data={data} />
      </div>
    </>
  );
}

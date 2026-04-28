import { ContributionSnake, getGithubContributions } from "@/widget";

export const dynamic = "force-dynamic";

const FALLBACK_USER = process.env.DEMO_GITHUB_USER ?? "torvalds";
const USERNAME_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

type PageProps = {
  searchParams: Promise<{ user?: string; theme?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { user, theme } = await searchParams;
  const safeUser =
    user && USERNAME_RE.test(user) ? user : FALLBACK_USER;

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
      <div className="widget-shell">
        <ContributionSnake data={data} />
      </div>
    </>
  );
}

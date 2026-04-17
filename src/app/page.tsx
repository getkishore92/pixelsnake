import { ContributionSnake } from "@/components/contribution-snake";
import { getGithubContributions } from "@/lib/github-contributions";

const DEMO_USER = process.env.DEMO_GITHUB_USER ?? "torvalds";
const REPO_URL = "https://github.com/yourusername/pixelsnake";

const VERCEL_DEPLOY_URL =
  `https://vercel.com/new/clone?repository-url=${encodeURIComponent(REPO_URL)}` +
  `&project-name=pixelsnake&repository-name=pixelsnake` +
  `&env=DEMO_GITHUB_USER&envDescription=${encodeURIComponent("GitHub username shown on your landing page demo")}`;

const NETLIFY_DEPLOY_URL = `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(REPO_URL)}`;

function VercelIcon() {
  return (
    <svg viewBox="0 0 76 65" fill="currentColor" aria-hidden="true">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function NetlifyIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
      <path d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.59.59 0 0 0-.028-.026c-.008-.008-.013-.018-.02-.026a.388.388 0 0 0-.026-.041 1.65 1.65 0 0 0-.028-.04c-.014-.016-.026-.016-.04-.025l-.045-.025a.514.514 0 0 0-.044-.013l-.05-.006h-.464l-3.078-3.078-.013-.046a.9.9 0 0 0-.006-.051.325.325 0 0 0-.014-.048 1.048 1.048 0 0 0-.022-.04.6.6 0 0 0-.029-.041c-.008-.013-.018-.016-.028-.025a.486.486 0 0 0-.04-.027l-.044-.025a.555.555 0 0 0-.05-.013l-.05-.006H13.24a.657.657 0 0 0-.05.006l-.05.013-.044.025a.37.37 0 0 0-.04.027c-.01.009-.02.012-.03.025a.484.484 0 0 0-.028.04c-.009.013-.016.028-.022.041a.358.358 0 0 0-.014.048 1.09 1.09 0 0 0-.006.051l-.013.046L9.871 14h-.464l-.05.006a.476.476 0 0 0-.05.013l-.044.025a.486.486 0 0 0-.04.027c-.01.009-.018.024-.027.037a.553.553 0 0 0-.026.04 1.04 1.04 0 0 0-.022.041.358.358 0 0 0-.014.048 1.09 1.09 0 0 0-.006.051v11.624a.66.66 0 0 0 .006.051l.014.048c.006.013.013.028.022.04a.655.655 0 0 0 .026.042c.009.012.018.024.027.037a.37.37 0 0 0 .04.027l.044.025a.555.555 0 0 0 .05.013l.05.006H28.12l.05-.006a.476.476 0 0 0 .05-.013l.044-.025a.486.486 0 0 0 .04-.027c.01-.013.02-.025.029-.037a.622.622 0 0 0 .028-.042c.009-.012.016-.027.022-.04a.384.384 0 0 0 .014-.048 1.09 1.09 0 0 0 .006-.051V14.291l-.006-.05a.476.476 0 0 0-.008-.106zm-9.546-2.35l2.138 2.137h-2.138v-2.138zm-5.087 0l2.138 2.137h-2.138v-2.138zM9.624 25.609V14.39l.009-.042 3.03 3.03-.008.042a.62.62 0 0 0-.006.05v7.027l.006.05.014.048c.006.013.013.028.022.04a.6.6 0 0 0 .027.042.35.35 0 0 0 .028.036l3.03 3.03-.009.041H9.666l-.042-.009v-.167zm4.44 1.38l-3.03-3.03.041-.009H14.21l.05-.006a.476.476 0 0 0 .05-.013l.044-.025a.486.486 0 0 0 .04-.027c.01-.013.019-.025.028-.037a.6.6 0 0 0 .028-.042c.009-.012.016-.027.022-.04a.384.384 0 0 0 .014-.048 1.09 1.09 0 0 0 .006-.051v-7.624l-.006-.05a1.09 1.09 0 0 0-.014-.05l-.022-.041a.625.625 0 0 0-.028-.04.35.35 0 0 0-.028-.037l-3.03-3.03.009-.041h9.917l-.009.041-3.03 3.03a.35.35 0 0 0-.028.037.62.62 0 0 0-.028.04 1.048 1.048 0 0 0-.022.041 1.09 1.09 0 0 0-.014.05 1.048 1.048 0 0 0-.006.05v7.624c0 .018.002.035.006.051a.384.384 0 0 0 .014.048c.006.013.013.028.022.04a.6.6 0 0 0 .028.042.35.35 0 0 0 .028.037l3.03 3.03-.009.041H14.064zm14.303-1.38l-.009.041H18.44l-.009-.041 3.03-3.03a.35.35 0 0 0 .028-.037.553.553 0 0 0 .028-.041c.009-.013.016-.028.022-.04a.384.384 0 0 0 .014-.048c.004-.017.006-.034.006-.051v-7.625a1.09 1.09 0 0 0-.006-.05 1.09 1.09 0 0 0-.014-.05 1.048 1.048 0 0 0-.022-.041.602.602 0 0 0-.028-.04.35.35 0 0 0-.028-.037l-3.03-3.03.009-.041h3.917l3.03 3.03a.39.39 0 0 0-.006.05v11.04z" />
    </svg>
  );
}

export default async function HomePage() {
  const data = await getGithubContributions(DEMO_USER);

  return (
    <div className="landing-shell">
      <div className="landing-chrome">
        <header className="landing-header">
          <span className="landing-logo">pixelsnake</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="landing-header-link"
          >
            github
          </a>
        </header>

        <section className="landing-hero">
          <h1 className="landing-title">
            A playable GitHub contribution graph
          </h1>
          <p className="landing-subtitle">
            Self-host it, embed it on any website with a single{" "}
            <code className="landing-inline-code">&lt;iframe&gt;</code>.
            No autoplay. No GIF. Just a real snake game on your real commits.
          </p>
          <p className="landing-hint">
            Click any square below to start playing.
          </p>
        </section>
      </div>

      <div className="landing-demo">
        <ContributionSnake data={data} />
      </div>

      <div className="landing-chrome">
        <section className="landing-section">
          <h2 className="landing-section-title">Embed on your site</h2>
          <p className="landing-section-body">
            Deploy your own instance, then drop this into any webpage.
          </p>
          <pre className="landing-code-block">{`<iframe
  src="https://your-deployment.vercel.app/embed?user=yourusername"
  width="100%"
  height="200"
  frameborder="0"
  scrolling="no"
  title="GitHub contribution snake"
></iframe>`}</pre>

          <div className="landing-params">
            <h3 className="landing-params-title">Parameters</h3>
            <div className="landing-param-table">
              <div className="landing-param-row landing-param-header">
                <span>param</span>
                <span>values</span>
                <span>description</span>
              </div>
              <div className="landing-param-row">
                <span className="landing-param-key">user</span>
                <span className="landing-param-val">string</span>
                <span className="landing-param-desc">
                  GitHub username — required
                </span>
              </div>
              <div className="landing-param-row">
                <span className="landing-param-key">theme</span>
                <span className="landing-param-val">light · dark</span>
                <span className="landing-param-desc">
                  Force a color theme (default: system)
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section-deploy">
          <h2 className="landing-section-title">Deploy your own</h2>
          <p className="landing-section-body">
            One click to get your own instance. Each person hosts their own — no
            shared rate limits, no dependencies on anyone else&apos;s uptime.
          </p>

          <div className="deploy-buttons">
            <a
              href={VERCEL_DEPLOY_URL}
              target="_blank"
              rel="noreferrer"
              className="deploy-btn deploy-btn-vercel"
            >
              <VercelIcon />
              Deploy on Vercel
            </a>
            <a
              href={NETLIFY_DEPLOY_URL}
              target="_blank"
              rel="noreferrer"
              className="deploy-btn deploy-btn-netlify"
            >
              <NetlifyIcon />
              Deploy on Netlify
            </a>
          </div>

          <div className="landing-clone">
            <h3 className="landing-params-title">Or clone and run locally</h3>
            <pre className="landing-code-block">{`git clone ${REPO_URL}
cd pixelsnake
npm install
npm run dev`}</pre>
            <p className="landing-section-body">
              Set <code className="landing-inline-code">DEMO_GITHUB_USER</code>{" "}
              in <code className="landing-inline-code">.env.local</code> to
              change the demo shown on this landing page.
            </p>
          </div>
        </section>

        <footer className="landing-footer">
          <p>
            <a href={REPO_URL} target="_blank" rel="noreferrer">
              open source
            </a>{" "}
            · built with Next.js
          </p>
        </footer>
      </div>
    </div>
  );
}

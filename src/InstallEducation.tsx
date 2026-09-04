import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CloudDownload,
  Database,
  Download,
  ExternalLink,
  Home,
  RefreshCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  detectInstallPlatform,
  getInstallInstructions,
  isRunningStandalone,
  type BeforeInstallPromptEvent,
} from "./install";

interface InstallEducationProps {
  online: boolean;
  offlineReady: boolean;
  compact?: boolean;
  installPrompt?: BeforeInstallPromptEvent | null;
  installed?: boolean;
  onInstall?: () => Promise<void>;
}

export function InstallEducation({
  online,
  offlineReady,
  compact = false,
  installPrompt = null,
  installed = isRunningStandalone(),
  onInstall,
}: InstallEducationProps) {
  const [expanded, setExpanded] = useState(false);
  const instructions = useMemo(() => {
    const platform = detectInstallPlatform(
      window.navigator.userAgent,
      window.navigator.maxTouchPoints,
    );
    return getInstallInstructions(platform);
  }, []);

  if (compact) {
    return (
      <aside className="mobile-welcome-guide" aria-labelledby="mobile-welcome-title">
        <div className="mobile-welcome-heading">
          <span className="mobile-welcome-icon">
            <Smartphone aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Using your phone?</p>
            <h2 id="mobile-welcome-title">OpenWall can live on your home screen.</h2>
          </div>
        </div>
        <p>
          Start with the sample or your household, then open Settings for guided installation and an
          honest explanation of what works online and offline.
        </p>
        <button
          type="button"
          className="text-button mobile-learn-button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Hide how it works" : "How does mobile work?"}
        </button>
        {expanded && (
          <div className="mobile-welcome-details">
            <p>
              <strong>Online:</strong> GitHub Pages sends this app to your browser and checks for
              updates. OpenWall has no household-data server.
            </p>
            <p>
              <strong>On this phone:</strong> Your household is saved in this browser. Another phone
              starts separately unless you move a supported backup yourself.
            </p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <section className="install-section" aria-labelledby="install-section-title">
      <header className="install-section-header">
        <div className="install-heading-icon">
          <Smartphone aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Phone, tablet, or wall display</p>
          <h2 id="install-section-title">Install & connectivity</h2>
          <p>
            Make OpenWall easier to open, then learn exactly what the internet does—and doesn’t do.
          </p>
        </div>
        <span className={`connection-pill ${online ? "online" : "offline"}`}>
          {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
          Device reports {online ? "online" : "offline"}
        </span>
      </header>

      <div className="install-steps-grid">
        <article className="install-step-card">
          <span className="install-step-number">1</span>
          <div className="install-step-heading">
            <Download aria-hidden="true" />
            <div>
              <p className="eyebrow">Install</p>
              <h3>Add OpenWall to this device</h3>
            </div>
          </div>
          {installed ? (
            <div className="install-success" role="status">
              <CheckCircle2 aria-hidden="true" /> OpenWall is running as an installed app.
            </div>
          ) : installPrompt && onInstall ? (
            <>
              <p>Your browser says OpenWall is ready to install.</p>
              <button className="primary-button install-now-button" onClick={onInstall}>
                <Download aria-hidden="true" /> Install OpenWall
              </button>
            </>
          ) : (
            <>
              <p className="install-platform-label">
                Instructions for <strong>{instructions.label}</strong>
              </p>
              <ol className="install-instruction-list">
                {instructions.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </>
          )}
          <p className="install-fine-print">
            Install options depend on the browser and operating-system version. A normal browser
            bookmark still works when installation is unavailable.
          </p>
        </article>

        <article className="install-step-card">
          <span className="install-step-number">2</span>
          <div className="install-step-heading">
            <Database aria-hidden="true" />
            <div>
              <p className="eyebrow">Understand</p>
              <h3>Each browser is its own OpenWall</h3>
            </div>
          </div>
          <div className="connectivity-flow" aria-label="How OpenWall uses the internet">
            <div>
              <CloudDownload aria-hidden="true" />
              <strong>GitHub Pages</strong>
              <span>Delivers app files and updates</span>
            </div>
            <ExternalLink aria-hidden="true" className="flow-arrow" />
            <div>
              <Smartphone aria-hidden="true" />
              <strong>This device</strong>
              <span>Stores your household locally</span>
            </div>
          </div>
          <ul className="connectivity-facts">
            <li>
              <ShieldCheck aria-hidden="true" /> No OpenWall account, analytics, or household-data
              upload.
            </li>
            <li>
              <RefreshCw aria-hidden="true" /> Phones do not sync with each other in this version.
            </li>
            <li>
              <Share2 aria-hidden="true" /> Use a supported backup to move members, schedules, and
              tasks manually.
            </li>
          </ul>
        </article>

        <article className="install-step-card">
          <span className="install-step-number">3</span>
          <div className="install-step-heading">
            <Home aria-hidden="true" />
            <div>
              <p className="eyebrow">Use anywhere</p>
              <h3>Online first, then offline</h3>
            </div>
          </div>
          <div className={`offline-readiness-card ${offlineReady ? "ready" : "waiting"}`}>
            {offlineReady ? (
              <CheckCircle2 aria-hidden="true" />
            ) : (
              <CloudDownload aria-hidden="true" />
            )}
            <div>
              <strong>
                {offlineReady ? "Offline app files are ready" : "Finish one online visit"}
              </strong>
              <span>
                {offlineReady
                  ? "This browser has cached the OpenWall app shell."
                  : "Keep this page open online until the browser finishes caching OpenWall."}
              </span>
            </div>
          </div>
          <ol className="offline-steps">
            <li>Visit OpenWall successfully while connected.</li>
            <li>Add it to your home screen if your browser offers installation.</li>
            <li>Open it without Wi-Fi; saved local features should remain available.</li>
          </ol>
          <p className="install-warning">
            Clearing site data or removing browser storage can erase this device’s household. Keep a
            recent backup of the records the current backup format supports.
          </p>
        </article>
      </div>
    </section>
  );
}

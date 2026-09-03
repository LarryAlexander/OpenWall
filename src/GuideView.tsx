import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import {
  GUIDE_ARTICLES,
  GUIDE_CATEGORIES,
  RELEASE_NOTES,
  SUGGESTED_SEARCH_TOPICS,
  getArticleById,
  getCategoryById,
  searchGuideArticles,
} from "./guideData";
import { markReleaseSeen, resetDismissedTips, setLastHelpCategory } from "./guideState";
import type { GuideAction, GuideArticle, GuideCategoryId, GuideState } from "./types";

interface GuideViewProps {
  guideState: GuideState;
  onUpdateGuideState: (state: GuideState) => void;
  onNavigate: (view: "today" | "settings") => void;
  onStartTour: (triggerElement?: HTMLElement | null, stepIndex?: number) => void;
  initialTab?: GuideTab;
}

type GuideTab = "articles" | "releases";

export function GuideView({
  guideState,
  onUpdateGuideState,
  onNavigate,
  onStartTour,
  initialTab,
}: GuideViewProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>(initialTab ?? "articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [resetNotice, setResetNotice] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Initialize selectedCategory with persisted lastHelpCategory if valid
  const initialCategory: GuideCategoryId | "all" = useMemo(() => {
    if (
      guideState.lastHelpCategory &&
      GUIDE_CATEGORIES.some((c) => c.id === guideState.lastHelpCategory)
    ) {
      return guideState.lastHelpCategory as GuideCategoryId;
    }
    return "all";
  }, [guideState.lastHelpCategory]);

  const [selectedCategory, setSelectedCategory] = useState<GuideCategoryId | "all">(
    initialCategory,
  );

  // Mark release 0.1.0 as seen when viewing the release history tab or on mount
  useEffect(() => {
    if (activeTab === "releases" && !guideState.seenReleaseVersions.includes("0.1.0")) {
      const updated = markReleaseSeen("0.1.0");
      onUpdateGuideState(updated);
    }
  }, [activeTab, guideState.seenReleaseVersions, onUpdateGuideState]);

  const handleCategorySelect = (categoryId: GuideCategoryId | "all") => {
    setSelectedCategory(categoryId);
    const updated = setLastHelpCategory(categoryId === "all" ? undefined : categoryId);
    onUpdateGuideState(updated);
  };

  const handleResetTips = () => {
    const updated = resetDismissedTips();
    onUpdateGuideState(updated);
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 4000);
  };

  const handleAction = (action: GuideAction) => {
    if (action.type === "tour" || action.type === "tour-step") {
      onStartTour(null, action.stepIndex ?? 0);
    } else if (action.type === "navigate" && action.targetView) {
      onNavigate(action.targetView);
    }
  };

  const filteredArticles = useMemo(() => {
    return searchGuideArticles(searchQuery, selectedCategory);
  }, [searchQuery, selectedCategory]);

  const currentCategoryObj = selectedCategory !== "all" ? getCategoryById(selectedCategory) : null;

  return (
    <div className="guide-view">
      <header className="guide-view-header">
        <div className="guide-header-title-block">
          <p className="eyebrow">
            <Compass aria-hidden="true" /> OpenWall Guide
          </p>
          <h1>Help, Orientation & What’s New</h1>
          <p className="guide-view-lede">
            Truthful, private, offline-first guidance for your family’s living corkboard.
          </p>
        </div>

        <div className="guide-header-status-strip">
          <div className="guide-status-badge">
            <ShieldCheck aria-hidden="true" />
            <span>OpenWall 0.1.0 · Local-only · No telemetry</span>
          </div>

          <div className="guide-quick-controls">
            <button
              type="button"
              className="secondary-button guide-btn-sm"
              onClick={() => onStartTour(null, 0)}
              title="Replay the 60-second visual tour"
            >
              <Compass aria-hidden="true" />
              <span>Replay 60-second tour</span>
            </button>

            <button
              type="button"
              className="secondary-button guide-btn-sm"
              onClick={handleResetTips}
              title="Reset dismissed contextual guidance tips"
            >
              <RotateCcw aria-hidden="true" />
              <span>Reset dismissed tips</span>
            </button>
          </div>
        </div>

        {resetNotice && (
          <div className="notice success guide-toast-notice" role="status">
            <Check aria-hidden="true" />
            <span>Dismissed contextual tips have been reset for this device.</span>
          </div>
        )}

        <div className="guide-tab-nav" role="tablist" aria-label="Guide Sections">
          <button
            type="button"
            role="tab"
            id="guide-tab-articles"
            aria-controls="guide-panel-articles"
            aria-selected={activeTab === "articles"}
            className={`guide-tab-btn ${activeTab === "articles" ? "active" : ""}`}
            onClick={() => setActiveTab("articles")}
          >
            <BookOpen aria-hidden="true" />
            <span>Searchable Help ({GUIDE_ARTICLES.length} guides)</span>
          </button>
          <button
            type="button"
            role="tab"
            id="guide-tab-releases"
            aria-controls="guide-panel-releases"
            aria-selected={activeTab === "releases"}
            className={`guide-tab-btn ${activeTab === "releases" ? "active" : ""}`}
            onClick={() => setActiveTab("releases")}
          >
            <Sparkles aria-hidden="true" />
            <span>What’s New (Release history)</span>
          </button>
        </div>
      </header>

      {activeTab === "articles" ? (
        <section
          id="guide-panel-articles"
          role="tabpanel"
          aria-labelledby="guide-tab-articles"
          className="guide-articles-section"
        >
          <div className="guide-search-panel">
            <div className="guide-search-input-wrapper">
              <Search className="guide-search-icon" aria-hidden="true" />
              <input
                type="search"
                className="guide-search-input"
                placeholder="Search guides, countdowns, arrangement, backups, members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search guide articles"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="icon-button guide-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="guide-category-chips" role="group" aria-label="Filter by category">
              <button
                type="button"
                className={`guide-chip ${selectedCategory === "all" ? "is-selected" : ""}`}
                onClick={() => handleCategorySelect("all")}
              >
                All topics ({GUIDE_ARTICLES.length})
              </button>
              {GUIDE_CATEGORIES.map((cat) => {
                const count = GUIDE_ARTICLES.filter((a) => a.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`guide-chip ${selectedCategory === cat.id ? "is-selected" : ""}`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    {cat.title} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="guide-results-header">
            <div>
              <h2>{currentCategoryObj ? currentCategoryObj.title : "All Help Articles"}</h2>
              {currentCategoryObj && (
                <p className="guide-category-desc">{currentCategoryObj.description}</p>
              )}
            </div>
            <span className="guide-results-count">
              {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"}
            </span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="guide-empty-search">
              <Search className="guide-empty-icon" aria-hidden="true" />
              <h3>No guides found matching “{searchQuery}”</h3>
              <p>Try searching for a different keyword or explore one of these popular topics:</p>
              <div className="guide-suggested-topics">
                {SUGGESTED_SEARCH_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="guide-suggestion-chip"
                    onClick={() => setSearchQuery(topic)}
                  >
                    <Tag aria-hidden="true" size={13} />
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="guide-articles-grid">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} onAction={handleAction} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section
          id="guide-panel-releases"
          role="tabpanel"
          aria-labelledby="guide-tab-releases"
          className="guide-releases-section"
        >
          <div className="guide-releases-intro">
            <h2>Release History & What’s New</h2>
            <p>
              OpenWall is developed as an open-source, local-first product. Here is what has been
              built and verified in each release.
            </p>
          </div>

          <div className="guide-releases-list">
            {RELEASE_NOTES.map((release) => (
              <article key={release.version} className="guide-release-card">
                <header className="guide-release-header">
                  <div className="guide-release-badge-line">
                    <span className="guide-version-tag">Version {release.version}</span>
                    <time className="guide-release-date">{release.releasedAt}</time>
                    <span className="guide-current-badge">Current release</span>
                  </div>
                  <h3>{release.title}</h3>
                  <p className="guide-release-summary">{release.summary}</p>
                </header>

                <div className="guide-release-highlights">
                  <h4>What’s included:</h4>
                  <ul>
                    {release.highlights.map((h, index) => (
                      <li key={index}>
                        <Check aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {release.relatedArticleIds.length > 0 && (
                  <div className="guide-release-related">
                    <h4>Related documentation:</h4>
                    <div className="guide-related-pills">
                      {release.relatedArticleIds.map((artId) => {
                        const art = getArticleById(artId);
                        if (!art) return null;
                        return (
                          <button
                            key={artId}
                            type="button"
                            className="guide-related-btn"
                            onClick={() => {
                              setActiveTab("articles");
                              handleCategorySelect(art.categoryId);
                              setSearchQuery(art.title);
                            }}
                          >
                            <BookOpen aria-hidden="true" size={14} />
                            <span>{art.title}</span>
                            <ArrowRight aria-hidden="true" size={13} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  onAction,
}: {
  article: GuideArticle;
  onAction: (action: GuideAction) => void;
}) {
  const category = getCategoryById(article.categoryId);

  return (
    <article className="guide-article-card" aria-labelledby={`article-${article.id}-title`}>
      <header className="guide-article-header">
        <span className="guide-article-category-pill">{category?.title ?? article.categoryId}</span>
        <h3 id={`article-${article.id}-title`}>{article.title}</h3>
        <p className="guide-article-summary">{article.summary}</p>
      </header>

      <div className="guide-article-steps">
        <h4>Steps:</h4>
        <ol>
          {article.steps.map((step, idx) => (
            <li key={idx}>
              <span className="guide-step-number">{idx + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {article.action && (
        <footer className="guide-article-footer">
          <button
            type="button"
            className="secondary-button guide-action-btn"
            onClick={() => onAction(article.action!)}
          >
            {article.action.type === "tour" || article.action.type === "tour-step" ? (
              <Compass aria-hidden="true" />
            ) : (
              <ChevronRight aria-hidden="true" />
            )}
            <span>{article.action.label}</span>
          </button>
        </footer>
      )}
    </article>
  );
}

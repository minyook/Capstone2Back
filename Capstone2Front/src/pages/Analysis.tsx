import { useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { findSubmissionById, submissionPrimaryFileName } from "../data/folderFilesStorage";
import { loadScoresForView, totalFromScores, type StoredRubricScores } from "../data/analysisResultStorage";
import { RUBRIC } from "../data/rubric";
import "./Analysis.css";

export function Analysis() {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const scores = useMemo<StoredRubricScores | null>(
    () => loadScoresForView(submissionId),
    [submissionId]
  );
  const submissionMeta = useMemo(
    () => (submissionId ? findSubmissionById(submissionId) : null),
    [submissionId]
  );

  const hasData = scores !== null;
  const total = useMemo(() => (scores ? totalFromScores(scores) : null), [scores]);
  const previewVideoUrl = useMemo(() => {
    if (!submissionId) return null;
    try {
      const raw = sessionStorage.getItem("overnight-video-preview-by-submission-v1");
      if (!raw) return null;
      const map = JSON.parse(raw) as Record<string, string>;
      return map[submissionId] ?? null;
    } catch {
      return null;
    }
  }, [submissionId]);

  const emptyDesc =
    submissionId && !hasData
      ? "이 제출에 대한 채점 결과가 아직 없습니다. 서버 분석이 끝나면 같은 화면에서 점수를 불러올 수 있습니다."
      : "저장된 채점 결과가 없습니다. 발표 평가에서 제출한 영상의 분석이 완료되면 항목별 점수가 여기에 표시됩니다.";

  return (
    <div className="page analysis">
      <div className="page-inner page-inner--wide">
        <p className="analysis-kicker">시각화 대시보드</p>
        <h1 className="analysis-page-title">멀티모달 채점 결과</h1>
        {submissionMeta ? (
          <p className="analysis-page-desc analysis-page-desc--meta">
            <strong>{submissionPrimaryFileName(submissionMeta)}</strong>
            <span className="analysis-page-desc__sep" aria-hidden>
              {" "}
              ·{" "}
            </span>
            제출 시각 기준 기록입니다. 발표 기록에서 다른 제출을 고르면 해당 결과로 바뀝니다.
          </p>
        ) : null}
        {hasData ? (
          <p className="analysis-page-desc">
            음성·영상을 함께 본 항목별 점수입니다. 결과를 확인하고 아래에서 PDF·Excel로 내보낼 수 있습니다.
          </p>
        ) : (
          <p className="analysis-page-desc">{emptyDesc}</p>
        )}

        <div
          className={
            "analysis-player" + (!hasData ? " analysis-player--placeholder" : "")
          }
        >
          <button
            type="button"
            className="analysis-play"
            aria-label="재생"
            disabled={!previewVideoUrl}
            onClick={() => {
              if (!previewVideoRef.current) return;
              previewVideoRef.current.play().catch(() => {
                /* ignore autoplay/play errors */
              });
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
            </svg>
          </button>
          {previewVideoUrl ? (
            <video
              ref={previewVideoRef}
              className="analysis-player__video"
              src={previewVideoUrl}
              controls
              playsInline
            />
          ) : null}
          <span className="analysis-player__cap">
            {previewVideoUrl ? "발표 영상 다시보기" : "영상 미리보기가 없습니다"}
          </span>
        </div>

        <section className="analysis-section">
          <h2>종합</h2>
          <div
            className={
              "analysis-total" + (hasData ? " analysis-total--filled" : " analysis-total--empty")
            }
          >
            <span className="analysis-total__label">Total</span>
            <div className="analysis-total__score" aria-live="polite">
              {hasData && total !== null ? (
                <>
                  <span className="analysis-total__num">{total}</span>
                  <span className="analysis-total__max">/ 100</span>
                </>
              ) : (
                <span className="analysis-total__num analysis-total__num--empty">—</span>
              )}
            </div>
            <p className="analysis-total__note">
              {hasData
                ? "발표 내용 · 태도 · 음성 영역 점수를 종합해 계산한 결과입니다."
                : "채점 결과가 있으면 종합 점수가 계산됩니다."}
            </p>
          </div>
        </section>

        <section className="analysis-section">
          <h2>항목별 점수</h2>
          <div className="analysis-rubric">
            {RUBRIC.map((cat) => {
              const d = scores?.[cat.id];
              return (
                <div
                  key={cat.id}
                  className={"analysis-cat" + (!hasData ? " analysis-cat--empty" : "")}
                >
                  <div className="analysis-cat__head">
                    <div>
                      <h3>{cat.title}</h3>
                      <p className="analysis-cat__sub">{cat.subtitle}</p>
                    </div>
                    <span
                      className={
                        "analysis-cat__badge" + (!hasData ? " analysis-cat__badge--empty" : "")
                      }
                    >
                      {d ? `${d.category}점` : "—"}
                    </span>
                  </div>
                  <ul className="analysis-cat__items">
                    {cat.items.map((label, i) => (
                      <li key={label}>
                        <span className="analysis-cat__label">{label}</span>
                        <span className="analysis-cat__itemscore">
                          {d?.items[i] ?? "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="analysis-bar" aria-hidden>
                    <span
                      className={!hasData ? "analysis-bar__fill analysis-bar__fill--empty" : "analysis-bar__fill"}
                      style={
                        hasData && d ? { width: `${Math.min(100, Math.max(0, d.category))}%` } : { width: 0 }
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="analysis-section">
          <h2>리포트 내보내기</h2>
          <div className="analysis-export">
            <button
              type="button"
              className="analysis-btn analysis-btn--outline"
              disabled={!hasData}
              title={!hasData ? "채점 결과가 있을 때 사용할 수 있습니다" : undefined}
              onClick={() => {
                if (!scores) return;
                const rows = [
                  ["영역", "세부항목", "점수"].join(","),
                  ...RUBRIC.flatMap((cat) => {
                    const data = scores[cat.id];
                    const itemRows = cat.items.map((label, idx) =>
                      [cat.title, label, String(data.items[idx] ?? "")].join(",")
                    );
                    return [...itemRows, [cat.title, "영역 점수", String(data.category)].join(",")];
                  }),
                  ["총점", "", String(totalFromScores(scores))].join(","),
                ];
                const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `analysis-report-${submissionId ?? "latest"}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              EXCEL
            </button>
            <button
              type="button"
              className="analysis-btn analysis-btn--fill"
              disabled={!hasData}
              title={!hasData ? "채점 결과가 있을 때 사용할 수 있습니다" : undefined}
              onClick={() => {
                window.print();
              }}
            >
              PDF
            </button>
          </div>
        </section>

        <p className="analysis-foot">
          <Link to="/notes">발표 기록</Link>
          <span aria-hidden> · </span>
          <Link to="/evaluate">다시 평가하기</Link>
          <span aria-hidden> · </span>
          <Link to="/mypage">마이페이지로</Link>
        </p>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { DEMO_SCORES } from "../data/analysisDemo";
import { RUBRIC } from "../data/rubric";
import "./Analysis.css";

export function Analysis() {
  const total = Math.round(
    RUBRIC.reduce((sum, cat) => sum + DEMO_SCORES[cat.id].category, 0) / RUBRIC.length
  );

  return (
    <div className="page analysis">
      <div className="page-inner page-inner--wide">
        <p className="analysis-kicker">시각화 대시보드 (데모)</p>
        <h1 className="analysis-page-title">멀티모달 채점 결과</h1>
        <p className="analysis-page-desc">
          음성·영상 특징이 융합된 항목별 점수입니다. 교수·채점자는 <strong>가중치</strong>를 조정할 수 있으며, 아래
          리포트는 계획서의 PDF·Excel 산출물과 연결됩니다.
        </p>

        <div className="analysis-player">
          <button type="button" className="analysis-play" aria-label="재생">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
            </svg>
          </button>
          <span className="analysis-player__cap">발표 영상 다시보기</span>
        </div>

        <section className="analysis-section">
          <h2>종합</h2>
          <div className="analysis-total analysis-total--filled">
            <span className="analysis-total__label">Total</span>
            <div className="analysis-total__score" aria-live="polite">
              <span className="analysis-total__num">{total}</span>
              <span className="analysis-total__max">/ 100</span>
            </div>
            <p className="analysis-total__note">
              발표 내용 · 태도 · 음성 영역 가중 평균 (가중치는 교수 설정에 맞게 조정 가능)
            </p>
          </div>
        </section>

        <section className="analysis-section">
          <h2>항목별 점수</h2>
          <div className="analysis-rubric">
            {RUBRIC.map((cat) => {
              const d = DEMO_SCORES[cat.id];
              return (
                <div key={cat.id} className="analysis-cat">
                  <div className="analysis-cat__head">
                    <div>
                      <h3>{cat.title}</h3>
                      <p className="analysis-cat__sub">{cat.subtitle}</p>
                    </div>
                    <span className="analysis-cat__badge">{d.category}점</span>
                  </div>
                  <ul className="analysis-cat__items">
                    {cat.items.map((label, i) => (
                      <li key={label}>
                        <span className="analysis-cat__label">{label}</span>
                        <span className="analysis-cat__itemscore">{d.items[i] ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="analysis-bar" aria-hidden>
                    <span style={{ width: `${d.category}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="analysis-section">
          <h2>리포트 내보내기</h2>
          <div className="analysis-export">
            <button type="button" className="analysis-btn analysis-btn--outline">
              EXCEL
            </button>
            <button type="button" className="analysis-btn analysis-btn--fill">
              PDF
            </button>
          </div>
        </section>

        <p className="analysis-foot">
          <Link to="/evaluate">다시 평가하기</Link>
          <span aria-hidden> · </span>
          <Link to="/mypage">마이페이지로</Link>
        </p>
      </div>
    </div>
  );
}

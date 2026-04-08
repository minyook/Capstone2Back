import { useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft } from "../components/Icons";
import { RUBRIC } from "../data/rubric";
import "./Guide.css";

type Tab = "criteria" | "howto";

const cardClass: Record<string, string> = {
  content: "c-card--blue",
  attitude: "c-card--mint",
  voice: "c-card--lavender",
};

const iconClass: Record<string, string> = {
  content: "c-card__icon--blue",
  attitude: "c-card__icon--mint",
  voice: "c-card__icon--lavender",
};

export function Guide() {
  const [tab, setTab] = useState<Tab>("criteria");

  return (
    <div className="page guide">
      <div className="page-inner page-inner--wide">
        <header className="guide-top">
          <Link to="/" className="guide-back" aria-label="홈으로">
            <IconArrowLeft />
          </Link>
          <h1 className="guide-page-title">가이드</h1>
        </header>

        <div className="guide-tabs" role="tablist" aria-label="가이드 구분">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "criteria"}
            className={"guide-tab" + (tab === "criteria" ? " guide-tab--on" : "")}
            onClick={() => setTab("criteria")}
          >
            채점 항목
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "howto"}
            className={"guide-tab" + (tab === "howto" ? " guide-tab--on" : "")}
            onClick={() => setTab("howto")}
          >
            이용 방법
          </button>
        </div>

        {tab === "criteria" && (
          <>
            <p className="guide-intro">
              컴퓨터 비전·음성 분석과 PPT 대조를 통해 아래 세 영역을 채점합니다. 각 항목은 보고서에서 세부 피드백과 함께
              제공됩니다.
            </p>
            <hr className="guide-rule" />

            <div className="guide-criteria-grid">
              {RUBRIC.map((cat) => (
                <article key={cat.id} className={`c-card ${cardClass[cat.id]}`}>
                  <div className={`c-card__icon ${iconClass[cat.id]}`}>
                    {cat.id === "content" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M4 6h16v12H4V6z" stroke="currentColor" strokeWidth="2" />
                        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                    {cat.id === "attitude" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                    {cat.id === "voice" && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  <h3>{cat.title}</h3>
                  <p className="c-card__summary">{cat.summary}</p>
                  <ul className="c-card__list">
                    {cat.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="c-note">
              <span className="c-note__emoji" aria-hidden>
                💯
              </span>
              <p>
                종합 점수는 <strong>발표 내용 · 발표 태도 · 발표 음성</strong> 영역에 가중치를 두어 산출하며, PPT와 발화
                텍스트 비교는 <strong>발표 내용</strong> 영역에 반영됩니다.
              </p>
            </div>
          </>
        )}

        {tab === "howto" && (
          <>
            <h2 className="guide-how-title">폴더 지정부터 채점 결과까지</h2>
            <p className="guide-how-sub">
              Overnight는 <strong>발표 폴더</strong>마다 녹화·PPT·채점 기록을 묶어 두고, 슬라이드와 영상·음성을 함께
              분석해 피드백을 제공합니다.
            </p>

            <ol className="how-list">
              <li>
                <span className="how-list__num how-list__num--1">1</span>
                <div>
                  <strong>발표 폴더 만들기 · 선택</strong>
                  <ul>
                    <li>
                      <strong>폴더</strong> 화면에서 주제·과목별로 새 폴더를 만들거나, 기존 폴더를 선택합니다. 이 안에 발표
                      영상 녹화, PPT, 채점 결과가 함께 쌓입니다.
                    </li>
                    <li>
                      <strong>발표 평가</strong>를 시작할 때도 &apos;저장할 발표 폴더&apos;를 먼저 고르면 같은 규칙으로
                      정리됩니다.
                    </li>
                  </ul>
                </div>
              </li>
              <li>
                <span className="how-list__num how-list__num--2">2</span>
                <div>
                  <strong>PPT와 발표 영상 제출</strong>
                  <ul>
                    <li>선택한 폴더를 기준으로 PPT를 업로드하고, 카메라로 녹화하거나 영상 파일을 올립니다.</li>
                    <li>시스템이 슬라이드 내용과 발화를 대조해 <strong>내용 일치·논리성</strong>을 평가합니다.</li>
                  </ul>
                </div>
              </li>
              <li>
                <span className="how-list__num how-list__num--3">3</span>
                <div>
                  <strong>항목별 점수·리포트</strong>
                  <ul>
                    <li>
                      <strong>발표 태도</strong>(시선·표정·제스처)와 <strong>발표 음성</strong>(속도·안정성·말버릇·반복)은
                      영상·음성 분석 결과로 채워집니다.
                    </li>
                    <li>결과는 화면에서 확인하고, Excel 또는 PDF로 내려받을 수 있습니다.</li>
                  </ul>
                </div>
              </li>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

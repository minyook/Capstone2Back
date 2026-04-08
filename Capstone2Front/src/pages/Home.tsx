import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "./Home.css";



/** 캡스톤 계획서 기준: 멀티모달 발표 자동 채점 — 음성+영상 융합, 리포트, 가중치 */

export function Home() {

  const { user, loading } = useAuth();



  return (

    <div className="page landing">

      <div className="landing__inner">

        <p className="landing__eyebrow">Computer Vision–Based Presentation Grading</p>

        <h1 className="landing__title">멀티모달 발표 자동 채점</h1>

        <p className="landing__lead">

          음성(STT)과 영상(컴퓨터 비전)을 함께 분석해 <strong>내용·논리</strong>와{" "}

          <strong>태도·음성</strong>을 정량적으로 평가합니다. 결과는 PDF·Excel 리포트로 내보낼 수 있습니다.

        </p>



        <div className="landing__cta">

          <Link to="/evaluate" className="landing__btn landing__btn--primary">

            발표 평가

          </Link>

          <Link to="/projects" className="landing__btn landing__btn--ghost">

            문서

          </Link>

        </div>



        <ul className="landing__pills" aria-label="시스템 구성 (계획서 기준)">

          <li>Whisper STT · 발화·억양·말버릇</li>

          <li>MediaPipe · 시선·제스처·표정</li>

          <li>항목별 융합 점수 · 가중치 조정</li>

          <li>PDF · Excel 피드백 리포트</li>

        </ul>



        <p className="landing__foot">

          {!loading && !user && (

            <Link to="/login" className="landing__link">

              로그인

            </Link>

          )}

          {!loading && user && (
            <span className="landing__muted">
              {user.displayName?.trim() || user.email?.split("@")[0]} 님
            </span>
          )}

          <span className="landing__dot" aria-hidden>

            ·

          </span>

          <span className="landing__muted">동의대 캡스톤 · 무박2일 · Overnight</span>

        </p>

      </div>

    </div>

  );

}


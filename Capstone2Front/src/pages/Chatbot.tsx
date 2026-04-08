import { useEffect, useId, useRef, useState } from "react";
import "./Chatbot.css";

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  /** 사용자가 PPT를 올린 턴 */
  isPptUpload?: boolean;
};

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 데모: 실제 PPT 파싱 대신 구조·발표 관점 피드백 템플릿 */
function pptFeedbackDemo(fileName: string): string {
  return `「${fileName}」을(를) 받았습니다. (현재는 파일 내용을 읽지 않고, 일반적인 발표 피드백을 드립니다. 백엔드와 연동하면 슬라이드별 분석이 가능합니다.)

• 슬라이드 구조: 도입(문제·목표) → 본론(근거·절차) → 결론(요약·다음 단계)처럼 한 슬라이드에 메시지가 하나씩 드러나는지 확인해 보세요.
• 분량: 발표 시간을 정했다면 슬라이드 수·글머리 수가 시간에 맞는지(슬라이드당 1~2분 등) 점검이 필요합니다.
• 말과 PPT: 슬라이드의 글은 키워드 위주로 두고, 설명은 말로 풀면 ‘내용·논리’ 채점에 유리합니다.
• 시각: 그래프·표는 축·단위를 크게, 한 슬라이드에 정보가 과하지 않은지 봐 주세요.

더 구체적으로 다듬고 싶으면 어떤 발표인지(과제·캡스톤·영어 등)와 분량을 알려 주세요.`;
}

/** 데모: 질문에 대한 짧은 코칭형 답변 */
function questionFeedbackDemo(q: string): string {
  const t = q.trim();
  if (!t) return "무엇이든 물어보세요. 발표 구성, 말하기, 긴장, 시간 배분 등에 대해 피드백 드릴게요.";

  if (/시간|분량|몇 분/i.test(t)) {
    return `시간·분량은 미리 연습하면서 맞추는 게 가장 정확합니다. 초안 기준으로는 전체를 도입 10~15% · 본론 70~75% · 결론 10~15% 정도로 나눠 보고, 슬라이드 수가 많으면 슬라이드당 1~2분을 상한으로 잡아 보세요. 실제로는 “한 장에 말할 내용이 몇 문장인지”를 줄이는 게 효과적입니다.`;
  }
  if (/긴장|떨림|목소리/i.test(t)) {
    return `긴장·목소리는 호흡과 속도가 핵심입니다. 첫 문장을 짧게, 천천히 시작해 보세요. 시선은 한 사람씩 천천히 옮기면 ‘태도·음성’ 채점에서도 안정적으로 보입니다. 필요하면 발표 평가 화면에서 녹화 후 다시 들어 보는 것도 좋습니다.`;
  }
  if (/ppt|슬라이드|자료/i.test(t)) {
    return `PPT는 청자가 따라오기 쉬운 한 슬라이드 한 메시지가 좋습니다. 긴 문단 대신 글머리·도식을 쓰고, 발표자 노트에만 상세 설명을 두면 말과 슬라이드가 어긋나지 않습니다. 파일을 올리면 구성·분량 쪽 피드백을 더 구체화할 수 있어요.`;
  }

  return `질문해 주셔서 감사합니다. 「${t.slice(0, 80)}${t.length > 80 ? "…" : ""}」에 대해 발표·채점 관점에서 정리해 보면:

• 내용: 주장이 한 문장으로 요약되는지, 근거(데이터·사례)가 붙어 있는지
• 전개: 도입에서 왜 이 주제인지, 본론에서 어떻게 풀었는지, 결론에서 무엇을 남길지
• 전달: 핵심 용어 설명, 시간 안에 끝나는지, 슬라이드와 말이 맞는지

를 점검해 보시면 좋습니다. 원하시면 PPT를 올려 주시면 구성 피드백을 같이 맞춰 드릴게요.`;
}

export function Chatbot() {
  const uploadId = useId();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: newId(),
      role: "bot",
      text:
        "PPT를 올리면 구성·분량·전달 쪽 피드백을 드리고, 궁금한 점을 물어보면 발표·채점 관점에서 답을 드릴 수 있어요. 위의 ‘PPT 올리기’에서 파일을 선택하거나, 아래에 메시지를 입력해 보세요.",
    },
  ]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function appendUserAndBot(userText: string, botText: string, isPptUpload?: boolean) {
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: "user", text: userText, isPptUpload },
      { id: newId(), role: "bot", text: botText },
    ]);
  }

  function handlePptFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    const ok = lower.endsWith(".ppt") || lower.endsWith(".pptx");
    if (!ok) {
      appendUserAndBot(
        `${file.name} 업로드 시도`,
        "`.ppt` 또는 `.pptx` 파일만 지원합니다. PowerPoint에서 다시 저장해 올려 주세요."
      );
      return;
    }
    appendUserAndBot(`PPT 업로드: ${file.name}`, pptFeedbackDemo(file.name), true);
  }

  function handleSend() {
    const t = text.trim();
    if (!t) return;
    setText("");
    appendUserAndBot(t, questionFeedbackDemo(t));
  }

  return (
    <div className="chatbot-page">
      <header className="chatbot-page__head">
        <h1 className="chatbot-page__title">챗봇</h1>
        <p className="chatbot-page__sub">
          PPT를 올리면 피드백을 드리고, 질문하시면 발표·채점 관점에서 답해 드립니다.
        </p>
        <div className="chatbot-page__upload">
          <input
            id={uploadId}
            type="file"
            className="chatbot-page__file"
            accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => {
              handlePptFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <label htmlFor={uploadId} className="chatbot-page__upload-btn">
            PPT 올리기
          </label>
          <span className="chatbot-page__upload-hint">.ppt · .pptx</span>
        </div>
      </header>

      <div className="chatbot-page__body" ref={bodyRef}>
        {messages.map((m) => (
          <div key={m.id} className={"chatbot-msg" + (m.role === "user" ? " chatbot-msg--user" : "")}>
            {m.role === "bot" && (
              <div className="chatbot-msg__avatar" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div
              className={
                "chatbot-bubble" +
                (m.role === "user" ? " chatbot-bubble--user" : "") +
                (m.isPptUpload ? " chatbot-bubble--ppt" : "")
              }
            >
              {m.role === "user" && m.isPptUpload ? (
                <span className="chatbot-bubble__tag">PPT</span>
              ) : null}
              <div className="chatbot-bubble__text">{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      <footer className="chatbot-inputbar">
        <input
          className="chatbot-input"
          placeholder="발표가 궁금한 점을 물어보세요 (구성, 긴장, 시간, PPT 등)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button type="button" className="chatbot-send" aria-label="보내기" onClick={handleSend}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" fill="currentColor" />
          </svg>
        </button>
      </footer>
    </div>
  );
}

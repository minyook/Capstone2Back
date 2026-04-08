import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, reload, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { mapAuthError } from "../firebase/authErrors";
import { AuthLayout } from "../components/AuthLayout";
import { IconEye, IconEyeOff } from "../components/Icons";
import "./auth.css";

export function Register() {
  const navigate = useNavigate();
  const { firebaseConfigured } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formEnabled = firebaseConfigured && Boolean(auth) && Boolean(db);
  const canSubmit = formEnabled && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!auth || !db) {
      setError("Firebase Auth·Firestore가 연결되지 않았습니다. .env와 콘솔 설정을 확인해 주세요.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 6자 이상으로 해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await reload(cred.user);
      await setDoc(doc(db, "users", cred.user.uid), {
        displayName: name.trim() || null,
        email: email.trim(),
        birthDate: birthDate || null,
        phone: phone.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      if (code.startsWith("auth/")) {
        setError(mapAuthError(code));
      } else if (code === "permission-denied") {
        setError(
          "가입은 되었지만 Firestore에 프로필을 저장하지 못했습니다. 콘솔 → Firestore → 규칙에서 쓰기를 허용했는지 확인해 주세요."
        );
      } else {
        setError(code ? `오류: ${code}` : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout wide>
      <div className="auth-form">
        <div className="auth-form__head">
          <button type="button" className="auth-back-link" onClick={() => navigate("/login")}>
            ← 로그인
          </button>
          <h1 className="auth-form__title">회원가입</h1>
        </div>
        <p className="auth-form__desc">
          Authentication에 계정을 만들고, 프로필은 Firestore <code>users/&lt;uid&gt;</code>에 저장됩니다.
        </p>

        {!firebaseConfigured && (
          <div className="auth-banner auth-banner--info" role="status">
            <strong>Firebase 미연결.</strong> <code>.env</code>에 <code>VITE_FIREBASE_*</code>를 넣고 개발 서버를 재시작한
            뒤, 콘솔에서 Firestore 데이터베이스를 생성하세요.
          </div>
        )}
        {firebaseConfigured && !db && (
          <div className="auth-banner auth-banner--info" role="status">
            Firestore 클라이언트를 초기화할 수 없습니다. <code>.env</code>의 projectId 등을 확인하세요.
          </div>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <div className="auth-grid">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-name">
                이름
              </label>
              <input
                id="reg-name"
                className="auth-input"
                placeholder="홍길동"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!formEnabled || busy}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-email">
                이메일 <span className="auth-req">*</span>
              </label>
              <input
                id="reg-email"
                className="auth-input"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!formEnabled || busy}
                required
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-birth">
                생년월일
              </label>
              <input
                id="reg-birth"
                className="auth-input"
                type="date"
                title="생년월일"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                disabled={!formEnabled || busy}
              />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reg-phone">
                휴대폰 번호
              </label>
              <input
                id="reg-phone"
                className="auth-input"
                type="tel"
                placeholder="010-0000-0000"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!formEnabled || busy}
              />
            </div>
            <div className="auth-field auth-grid__full">
              <label className="auth-label" htmlFor="reg-password">
                비밀번호 <span className="auth-req">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password"
                  className="auth-input"
                  type={showPw ? "text" : "password"}
                  placeholder="6자 이상"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!formEnabled || busy}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-input-icon"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={!formEnabled || busy}
                >
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <div className="auth-field auth-grid__full">
              <label className="auth-label" htmlFor="reg-password2">
                비밀번호 확인 <span className="auth-req">*</span>
              </label>
              <div className="auth-input-wrap">
                <input
                  id="reg-password2"
                  className="auth-input"
                  type={showPw2 ? "text" : "password"}
                  placeholder="비밀번호 다시 입력"
                  autoComplete="new-password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  disabled={!formEnabled || busy}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-input-icon"
                  onClick={() => setShowPw2(!showPw2)}
                  aria-label={showPw2 ? "비밀번호 숨기기" : "비밀번호 보기"}
                  disabled={!formEnabled || busy}
                >
                  {showPw2 ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="auth-btn auth-btn--mt" disabled={!canSubmit}>
            {busy ? "처리 중…" : "회원가입 완료"}
          </button>
        </form>

        <p className="auth-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

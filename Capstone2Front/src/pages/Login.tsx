import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  OAuthProvider,
  reload,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { mapAuthError } from "../firebase/authErrors";
import { AuthLayout } from "../components/AuthLayout";
import { IconGoogle, IconMicrosoft } from "../components/SocialAuthIcons";
import { IconEye, IconEyeOff } from "../components/Icons";
import "./auth.css";

export function Login() {
  const navigate = useNavigate();
  const { firebaseConfigured } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formEnabled = firebaseConfigured && Boolean(auth);
  const canSubmit = formEnabled && !busy;
  const socialEnabled = formEnabled;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!auth) {
      setError("Firebase가 연결되지 않았습니다. .env 설정을 확인해 주세요.");
      return;
    }
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await reload(cred.user);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    if (!auth) return;
    setError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      if (cred.user) await reload(cred.user);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code));
    } finally {
      setBusy(false);
    }
  }

  async function signInWithMicrosoft() {
    if (!auth) return;
    setError(null);
    setBusy(true);
    try {
      const provider = new OAuthProvider("microsoft.com");
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) await reload(cred.user);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
      setError(mapAuthError(code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <h1 className="auth-form__title">로그인</h1>
        <p className="auth-form__desc">
          등록된 이메일로 로그인합니다. (Firebase Authentication · 프로필은 Firestore에 저장)
        </p>

        {!firebaseConfigured && (
          <div className="auth-banner auth-banner--info" role="status">
            <strong>Firebase 미연결 상태입니다.</strong> 프로젝트 루트에 <code>.env</code>를 만들고{" "}
            <code>.env.example</code>의 <code>VITE_FIREBASE_*</code> 값을 채운 뒤, 콘솔에서 Authentication·Firestore를
            켜고 <code>npm run dev</code>를 다시 실행하세요.
          </div>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={submit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">
              이메일
            </label>
            <input
              id="login-email"
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
            <label className="auth-label" htmlFor="login-password">
              비밀번호
            </label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                className="auth-input"
                type={showPw ? "text" : "password"}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!formEnabled || busy}
                required
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

          <div className="auth-row-end">
            <Link className="auth-link" to="/forgot-password">
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <button type="submit" className="auth-btn" disabled={!canSubmit}>
            {busy ? "처리 중…" : "로그인"}
          </button>
        </form>

        <div className="auth-divider">또는</div>
        <div className="auth-social">
          <button
            type="button"
            className="auth-social-btn auth-social-btn--google"
            disabled={!socialEnabled || busy}
            onClick={signInWithGoogle}
          >
            <IconGoogle />
            Google로 계속하기
          </button>
          <button
            type="button"
            className="auth-social-btn auth-social-btn--ms"
            disabled={!socialEnabled || busy}
            onClick={signInWithMicrosoft}
          >
            <IconMicrosoft />
            Microsoft로 계속하기
          </button>
        </div>
        {!firebaseConfigured && (
          <p className="auth-hint auth-hint--center">소셜 로그인도 Firebase Authentication 설정 후 사용할 수 있습니다.</p>
        )}

        <p className="auth-footer">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

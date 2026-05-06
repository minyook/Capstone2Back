import subprocess
import os
from pathlib import Path
import numpy as np

from processing.vision_dto import FrameVisionResult, MediaPipeFaceResult, YoloPoseResult
from processing.face_analyzer import analyze_image

# YOLO: 제스처(포즈) 전용
try:
    from ultralytics import YOLO  # type: ignore

    _YOLO_AVAILABLE = True
    pose_model = YOLO("yolov8n-pose.pt")
except Exception:
    _YOLO_AVAILABLE = False
    pose_model = None

"""
MediaPipe는 FaceLandmarker(Tasks) 방식으로 통일합니다.
- 구현: processing/face_analyzer.py
- video_analyzer.py에서는 해당 모듈을 호출해 DTO로만 변환
"""

# === 기존 extract_audio 로직 (수정 없음) ===
def extract_audio(video_path: Path, output_audio_path: Path) -> Path:
    print(f"   > [1/6] 오디오 트랙 추출 중...")
    try:
        subprocess.run(['ffmpeg', '-i', str(video_path), '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', str(output_audio_path)], check=True, capture_output=True, text=True)
        print(f"   > [1/6] ✅ 오디오 추출 완료: {output_audio_path.name}")
        return output_audio_path
    except subprocess.CalledProcessError as e:
        raise Exception("FFmpeg 오디오 추출 실패")

# === 기존 extract_all_frames 로직 (수정 없음) ===
def extract_all_frames(video_path: Path, output_dir: Path, fps: int) -> list[Path]:
    print(f"   > [2/6] 비디오 프레임 추출 중... (초당 {fps} 프레임)")
    output_pattern = output_dir / "frame-%04d.jpg"
    try:
        subprocess.run(['ffmpeg', '-i', str(video_path), '-vf', f'fps={fps}', str(output_pattern)], check=True, capture_output=True, text=True) 
    except subprocess.CalledProcessError as e:
        raise Exception("FFmpeg 프레임 추출 실패")
    frames = sorted([f for f in output_dir.glob('*.jpg')])
    print(f"   > [2/6] ✅ {len(frames)}개 프레임 추출 완료.")
    return frames

def _clamp01(x: float) -> float:
    return float(max(0.0, min(1.0, x)))


def _safe_ratio(num: float, den: float, default: float = 0.0) -> float:
    if den == 0:
        return default
    return num / den


def analyze_frame_gesture_yolo(frame_path: str) -> dict:
    """
    YOLO는 제스처(포즈) 담당:
    - 사람 존재 여부
    - 골반/발목 가시성
    - 상세 제스처 (손 높이, 팔짱 등)
    """
    data = {
        "has_person": False,
        "has_pelvis": False,
        "has_ankles": False,
        "gesture_name": "Stand",
        "left_hand_state": "Low",
        "right_hand_state": "Low",
        "is_arm_crossed": False,
        "body_tilt": 0.0,
        "keypoints": []
    }

    if not _YOLO_AVAILABLE or pose_model is None:
        data["error"] = "ultralytics 미설치"
        return data

    results = pose_model(frame_path, verbose=False)

    if (
        results
        and len(results) > 0
        and getattr(results[0], "boxes", None) is not None
        and len(results[0].boxes) > 0
        and getattr(results[0], "keypoints", None) is not None
    ):
        data["has_person"] = True
        xy = results[0].keypoints.xy
        if len(xy) > 0 and len(xy[0]) > 0:
            kp = xy[0].cpu().numpy() # COCO format (17 points)
            data["keypoints"] = kp.tolist()

            # 가시성 체크 (11: L_Hip, 12: R_Hip, 15: L_Ankle, 16: R_Ankle)
            data["has_pelvis"] = bool(np.any(kp[11:13] > 0))
            data["has_ankles"] = bool(np.any(kp[15:17] > 0))

            # --- 제스처 분석 로직 ---
            # 어깨(5, 6), 팔꿈치(7, 8), 손목(9, 10), 골반(11, 12)
            l_sh, r_sh = kp[5], kp[6]
            l_el, r_el = kp[7], kp[8]
            l_wr, r_wr = kp[9], kp[10]
            l_hip, r_hip = kp[11], kp[12]

            def get_hand_state(wrist, shoulder, hip):
                if wrist[1] == 0: return "Unknown"
                if wrist[1] < shoulder[1]: return "High"
                if wrist[1] < hip[1]: return "Middle"
                return "Low"

            data["left_hand_state"] = get_hand_state(l_wr, l_sh, l_hip)
            data["right_hand_state"] = get_hand_state(r_wr, r_sh, r_hip)

            # 팔짱 끼기 체크 (손목이 반대편 팔꿈치 근처에 있는지)
            if l_wr[0] > 0 and r_wr[0] > 0 and l_el[0] > 0 and r_el[0] > 0:
                dist_l = np.linalg.norm(l_wr - r_el)
                dist_r = np.linalg.norm(r_wr - l_el)
                if dist_l < 50 and dist_r < 50: 
                    data["is_arm_crossed"] = True

            # 몸의 기울기
            if l_sh[1] > 0 and r_sh[1] > 0:
                data["body_tilt"] = float(l_sh[1] - r_sh[1])

            # 대표 제스처 이름 결정
            if data["is_arm_crossed"]: data["gesture_name"] = "Arms Crossed"
            elif data["left_hand_state"] == "High" or data["right_hand_state"] == "High": data["gesture_name"] = "Emphasizing"
            elif data["left_hand_state"] == "Middle" or data["right_hand_state"] == "Middle": data["gesture_name"] = "Active"
            else: data["gesture_name"] = "Normal Stand"

    return data


def analyze_frame_face_mediapipe(frame_path: str) -> dict:
    """
    (호환용) FaceLandmarker 기반 추출 결과를 dict로 반환합니다.
    """
    return analyze_image(frame_path)


def analyze_frame_combined(frame_path: str) -> dict:
    raise RuntimeError(
        "analyze_frame_combined()는 더 이상 dict를 반환하지 않습니다. "
        "task_manager에서 analyze_frame_vision()을 사용하세요."
    )


def analyze_frame_yolo_pose(frame_path: str) -> YoloPoseResult:
    y = analyze_frame_gesture_yolo(frame_path)
    return YoloPoseResult(
        has_person=bool(y.get("has_person", False)),
        has_pelvis=bool(y.get("has_pelvis", False)),
        has_ankles=bool(y.get("has_ankles", False)),
        gesture_name=str(y.get("gesture_name", "Stand")),
        left_hand_state=str(y.get("left_hand_state", "Low")),
        right_hand_state=str(y.get("right_hand_state", "Low")),
        is_arm_crossed=bool(y.get("is_arm_crossed", False)),
        body_tilt=float(y.get("body_tilt", 0.0)),
        keypoints=list(y.get("keypoints", []))
    )


def analyze_frame_face(frame_path: str) -> MediaPipeFaceResult:
    f = analyze_frame_face_mediapipe(frame_path)

    err = f.get("error")
    if err is not None:
        return MediaPipeFaceResult(has_face=False, error=str(err))

    return MediaPipeFaceResult(
        has_face=True,
        smile=float(f.get("smile", 0.0)),
        frown=float(f.get("frown", 0.0)),
        brow_up=float(f.get("brow_up", 0.0)),
        brow_down=float(f.get("brow_down", 0.0)),
        jaw_open=float(f.get("jaw_open", 0.0)),
        mouth_open=float(f.get("mouth_open", 0.0)),
        squint=float(f.get("squint", 0.0)),
        gaze_h=float(f.get("gaze_h", 0.0)),
        gaze_v=float(f.get("gaze_v", 0.0)),
        # 🌟 추가된 부분: MediaPipe에서 추출한 52개 상세 좌표를 DTO에 매핑
        all_blendshapes=f.get("all_blendshapes", {}),
        error=None,
    )


def analyze_frame_vision(frame_path: str, time_s: float) -> FrameVisionResult:
    """
    역할 분리된 프레임 분석:
    - YOLO: 사람/포즈 가시성
    - MediaPipe: 얼굴/표정/시선
    """
    yolo = analyze_frame_yolo_pose(frame_path)
    face = analyze_frame_face(frame_path)
    return FrameVisionResult(time=time_s, yolo=yolo, face=face)
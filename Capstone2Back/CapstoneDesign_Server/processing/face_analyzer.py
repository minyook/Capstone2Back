from __future__ import annotations

import os
from pathlib import Path

import numpy as np

try:
    import cv2  # type: ignore
    import mediapipe as mp  # type: ignore
    from mediapipe.tasks import python  # type: ignore
    from mediapipe.tasks.python import vision  # type: ignore

    _MP_AVAILABLE = True
except Exception:
    cv2 = None  # type: ignore
    mp = None  # type: ignore
    python = None  # type: ignore
    vision = None  # type: ignore
    _MP_AVAILABLE = False

# MediaPipe 설정
if _MP_AVAILABLE:
    FaceLandmarker = vision.FaceLandmarker
    FaceLandmarkerOptions = vision.FaceLandmarkerOptions
    VisionRunningMode = vision.RunningMode
else:
    FaceLandmarker = None
    FaceLandmarkerOptions = None
    VisionRunningMode = None

face_landmarker_instance = None

# 현재 파일 위치를 기준으로 절대 경로 재구성
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "face_landmarker.task"

def setup_face_landmarker():
    """MediaPipe 모델을 로드합니다."""
    global face_landmarker_instance
    if not _MP_AVAILABLE:
        return None
    if face_landmarker_instance:
        return face_landmarker_instance

    model_path_str = os.path.abspath(str(MODEL_PATH))
    print(f"\n   > [1/5] AI 모델 로드 시도: {model_path_str}")
    
    if not os.path.exists(model_path_str):
        print(f"❌ 파일을 찾을 수 없습니다: {model_path_str}")
        raise FileNotFoundError(f"모델 파일이 없습니다.")

    try:
        # 🌟 핵심 수정 부분: 파이썬이 파일을 직접 읽어서 바이트 데이터로 만듭니다! (한글 경로 에러 원천 차단)
        with open(model_path_str, 'rb') as f:
            model_data = f.read()
            
        # 경로(model_asset_path) 대신 데이터(model_asset_buffer)를 전달합니다.
        base_options = python.BaseOptions(model_asset_buffer=model_data)
        
        options = FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=VisionRunningMode.IMAGE,
            num_faces=1,
            output_face_blendshapes=True
        )
        face_landmarker_instance = FaceLandmarker.create_from_options(options)
        print("   > [1/5] ✅ MediaPipe 모델 로드 완료.")
        return face_landmarker_instance
    except Exception as e:
        print(f"❌ 로드 실패: {e}")
        raise

def _process_blendshapes(blendshapes: list) -> dict:
    """얼굴 특징 수치를 계산하여 반환합니다."""
    if not blendshapes:
        return {}
        
    cats = {c.category_name: c.score for c in blendshapes[0]}
    
    def pick(n):
        return cats.get(n, 0)

    # 시선, 웃음, 찡그림 등 계산
    gaze_h = ((pick('eyeLookOutLeft') - pick('eyeLookInLeft')) + (pick('eyeLookInRight') - pick('eyeLookOutRight'))) / 2
    gaze_v = ((pick('eyeLookUpLeft') - pick('eyeLookDownLeft')) + (pick('eyeLookUpRight') - pick('eyeLookDownRight'))) / 2
    smile = (pick('mouthSmileLeft') + pick('mouthSmileRight')) / 2
    frown = (pick('mouthFrownLeft') + pick('mouthFrownRight')) / 2
    brow_down = (pick('browDownLeft') + pick('browDownRight')) / 2
    jaw_open = pick('jawOpen')
    
    brow_up = (pick('browInnerUp') + pick('browOuterUpLeft') + pick('browOuterUpRight')) / 3
    mouth_open = pick('mouthOpen')
    squint = (pick('eyeSquintLeft') + pick('eyeSquintRight')) / 2
    
    return {
        "gaze_h": gaze_h,
        "gaze_v": gaze_v,
        "smile": smile,
        "frown": frown,
        "brow_down": brow_down,
        "jaw_open": jaw_open,
        "brow_up": brow_up,
        "mouth_open": mouth_open,
        "squint": squint,
        "all_blendshapes": cats
    }

def analyze_image(image_path: str) -> dict:
    """task_manager에서 호출하는 핵심 함수입니다."""
    landmarker = setup_face_landmarker()
    if not landmarker:
        if not _MP_AVAILABLE:
            return {"error": "mediapipe 미설치(가상환경에 mediapipe가 없음)"}
        return {"error": "모델 미로드"}
    
    try:
        if cv2 is None or mp is None:
            return {"error": "mediapipe/cv2 초기화 실패"}
        image_bgr = cv2.imread(image_path)
        if image_bgr is None:
            return {"error": "이미지 읽기 실패"}
        
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
        results = landmarker.detect(mp_image)
        
        if results.face_blendshapes:
            return _process_blendshapes(results.face_blendshapes)
        else:
            return {"error": "얼굴 미검출"}
            
    except Exception as e:
        return {"error": str(e)}
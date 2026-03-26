import subprocess
import os
from pathlib import Path
from ultralytics import YOLO
import numpy as np

# 🌟 추가: YOLO 모델 로드 (가벼운 nano 버전)
pose_model = YOLO('yolov8n-pose.pt') 

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

# === 🌟 신규: YOLO 기반 프레임 분석 ===
def analyze_frame_yolo(frame_path: str) -> dict:
    results = pose_model(frame_path, verbose=False)
    
    # 🌟 data_combiner.py가 찾는 9가지 표정/시선 키값을 모두 0.0으로 초기화!
    data = {
        "has_person": False, "has_face": False, "has_pelvis": False, "has_ankles": False,
        "smile": 0.0, 
        "frown": 0.0, 
        "brow_up": 0.0, 
        "brow_down": 0.0, 
        "jaw_open": 0.0, 
        "mouth_open": 0.0, 
        "squint": 0.0, 
        "gaze_h": 0.0, 
        "gaze_v": 0.0
    }
    
    # 🌟 이하 방어 로직 (동일)
    if results and len(results) > 0 and len(results[0].boxes) > 0 and results[0].keypoints is not None:
        data["has_person"] = True
        xy = results[0].keypoints.xy
        
        if len(xy) > 0 and len(xy[0]) > 0:
            keypoints = xy[0].cpu().numpy()
            data["has_face"] = np.any(keypoints[0:5] > 0)
            data["has_pelvis"] = np.any(keypoints[11:13] > 0)
            data["has_ankles"] = np.any(keypoints[15:17] > 0)
            
            if data["has_face"]:
                data["smile"] = np.random.uniform(0.5, 1.0) # 임시 스마일 수치
    else:
        data["error"] = "얼굴/사람 미검출"
        
    return data
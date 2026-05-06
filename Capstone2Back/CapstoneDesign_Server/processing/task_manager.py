from pathlib import Path
import time as timer 
import traceback
import json  # 🌟 추가: JSON 파일 저장을 위해 필요

# 모든 처리 모듈 임포트
from processing.video_analyzer import extract_all_frames, extract_audio, analyze_frame_vision
from processing.audio_analyzer import transcribe_audio_with_timestamps, analyze_prosody_for_segments
from processing.data_combiner import align_data
from utils.helpers import cleanup_dirs

# 🌟 신규 임포트
from utils.quality_checker import check_video_quality, check_audio_quality
from schemas.video_type import VideoType
from core.llama_client import get_feedback_from_coach
from core.exceptions import QualityException

FRAME_RATE = 5
job_status = {} 

def run_analysis_task(job_id: str, video_path: Path, frame_dir: Path, video_dir: Path, custom_criteria: list):
    all_vision_results = []
    audio_path = frame_dir / "audio.wav" 
    
    # 🌟 4단계 분류를 위한 영상 전체의 최대 가시성 추적
    max_visibility = {"face": False, "pelvis": False, "ankles": False}
    
    try:
        print(f"\n{'='*60}\n🚀 분석 시작 (Job ID: {job_id})\n{'='*60}")

        # 0. 품질 검증
        job_status[job_id] = {"status": "Checking", "message": "0/6: 품질 검사 중..."}
        if not check_video_quality(video_path): raise QualityException("영상 화질이 너무 낮거나 손상되었습니다.")
        if not check_audio_quality(video_path): raise QualityException("오디오 트랙을 찾을 수 없습니다.")

        # 1 & 2. 오디오/프레임 추출
        extract_audio(video_path, audio_path)
        frame_paths = extract_all_frames(video_path, frame_dir, FRAME_RATE)
        if not frame_paths: raise Exception("비디오 프레임 추출 실패.")
        
        # 3. YOLO(제스처) + MediaPipe(표정/시선) 실시간 분석
        print(f"\n[3/6] 👀 시각 데이터(YOLO & MediaPipe) 추출 중... (터미널 출력 생략)")
        for i, path in enumerate(frame_paths):
            current_time = i / FRAME_RATE
            frame = analyze_frame_vision(str(path), current_time)
            all_vision_results.append(frame)
            
            # 가시성 업데이트
            if frame.face.has_face:
                max_visibility["face"] = True
            
            # YOLO 감지 데이터 업데이트 (객체 속성 확인 방식 대응)
            yolo_data = frame.yolo
            if hasattr(yolo_data, 'has_pelvis'):
                if yolo_data.has_pelvis: max_visibility["pelvis"] = True
                if yolo_data.has_ankles: max_visibility["ankles"] = True
            
        print(f"   > ✅ 시각 데이터 추출 완료.")

        # 🌟 [시각화 체크용] 첫 번째 프레임의 분석 결과를 이미지로 저장
        if all_vision_results and frame_paths:
            import cv2
            debug_frame = cv2.imread(str(frame_paths[0]))
            y_res = all_vision_results[0].yolo
            # 제스처 이름 그리기
            cv2.putText(debug_frame, f"Gesture: {y_res.gesture_name}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(debug_frame, f"L-Hand: {y_res.left_hand_state}", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(debug_frame, f"R-Hand: {y_res.right_hand_state}", (50, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            check_dir = Path("out/aa/testopen")
            check_dir.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(check_dir / "yolo_check.jpg"), debug_frame)
            print(f"   > 🖼️ [시각화 체크] 분석 샘플 이미지가 저장되었습니다: {check_dir / 'yolo_check.jpg'}")

        # 4 & 5. Whisper 및 Praat 음성 분석
        job_status[job_id] = {"status": "Analyzing", "message": "4/6: 로컬 음성 인식 실행 중..."}
        audio_segments, whisper_error = transcribe_audio_with_timestamps(str(audio_path))
        
        # 🌟 신규: 목소리가 아예 없는 경우 방어 로직
        if not audio_segments: 
            print(f"\n[4/6] ⚠️ 목소리 텍스트가 추출되지 않았습니다. (음성 분석 스킵)")
            aligned_data = [] # 데이터 정렬 건너뛰기
        else:
            print(f"\n[4/6] ✅ 로컬 음성 인식 완료.")
            audio_segments = analyze_prosody_for_segments(audio_path, audio_segments)
            print(f"\n[5/6] ✅ 운율 분석 완료.")
            
            job_status[job_id] = {"status": "Analyzing", "message": "6/6: 데이터 정렬 중..."}
            aligned_data = align_data(all_vision_results, audio_segments)

        # ==========================================
        # 🌟 4단계 비디오 분류 및 LLaMA 코칭
        # ==========================================
        if max_visibility["ankles"]: video_type = VideoType.FULL_BODY
        elif max_visibility["pelvis"]: video_type = VideoType.UPPER_BODY
        elif max_visibility["face"]: video_type = VideoType.FACE_ONLY
        else: video_type = VideoType.VOICE_ONLY
        
        print(f"\n📊 [분석 결과] 영상 타입 판별: {video_type.value}")
        
        # LLaMA 피드백 요청
        ppt_context = "현재 슬라이드 내용: 서론 및 연구 배경"
        voice_summary = f"총 {len(audio_segments)}개 음성 구간 검출 완료."
        
        llama_prompt = f"영상 타입: {video_type.value}\n[목소리 분석] {voice_summary}\n발표자 조언 작성."
        llama_feedback = get_feedback_from_coach(llama_prompt)
        
        print(f"\n{'='*20} 🤖 LLaMA 발표 코치 피드백 {'='*20}")
        print(llama_feedback)

        # ==========================================
        # 🌟 [신규 추가] 시간대별 상세 좌표 통합 JSON 저장 (MediaPipe & YOLO)
        # ==========================================
        time_series_face = {}
        time_series_gesture = {}

        for i, res in enumerate(all_vision_results):
            seconds = i / FRAME_RATE
            mins, secs = divmod(seconds, 60)
            hours, mins = divmod(mins, 60)
            timestamp_key = f"{int(hours):02d}:{int(mins):02d}:{int(secs):02d}.{int((seconds % 1) * 100):02d}"
            
            # 1. MediaPipe 얼굴 데이터 정렬
            main_state = "정면 응시 / 진지함"
            if res.face.has_face:
                if res.face.smile > 0.5: main_state = "미소 감지"
                elif res.face.squint > 0.5: main_state = "집중 / 찌푸림"
                elif abs(res.face.gaze_h) > 0.3: main_state = "시선 분산 (좌우)"
                elif res.face.brow_up > 0.5: main_state = "눈썹 치켜뜸 (강조)"
            else:
                main_state = "얼굴 미검출"
            
            face_data = res.face.to_dict()
            time_series_face[timestamp_key] = {
                "info": {"frame_index": i, "main_state": main_state},
                "blendshapes": face_data.get("all_blendshapes", {})
            }

            # 2. YOLO 제스처 데이터 정렬
            yolo_data = res.yolo.to_dict()
            time_series_gesture[timestamp_key] = {
                "gesture_name": yolo_data["gesture_name"],
                "left_hand": yolo_data["left_hand_state"],
                "right_hand": yolo_data["right_hand_state"],
                "is_arm_crossed": yolo_data["is_arm_crossed"],
                "body_tilt": yolo_data["body_tilt"],
                "keypoints": yolo_data["keypoints"] # 프론트엔드 시각화용
            }

        # MediaPipe JSON 저장
        face_out_dir = Path("processing/MediaPipe_json")
        face_out_dir.mkdir(parents=True, exist_ok=True)
        with open(face_out_dir / "final_time_series.json", 'w', encoding='utf-8') as f:
            json.dump(time_series_face, f, indent=4, ensure_ascii=False)
        
        # YOLO JSON 저장 (요청사항)
        yolo_out_dir = Path("processing/Yolo_json")
        yolo_out_dir.mkdir(parents=True, exist_ok=True)
        with open(yolo_out_dir / "gesture_time_series.json", 'w', encoding='utf-8') as f:
            json.dump(time_series_gesture, f, indent=4, ensure_ascii=False)
        
        print(f"\n✨ [분석 완료] 시계열 통합 데이터 저장됨:")
        print(f"   > MediaPipe: {face_out_dir / 'final_time_series.json'}")
        print(f"   > YOLO: {yolo_out_dir / 'gesture_time_series.json'}")
        # ==========================================

        raw_data_json = [f.to_dict() for f in all_vision_results]
        final_result = {
            "video_type": video_type.value,
            "llama_feedback": llama_feedback,
            "raw_data": raw_data_json,
            "aligned_transcript_data": aligned_data
        }
        
        job_status[job_id] = {"status": "Complete", "result": final_result}
        print(f"✅ 모든 분석 작업 완료! (Job: {job_id})")

    except Exception as e:
        print(f"\n❌ 작업 실패 (Job: {job_id}) | 오류: {e}")
        traceback.print_exc()
        job_status[job_id] = {"status": "Error", "message": str(e)}
    finally:
        cleanup_dirs(video_dir, frame_dir)
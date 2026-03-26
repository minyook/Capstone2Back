from pathlib import Path
import time as timer 
import traceback

# 모든 처리 모듈 임포트
from processing.video_analyzer import extract_all_frames, extract_audio, analyze_frame_yolo
from processing.audio_analyzer import transcribe_audio_with_timestamps, analyze_prosody_for_segments
from processing.data_combiner import align_data
from utils.helpers import cleanup_dirs

# 🌟 신규 임포트
from utils.quality_checker import check_video_quality, check_audio_quality
from schemas.video_type import VideoType
from core.llama_client import get_llama_feedback
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
        total_frames = len(frame_paths)
        
        # 3. 🌟 YOLO 실시간 분석 및 터미널 출력
        print(f"\n[3/6] 👀 실시간 YOLO 포즈/표정 데이터 추출 시작...")
        for i, path in enumerate(frame_paths):
            data = analyze_frame_yolo(str(path))
            current_time = i / FRAME_RATE
            data["time"] = current_time
            all_vision_results.append(data)
            
            # 가시성 업데이트
            if data["has_face"]: max_visibility["face"] = True
            if data["has_pelvis"]: max_visibility["pelvis"] = True
            if data["has_ankles"]: max_visibility["ankles"] = True
            
            # 터미널 출력 (기존 스타일 유지)
            if "error" not in data:
                print(f"  > [{current_time:5.1f}s] YOLO | 얼굴:{data['has_face']} 골반:{data['has_pelvis']} 발목:{data['has_ankles']}")
            else:
                print(f"  > [{current_time:5.1f}s] ⚠️ 얼굴/사람 미검출")

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
        # 🌟 4단계 비디오 분류 및 LLaMA 코칭 (이전 코드와 동일하게 유지)
        # ==========================================
        if max_visibility["ankles"]: video_type = VideoType.FULL_BODY
        elif max_visibility["pelvis"]: video_type = VideoType.UPPER_BODY
        elif max_visibility["face"]: video_type = VideoType.FACE_ONLY
        else: video_type = VideoType.VOICE_ONLY
        
        print(f"\n📊 [분석 결과] 영상 타입 판별: {video_type.value}")
        
        # LLaMA 프롬프트 조립
        ppt_context = "현재 슬라이드 내용: 서론 및 연구 배경" # 임시
        voice_summary = f"총 {len(audio_segments)}개 음성 구간 검출, 떨림(Jitter/Shimmer) 분석 완료."
        
        llama_prompt = f"""
        영상 타입: {video_type.value}
        [PPT 요약] {ppt_context}
        [목소리 분석] {voice_summary}
        위 데이터를 바탕으로 발표자에게 적절한 자세와 목소리 톤에 대한 조언을 작성하세요.
        """
        
        llama_feedback = get_llama_feedback(llama_prompt)
        
        print(f"\n{'='*20} 🤖 LLaMA 발표 코치 피드백 {'='*20}")
        print(llama_feedback)
        print(f"{'='*60}")

        final_result = {
            "video_type": video_type.value,
            "llama_feedback": llama_feedback,
            "raw_data": all_vision_results,
            "aligned_transcript_data": aligned_data
        }
        
        job_status[job_id] = {"status": "Complete", "result": final_result}
        print(f"✅ 작업 완료! 모든 데이터가 터미널에 정리되었습니다. (Job: {job_id})")

    except Exception as e:
        print(f"\n❌ 작업 실패 (Job: {job_id}) | 오류: {e}")
        traceback.print_exc() # 🌟 핵심! 이제 에러가 나면 몇 번째 줄인지 쫙 알려줍니다.
        job_status[job_id] = {"status": "Error", "message": str(e)}
    finally:
        cleanup_dirs(video_dir, frame_dir)
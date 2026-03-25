from pathlib import Path
import time as timer 

# 모든 처리 모듈 임포트
from processing.video_analyzer import extract_all_frames, extract_audio
from processing.face_analyzer import analyze_image
from processing.audio_analyzer import transcribe_audio_with_timestamps, analyze_prosody_for_segments
# ai_scorer는 더 이상 사용하지 않으므로 임포트하지 않거나 주석 처리 가능합니다.
from processing.data_combiner import align_data
from utils.helpers import cleanup_dirs

FRAME_RATE = 5
job_status = {} 

def run_analysis_task(job_id: str, video_path: Path, frame_dir: Path, video_dir: Path, custom_criteria: list):
    """
    전체 분석 파이프라인: 터미널 데이터 출력 모드
    """
    all_vision_results = []
    audio_path = frame_dir / "audio.wav" 
    
    try:
        print(f"\n{'='*60}\n🚀 분석 시작 (Job ID: {job_id})\n{'='*60}")

        # 1. 오디오 추출
        job_status[job_id] = {"status": "Analyzing", "message": "1/6: 오디오 트랙 추출 중..."}
        extract_audio(video_path, audio_path)
        
        # 2. 프레임 추출
        job_status[job_id] = {"status": "Analyzing", "message": "2/6: 비디오 프레임 추출 중..."}
        frame_paths = extract_all_frames(video_path, frame_dir, FRAME_RATE)
        
        if not frame_paths:
            raise Exception("비디오에서 프레임을 추출할 수 없습니다.")
        
        total_frames = len(frame_paths)
        
        # 3. 각 프레임 분석 (MediaPipe) 및 터미널 출력
        job_status[job_id] = {"status": "Analyzing", "message": f"3/6: 얼굴 데이터 분석 중..."}
        print(f"\n[3/6] 👀 실시간 시선/표정 데이터 추출 시작...")
        
        for i, path in enumerate(frame_paths):
            data = analyze_image(str(path))
            current_time = i / FRAME_RATE
            data["time"] = current_time
            all_vision_results.append(data)
            
            # --- 실시간 터미널 로그 출력 ---
            if "error" not in data:
                print(f"  > [{current_time:5.1f}s] 시선: H({data['gaze_h']:+.2f}) V({data['gaze_v']:+.2f}) | "
                      f"표정: 웃음({data['smile']:.2f}) 찡그림({data['frown']:.2f}) 😲입벌림({data['mouth_open']:.2f})")
            else:
                print(f"  > [{current_time:5.1f}s] ⚠️ 얼굴 미검출")
            
            if i % 20 == 0:
                job_status[job_id]["progress"] = i + 1
                job_status[job_id]["total"] = total_frames

        # 4. 음성 인식 (로컬 Whisper)
        job_status[job_id] = {"status": "Analyzing", "message": "4/6: 로컬 음성 인식(Whisper) 실행 중..."}
        audio_segments, whisper_error = transcribe_audio_with_timestamps(str(audio_path))
        
        if whisper_error:
            print(f"❌ 음성 인식 오류: {whisper_error}")
            audio_segments = []
        else:
            print(f"\n[4/6] ✅ 음성 인식 완료.")

        # 5. 음성 운율 분석 (Praat)
        job_status[job_id] = {"status": "Analyzing", "message": "5/6: 음성 운율(목소리 떨림) 분석 중..."}
        audio_segments = analyze_prosody_for_segments(audio_path, audio_segments)

        # 6. 데이터 정렬 및 최종 출력
        job_status[job_id] = {"status": "Analyzing", "message": "6/6: 데이터 정렬 중..."}
        
        # 데이터 정렬
        aligned_data = align_data(all_vision_results, audio_segments)
        
        # --- 최종 정렬 데이터 터미널 요약 출력 ---
        print(f"\n{'='*20} 📊 분석 최종 결과 요약 {'='*20}")
        for seg in aligned_data:
            print(f"\n[구간: {seg['start']:.1f}s ~ {seg['end']:.1f}s]")
            print(f" 🎤 대사: {seg['text']}")
            print(f" 🫨 떨림: Jitter({seg['prosody']['jitter']:.3f}%), Shimmer({seg['prosody']['shimmer']:.3f}%)")
            
            vis = seg['vision_avg']
            if "error" not in vis:
                print(f" 😊 표정평균: 웃음({vis['smile']:.2f}), 찡그림({vis['frown']:.2f}), 시선H({vis['gaze_h']:+.2f})")
            else:
                print(" ⚠️ 표정평균: 이 구간은 얼굴 데이터가 없습니다.")
        print(f"\n{'='*60}")

        final_result = {
            "analysis_summary": {
                "total_frames_processed": len(all_vision_results),
                "duration_analyzed_sec": len(all_vision_results) / FRAME_RATE,
                "face_detected_frames": len([f for f in all_vision_results if "error" not in f]),
            },
            "raw_data": all_vision_results,
            "aligned_transcript_data": aligned_data
        }
        
        job_status[job_id] = {"status": "Complete", "result": final_result}
        print(f"✅ 작업 완료! 모든 데이터가 터미널에 정리되었습니다. (Job: {job_id})")

    except Exception as e:
        print(f"\n❌ 작업 실패 (Job: {job_id}) | 오류: {e}")
        job_status[job_id] = {"status": "Error", "message": str(e)}
    
    finally:
        # 데이터셋 확보를 위해 임시 파일을 확인하고 싶다면 아래 줄을 주석 처리하세요.
        cleanup_dirs(video_dir, frame_dir)
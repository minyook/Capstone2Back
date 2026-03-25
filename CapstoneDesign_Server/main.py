import os
import uvicorn
import uuid 
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks

# 임포트 경로 확인
from utils.helpers import setup_temp_dirs, create_session_dirs, save_upload_file
from utils.json_helpers import setup_json_dirs
from processing.face_analyzer import setup_face_landmarker
from processing.audio_analyzer import load_local_whisper_model
from processing.task_manager import run_analysis_task, job_status

BASE_DIR = Path(__file__).resolve().parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.name == 'nt':
        os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

    print("\n" + "="*50)
    print("🚀 데이터 추출 서버 시작 (자동 분석 모드)")
    print("="*50)
    
    setup_temp_dirs()
    setup_json_dirs() 
    
    try:
        setup_face_landmarker()
        load_local_whisper_model()
        
        # --- 🟢 자동 분석 하드코딩 구간 🟢 ---
        test_file = BASE_DIR / "adiotest.mp4"
        if test_file.exists():
            print(f"\n📦 테스트 파일 발견: {test_file.name}")
            print("⚙️ 즉시 분석을 시작합니다...\n")
            
            # 분석에 필요한 임시 폴더 생성
            video_dir, frame_dir = create_session_dirs()
            
            # 파일을 분석 위치로 복사하거나 경로 지정
            job_id = "AUTO_TEST_001"
            job_status[job_id] = {"status": "Started"}
            
            # 서버 시작 직후 비동기로 분석 함수 실행
            asyncio.create_task(asyncio.to_thread(
                run_analysis_task, job_id, test_file, frame_dir, video_dir, []
            ))
        else:
            print(f"\n⚠️ 자동 분석 실패: {test_file.name} 파일이 없습니다.")
        # ----------------------------------

    except Exception as e:
        print(f"❌ 초기화 오류: {e}")
        
    yield
    print("\n" + "="*50)
    print("서버가 종료됩니다.")
    print("="*50)

app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False) # 자동실행 시 reload는 False 권장

    # .\venv\Scripts\activate    python main.py  http://127.0.0.1:8000
    # pip install -r requirements.txt (라이브러리 설치)
    # http://127.0.0.1:8000/chat

    # --------------핸드폰으로 실행 방법-----------------
    # .\venv\Scripts\activate
    # uvicorn main:app --host 0.0.0.0 --port 8000 (서버 키기)


    #---------------캡디 2---------
    # # 1. 가상환경 활성화 (필요한 경우)
#    .\venv\Scripts\activate
# pip install fastapi uvicorn mediapipe opencv-python openai-whisper parselmouth numpy python-multipart python-dotenv
# 위에 가상환경에서 다운로드한것
# 2. 서버 실행
#   python main.py
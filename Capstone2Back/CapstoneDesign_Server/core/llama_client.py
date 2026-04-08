import ollama

def get_feedback_from_coach(vision_audio_data: str) -> str:
    """
    [용도 1] 분석 파이프라인용 (영상 분석 후 피드백 받을 때 사용)
    - 모델: presenter-coach
    """
    try:
        response = ollama.chat(
            model='presenter-coach',
            messages=[{'role': 'user', 'content': vision_audio_data}]
        )
        return response['message']['content']
    except Exception as e:
        return f"코칭 AI 응답 실패: {e}"


def chat_with_mentor(user_message: str, chat_history: list = None) -> list:
    """
    [용도 2] 챗봇 서비스용 (대본 작성, 발표 조언 등)
    """
    if chat_history is None:
        chat_history = []
        
    chat_history.append({'role': 'user', 'content': user_message})
    
    try:
        print("\n[🤖 챗봇 AI 답변 작성 중...]: ", end="", flush=True)
        
        # 🌟 핵심: stream=True 옵션을 켜서 글자를 한 글자씩 실시간으로 받아옵니다!
        response = ollama.chat(
            model='presenter-chatbot',
            messages=chat_history,
            stream=True 
        )
        
        full_reply = ""
        for chunk in response:
            word = chunk['message']['content']
            # 터미널에 한 글자씩 바로바로 출력
            print(word, end="", flush=True)
            full_reply += word
            
        print("\n") # 다 치면 줄바꿈
        
        # 전체 답변을 완성해서 기록에 추가
        chat_history.append({'role': 'assistant', 'content': full_reply})
        return chat_history
        
    except Exception as e:
        print(f"\n❌ 챗봇 AI 응답 실패: {e}")
        return chat_history

# ==========================================
# 🧪 테스트 실행 코드
# ==========================================
if __name__ == "__main__":
    print("=== 1. 피드백 코치 테스트 ===")
    mock_data = "데이터: 어깨 기울어짐, 목소리 떨림 감지됨"
    print(get_feedback_from_coach(mock_data))
    
    print("\n=== 2. 챗봇 멘토 테스트 (대본 짜기) ===")
    history = []
    
    # 첫 번째 질문
    print("\nUser: 캡스톤 디자인 최종 발표 오프닝 멘트 좀 추천해줘. 주제는 AI 프레젠테이션 코치야.")
    history = chat_with_mentor("캡스톤 디자인 최종 발표 오프닝 멘트 좀 추천해줘. 주제는 AI 프레젠테이션 코치야.", history)
    print(f"AI: {history[-1]['content']}")
    
    # 이어지는 질문 (문맥 유지 테스트)
    print("\nUser: 첫 번째 걸로 할게. 그 다음엔 어떤 내용을 말하면 좋을까?")
    history = chat_with_mentor("첫 번째 걸로 할게. 그 다음엔 어떤 내용을 말하면 좋을까?", history)
    print(f"AI: {history[-1]['content']}")
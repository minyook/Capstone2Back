import ollama

def get_llama_feedback(prompt: str) -> str:
    print(f"\n[7/7] 🧠 LLaMA 코칭 요청 중...")
    try:
        # 민욱님이 추후 파인튜닝할 모델명 (예: 'llama3' 또는 'presenter-bot')
        response = ollama.chat(model='llama3', messages=[ 
            {'role': 'system', 'content': '당신은 전문 스피치 코치입니다. 데이터를 보고 3줄 이내의 날카로운 조언을 해주세요.'},
            {'role': 'user', 'content': prompt}
        ])
        return response['message']['content']
    except Exception as e:
        return f"LLaMA 코칭 생성 실패: {e}"
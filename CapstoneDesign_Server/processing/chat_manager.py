# chat_manager.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
apikey = os.getenv("OPENAI_API_KEY")
client = None
if apikey and apikey.startswith("sk-"):
    try:
        client = OpenAI(api_key=apikey)
    except Exception as e:
        print("OpenAI Setting Error:", e)
        client = None

def ask_gpt(prompt):
    if not client:
        return "OpenAI API Key가 설정되지 않았습니다."
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error: {e}"

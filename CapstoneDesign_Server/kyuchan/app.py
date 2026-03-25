# app.py
import os
from flask import Flask, request, jsonify, render_template, send_file # safe_join 제거
from werkzeug.utils import safe_join # <--- werkzeug.utils에서 safe_join을 가져옴
from report_generator import create_pdf, save_summary_excel

app = Flask(__name__)

# 결과 폴더 및 폰트 폴더 경로 설정 (프로젝트 루트 기준으로)
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
RESULTPDF_DIR = os.path.join(PROJECT_ROOT, "results", "pdf")
RESULTEXCEL_DIR = os.path.join(PROJECT_ROOT, "results", "excel")

# 1. HTML 파일 제공 (GET 요청)
@app.route("/")
def index():
    # index.html 파일이 Flask 실행 위치와 같은 폴더에 있다고 가정
    try:
        with open("index.html", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "index.html 파일을 찾을 수 없습니다.", 500

# 2. 보고서 생성 API (POST 요청)
@app.route("/generate_report", methods=["POST"])
def generate_report():
    data = request.get_json()
    team_name = data.get("teamName")
    presentation_topic = data.get("presentationTopic")
    criteria = data.get("criteria")
    grading_result = data.get("gradingResult")

    if not all([team_name, presentation_topic, criteria, grading_result]):
        return jsonify({"error": "필수 데이터가 부족합니다."}), 400

    try:
        # 파일 생성 함수 호출
        create_pdf(team_name, criteria, grading_result)
        save_summary_excel(team_name, presentation_topic, criteria, grading_result)

        return jsonify({"status": "success"})

    except FileNotFoundError as e:
        # 폰트 파일이 없을 경우 (1단계 3번 확인)
        return jsonify({"error": f"파일 생성 실패 (폰트 오류): {str(e)}"}), 500
    except Exception as e:
        print(f"[ERROR] 보고서 생성 중 오류 발생: {e}")
        return jsonify({"error": f"보고서 생성 실패: {str(e)}"}), 500

# 3. 파일 다운로드 API (GET 요청)
@app.route("/download/<file_type>/<file_id>", methods=["GET"])
def download_file(file_type, file_id):
    if file_type == "pdf":
        directory = RESULTPDF_DIR
        filename = f"{file_id}.pdf"
        mime_type = "application/pdf"
    elif file_type == "excel":
        directory = RESULTEXCEL_DIR
        filename = f"{file_id}.xlsx"
        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        return jsonify({"error": "유효하지 않은 파일 타입입니다."}), 400

    file_path = safe_join(directory, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": f"파일을 찾을 수 없습니다: {filename}"}), 404

    try:
        return send_file(file_path, as_attachment=True, download_name=filename, mimetype=mime_type)
    except Exception as e:
        return jsonify({"error": f"파일 다운로드 중 오류가 발생했습니다: {e}"}), 500

if __name__ == "__main__":
    app.run(debug=True)
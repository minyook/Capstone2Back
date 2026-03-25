# report_generator.py
from fpdf import FPDF
import pandas as pd
import os
import time

# Flask에서 호출될 함수 1: PDF 보고서 생성
def create_pdf(team_name, criteria, grading_result):
    pdf = FPDF()

    # 🔧 폴더 존재하지 않으면 자동 생성
    pdf_dir = os.path.join("results", "pdf")
    os.makedirs(pdf_dir, exist_ok=True)
    
    # 폰트 경로 설정 (현재 프로젝트 구조에 맞게)
    CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
    FONT_PATH = os.path.join(CURRENT_DIR, "fonts", "malgun.ttf")
    if not os.path.exists(FONT_PATH):
        raise FileNotFoundError(f"❌ 폰트 파일을 찾을 수 없습니다: {FONT_PATH}. 1단계 3번을 확인하세요.")
    
    # 폰트 등록 및 설정
    pdf.add_font('malgun', '', FONT_PATH, uni=True)
    pdf.add_font('malgun', 'B', FONT_PATH, uni=True)
    pdf.add_page()

    # 1. 제목: 팀명
    pdf.set_font('malgun', 'B', 20)
    pdf.multi_cell(0, 10, f"{team_name} 팀", align="C")
    pdf.ln(10)

    # 2. 평가 기준
    pdf.set_font('malgun', 'B', 14)
    pdf.cell(0, 10, "평가 기준", ln=True)
    pdf.set_font('malgun', '', 12)
    total_weight = sum(c["weight"] for c in criteria)
    for c in criteria:
        pdf.cell(0, 8, f"• {c['name']} : {c['weight']}점", ln=True)
    pdf.cell(0, 8, f"• 합계 : {total_weight}점", ln=True)
    pdf.ln(5)

    # 3. 채점 결과
    pdf.set_font('malgun', 'B', 14)
    pdf.cell(0, 10, "채점 결과", ln=True)
    pdf.ln(3)

    pdf.set_font("malgun", '', 12)
    total_score = 0

    for i, criterion in enumerate(criteria):
        name = criterion["name"]
        # 점수가 문자열("0")로 올 수 있으므로 int로 변환
        score = int(grading_result[i]["score"]) if grading_result[i]["score"].isdigit() else 0
        feedback = grading_result[i]["feedback"]
        total_score += score

        pdf.set_font('malgun', 'B', 12)
        pdf.cell(0, 8, f"{name} : {score}점", ln=True)

        pdf.set_font('malgun', '', 12)
        pdf.multi_cell(0, 8, f"피드백 : {feedback}")

        pdf.ln(1)
        # 구분선
        pdf.set_draw_color(150)
        pdf.set_line_width(0.3)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(3)

    # 4. 총점
    pdf.ln(5)
    pdf.set_font('malgun', 'B', 12)
    pdf.cell(0, 10, f"총점 : {total_score}점", ln=True)

    # PDF 파일 저장 (팀명 기준)
    pdf_path = os.path.join(pdf_dir, f"{team_name}.pdf")
    pdf.output(pdf_path)
    return pdf_path

# Flask에서 호출될 함수 2: Excel 요약 파일 저장/업데이트
def save_summary_excel(team_name, presentation_topic, criteria, grading_result):
    # 📁 저장 경로 설정
    summary_dir = "results/excel/"
    os.makedirs(summary_dir, exist_ok=True)
    
    # 🧱 열 구조 생성
    new_columns = ["팀명"] + [c["name"] for c in criteria] + ["총점"]
    # Excel 파일명은 주제명으로 생성 (띄어쓰기 등 파일명 불가 문자 치환)
    safe_topic = presentation_topic.replace(" ", "_").replace("/", "_").replace("\\", "_")
    path = os.path.join(summary_dir, f"{safe_topic}.xlsx")

    # 📊 점수 계산 및 데이터 행 생성
    total_score = sum(int(r["score"]) if str(r["score"]).isdigit() else 0 for r in grading_result)
    row = {
        "팀명": team_name,
        **{c["name"]: int(r["score"]) if str(r["score"]).isdigit() else 0 for c, r in zip(criteria, grading_result)},
        "총점": total_score
    }

    # 📄 기존 파일 존재 여부 및 업데이트 로직
    if os.path.exists(path):
        existing = pd.read_excel(path)
        existing_columns = list(existing.columns)

        if existing_columns != new_columns:
            # 기준 변경 시 기존 파일 백업
            backup_path = os.path.join(summary_dir, f"summary_backup_{int(time.time())}.xlsx")
            os.rename(path, backup_path)
            # 새 기준으로 DataFrame 생성
            df = pd.DataFrame([row], columns=new_columns)
        else:
            # 기존 데이터에 새 행 추가
            df = pd.concat([existing, pd.DataFrame([row])], ignore_index=True)
    else:
        # 파일이 없으면 새 DataFrame 생성
        df = pd.DataFrame([row], columns=new_columns)

    # 💾 저장
    df.to_excel(path, index=False)
    return path
"""
Audit and Empirical Stress Test for B2B Financial Model in Lingopro Chinese Proposal
Target: DE_AN_HOP_TAC_LINGOPRO_TRUNG_TAM_TIENG_TRUNG.md
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def calculate_breakeven(students, tuition, course_duration_months, pricing_mode, margin_rate=0.65):
    # Determine monthly software cost based on pricing tiers
    if students < 100:
        tier = "Standard (Per-Seat)"
        monthly_cost = 59000 * students if pricing_mode == "monthly" else 44000 * students
    elif students < 300:
        tier = "Professional (Campus)"
        monthly_cost = 4900000 if pricing_mode == "monthly" else 3675000
    else:
        tier = "Enterprise (Co-Brand)"
        monthly_cost = 9900000 if pricing_mode == "monthly" else 7425000

    course_software_cost = monthly_cost * course_duration_months
    six_month_software_cost = monthly_cost * 6.0
    annual_software_cost = monthly_cost * 12.0

    gross_profit_per_student_course = tuition * margin_rate
    gross_profit_per_student_full = tuition  # If considering 100% of revenue (flawed, but let's check)

    # Breakeven in number of students retained for the course duration
    n_breakeven_margin = course_software_cost / gross_profit_per_student_course
    n_breakeven_full_revenue = course_software_cost / gross_profit_per_student_full

    # Breakeven for 6 months (as claimed in Objection 8.3: "1 học viên duy nhất thừa sức chi trả cả nửa năm")
    n_breakeven_6mo_margin = six_month_software_cost / gross_profit_per_student_course
    n_breakeven_6mo_revenue = six_month_software_cost / gross_profit_per_student_full

    # Breakeven for 1 year
    n_breakeven_annual_margin = annual_software_cost / gross_profit_per_student_course

    return {
        "students": students,
        "tuition": tuition,
        "course_duration_months": course_duration_months,
        "pricing_mode": pricing_mode,
        "tier": tier,
        "monthly_cost": monthly_cost,
        "course_software_cost": course_software_cost,
        "margin_rate": margin_rate,
        "profit_per_student": gross_profit_per_student_course,
        "n_breakeven_margin": n_breakeven_margin,
        "n_breakeven_full_revenue": n_breakeven_full_revenue,
        "six_month_cost": six_month_software_cost,
        "n_breakeven_6mo_margin": n_breakeven_6mo_margin,
        "n_breakeven_6mo_revenue": n_breakeven_6mo_revenue,
        "annual_cost": annual_software_cost,
        "n_breakeven_annual_margin": n_breakeven_annual_margin
    }

def run_stress_test():
    scales = [30, 50, 100, 150, 300, 500]
    tuitions = [2000000, 3000000, 4500000, 6000000]
    durations = [2.5]
    modes = ["annual", "monthly"]
    margins = [0.65, 0.50, 0.35]

    print("="*80)
    print("EMPIRICAL TEST 1: SENSITIVITY GRID FOR N_BREAKEVEN (Course Duration = 2.5 months)")
    print("="*80)
    
    results = []
    
    # Baseline comparison (Margin = 65%, Duration = 2.5)
    print(f"{'Scale':<8} | {'Tuition (VND)':<14} | {'Billing':<8} | {'Software Cost':<14} | {'N_break (65% M)':<16} | {'N_break (50% M)':<16} | {'Holds <=2?':<10}")
    print("-" * 95)
    
    violating_cases = 0
    total_cases = 0
    
    for s in scales:
        for t in tuitions:
            for m in modes:
                total_cases += 1
                r65 = calculate_breakeven(s, t, 2.5, m, 0.65)
                r50 = calculate_breakeven(s, t, 2.5, m, 0.50)
                holds = "YES" if r65["n_breakeven_margin"] <= 2.0 else "FAIL"
                if holds == "FAIL":
                    violating_cases += 1
                print(f"{s:<8} | {t:<14,d} | {m:<8} | {r65['course_software_cost']:<14,.0f} | {r65['n_breakeven_margin']:<16.2f} | {r50['n_breakeven_margin']:<16.2f} | {holds:<10}")

    print("\nSUMMARY TEST 1:")
    print(f"Total scenarios tested: {total_cases}")
    print(f"Violations of 'Breakeven after retaining 1-2 students' (at 65% margin): {violating_cases} / {total_cases} ({violating_cases/total_cases*100:.1f}%)")
    
    print("\n" + "="*80)
    print("EMPIRICAL TEST 2: FACT-CHECK OBJECTION SCRIPT 8.3 CLAIM")
    print("Claim: 'Chỉ cần cứu vãn ĐÚNG 1 HỌC VIÊN DUY NHẤT... thừa sức chi trả cho bản quyền phần mềm của TOÀN BỘ TRUNG TÂM trong suốt cả NỬA NĂM TRỜI!'")
    print("="*80)
    print(f"{'Scale':<8} | {'Tier':<22} | {'6-mo Cost (VND)':<16} | {'1 Student Tuition':<18} | {'1 Student Profit(65%)':<22} | {'Can 1 Student Cover 6mo?'}")
    print("-" * 105)
    
    for s in [30, 50, 100, 150, 300]:
        for m in ["monthly", "annual"]:
            res = calculate_breakeven(s, 4500000, 2.5, m, 0.65)
            covers_full = "YES" if 4500000 >= res['six_month_cost'] else "NO (Deficit)"
            covers_margin = "YES" if res['profit_per_student'] >= res['six_month_cost'] else "NO (Deficit)"
            deficit = res['six_month_cost'] - res['profit_per_student']
            print(f"{s} ({m[:3]})  | {res['tier']:<22} | {res['six_month_cost']:<16,.0f} | 4,500,000 VND        | {res['profit_per_student']:<22,.0f} | {covers_margin:<12} (Gap: {deficit:+,.0f})")

    print("\n" + "="*80)
    print("EMPIRICAL TEST 3: DIGITAL WORKBOOK ADD-ON STRESS TEST (SECTION 9.3)")
    print("Claim: '+13.000.000 VNĐ LÃI RÒNG TIỀN MẶT trên mỗi 100 học viên'")
    print("="*80)
    
    # Test model:
    # 100 students x 250,000 VND = 25,000,000 VND
    # Stated cost: -12,000,000 VND (Campus Pro)
    # Stated net profit: +13,000,000 VND
    # Now let's test realistic frictions:
    # F1: Payment collection rate (opt-in friction / churn)
    # F2: Payment gateway / banking / cash handling fee (1.5%)
    # F3: VAT / Tax compliance (if required, 8% VAT or 2% CIT/PIT)
    # F4: Teacher commission for onboarding & monitoring digital workbook (e.g. 30k/student)
    # F5: Lingopro AI / TTS / Remotion consumption cost
    # F6: Time duration mismatch: Campus Pro 4.9M/mo x 2.5 mo = 12.25M; Campus Pro 4.9M/mo x 3 mo = 14.7M; Annual Campus Pro / 12 = 3.675M
    
    scenarios = [
        {"name": "Stated Ideal (Author)", "opt_in": 1.0, "gateway_fee": 0.0, "tax_rate": 0.0, "teacher_comm": 0, "software_cost": 12000000},
        {"name": "Realistic 1: Gateway Fee (2%) + Teacher Incentive (30k/hv)", "opt_in": 1.0, "gateway_fee": 0.02, "tax_rate": 0.0, "teacher_comm": 30000, "software_cost": 12000000},
        {"name": "Realistic 2: 85% Opt-in + Gateway Fee (2%) + Teacher Comm", "opt_in": 0.85, "gateway_fee": 0.02, "tax_rate": 0.0, "teacher_comm": 30000, "software_cost": 12000000},
        {"name": "Realistic 3: 3-month course duration (4.9M x 3 = 14.7M) + 85% Opt-in", "opt_in": 0.85, "gateway_fee": 0.02, "tax_rate": 0.0, "teacher_comm": 30000, "software_cost": 14700000},
        {"name": "Conservative: 70% Opt-in + 3-month course + Tax (8%) + Comm (50k)", "opt_in": 0.70, "gateway_fee": 0.02, "tax_rate": 0.08, "teacher_comm": 50000, "software_cost": 14700000}
    ]
    
    for sc in scenarios:
        paying_students = int(100 * sc["opt_in"])
        gross_rev = paying_students * 250000
        net_rev = gross_rev * (1 - sc["gateway_fee"] - sc["tax_rate"])
        teacher_exp = paying_students * sc["teacher_comm"]
        total_exp = sc["software_cost"] + teacher_exp
        profit = net_rev - total_exp
        margin = (profit / gross_rev) * 100 if gross_rev > 0 else 0
        print(f"Scenario: {sc['name']}")
        print(f"  Paying students: {paying_students}/100 | Gross Rev: {gross_rev:,.0f} | Net Rev: {net_rev:,.0f}")
        print(f"  Software: {sc['software_cost']:,.0f} | Teacher Incentive: {teacher_exp:,.0f} | Total Costs: {total_exp:,.0f}")
        print(f"  NET PROFIT: {profit:,.0f} VNĐ (Claimed: +13,000,000 VNĐ) | Deviation: {profit - 13000000:+,.0f} VNĐ")
        print()

def verify_proposal_remediations():
    import os
    print("="*80)
    print("EMPIRICAL TEST 4: VERIFICATION OF 7 REMEDIATIONS IN PROPOSAL (11 CHECKS)")
    print("Target: DE_AN_HOP_TAC_LINGOPRO_TRUNG_TAM_TIENG_TRUNG.md")
    print("="*80)

    target_path = os.path.join(os.path.dirname(__file__), '..', 'DE_AN_HOP_TAC_LINGOPRO_TRUNG_TAM_TIENG_TRUNG.md')
    target_path = os.path.normpath(target_path)
    
    with open(target_path, 'r', encoding='utf-8') as f:
        text = f.read()

    checks = [
        ('Check 01: Section 9.2 Micro-center breakeven (1-2 students, 1.88)', 
         'Micro-Center (Cơ sở nhỏ)' in text and '1 – 2 học viên' in text and '1.88 bạn' in text),
        ('Check 02: Section 9.2 Campus Pro breakeven (3-4 students, 3.14 bạn, 2%-3%)', 
         'Campus Pro (Cơ sở vừa)' in text and '3 – 4 học viên' in text and '3.14 bạn' in text and '2% – 3%' in text),
        ('Check 03: Section 9.2 Enterprise breakeven (6-8 students, 6.34 bạn, < 2%)', 
         'Enterprise (Hệ thống lớn)' in text and '6 – 8 học viên' in text and '6.34 bạn' in text and '< 2%' in text),
        ('Check 04: Section 9.2 Conclusion: giảm rơi rụng 2%-3% tự hòa vốn 100%', 
         'Chỉ cần giảm tỷ lệ rơi rụng từ 2% - 3%, hệ thống đã tự hòa vốn 100%!' in text),
        ('Check 05: Section 8.3 Sales script 3 math rewrite (1 hv covers ~half course fee, 3 hv breaks even for 150 hv)', 
         'gần **một nửa chi phí phần mềm của cả cơ sở trong cả khóa học**' in text and 'hòa vốn phần mềm cho 150 học viên của toàn trường!' in text),
        ('Check 06: Section 9.3 Financial Sensitivity Matrix (+6.0M to +10.0M VND per 100 students)', 
         '+6.0M đến +10.0M VNĐ' in text and 'Financial Sensitivity Matrix' in text and '30.000 đ' in text),
        ('Check 07: Section 8.2 Counter-arguments to HelloChinese, SuperChinese, Pleco (Institutional Control)', 
         'HelloChinese' in text and 'SuperChinese' in text and 'Pleco' in text and 'Zero Institutional Control' in text),
        ('Check 08: Section 8.5 Zalo WebView mitigation (Intent Redirect, Guest PIN, PWA)', 
         'Automatic External Intent Redirect' in text and 'Progressive Web App' in text and 'Guest PIN Login' in text),
        ('Check 09: Section 11.1 SaaS Service Credits (10%, 25%, 50%)', 
         '10%' in text and '25%' in text and '50%' in text and 'Service Credit' in text),
        ('Check 10: Section 12 Article 4.4 Decree 13/2023/ND-CP parental consent (<16 years)', 
         'Nghị định 13/2023/NĐ-CP' in text and 'dưới 16 tuổi' in text and '4.4' in text),
        ('Check 11: Section 12 Article 5 calibrated KPIs (>=60% retention, >=65% homework, qualitative survey)', 
         '>= 60%' in text and '>= 65%' in text and 'khảo sát định tính' in text)
    ]

    passed_count = 0
    for name, passed in checks:
        status = "PASS" if passed else "FAIL"
        if passed:
            passed_count += 1
        print(f"[{status}] {name}")

    print("-" * 80)
    print(f"Total Remediation Checks: {len(checks)} | Passed: {passed_count} | Failed: {len(checks) - passed_count}")

    # Negative checks
    negatives = [
        ('Absence of impossible 6-month claim ("1 học viên... cả nửa năm trời")', 
         'nửa năm' in text and '1 học viên duy nhất thừa sức' in text),
        ('Absence of commercial suicide SLA 100% cash refund', 
         'hoàn trả 100% phí dịch vụ' in text),
        ('Absence of unadjusted +13M net profit claim in 9.3 conclusion', 
         'LÃI RÒNG TRỰC TIẾP CỦA TRUNG TÂM: = +13.000.000' in text),
        ('Absence of uncalibrated 75% retention in Pilot MOU', 
         '>= 75% học viên duy trì' in text)
    ]
    neg_passed = 0
    for name, found in negatives:
        status = "PASS" if not found else "FAIL"
        if not found:
            neg_passed += 1
        print(f"[{status}] Negative Guardrail: {name}")

    if passed_count == len(checks) and neg_passed == len(negatives):
        print("\n>>> FINAL VERDICT: 11/11 tests PASS (All remediations and negative guardrails verified!) <<<")
        return True
    else:
        print("\n>>> FINAL VERDICT: FAILED - Remediations incomplete! <<<")
        sys.exit(1)

if __name__ == "__main__":
    run_stress_test()
    verify_proposal_remediations()


import sys
import json
import random
from ortools.sat.python import cp_model
from collections import defaultdict
from flask import Flask, request, jsonify
import time

app = Flask(__name__)

def generate_schedule(subjects, classes, users):
    model = cp_model.CpModel()

    # Xáo trộn dữ liệu môn học để thêm tính ngẫu nhiên
    random.shuffle(subjects)

    # Xây dựng dữ liệu
    class_ids = [cls['class_id'] for cls in classes]
    class_subjects = defaultdict(list)

    # Phân loại các môn học theo lớp
    for subject in subjects:
        if 'class_id' in subject and 'subject_name' in subject and 'teacher_id' in subject:
            class_subjects[subject['class_id']].append(subject)
        else:
            return {"error": "Invalid subject data format"}

    # Kiểm tra nếu không có môn học cho lớp
    for class_id in class_ids:
        if not class_subjects[class_id]:
            return {"error": f"No subjects found for class {class_id}"}

    # Tạo các biến lập lịch cho từng lớp
    schedule_vars = {}
    for class_id in class_ids:
        schedule_vars[class_id] = []
        num_subjects = len(class_subjects[class_id])
        if num_subjects == 0:
            return {"error": f"No subjects for class {class_id}"}
        for slot in range(30):  # 6 buổi, mỗi buổi 5 tiết
            var = model.NewIntVar(0, num_subjects - 1, f"{class_id}_{slot}")
            schedule_vars[class_id].append(var)

    # Ràng buộc: Không cho giáo viên dạy cùng lúc 2 lớp
    for slot in range(30):
        teacher_slots = defaultdict(list)
        for class_id in class_ids:
            var = schedule_vars[class_id][slot]
            for subject_index, subject in enumerate(class_subjects[class_id]):
                teacher_id = subject["teacher_id"]
                b = model.NewBoolVar(f"{class_id}_{slot}_is_{subject_index}")
                model.Add(var == subject_index).OnlyEnforceIf(b)
                model.Add(var != subject_index).OnlyEnforceIf(b.Not())
                teacher_slots[teacher_id].append(b)
        for teacher_id, bools in teacher_slots.items():
            if len(bools) > 1:
                model.Add(sum(bools) <= 1)

    # Ràng buộc: Mỗi môn học được dạy ít nhất 1 lần, tối đa 5 lần
    for class_id in class_ids:
        for subject_index, subject in enumerate(class_subjects[class_id]):
            subject_count = 0
            for slot in range(30):
                b = model.NewBoolVar(f"{class_id}_{slot}_count_{subject_index}")
                model.Add(schedule_vars[class_id][slot] == subject_index).OnlyEnforceIf(b)
                model.Add(schedule_vars[class_id][slot] != subject_index).OnlyEnforceIf(b.Not())
                subject_count += b
            model.Add(subject_count >= 1)
            model.Add(subject_count <= 5)

    # Ràng buộc: Trong 1 buổi (5 tiết), mỗi môn học tối đa 2 tiết
    for class_id in class_ids:
        for day in range(6):
            for subject_index in range(len(class_subjects[class_id])):
                subject_count_in_day = 0
                for period in range(5):
                    slot = day * 5 + period
                    b = model.NewBoolVar(f"{class_id}_day_{day}_period_{period}_subject_{subject_index}")
                    model.Add(schedule_vars[class_id][slot] == subject_index).OnlyEnforceIf(b)
                    model.Add(schedule_vars[class_id][slot] != subject_index).OnlyEnforceIf(b.Not())
                    subject_count_in_day += b
                model.Add(subject_count_in_day <= 2)

    # Thêm hàm mục tiêu với trọng số ngẫu nhiên để tạo lịch khác nhau
    objective_terms = []
    for class_id in class_ids:
        for slot in range(30):
            for subject_index in range(len(class_subjects[class_id])):
                b = model.NewBoolVar(f"{class_id}_{slot}_objective_{subject_index}")
                model.Add(schedule_vars[class_id][slot] == subject_index).OnlyEnforceIf(b)
                model.Add(schedule_vars[class_id][slot] != subject_index).OnlyEnforceIf(b.Not())
                random_weight = random.randint(1, 100)
                objective_terms.append(random_weight * b)

    # Tối đa hóa tổng trọng số ngẫu nhiên
    model.Maximize(sum(objective_terms))

    # Giải quyết mô hình
    solver = cp_model.CpSolver()
    # Sửa random_seed để nằm trong phạm vi hợp lệ (0 đến 2**31 - 1)
    solver.parameters.random_seed = int(time.time() * 1000) % (2**31)
    # Tăng tính ngẫu nhiên trong tìm kiếm
    solver.parameters.num_search_workers = 8  # Sử dụng nhiều luồng để tìm kiếm
    solver.parameters.randomize_search = True  # Bật chế độ tìm kiếm ngẫu nhiên

    status = solver.Solve(model)

    # Kiểm tra trạng thái giải pháp
    if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        return {"error": f"No feasible solution found. Solver status: {solver.StatusName(status)}"}

    # Kiểm tra trùng lặp giáo viên
    for day in range(6):
        for period in range(5):
            slot = day * 5 + period
            teacher_in_slot = defaultdict(list)
            for class_id in class_ids:
                subject_index = solver.Value(schedule_vars[class_id][slot])
                if 0 <= subject_index < len(class_subjects[class_id]):
                    subject = class_subjects[class_id][subject_index]
                    teacher_id = subject["teacher_id"]
                    teacher_in_slot[teacher_id].append(class_id)
            for teacher_id, class_list in teacher_in_slot.items():
                if len(class_list) > 1:
                    print(f"Trùng lặp giáo viên {teacher_id} tại Day {day+1}, Period {period+1}: {class_list}")

    # Lưu lịch trình vào kết quả
    result = {}
    for class_id in class_ids:
        timetable = {f"Day {day+1}": [] for day in range(6)}
        for day in range(6):
            for period in range(5):
                slot = day * 5 + period
                subject_index = solver.Value(schedule_vars[class_id][slot])
                if 0 <= subject_index < len(class_subjects[class_id]):
                    subject = class_subjects[class_id][subject_index]
                    timetable[f"Day {day+1}"].append({
                        "period": period + 1,
                        "subject": subject["subject_name"],
                        "teacher_id": subject["teacher_id"]
                    })
                else:
                    return {"error": f"Invalid subject index {subject_index} for class {class_id}"}
        result[class_id] = timetable
    return result

@app.route('/generate-schedule', methods=['POST'])
def generate_schedule_api():
    data = request.get_json()
    subjects = data['subjects']
    classes = data['classes']
    users = data['users']
    
    schedule = generate_schedule(subjects, classes, users)
    
    return jsonify(schedule)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
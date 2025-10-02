const axios = require('axios');
const Schedule = require('../models/Schedule'); 

exports.generateSchedule = async (req, res) => {
    try {
        // Lấy schoolYear và semester từ request body
        const { schoolYear, semester } = req.body;
        if (!schoolYear || !semester) {
            return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear và semester' });
        }

        // Gọi API để lấy danh sách lớp Khối 12
        const classResponse = await axios.get('http://localhost:4000/api/classes/khoi');
        const classes = classResponse.data.map(cls => ({
            class_id: cls.class_id,
            class_name: cls.class_name,
            subject_teacher: cls.subject_teacher || []
        }));

        if (!classes || classes.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy lớp nào' });
        }

        // Chuẩn bị danh sách giáo viên (users)
        const teacherIds = [...new Set(classes.flatMap(cls => cls.subject_teacher))];

        let users = [];
        if (teacherIds.length > 0) {
            const userResponse = await axios.post('http://localhost:4003/api/users/teachers', { ids: teacherIds });
            users = userResponse.data.map(user => ({
                user_id: user._id,
                name: user.name || 'Unknown Teacher'
            }));
        }
        if (users.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy giáo viên nào' });
        }

        // Chuẩn bị danh sách môn học (subjects) cho từng lớp
        const subjects = [];
        for (const cls of classes) {
            for (const teacherId of cls.subject_teacher) {
                try {
                    const userDetailResponse = await axios.get(`http://localhost:4003/api/users/${teacherId}`);
                    const tdt_id = userDetailResponse.data.tdt_id;

                    if (!tdt_id) {
                        console.log(`Không tìm thấy tdt_id cho giáo viên ${teacherId}`);
                        continue;
                    }

                    const subjectResponse = await axios.get(`http://localhost:4001/api/departments/${tdt_id}/subjects`);
                    const teacherSubjects = subjectResponse.data.map(subject => ({
                        class_id: cls.class_id,
                        subject_name: subject.subject_name,
                        subject_code: subject.subject_code,
                        teacher_id: teacherId
                    }));
                    subjects.push(...teacherSubjects);
                } catch (error) {
                    console.log(`Lỗi khi lấy môn học cho giáo viên ${teacherId}:`, error.message);
                    continue;
                }
            }
        }

        if (subjects.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy môn học nào' });
        }

        // Loại bỏ môn học trùng lặp trong cùng lớp
        const uniqueSubjects = [];
        const seen = new Set();
        for (const subject of subjects) {
            const key = `${subject.class_id}-${subject.subject_code}-${subject.teacher_id}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueSubjects.push(subject);
            }
        }

        // Chuẩn bị dữ liệu để gửi cho Python
        const inputData = {
            subjects: uniqueSubjects,
            classes,
            users
        };

        // Gọi Python để xếp lịch
        const result = await axios.post('http://127.0.0.1:5000/generate-schedule', inputData);

        // Kiểm tra nếu API Python trả về lỗi
        if (result.data.error) {
            return res.status(400).json({ message: 'Failed to generate schedule', error: result.data.error });
        }

        // Chuyển đổi object thành mảng để lặp qua
        const schedules = Object.keys(result.data).map(classId => ({
            class_name: classId,
            schedule: Object.keys(result.data[classId]).map(day => ({
                day: day,
                periods: result.data[classId][day]
            }))
        }));

        // Lưu thời khóa biểu vào database
        const savedSchedules = [];

        for (const scheduleData of schedules) {
            const { class_name, schedule } = scheduleData;

            try {
                // Sử dụng phương thức createNewSchedule để lưu TKB mới
                const newSchedule = await Schedule.createNewSchedule(
                    class_name,
                    schoolYear,
                    semester,
                    schedule
                );
                savedSchedules.push(newSchedule);
            } catch (error) {
                console.error(`Lỗi khi lưu thời khóa biểu cho lớp ${class_name}:`, error.message);
                continue; // Tiếp tục với các lớp khác thay vì dừng lại
            }
        }

        if (savedSchedules.length === 0) {
            return res.status(500).json({ message: 'Không thể lưu thời khóa biểu nào vào database' });
        }

        // Trả kết quả về cho client
        res.json({
            message: 'Thời khóa biểu đã được tạo và lưu thành công',
            data: savedSchedules
        });
    } catch (error) {
        console.error('Error calling services:', error.message);
        res.status(500).json({
            message: 'Error calling services',
            error: error.response?.data || error.message
        });
    }
};

// exports.generateSchedule = async (req, res) => {
//     try {
//         // Lấy schoolYear và semester từ request body
//         const { schoolYear, semester } = req.body;
//         if (!schoolYear || !semester) {
//             return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear và semester' });
//         }
//         console.log('Step 1: Received schoolYear and semester:', { schoolYear, semester });

//         // Gọi API để lấy danh sách lớp Khối 12
//         console.log('Step 2: Fetching classes from http://localhost:4000/api/classes/khoi');
//         let classResponse;
//         try {
//             classResponse = await axios.get('http://localhost:4000/api/classes/khoi');
//         } catch (error) {
//             console.error('Error fetching classes:', error.message);
//             return res.status(500).json({ message: 'Lỗi khi lấy danh sách lớp', error: error.message });
//         }
//         console.log('Step 2: Class response:', classResponse.data);

//         const classes = classResponse.data.map(cls => ({
//             class_id: cls.class_id,
//             class_name: cls.class_name,
//             subject_teacher: cls.subject_teacher || []
//         }));

//         if (!classes || classes.length === 0) {
//             return res.status(404).json({ message: 'Không tìm thấy lớp nào' });
//         }
//         console.log('Step 3: Processed classes:', classes);

//         // Chuẩn bị danh sách giáo viên (users)
//         const teacherIds = [...new Set(classes.flatMap(cls => cls.subject_teacher))];
//         console.log('Step 4: Extracted teacher IDs:', teacherIds);

//         let users = [];
//         if (teacherIds.length > 0) {
//             console.log('Step 5: Fetching teachers from http://localhost:4003/api/users/teachers');
//             try {
//                 const userResponse = await axios.post('http://localhost:4003/api/users/teachers', { ids: teacherIds });
//                 users = userResponse.data.map(user => ({
//                     user_id: user._id,
//                     name: user.name || 'Unknown Teacher'
//                 }));
//             } catch (error) {
//                 console.error('Error fetching teachers:', error.message);
//                 return res.status(500).json({ message: 'Lỗi khi lấy danh sách giáo viên', error: error.message });
//             }
//         }
//         if (users.length === 0) {
//             return res.status(400).json({ message: 'Không tìm thấy giáo viên nào' });
//         }
//         console.log('Step 6: Processed users:', users);

//         // Danh sách môn học yêu cầu
//         const requiredSubjects = [
//             "Toán", "Văn", "Anh", "Lý", "Hóa", "Sinh", "Sử", "Địa", "Tin", "Công nghệ", "Công dân"
//         ];

//         // Chuẩn bị danh sách môn học (subjects) cho từng lớp
//         const subjects = [];
//         for (const cls of classes) {
//             const classSubjectsMap = new Map(); // Sử dụng Map để theo dõi môn học đã thêm
//             for (const teacherId of cls.subject_teacher) {
//                 try {
//                     console.log(`Step 7: Fetching user details for teacher ${teacherId} from http://localhost:4003/api/users/${teacherId}`);
//                     const userDetailResponse = await axios.get(`http://localhost:4003/api/users/${teacherId}`);
//                     const tdt_id = userDetailResponse.data.tdt_id;

//                     if (!tdt_id) {
//                         console.log(`Không tìm thấy tdt_id cho giáo viên ${teacherId}`);
//                         continue;
//                     }
//                     console.log(`Step 8: tdt_id for teacher ${teacherId}:`, tdt_id);

//                     console.log(`Step 9: Fetching subjects for tdt_id ${tdt_id} from http://localhost:4001/api/departments/${tdt_id}/subjects`);
//                     const subjectResponse = await axios.get(`http://localhost:4001/api/departments/${tdt_id}/subjects`);
//                     const teacherSubjects = subjectResponse.data.map(subject => ({
//                         class_id: cls.class_id,
//                         subject_name: subject.subject_name,
//                         subject_code: subject.subject_code,
//                         teacher_id: teacherId
//                     }));
//                     teacherSubjects.forEach(subject => {
//                         const key = `${subject.subject_name}-${subject.teacher_id}`;
//                         if (!classSubjectsMap.has(key)) {
//                             classSubjectsMap.set(key, subject);
//                         }
//                     });
//                 } catch (error) {
//                     console.log(`Lỗi khi lấy môn học cho giáo viên ${teacherId}:`, error.message);
//                     continue;
//                 }
//             }

//             // Bổ sung các môn học bị thiếu
//             requiredSubjects.forEach(subjectName => {
//                 const existingSubject = Array.from(classSubjectsMap.values()).find(s => s.subject_name === subjectName);
//                 if (!existingSubject) {
//                     // Tìm teacher_id ngẫu nhiên từ subject_teacher của lớp
//                     const randomTeacherId = cls.subject_teacher[Math.floor(Math.random() * cls.subject_teacher.length)];
//                     subjects.push({
//                         class_id: cls.class_id,
//                         subject_name: subjectName,
//                         subject_code: subjectName.toUpperCase().slice(0, 3), // Tạo mã tạm thời
//                         teacher_id: randomTeacherId
//                     });
//                 } else {
//                     subjects.push(existingSubject);
//                 }
//             });
//         }

//         if (subjects.length === 0) {
//             return res.status(400).json({ message: 'Không tìm thấy môn học nào' });
//         }
//         console.log('Step 10: Processed subjects:', subjects);

//         // Loại bỏ môn học trùng lặp trong cùng lớp (dựa trên subject_name và teacher_id)
//         const uniqueSubjects = [];
//         const seen = new Set();
//         for (const subject of subjects) {
//             const key = `${subject.class_id}-${subject.subject_name}-${subject.teacher_id}`;
//             if (!seen.has(key)) {
//                 seen.add(key);
//                 uniqueSubjects.push(subject);
//             }
//         }
//         console.log('Step 11: Unique subjects after deduplication:', uniqueSubjects);

//         // Chuẩn bị dữ liệu để gửi cho Python
//         const inputData = {
//             subjects: uniqueSubjects,
//             classes,
//             users
//         };
//         console.log('Step 12: Input data for Python service:', inputData);

//         // Gọi Python để xếp lịch
//         console.log('Step 13: Calling Python service at http://127.0.0.1:5000/generate-schedule');
//         let result;
//         try {
//             result = await axios.post('http://127.0.0.1:5000/generate-schedule', inputData, { timeout: 60000 });
//         } catch (error) {
//             console.error('Error calling Python service:', error.message);
//             if (error.response) {
//                 console.error('Python service error response:', error.response.data);
//                 return res.status(error.response.status).json({
//                     message: 'Lỗi khi gọi Python service để xếp lịch',
//                     error: error.response.data.error || error.message
//                 });
//             }
//             return res.status(500).json({
//                 message: 'Lỗi khi gọi Python service để xếp lịch',
//                 error: error.message
//             });
//         }
//         console.log('Step 14: Python service response:', result.data);

//         // Kiểm tra nếu API Python trả về lỗi
//         if (result.data.error) {
//             return res.status(400).json({ message: 'Failed to generate schedule', error: result.data.error });
//         }

//         // Chuyển đổi object thành mảng để lặp qua
//         const schedules = Object.keys(result.data).map(classId => ({
//             class_name: classId,
//             schedule: Object.keys(result.data[classId]).map(day => ({
//                 day: day,
//                 periods: result.data[classId][day]
//             }))
//         }));
//         console.log('Step 15: Converted schedules:', schedules);

//         // Lưu thời khóa biểu vào database
//         const savedSchedules = [];
//         for (const scheduleData of schedules) {
//             const { class_name, schedule } = scheduleData;

//             try {
//                 console.log(`Step 16: Saving schedule for class ${class_name}`);
//                 const newSchedule = await Schedule.createNewSchedule(
//                     class_name,
//                     schoolYear,
//                     semester,
//                     schedule
//                 );
//                 savedSchedules.push(newSchedule);
//             } catch (error) {
//                 console.error(`Lỗi khi lưu thời khóa biểu cho lớp ${class_name}:`, error.message);
//                 continue;
//             }
//         }

//         if (savedSchedules.length === 0) {
//             return res.status(500).json({ message: 'Không thể lưu thời khóa biểu nào vào database' });
//         }
//         console.log('Step 17: Saved schedules:', savedSchedules);

//         // Trả kết quả về cho client
//         res.json({
//             message: 'Thời khóa biểu đã được tạo và lưu thành công',
//             data: savedSchedules
//         });
//     } catch (error) {
//         console.error('Error calling services:', error.message);
//         res.status(500).json({
//             message: 'Error calling services',
//             error: error.response?.data || error.message
//         });
//     }
// };

exports.getAllSchedules = async (req, res) => {
    try {
        const { schoolYear, semester, version } = req.query;

        // Xây dựng điều kiện lọc
        const filter = {};
        if (schoolYear) filter.schoolYear = schoolYear;
        if (semester) filter.semester = Number(semester);
        if (version) filter.version = Number(version);

        // Lấy tất cả thời khóa biểu từ database
        const schedules = await Schedule.find(filter)
            .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo giảm dần
            .exec();

        if (!schedules || schedules.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thời khóa biểu nào' });
        }

        res.json({
            message: 'Lấy danh sách thời khóa biểu thành công',
            data: schedules
        });
    } catch (error) {
        console.error('Lỗi khi lấy thời khóa biểu:', error.message);
        res.status(500).json({
            message: 'Lỗi khi lấy thời khóa biểu',
            error: error.message
        });
    }
};

// exports.getScheduleVersions = async (req, res) => {
//     try {
//         const { schoolYear, semester } = req.query;

//         if (!schoolYear || !semester) {
//             return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear và semester' });
//         }

//         const filter = {
//             schoolYear: schoolYear,
//             semester: Number(semester)
//         };

//         // Lấy danh sách các version duy nhất
//         const versions = await Schedule.distinct('version', filter)
//             .sort({ version: -1 }) // Sắp xếp theo version giảm dần
//             .exec();

//         if (!versions || versions.length === 0) {
//             return res.status(404).json({ message: 'Không tìm thấy version nào cho kỳ học này' });
//         }

//         res.json({
//             message: 'Lấy danh sách version thành công',
//             data: versions
//         });
//     } catch (error) {
//         console.error('Lỗi khi lấy version:', error.message);
//         res.status(500).json({
//             message: 'Lỗi khi lấy version',
//             error: error.message
//         });
//     }
// };

exports.getScheduleVersions = async (req, res) => {
    try {
        const { schoolYear, semester } = req.query;

        if (!schoolYear || !semester) {
            return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear và semester' });
        }

        const filter = {
            schoolYear: schoolYear,
            semester: Number(semester)
        };

        // Sử dụng aggregate để lấy danh sách version và kiểm tra isApproved
        const versions = await Schedule.aggregate([
            { $match: filter },
            { $group: {
                _id: "$version",
                isApproved: { $max: "$isApproved" } // Nếu bất kỳ document nào trong version có isApproved: true, thì trả true
            }},
            { $sort: { _id: -1 } }, // Sắp xếp theo version giảm dần
            { $project: {
                version: "$_id",
                isApproved: 1,
                _id: 0
            }}
        ]);

        if (!versions || versions.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy version nào cho kỳ học này' });
        }

        res.json({
            message: 'Lấy danh sách version thành công',
            data: versions
        });
    } catch (error) {
        console.error('Lỗi khi lấy version:', error.message);
        res.status(500).json({
            message: 'Lỗi khi lấy version',
            error: error.message
        });
    }
};

exports.approveScheduleVersion = async (req, res) => {
    try {
        const { schoolYear, semester, version } = req.body;

        if (!schoolYear || !semester || !version) {
            return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear, semester và version' });
        }

        const filter = {
            schoolYear: schoolYear,
            semester: Number(semester)
        };

        // Đặt tất cả các version của kỳ học này thành isApproved: false
        await Schedule.updateMany(filter, { isApproved: false });

        // Đặt version được chọn thành isApproved: true
        const updatedSchedule = await Schedule.updateMany(
            { ...filter, version: Number(version) },
            { isApproved: true }
        );

        if (updatedSchedule.matchedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy version này' });
        }

        res.json({
            message: `Version ${version} đã được duyệt thành công`
        });
    } catch (error) {
        console.error('Lỗi khi duyệt version:', error.message);
        res.status(500).json({
            message: 'Lỗi khi duyệt version',
            error: error.message
        });
    }
};

exports.unapproveScheduleVersion = async (req, res) => {
    try {
        const { schoolYear, semester, version } = req.body;

        if (!schoolYear || !semester || !version) {
            return res.status(400).json({ message: 'Vui lòng cung cấp schoolYear, semester và version' });
        }

        const filter = {
            schoolYear: schoolYear,
            semester: Number(semester),
            version: Number(version)
        };

        // Đặt isApproved: false cho version được chọn
        const updatedSchedule = await Schedule.updateMany(
            filter,
            { isApproved: false }
        );

        if (updatedSchedule.matchedCount === 0) {
            return res.status(404).json({ message: 'Không tìm thấy version này' });
        }

        res.json({
            message: `Hủy duyệt version ${version} thành công`
        });
    } catch (error) {
        console.error('Lỗi khi hủy duyệt version:', error.message);
        res.status(500).json({
            message: 'Lỗi khi hủy duyệt version',
            error: error.message
        });
    }
};

exports.getApprovedSchedule = async (req, res) => {
    try {
        const { className, schoolYear, semester } = req.query;

        if (!className || !schoolYear || !semester) {
            return res.status(400).json({ message: 'Vui lòng cung cấp className, schoolYear và semester' });
        }

        const filter = {
            className: className,
            schoolYear: schoolYear,
            semester: Number(semester),
            isApproved: true // Chỉ lấy TKB đã được duyệt
        };

        const schedule = await Schedule.findOne(filter).exec();

        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy thời khóa biểu đã được duyệt cho lớp này' });
        }

        res.json({
            message: 'Lấy thời khóa biểu đã được duyệt thành công',
            data: schedule
        });
    } catch (error) {
        console.error('Lỗi khi lấy thời khóa biểu:', error.message);
        res.status(500).json({
            message: 'Lỗi khi lấy thời khóa biểu',
            error: error.message
        });
    }
};

exports.getTeacherSchedule = async (req, res) => {
    try {
        const { schoolYear, semester, teacherId } = req.query; // Lấy teacherId từ query params

        if (!schoolYear || !semester || !teacherId) {
            return res.status(400).json({ 
                message: 'Vui lòng cung cấp schoolYear, semester và teacherId' 
            });
        }

        const filter = {
            schoolYear: schoolYear,
            semester: Number(semester),
            isApproved: true // Chỉ lấy lịch đã được duyệt
        };

        // Lấy tất cả lịch đã được duyệt
        const schedules = await Schedule.find(filter).exec();

        if (!schedules || schedules.length === 0) {
            console.log('No schedules found for filter:', filter); // Debug
            return res.status(404).json({ 
                message: 'Không tìm thấy thời khóa biểu đã được duyệt cho kỳ học này' 
            });
        }

        // Lọc các tiết mà giáo viên này dạy
        const teacherSchedule = schedules
            .map(schedule => {
                const filteredSchedule = schedule.schedule
                    .map(day => {
                        // Lọc các tiết mà teacher_id khớp với giáo viên
                        const filteredPeriods = day.periods.filter(period => {
                            const match = String(period.teacher_id) === String(teacherId);
                            return match;
                        });
                        return {
                            day: day.day,
                            periods: filteredPeriods
                        };
                    })
                    .filter(day => day.periods.length > 0); // Chỉ giữ lại các ngày có tiết của giáo viên

                if (filteredSchedule.length === 0) {
                    return null; // Không có tiết nào của giáo viên trong lịch này
                }

                return {
                    className: schedule.className,
                    schoolYear: schedule.schoolYear,
                    semester: schedule.semester,
                    schedule: filteredSchedule
                };
            })
            .filter(schedule => schedule !== null); // Loại bỏ các lịch không có tiết của giáo viên

        if (teacherSchedule.length === 0) {
            console.log('No periods found for this teacher'); // Debug
            return res.status(404).json({ 
                message: 'Không có tiết học nào của giáo viên này trong kỳ học đã chọn' 
            });
        }

        res.json({
            message: 'Lấy thời khóa biểu của giáo viên thành công',
            data: teacherSchedule
        });
    } catch (error) {
        console.error('Lỗi khi lấy thời khóa biểu của giáo viên:', error.message);
        res.status(500).json({
            message: 'Lỗi khi lấy thời khóa biểu',
            error: error.message
        });
    }
};
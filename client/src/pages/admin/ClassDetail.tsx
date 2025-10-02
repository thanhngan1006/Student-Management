import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { mockListStudents } from "../../data/mockListStudent";
import { MdDelete } from "react-icons/md";

type Props = {};

const ClassDetail = (props: Props) => {
  const [newAdvisorEmail, setNewAdvisorEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState(mockListStudents);
  const { classId } = useParams();
  const [classInfo, setClassInfo] = useState<any>(null);
  const [classAdvisor, setClassAdvisor] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isEditingAdvisor, setIsEditingAdvisor] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [newSubjectTeacherEmail, setNewSubjectTeaacherEmail] = useState("");

  useEffect(() => {
    if (classId) {
      fetchTeachers();
    }
  }, [classId]);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`http://localhost:4000/api/classes/${classId}/subjects`);
      setTeachers(res.data);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin giáo viên:", error);
    }
  };
  
  const handleAddAdvisorClick = async () => {
    if (!newAdvisorEmail) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập email giáo viên",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:4000/api/classes/${classId}/add-advisor`,
        {
          email: newAdvisorEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNewAdvisorEmail("");
      // Cập nhật lại thông tin giáo viên từ server
      const advisorRes = await axios.get(
        `http://localhost:4000/api/classes/${classId}/advisor`
      );
      setClassAdvisor(advisorRes.data.advisor);
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã thêm giáo viên vào lớp!",
      });
    } catch (err: any) {
      console.error("Lỗi khi thêm giáo viên:", err);
      Swal.fire({
        icon: "error",
        title: "Thêm thất bại",
        text: err.response?.data?.message || "Đã xảy ra lỗi khi thêm giáo viên",
      });
    }
  };

  const handleEditAdvisorClick = async () => {
    if (!newAdvisorEmail) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập email giáo viên mới",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:4000/api/classes/${classId}/change-advisor`,
        {
          email: newAdvisorEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cập nhật lại giáo viên sau khi thay đổi
      const advisorRes = await axios.get(
        `http://localhost:4000/api/classes/${classId}/advisor`
      );
      setClassAdvisor(advisorRes.data.advisor);

      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã thay đổi giáo viên cho lớp!",
      });
      setNewAdvisorEmail("");
    } catch (err: any) {
      console.error("Lỗi khi thay đổi giáo viên:", err);
      Swal.fire({
        icon: "error",
        title: "Thay đổi thất bại",
        text:
          err.response?.data?.message || "Đã xảy ra lỗi khi thay đổi giáo viên",
      });
    }
  };

  const handleRemoveTeacher = async (classId: string, teacherId: string) => {
    try {
      const token = localStorage.getItem("token");  
      const res = await axios.put(
        "http://localhost:4000/api/classes/remove-teacher",
        {
          class_id: classId,
          teacher_id: teacherId,  
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        }
      );
      await fetchTeachers();
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã xoá giáo viên khỏi lớp!",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể xoá giáo viên khỏi lớp.",
      });
    }
  };  

  const handleAddSubjectTeacherClick = async () => {
    if (!newSubjectTeacherEmail) {
      Swal.fire({
        icon: "warning",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập email giáo viên mới",
      });
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
  
      // Gọi API để lấy thông tin giáo viên từ email
      const teacherRes = await axios.post(
        `http://localhost:4003/api/users/get-ids-by-emails`,
        {
          emails: [newSubjectTeacherEmail]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const teacherId = teacherRes.data?.userIds?.[0];
      if (!teacherId) {
        Swal.fire({
          icon: "error",
          title: "Không tìm thấy giáo viên",
          text: "Email không đúng hoặc giáo viên không tồn tại",
        });
        return;
      }
  
      // Gọi API gán giáo viên vào lớp
      await axios.put(
        `http://localhost:4000/api/classes/add-teacher`,
        {
          class_id: classId,
          teacher_id: teacherId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      Swal.fire({
        icon: "success",
        title: "Thành công",
        text: "Đã thêm giáo viên bộ môn vào lớp!",
      });
  
      setNewSubjectTeaacherEmail("");
      await fetchTeachers();
    } catch (err: any) {
      console.error("Lỗi khi thêm giáo viên bộ môn:", err);
      Swal.fire({
        icon: "error",
        title: "Thêm thất bại",
        text:
          err.response?.data?.message ||
          "Đã xảy ra lỗi khi thêm giáo viên bộ môn",
      });
    }
  };  

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const result = students.filter((student) => {
      return (
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.tdt_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredStudents(result);
  }, [searchTerm, students]);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/${classId}`);
        setClassInfo(res.data.class);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu lớp:", error);
      }
    };

    fetchClass();
  }, [classId]);

  useEffect(() => {
    const fetchAdvisor = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/classes/${classId}/advisor`
        );
        setClassAdvisor(res.data.advisor);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin giáo viên:", err);
      }
    };

    if (classId) {
      fetchAdvisor();
    }
  }, [classId]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/classes/${classId}/students`
        );
        const mappedStudents = res.data.students.map((student: any) => ({
          ...student,
          phoneNumber: student.phone_number,
          parentPhoneNumber: student.parent_phone_number,
          dateOfBirth: new Date(student.date_of_birth),
        }));
        setStudents(mappedStudents);
        setFilteredStudents(mappedStudents); // cập nhật dữ liệu cho bộ lọc
      } catch (err) {
        console.error("Lỗi khi lấy danh sách học sinh:", err);
      }
    };

    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="w-9/12 mx-auto relative">
        {!classAdvisor ? (
          <div className="mb-4 flex gap-3">
            <input
              type="email"
              placeholder="Nhập email giáo viên"
              value={newAdvisorEmail}
              onChange={(e) => setNewAdvisorEmail(e.target.value)}
              className="border p-2 rounded-md w-2/5"
            />
            <button
              className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-md"
              onClick={handleAddAdvisorClick}
            >
              Thêm giáo viên
            </button>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold">
                Giáo viên chủ nhiệm: {classAdvisor.name}
              </h3>
              <p>
                <strong>Email:</strong> {classAdvisor.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditingAdvisor ? (
                <>
                  <input
                    placeholder="Tìm kiếm"
                    className="px-4 py-2 rounded-md mt-2 border"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <button
                    className="bg-blue-900 hover:bg-blue-950 cursor-pointer text-white px-4 py-2 rounded-md mt-2"
                    onClick={() => setIsEditingAdvisor(true)}
                  >
                    Thay đổi giáo viên
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Nhập email giáo viên mới"
                    className="border p-2 rounded-md mt-2"
                    value={newAdvisorEmail}
                    onChange={(e) => setNewAdvisorEmail(e.target.value)}
                  />
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mt-2"
                    onClick={handleEditAdvisorClick}
                  >
                    Xác nhận thay đổi
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md mt-2"
                    onClick={() => {
                      setIsEditingAdvisor(false);
                      setNewAdvisorEmail("");
                    }}
                  >
                    Hủy
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {classInfo && (
          <div className="mb-6 bg-blue-50 p-4 rounded shadow">
            <h2 className="text-xl font-bold">
              Thông tin lớp: {classInfo.class_name}
            </h2>
            <p>Mã lớp: {classInfo.class_id}</p>
          </div>
        )}
        <div className="mb-4 flex gap-3">
            <input
              type="email"
              placeholder="Nhập email giáo viên"
              value={newSubjectTeacherEmail}
              onChange={(e) => setNewSubjectTeaacherEmail(e.target.value)}
              className="border p-2 rounded-md w-2/5"
            />
            <button
              className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-md"
              onClick={handleAddSubjectTeacherClick}
            >
              Thêm giáo viên bộ môn
            </button>
        </div>

        <table className="min-w-full border-collapse border border-gray-300 bg-white mt-5">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-base border border-gray-300 p-2">Họ và tên</th>
              <th className="text-base border border-gray-300 p-2">Mã định danh</th>
              <th className="text-base border border-gray-300 p-2">Email</th>
              <th className="text-base border border-gray-300 p-2">Số điện thoại</th>
              <th className="text-base border border-gray-300 p-2">Môn dạy</th>
              <th className="text-base border border-gray-300 p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.teacher_id} className="hover:bg-gray-100">
                <td className="text-center border text-sm border-gray-300 p-4">
                  {teacher.teacher_name}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {teacher.tdt_id}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {teacher.email}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {teacher.phone_number?.startsWith("0")
                    ? teacher.phone_number
                    : "0" + teacher.phone_number}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {teacher.subject_name}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  <button
                      onClick={() => handleRemoveTeacher(classInfo._id, teacher.teacher_id)}
                      className="cursor-pointer text-red-500 text-xl hover:text-red-700"
                  >
                  <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="min-w-full border-collapse border border-gray-300 bg-white mt-5">
          <thead className="bg-gray-200">
            <tr>
              <th className="text-base border border-gray-300 p-2">
                Họ và tên
              </th>
              <th className="text-base border border-gray-300 p-2">
                Mã định danh
              </th>
              <th className="text-base border border-gray-300 p-2">
                Giới tính
              </th>
              <th className="text-base border border-gray-300 p-2">
                Ngày sinh
              </th>
              <th className="text-base border border-gray-300 p-2">Email</th>
              <th className="text-base border border-gray-300 p-2">
                Số điện thoại
              </th>
              <th className="text-base border border-gray-300 p-2">
                Số điện thoại phụ huynh
              </th>
              <th className="border text-base border-gray-300 p-2">Địa chỉ</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.tdt_id} className="hover:bg-gray-100">
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.name}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.tdt_id}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.gender === "female" ? "Nữ" : "Nam"}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString()
                    : "Chưa có thông tin"}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.email}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.phoneNumber?.startsWith("0")
                    ? student.phoneNumber
                    : "0" + student.phoneNumber}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.parentPhoneNumber || "Chưa có thông tin"}
                </td>
                <td className="text-center border text-sm border-gray-300 p-4">
                  {student.address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClassDetail;

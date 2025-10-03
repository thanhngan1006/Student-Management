import { useEffect, useState } from "react";
import { IoAdd } from "react-icons/io5";
import { MdCheck, MdClose, MdDelete } from "react-icons/md";
import { useParams } from "react-router-dom";
import axios from "axios";

const TeacherDetailInDepartment = () => {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState<any>(null);
  const [teacherMongoId, setTeacherMongoId] = useState<string>("");

  const [teachingClasses, setTeachingClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<
    { subject_id: string; subject_code: string; subject_name: string }[]
  >([]);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  useEffect(() => {
    if (!teacherId) return;

    axios
      .get(`http://localhost:4003/api/users/tdt/${teacherId}`)
      .then((res) => {
        setTeacher(res.data);
        setTeacherMongoId(res.data._id);
      })
      .catch((err) => console.error("Lỗi khi lấy thông tin giáo viên:", err));

    axios
      .get(`http://localhost:4001/api/departments/${teacherId}/subjects`)
      .then((res) => setSubjects(res.data))
      .catch((err) => console.error("Lỗi khi lấy danh sách môn:", err));

    axios
      .get(`http://localhost:4000/api/teacher/tdt/${teacherId}`)
      .then((res) => setTeachingClasses(res.data))
      .catch((err) =>
        console.error("Lỗi khi lấy danh sách lớp phụ trách:", err)
      );
  }, [teacherId]);

  const handleAddClass = () => {
    setIsAddingClass(true);
    setNewClassName("");
  };

  const handleConfirmAddClass = async () => {
    if (!newClassName.trim()) {
      alert("Vui lòng nhập tên lớp!");
      return;
    }

    try {
      await axios.put("http://localhost:4000/api/classes/add-teacher", {
        class_id: newClassName.trim(),
        teacher_id: teacher._id,
      });

      const res = await axios.get(
        `http://localhost:4000/api/teacher/tdt/${teacherId}`
      );
      setTeachingClasses(res.data);

      setIsAddingClass(false);
      setNewClassName("");
    } catch (error) {
      console.error("Lỗi khi thêm lớp phụ trách:", error);
      if (axios.isAxiosError(error)) {
        console.error("Lỗi:", error.response?.data);
        alert(error.response?.data?.message || "Không thể thêm lớp.");
      } else {
        console.error(error);
        alert("Có lỗi xảy ra.");
      }
    }
  };

  const handleCancelAddClass = () => {
    setIsAddingClass(false);
    setNewClassName("");
  };

  const handleRemoveClass = async (classId: string) => {
    try {
      await axios.put("http://localhost:4000/api/classes/remove-teacher", {
        class_id: classId,
        teacher_id: teacherMongoId,
      });

      // Cập nhật lại danh sách lớp sau khi xóa
      const res = await axios.get(
        `http://localhost:4000/api/teacher/tdt/${teacherId}`
      );
      setTeachingClasses(res.data);

      alert("Đã xoá giáo viên khỏi lớp thành công!");
    } catch (error) {
      console.error("Lỗi khi xoá giáo viên khỏi lớp:", error);
      alert("Không thể xoá giáo viên khỏi lớp.");
    }
  };

  if (!teacher) return <div className="p-4">Đang tải...</div>;

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <div className="w-9/12 mx-auto">
        <div className="bg-blue-50 p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Thông tin giáo viên</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Mã giáo viên:</p>
              <p className="font-semibold">{teacher.tdt_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Họ và tên:</p>
              <p className="font-semibold">{teacher.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Email:</p>
              <p className="font-semibold">{teacher.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Số điện thoại:</p>
              <p className="font-semibold">{teacher.phone_number}</p>
            </div>
            <div>
              <p className="text-gray-600">Môn dạy:</p>
              <p className="font-semibold">
                {subjects.length > 0 ? subjects[0].subject_name : "Không rõ"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-xl font-semibold">Danh sách lớp phụ trách</h3>
            {!isAddingClass && (
              <button
                onClick={handleAddClass}
                className="bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-md flex items-center gap-2"
              >
                <IoAdd className="w-5 h-5" />
                Thêm lớp
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Lớp
                  </th>
                  {/* <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Môn học
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Lịch học
                  </th> */}
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isAddingClass && (
                  <tr>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        placeholder="Nhập tên lớp"
                        className="border p-2 rounded-md w-full"
                        autoFocus
                      />
                    </td>
                    <td className="py-2 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleConfirmAddClass}
                          className="text-green-500 hover:text-green-700"
                        >
                          <MdCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelAddClass}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MdClose className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {teachingClasses.map((cls) => (
                  <tr key={cls._id}>
                    <td className="py-2 px-4">{cls.class_id}</td>
                    {/* <td className="py-2 px-4">{cls.subject}</td>
                    <td className="py-2 px-4">{cls.schedule}</td> */}
                    <td className="py-2 px-4 text-center">
                      <button
                        onClick={() => handleRemoveClass(cls._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MdDelete className="w-5 h-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailInDepartment;
